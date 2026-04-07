/**
 * Клиент foundation chat API.
 * 401/403 — отдельные исходы (без демо-fallback).
 * Демо-fallback только при сетевой ошибке / таймауте (см. ChatWorkspace).
 * TODO: вложения в сообщениях.
 */

import { NEW_CHAT_THREAD_ID } from "@/lib/mock/chats";
import { getScenarioById } from "@/lib/mock/scenarios";
import type { ChatMessage, ChatThread } from "@/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const CHAT_FETCH_TIMEOUT_MS = 25_000;

export function isPersistedChatThreadId(id: string): boolean {
  if (!id || id === NEW_CHAT_THREAD_ID || id.startsWith("virtual:")) {
    return false;
  }
  return UUID_RE.test(id.trim());
}

type ApiThread = {
  id: string;
  title: string;
  scenarioId: string | null;
  pinned?: boolean;
  updatedAt: string;
  createdAt?: string;
};

type ApiMessage = {
  id: string;
  role: string;
  content: string;
  createdAt: string;
  metadata?: unknown;
};

type FetchTag =
  | { tag: "ok"; res: Response }
  | { tag: "unauthorized" }
  | { tag: "forbidden" }
  | { tag: "http_error"; status: number }
  | { tag: "network" };

async function chatFetchResponse(
  url: string,
  init: RequestInit = {},
): Promise<FetchTag> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), CHAT_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...init,
      credentials: "include",
      cache: "no-store",
      signal: ctrl.signal,
    });
    if (res.status === 401) return { tag: "unauthorized" };
    if (res.status === 403) return { tag: "forbidden" };
    if (!res.ok) return { tag: "http_error", status: res.status };
    return { tag: "ok", res };
  } catch {
    return { tag: "network" };
  } finally {
    clearTimeout(timer);
  }
}

export function mapApiThreadToChatThread(row: ApiThread): ChatThread {
  const sid = row.scenarioId?.trim() || undefined;
  const scenarioTitle = sid
    ? getScenarioById(sid).title
    : "Свободный запрос";
  return {
    id: row.id,
    title: row.title,
    scenarioId: sid,
    scenarioTitle,
    updatedAt: row.updatedAt,
    modelLabel: "Auto",
    lastMessagePreview: "",
    pinned: Boolean(row.pinned),
  };
}

export function mapApiMessageToChatMessage(m: ApiMessage): ChatMessage {
  const role = m.role as ChatMessage["role"];
  return {
    id: m.id,
    role: role === "user" || role === "assistant" || role === "system" ? role : "user",
    content: m.content,
    createdAt: m.createdAt,
  };
}

export type ChatThreadsResult =
  | { kind: "ok"; threads: ChatThread[] }
  | { kind: "unauthorized" }
  | { kind: "forbidden" }
  | { kind: "http_error"; status: number }
  | { kind: "network" };

export async function fetchChatThreadsFromApi(): Promise<ChatThreadsResult> {
  const tag = await chatFetchResponse("/api/chats");
  if (tag.tag === "unauthorized") return { kind: "unauthorized" };
  if (tag.tag === "forbidden") return { kind: "forbidden" };
  if (tag.tag === "http_error") return { kind: "http_error", status: tag.status };
  if (tag.tag === "network") return { kind: "network" };
  try {
    const data = (await tag.res.json()) as { threads?: ApiThread[] };
    const rows = data.threads ?? [];
    return { kind: "ok", threads: rows.map(mapApiThreadToChatThread) };
  } catch {
    return { kind: "network" };
  }
}

export type ChatMessagesResult =
  | { kind: "ok"; messages: ChatMessage[] }
  | { kind: "unauthorized" }
  | { kind: "forbidden" }
  | { kind: "http_error"; status: number }
  | { kind: "network" };

export async function fetchChatMessagesFromApi(
  threadId: string,
): Promise<ChatMessagesResult> {
  if (!isPersistedChatThreadId(threadId)) {
    return { kind: "ok", messages: [] };
  }
  const tag = await chatFetchResponse(`/api/chats/${threadId}/messages`);
  if (tag.tag === "unauthorized") return { kind: "unauthorized" };
  if (tag.tag === "forbidden") return { kind: "forbidden" };
  if (tag.tag === "http_error") return { kind: "http_error", status: tag.status };
  if (tag.tag === "network") return { kind: "network" };
  try {
    const data = (await tag.res.json()) as { messages?: ApiMessage[] };
    return {
      kind: "ok",
      messages: (data.messages ?? []).map(mapApiMessageToChatMessage),
    };
  } catch {
    return { kind: "network" };
  }
}

export type ChatPostOk = {
  thread: ApiThread;
  messages: ChatMessage[];
};

export type ChatPostResult =
  | { kind: "ok"; data: ChatPostOk }
  | { kind: "unauthorized" }
  | { kind: "forbidden" }
  | { kind: "http_error"; status: number }
  | { kind: "network" };

export async function postChatMessageToApi(
  threadId: string,
  content: string,
  options?: { scenarioId?: string | null; title?: string },
): Promise<ChatPostResult> {
  if (!isPersistedChatThreadId(threadId)) {
    return { kind: "http_error", status: 400 };
  }
  const tag = await chatFetchResponse(`/api/chats/${threadId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content,
      scenarioId: options?.scenarioId ?? undefined,
      title: options?.title,
    }),
  });
  if (tag.tag === "unauthorized") return { kind: "unauthorized" };
  if (tag.tag === "forbidden") return { kind: "forbidden" };
  if (tag.tag === "http_error") return { kind: "http_error", status: tag.status };
  if (tag.tag === "network") return { kind: "network" };
  try {
    const data = (await tag.res.json()) as {
      thread?: ApiThread;
      messages?: ApiMessage[];
    };
    if (!data.thread || !data.messages) {
      return { kind: "http_error", status: tag.res.status };
    }
    return {
      kind: "ok",
      data: {
        thread: data.thread,
        messages: data.messages.map(mapApiMessageToChatMessage),
      },
    };
  } catch {
    return { kind: "network" };
  }
}

export type ChatThreadMutationResult =
  | { kind: "ok"; thread: ChatThread }
  | { kind: "unauthorized" }
  | { kind: "forbidden" }
  | { kind: "http_error"; status: number }
  | { kind: "network" };

export async function patchChatThreadApi(
  threadId: string,
  body: { title?: string; pinned?: boolean },
): Promise<ChatThreadMutationResult> {
  if (!isPersistedChatThreadId(threadId)) {
    return { kind: "http_error", status: 400 };
  }
  const tag = await chatFetchResponse(`/api/chats/${threadId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (tag.tag === "unauthorized") return { kind: "unauthorized" };
  if (tag.tag === "forbidden") return { kind: "forbidden" };
  if (tag.tag === "http_error") return { kind: "http_error", status: tag.status };
  if (tag.tag === "network") return { kind: "network" };
  try {
    const data = (await tag.res.json()) as { thread?: ApiThread };
    if (!data.thread) return { kind: "http_error", status: tag.res.status };
    return { kind: "ok", thread: mapApiThreadToChatThread(data.thread) };
  } catch {
    return { kind: "network" };
  }
}

export type ChatThreadDeleteResult =
  | { kind: "ok" }
  | { kind: "unauthorized" }
  | { kind: "forbidden" }
  | { kind: "http_error"; status: number }
  | { kind: "network" };

export async function deleteChatThreadApi(
  threadId: string,
): Promise<ChatThreadDeleteResult> {
  if (!isPersistedChatThreadId(threadId)) {
    return { kind: "http_error", status: 400 };
  }
  const tag = await chatFetchResponse(`/api/chats/${threadId}`, {
    method: "DELETE",
  });
  if (tag.tag === "unauthorized") return { kind: "unauthorized" };
  if (tag.tag === "forbidden") return { kind: "forbidden" };
  if (tag.tag === "http_error") return { kind: "http_error", status: tag.status };
  if (tag.tag === "network") return { kind: "network" };
  return { kind: "ok" };
}

export type ChatThreadDuplicateResult =
  | { kind: "ok"; thread: ChatThread; messagesCopied: number }
  | { kind: "unauthorized" }
  | { kind: "forbidden" }
  | { kind: "http_error"; status: number }
  | { kind: "network" };

export async function duplicateChatThreadApi(
  threadId: string,
  options?: { title?: string },
): Promise<ChatThreadDuplicateResult> {
  if (!isPersistedChatThreadId(threadId)) {
    return { kind: "http_error", status: 400 };
  }
  const tag = await chatFetchResponse(`/api/chats/${threadId}/duplicate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: options?.title }),
  });
  if (tag.tag === "unauthorized") return { kind: "unauthorized" };
  if (tag.tag === "forbidden") return { kind: "forbidden" };
  if (tag.tag === "http_error") return { kind: "http_error", status: tag.status };
  if (tag.tag === "network") return { kind: "network" };
  try {
    const data = (await tag.res.json()) as {
      thread?: ApiThread;
      messagesCopied?: number;
    };
    if (!data.thread) return { kind: "http_error", status: tag.res.status };
    return {
      kind: "ok",
      thread: mapApiThreadToChatThread(data.thread),
      messagesCopied: data.messagesCopied ?? 0,
    };
  } catch {
    return { kind: "network" };
  }
}
