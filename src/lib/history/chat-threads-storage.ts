import { fetchChatThreadsFromApi } from "@/lib/chat/chat-backend-client";
import {
  clearChatApiBanner,
  setChatApiBanner,
} from "@/lib/chat/chat-api-banner-store";
import {
  mockChatThreads,
  NEW_CHAT_THREAD_ID,
  newChatThreadTemplate,
} from "@/lib/mock/chats";
import type { ChatThread } from "@/types";

const STORAGE_KEY = "rg_chat_threads_v1";
const PINS_KEY = "rg_chat_pins_v1";

export const CHAT_THREADS_CHANGED_EVENT = "rg_chat_threads_changed";

function readThreadPinsMap(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(PINS_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as Record<string, boolean>;
    return p && typeof p === "object" ? p : {};
  } catch {
    return {};
  }
}

function applyPinsToThreads(threads: ChatThread[]): ChatThread[] {
  const pins = readThreadPinsMap();
  return threads.map((t) => ({
    ...t,
    pinned: pins[t.id] === true ? true : Boolean(t.pinned),
  }));
}

/** Сохранить закрепление отдельно от списка (переживает sync с API). */
export function setThreadPinned(threadId: string, pinned: boolean): void {
  if (typeof window === "undefined") return;
  const pins = readThreadPinsMap();
  if (pinned) pins[threadId] = true;
  else delete pins[threadId];
  sessionStorage.setItem(PINS_KEY, JSON.stringify(pins));
}

/** Всегда держим слот «Новый чат» сверху списка. */
export function withNewChatThreadSlot(threads: ChatThread[]): ChatThread[] {
  const idx = threads.findIndex((t) => t.id === NEW_CHAT_THREAD_ID);
  if (idx === -1) {
    return [newChatThreadTemplate, ...threads];
  }
  if (idx === 0) {
    return threads;
  }
  const next = [...threads];
  const [slot] = next.splice(idx, 1);
  return [slot, ...next];
}

export function readChatThreads(): ChatThread[] {
  if (typeof window === "undefined") return mockChatThreads;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return withNewChatThreadSlot(mockChatThreads);
    const parsed = JSON.parse(raw) as ChatThread[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return withNewChatThreadSlot(mockChatThreads);
    }
    const mapped = parsed.map((p: ChatThread) => ({
      ...p,
      lastMessagePreview: p.lastMessagePreview ?? "",
    }));
    return withNewChatThreadSlot(applyPinsToThreads(mapped));
  } catch {
    return withNewChatThreadSlot(mockChatThreads);
  }
}

export function writeChatThreads(threads: ChatThread[]) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  window.dispatchEvent(new Event(CHAT_THREADS_CHANGED_EVENT));
}

export function mutateChatThreads(
  updater: (prev: ChatThread[]) => ChatThread[],
): ChatThread[] {
  const next = updater(readChatThreads());
  writeChatThreads(next);
  return next;
}

/**
 * Подтягивает треды с /api/chats и кладёт в sessionStorage (+ слот «Новый чат», закрепы).
 * @returns true если API ответил 200 и список обновлён
 */
export async function syncChatThreadsFromBackend(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const result = await fetchChatThreadsFromApi();

  if (result.kind === "ok") {
    clearChatApiBanner();
    const pins = readThreadPinsMap();
    const withPins = result.threads.map((t) => ({
      ...t,
      pinned: Boolean(pins[t.id]),
    }));
    const withSlot = withNewChatThreadSlot(withPins);
    writeChatThreads(withSlot);
    return true;
  }

  if (result.kind === "unauthorized") {
    setChatApiBanner({ kind: "unauthorized" });
    return false;
  }
  if (result.kind === "forbidden") {
    setChatApiBanner({ kind: "forbidden" });
    return false;
  }
  if (result.kind === "http_error") {
    setChatApiBanner({
      kind: "request_failed",
      detail: `Не удалось загрузить список чатов (HTTP ${result.status}).`,
    });
    return false;
  }

  // network / таймаут — без баннера, оставляем кэш в sessionStorage
  return false;
}
