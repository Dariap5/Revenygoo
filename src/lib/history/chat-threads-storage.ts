import {
  mockChatThreads,
  NEW_CHAT_THREAD_ID,
  newChatThreadTemplate,
} from "@/lib/mock/chats";
import type { ChatThread } from "@/types";

const STORAGE_KEY = "rg_chat_threads_v1";

export const CHAT_THREADS_CHANGED_EVENT = "rg_chat_threads_changed";

/** Всегда держим слот «Новый чат» сверху списка (mock, без отдельного backend). */
function withNewChatThreadSlot(threads: ChatThread[]): ChatThread[] {
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
    if (!raw) return mockChatThreads;
    const parsed = JSON.parse(raw) as ChatThread[];
    if (!Array.isArray(parsed) || parsed.length === 0) return mockChatThreads;
    const mapped = parsed.map((p: ChatThread) => ({
      ...p,
      lastMessagePreview: p.lastMessagePreview ?? "",
    }));
    return withNewChatThreadSlot(mapped);
  } catch {
    return mockChatThreads;
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
