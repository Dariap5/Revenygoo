import { getDefaultChatIdForScenario } from "@/lib/mock/chat-helpers";
import { NEW_CHAT_THREAD_ID } from "@/lib/mock/chats";
import type { ChatThread } from "@/types";

/** Согласовано с выбором активного треда в `ChatWorkspace`. */
export function resolveActiveChatKey(
  chatParam: string | null,
  scenarioParam: string | null,
  threadList: ChatThread[],
): string {
  if (chatParam && threadList.some((c) => c.id === chatParam)) {
    return chatParam;
  }
  if (scenarioParam) {
    const byScenario = getDefaultChatIdForScenario(scenarioParam);
    if (byScenario && threadList.some((c) => c.id === byScenario)) {
      return byScenario;
    }
    return `virtual:${scenarioParam}`;
  }
  const starter = threadList.find((c) => c.id === NEW_CHAT_THREAD_ID);
  return starter?.id ?? threadList[0]?.id ?? NEW_CHAT_THREAD_ID;
}
