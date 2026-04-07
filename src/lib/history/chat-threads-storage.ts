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

export const CHAT_THREADS_CHANGED_EVENT = "rg_chat_threads_changed";

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
    return withNewChatThreadSlot(mapped);
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
 * Подтягивает треды с /api/chats и кладёт в sessionStorage (+ слот «Новый чат»).
 * @returns true если API ответил 200 и список обновлён
 */
export async function syncChatThreadsFromBackend(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const result = await fetchChatThreadsFromApi();

  if (result.kind === "ok") {
    clearChatApiBanner();
    const withSlot = withNewChatThreadSlot(result.threads);
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
