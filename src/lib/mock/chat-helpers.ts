import type { ChatThread } from "@/types";

export function getDefaultChatIdForScenario(
  scenarioId: string,
  threads: ChatThread[],
) {
  return threads.find((c) => c.scenarioId === scenarioId)?.id;
}
