export type AIModelBadge = "Auto" | "GPT" | "Claude" | "Gemini";

export type ScenarioIconName =
  | "mail"
  | "file-text"
  | "search"
  | "presentation"
  | "languages"
  | "code-2"
  | "calendar-clock"
  | "lightbulb";

export interface Scenario {
  id: string;
  title: string;
  description: string;
  icon: ScenarioIconName;
  modelBadge: AIModelBadge;
  popular?: boolean;
  recent?: boolean;
  favorite?: boolean;
}

export type ScenarioTemplateCategory =
  | "communication"
  | "code"
  | "analysis"
  | "documents";

export interface ScenarioTemplate {
  id: string;
  title: string;
  description: string;
  category: ScenarioTemplateCategory;
  promptTemplate: string;
  isPublic: boolean;
  organizationId: string | null;
}

export interface ChatThread {
  id: string;
  title: string;
  /** Нет у потока «Новый чат» — без привязки к сценарию */
  scenarioId?: string;
  scenarioTitle: string;
  updatedAt: string;
  modelLabel: string;
  /** Короткий preview последнего сообщения (для списков / истории) */
  lastMessagePreview: string;
  /** Закреплён вверху списка (для UUID-тредов — из API). */
  pinned?: boolean;
}

export type MessageRole = "user" | "assistant" | "system";

/** Провайдер для серверного LLM-роутера (таблица org_settings + env). */
export type LlmProviderId = "openai" | "anthropic" | "openrouter";

export interface OrgLlmSettings {
  llm_provider: LlmProviderId;
  llm_api_key: string;
  llm_model?: string | null;
  /** База OpenAI-совместимого API, без `/chat/completions` (например `https://routerai.ru/api/v1`). */
  llm_base_url?: string | null;
}

export interface LLMChatMessage {
  role: MessageRole;
  content: string;
}

/** Провайдер интерфейса чата (mock UI-режимы). */
export type ChatWorkspaceProviderId = "openai" | "anthropic" | "google";

export interface ChatAttachmentPreview {
  id: string;
  name: string;
  sizeLabel?: string;
}

export type ChatSourceCitation = {
  id: string;
  label: string;
  url: string;
};

export type ChatDocumentCard = {
  id: string;
  title: string;
};

export type UnifiedChatModelId =
  | "gpt-instant-53"
  | "gpt-thinking-54"
  | "gemini-fast"
  | "gemini-thinking"
  | "gemini-pro"
  | "opus-46"
  | "sonnet-46"
  | "haiku-46"
  | "opus-45"
  | "opus-3"
  | "sonnet-45";

export type GptReasoningMode = "standard" | "extended";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  attachments?: ChatAttachmentPreview[];
  /** Мета на момент отправки (пользовательские сообщения). */
  sendMeta?: {
    unifiedModelId: UnifiedChatModelId;
    modelLabel: string;
    gptReasoningLabel?: string;
  };
  /** Ссылки-источники у ответа ассистента (демо). */
  citations?: ChatSourceCitation[];
  /** Карточка документа под ответом (демо). */
  documentCards?: ChatDocumentCard[];
  /** Ответ ассистента ещё приходит потоком (SSE). */
  isStreaming?: boolean;
}

export type KnowledgeSourceType =
  | "PDF"
  | "DOCX"
  | "Notion"
  | "Таблица"
  | "Регламент"
  | "FAQ";

export type KnowledgeSourceStatus = "ready" | "processing";

export interface KnowledgeSource {
  id: string;
  title: string;
  type: KnowledgeSourceType;
  description: string;
  addedAt: string;
  status: KnowledgeSourceStatus;
}
