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
const CHAT_STREAM_TIMEOUT_MS = 120_000;

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

export type ChatStreamMetaPayload = {
  organizationId: string;
  threadId: string;
  thread: ApiThread;
  messages: ApiMessage[];
};

export type ChatPostStreamResult =
  | { kind: "ok" }
  | { kind: "unauthorized" }
  | { kind: "forbidden" }
  | { kind: "dlp_blocked"; types: string[] }
  | { kind: "http_error"; status: number }
  | { kind: "network" }
  | { kind: "stream_error"; message: string; code?: string };

type SseHandler = (event: string, dataJson: string) => void;

function parseSseBuffer(
  buffer: string,
  onEvent: SseHandler,
): string {
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";
  for (const block of parts) {
    let eventName = "message";
    const dataLines: string[] = [];
    for (const line of block.split("\n")) {
      if (line.startsWith("event:")) {
        eventName = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        dataLines.push(line.slice(5).trimStart());
      }
    }
    const dataStr = dataLines.join("\n").trimEnd();
    if (dataStr) {
      onEvent(eventName, dataStr);
    }
  }
  return rest;
}

/**
 * POST сообщения: поток SSE (meta → delta* → done | error).
 */
export async function postChatMessageStreamFromApi(
  threadId: string,
  content: string,
  handlers: {
    onMeta: (meta: ChatStreamMetaPayload) => void;
    onDelta: (text: string) => void;
    onDone: () => void;
    onStreamError: (message: string, code?: string) => void;
  },
  options?: { scenarioId?: string | null; title?: string },
): Promise<ChatPostStreamResult> {
  if (!isPersistedChatThreadId(threadId)) {
    return { kind: "http_error", status: 400 };
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), CHAT_STREAM_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`/api/chats/${threadId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      cache: "no-store",
      signal: ctrl.signal,
      body: JSON.stringify({
        content,
        scenarioId: options?.scenarioId ?? undefined,
        title: options?.title,
      }),
    });
  } catch {
    clearTimeout(timer);
    return { kind: "network" };
  }
  clearTimeout(timer);

  if (res.status === 401) return { kind: "unauthorized" };
  if (res.status === 403) {
    try {
      const data = (await res.json()) as {
        blocked?: unknown;
        findings?: Array<{ type?: unknown }>;
      };
      if (data.blocked === true) {
        const types = Array.isArray(data.findings)
          ? data.findings
              .map((f) => (typeof f?.type === "string" ? f.type : null))
              .filter((x): x is string => Boolean(x))
          : [];
        return { kind: "dlp_blocked", types: [...new Set(types)] };
      }
    } catch {
      // not a DLP payload
    }
    return { kind: "forbidden" };
  }
  if (!res.ok) return { kind: "http_error", status: res.status };

  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("text/event-stream") || !res.body) {
    return { kind: "http_error", status: res.status };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let sawDone = false;
  type StreamErr = { message: string; code?: string };
  const streamErrorRef: { current: StreamErr | null } = { current: null };

  const handleEvent = (event: string, dataJson: string) => {
    if (event === "meta") {
      try {
        const data = JSON.parse(dataJson) as ChatStreamMetaPayload;
        if (data.thread && data.messages) {
          handlers.onMeta(data);
        }
      } catch {
        streamErrorRef.current = { message: "Invalid meta event" };
      }
      return;
    }
    if (event === "delta") {
      try {
        const data = JSON.parse(dataJson) as { t?: string };
        if (typeof data.t === "string" && data.t.length > 0) {
          handlers.onDelta(data.t);
        }
      } catch {
        /* skip bad delta */
      }
      return;
    }
    if (event === "done") {
      sawDone = true;
      handlers.onDone();
      return;
    }
    if (event === "error") {
      try {
        const data = JSON.parse(dataJson) as { message?: string; code?: string };
        streamErrorRef.current = {
          message: data.message ?? "Stream error",
          code: data.code,
        };
        handlers.onStreamError(
          streamErrorRef.current.message,
          streamErrorRef.current.code,
        );
      } catch {
        streamErrorRef.current = { message: "Stream error" };
        handlers.onStreamError(streamErrorRef.current.message);
      }
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      buf = parseSseBuffer(buf, handleEvent);
      if (streamErrorRef.current) {
        const err = streamErrorRef.current;
        return { kind: "stream_error", message: err.message, code: err.code };
      }
    }
    buf = parseSseBuffer(`${buf}\n\n`, handleEvent);
  } catch {
    return { kind: "network" };
  } finally {
    reader.releaseLock();
  }

  if (streamErrorRef.current) {
    const err = streamErrorRef.current;
    return { kind: "stream_error", message: err.message, code: err.code };
  }

  if (!sawDone) {
    return { kind: "network" };
  }

  return { kind: "ok" };
}

/** Совместимость: дожидается конца SSE и возвращает агрегированный ответ. */
export async function postChatMessageToApi(
  threadId: string,
  content: string,
  options?: { scenarioId?: string | null; title?: string },
): Promise<ChatPostResult> {
  if (!isPersistedChatThreadId(threadId)) {
    return { kind: "http_error", status: 400 };
  }

  const metaRef: { current: ChatStreamMetaPayload | null } = { current: null };
  const accRef = { current: "" };

  const r = await postChatMessageStreamFromApi(
    threadId,
    content,
    {
      onMeta: (m) => {
        metaRef.current = m;
      },
      onDelta: (t) => {
        accRef.current += t;
      },
      onDone: () => {},
      onStreamError: () => {},
    },
    options,
  );

  if (r.kind === "unauthorized") return { kind: "unauthorized" };
  if (r.kind === "forbidden") return { kind: "forbidden" };
  if (r.kind === "dlp_blocked") return { kind: "forbidden" };
  if (r.kind === "http_error") return { kind: "http_error", status: r.status };
  if (r.kind === "network") return { kind: "network" };
  if (r.kind === "stream_error") {
    return { kind: "http_error", status: 502 };
  }

  const metaPayload = metaRef.current;
  if (!metaPayload) return { kind: "network" };

  const userApi = metaPayload.messages.find((m) => m.role === "user");
  const asstApi = metaPayload.messages.find((m) => m.role === "assistant");
  if (!userApi || !asstApi) return { kind: "network" };

  const finalAssistant: ApiMessage = {
    ...asstApi,
    content: accRef.current.trim() ? accRef.current : asstApi.content,
  };

  return {
    kind: "ok",
    data: {
      thread: metaPayload.thread,
      messages: [
        mapApiMessageToChatMessage(userApi),
        mapApiMessageToChatMessage(finalAssistant),
      ],
    },
  };
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
