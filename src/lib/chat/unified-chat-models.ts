import type {
  ChatWorkspaceProviderId,
  GptReasoningMode,
  UnifiedChatModelId,
} from "@/types";

export type { GptReasoningMode, UnifiedChatModelId };

export type ModelFamily = "openai" | "google" | "anthropic";

export interface UnifiedModelDef {
  id: UnifiedChatModelId;
  label: string;
  family: ModelFamily;
  legacyProvider: ChatWorkspaceProviderId;
}

export const UNIFIED_CHAT_MODELS: UnifiedModelDef[] = [
  { id: "gpt-instant-53", label: "ChatGPT Instant 5.3", family: "openai", legacyProvider: "openai" },
  { id: "gpt-thinking-54", label: "ChatGPT Thinking 5.4", family: "openai", legacyProvider: "openai" },
  { id: "gemini-fast", label: "Gemini быстрая", family: "google", legacyProvider: "google" },
  { id: "gemini-thinking", label: "Gemini думающая", family: "google", legacyProvider: "google" },
  { id: "gemini-pro", label: "Gemini Pro", family: "google", legacyProvider: "google" },
  { id: "opus-46", label: "Opus 4.6", family: "anthropic", legacyProvider: "anthropic" },
  { id: "sonnet-46", label: "Sonnet 4.6", family: "anthropic", legacyProvider: "anthropic" },
  { id: "haiku-46", label: "Haiku 4.6", family: "anthropic", legacyProvider: "anthropic" },
  { id: "opus-45", label: "Opus 4.5", family: "anthropic", legacyProvider: "anthropic" },
  { id: "opus-3", label: "Opus 3", family: "anthropic", legacyProvider: "anthropic" },
  { id: "sonnet-45", label: "Sonnet 4.5", family: "anthropic", legacyProvider: "anthropic" },
];

const modelById = Object.fromEntries(
  UNIFIED_CHAT_MODELS.map((m) => [m.id, m]),
) as Record<UnifiedChatModelId, UnifiedModelDef>;

export const DEFAULT_UNIFIED_MODEL: UnifiedChatModelId = "gpt-instant-53";

export function getUnifiedModelDef(id: UnifiedChatModelId): UnifiedModelDef {
  return modelById[id] ?? modelById[DEFAULT_UNIFIED_MODEL];
}

export function isGptThinkingModel(id: UnifiedChatModelId): boolean {
  return id === "gpt-thinking-54";
}

export function composerPlaceholder(family: ModelFamily): string {
  if (family === "openai") return "Спросить ChatGPT…";
  if (family === "google") return "Спросить Gemini…";
  return "Сообщение Claude…";
}

export const GEMINI_TOOL_STRIP: { id: string; label: string }[] = [
  { id: "img", label: "Создание изображений" },
  { id: "canvas", label: "Canvas" },
  { id: "dr", label: "Deep Research" },
  { id: "vid", label: "Создание видео" },
  { id: "music", label: "Создание музыки" },
  { id: "learn", label: "Обучение" },
];

export function gptReasoningLabel(mode: GptReasoningMode): string {
  return mode === "extended" ? "Расширенное рассуждение" : "Стандартное рассуждение";
}
