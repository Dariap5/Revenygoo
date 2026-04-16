import { useSyncExternalStore } from "react";

export type ChatApiBannerState =
  | null
  | {
      kind: "unauthorized" | "forbidden" | "request_failed" | "dlp_blocked";
      /** Для request_failed — краткая деталь (код и т.п.) */
      detail?: string;
      dlpTypes?: string[];
    };

let state: ChatApiBannerState = null;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function setChatApiBanner(next: ChatApiBannerState): void {
  state = next;
  emit();
}

export function clearChatApiBanner(): void {
  if (state !== null) {
    state = null;
    emit();
  }
}

export function getChatApiBannerState(): ChatApiBannerState {
  return state;
}

export function subscribeChatApiBanner(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

export function useChatApiBannerState(): ChatApiBannerState {
  return useSyncExternalStore(
    subscribeChatApiBanner,
    getChatApiBannerState,
    getChatApiBannerState,
  );
}
