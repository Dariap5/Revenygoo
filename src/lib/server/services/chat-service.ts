import { randomUUID } from "crypto";

import { appendAuditEvent } from "@/lib/server/audit/append";
import { ApiError } from "@/lib/server/errors";
import {
  deleteThreadForUser,
  ensureThreadForUser,
  getThreadForUser,
  insertMessage,
  insertThread,
  listMessagesForThread,
  listThreadsForUserOrg,
  touchThreadUpdatedAt,
  updateThreadForUser,
} from "@/lib/server/repositories/chat-repository";
import type { Json } from "@/lib/server/supabase/database.types";
import { createServerSupabaseClient } from "@/lib/server/supabase/server";

const PLACEHOLDER_ASSISTANT =
  "Это ответ-заглушка с сервера (foundation v1). Подключение к LLM — позже.";

function toIso(s: string): string {
  return s;
}

export function mapThreadRow(row: {
  id: string;
  title: string;
  scenario_id: string | null;
  pinned?: boolean;
  updated_at: string;
  created_at: string;
}) {
  return {
    id: row.id,
    title: row.title,
    scenarioId: row.scenario_id,
    pinned: Boolean(row.pinned),
    updatedAt: toIso(row.updated_at),
    createdAt: toIso(row.created_at),
  };
}

export function mapMessageRow(row: {
  id: string;
  role: string;
  content: string;
  created_at: string;
  metadata: unknown;
}) {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    createdAt: toIso(row.created_at),
    metadata: row.metadata,
  };
}

export async function serviceListThreads(
  userId: string,
  organizationId: string,
) {
  const supabase = await createServerSupabaseClient();
  const rows = await listThreadsForUserOrg(supabase, organizationId, userId);
  return rows.map(mapThreadRow);
}

export async function serviceGetThread(
  userId: string,
  organizationId: string,
  threadId: string,
) {
  const supabase = await createServerSupabaseClient();
  const row = await getThreadForUser(supabase, threadId, organizationId, userId);
  if (!row) {
    throw new ApiError("Thread not found", 404, "thread_not_found");
  }
  return mapThreadRow(row);
}

export async function serviceCreateThread(
  userId: string,
  organizationId: string,
  input: { title?: string; scenarioId?: string | null; id?: string },
) {
  const supabase = await createServerSupabaseClient();
  const id = input.id?.trim() || randomUUID();
  const thread = await ensureThreadForUser(supabase, {
    threadId: id,
    organizationId,
    userId,
    title: input.title,
    scenarioId: input.scenarioId,
  });
  return mapThreadRow(thread);
}

export async function serviceUpdateThread(
  userId: string,
  organizationId: string,
  threadId: string,
  input: { title?: string; pinned?: boolean },
) {
  if (input.title === undefined && input.pinned === undefined) {
    throw new ApiError(
      "title or pinned is required",
      400,
      "validation_error",
    );
  }
  if (input.title !== undefined && !input.title.trim()) {
    throw new ApiError("title must not be empty", 400, "validation_error");
  }
  const supabase = await createServerSupabaseClient();
  const updated = await updateThreadForUser(supabase, {
    threadId,
    organizationId,
    userId,
    ...(input.title !== undefined
      ? { title: input.title.trim() }
      : {}),
    ...(input.pinned !== undefined ? { pinned: input.pinned } : {}),
  });
  if (!updated) {
    throw new ApiError("Thread not found", 404, "thread_not_found");
  }
  return mapThreadRow(updated);
}

export async function serviceDeleteThread(
  userId: string,
  organizationId: string,
  threadId: string,
) {
  const supabase = await createServerSupabaseClient();
  const row = await deleteThreadForUser(
    supabase,
    threadId,
    organizationId,
    userId,
  );
  if (!row) {
    throw new ApiError("Thread not found", 404, "thread_not_found");
  }
}

/** MVP: new thread + shallow copy of all messages (same text/role/metadata). */
export async function serviceDuplicateThread(
  userId: string,
  organizationId: string,
  sourceThreadId: string,
  options?: { title?: string },
) {
  const supabase = await createServerSupabaseClient();
  const source = await getThreadForUser(
    supabase,
    sourceThreadId,
    organizationId,
    userId,
  );
  if (!source) {
    throw new ApiError("Thread not found", 404, "thread_not_found");
  }

  const messages = await listMessagesForThread(
    supabase,
    sourceThreadId,
    organizationId,
  );

  const baseTitle = source.title.trim() || "Новый чат";
  const duplicateTitle =
    options?.title?.trim() || `${baseTitle} (копия)`;

  const newThread = await insertThread(supabase, {
    organization_id: organizationId,
    user_id: userId,
    title: duplicateTitle,
    scenario_id: source.scenario_id,
    pinned: false,
  });

  for (const m of messages) {
    await insertMessage(supabase, {
      organization_id: organizationId,
      thread_id: newThread.id,
      user_id: m.user_id,
      role: m.role,
      content: m.content,
      metadata: (m.metadata ?? {}) as Json,
    });
  }

  await touchThreadUpdatedAt(supabase, newThread.id);

  const fresh = await getThreadForUser(
    supabase,
    newThread.id,
    organizationId,
    userId,
  );
  if (!fresh) {
    throw new ApiError("Thread not found", 404, "thread_not_found");
  }
  return {
    thread: mapThreadRow(fresh),
    messagesCopied: messages.length,
  };
}

export async function serviceListMessages(
  userId: string,
  organizationId: string,
  threadId: string,
) {
  const supabase = await createServerSupabaseClient();
  const thread = await getThreadForUser(supabase, threadId, organizationId, userId);
  if (!thread) {
    throw new ApiError("Thread not found", 404, "thread_not_found");
  }
  const messages = await listMessagesForThread(supabase, threadId, organizationId);
  return messages.map(mapMessageRow);
}

export async function serviceAppendUserMessageAndPlaceholder(
  userId: string,
  organizationId: string,
  threadId: string,
  content: string,
  options?: {
    title?: string;
    scenarioId?: string | null;
    /** Stored in `chat_messages` (e.g. DLP-redacted). Defaults to trimmed `content`. */
    persistedContent?: string;
    /** Merged into `audit_events.payload` for this exchange. */
    auditPayloadExtras?: Json;
  },
) {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new ApiError("content is required", 400, "validation_error");
  }

  const stored = (options?.persistedContent ?? trimmed).trim();
  if (!stored) {
    throw new ApiError("content is required", 400, "validation_error");
  }

  const supabase = await createServerSupabaseClient();

  const thread = await ensureThreadForUser(supabase, {
    threadId,
    organizationId,
    userId,
    title: options?.title,
    scenarioId: options?.scenarioId,
  });

  const userMsg = await insertMessage(supabase, {
    organization_id: organizationId,
    thread_id: thread.id,
    user_id: userId,
    role: "user",
    content: stored,
    metadata: {},
  });

  const assistantMsg = await insertMessage(supabase, {
    organization_id: organizationId,
    thread_id: thread.id,
    user_id: null,
    role: "assistant",
    content: PLACEHOLDER_ASSISTANT,
    metadata: { placeholder: true },
  });

  await touchThreadUpdatedAt(supabase, thread.id);

  const basePayload: Json = {
    userMessageId: userMsg.id,
    assistantMessageId: assistantMsg.id,
  };
  const extras = options?.auditPayloadExtras;
  const payload: Json =
    extras && typeof extras === "object" && !Array.isArray(extras)
      ? { ...basePayload, ...extras }
      : basePayload;

  await appendAuditEvent(supabase, {
    organizationId,
    actorUserId: userId,
    eventType: "chat.message.exchange",
    resourceType: "chat_thread",
    resourceId: thread.id,
    payload,
  });

  return {
    thread: mapThreadRow(thread),
    messages: [mapMessageRow(userMsg), mapMessageRow(assistantMsg)],
  };
}
