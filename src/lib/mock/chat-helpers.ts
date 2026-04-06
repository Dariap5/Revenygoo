import { mockChatThreads } from "./chats";

export function getDefaultChatIdForScenario(scenarioId: string) {
  return mockChatThreads.find((c) => c.scenarioId === scenarioId)?.id;
}
