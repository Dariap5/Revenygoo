import { randomUUID } from "crypto";

import { appendAuditEvent } from "@/lib/server/audit/append";
import { ApiError } from "@/lib/server/errors";
import {
  ensureThreadForUser,
  getThreadForUser,
  insertMessage,
  listMessagesForThread,
  listThreadsForUserOrg,
  touchThreadUpdatedAt,
} from "@/lib/server/repositories/chat-repository";
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
  updated_at: string;
  created_at: string;
}) {
  return {
    id: row.id,
    title: row.title,
    scenarioId: row.scenario_id,
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
  options?: { title?: string; scenarioId?: string | null },
) {
  const trimmed = content.trim();
  if (!trimmed) {
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
    content: trimmed,
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

  await appendAuditEvent(supabase, {
    organizationId,
    actorUserId: userId,
    eventType: "chat.message.exchange",
    resourceType: "chat_thread",
    resourceId: thread.id,
    payload: {
      userMessageId: userMsg.id,
      assistantMessageId: assistantMsg.id,
    },
  });

  return {
    thread: mapThreadRow(thread),
    messages: [mapMessageRow(userMsg), mapMessageRow(assistantMsg)],
  };
}
