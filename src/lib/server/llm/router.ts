import "server-only";

import type { LLMChatMessage, LlmProviderId, OrgLlmSettings } from "@/types";
import { ApiError } from "@/lib/server/errors";
import { createAdminSupabaseClient } from "@/lib/server/supabase/admin";

const OPENAI_DEFAULT_MODEL = "gpt-4o-mini";
const ANTHROPIC_DEFAULT_MODEL = "claude-3-5-sonnet-20241022";
const ANTHROPIC_VERSION = "2023-06-01";

/** Итог потока: из usage провайдера или 0 (тогда оценка на стороне API). */
export type LlmStreamUsage = {
  totalTokens: number;
  promptTokens: number | null;
  completionTokens: number | null;
};

function isLlmProviderId(v: string): v is LlmProviderId {
  return v === "openai" || v === "anthropic" || v === "openrouter";
}

function envDefaultProvider(): string | undefined {
  return process.env.LLM_DEFAULT_PROVIDER?.trim();
}

function envDefaultApiKey(): string | undefined {
  return process.env.LLM_DEFAULT_API_KEY?.trim();
}

/** OpenAI-совместимый POST …/chat/completions (OpenAI, OpenRouter, routerai.ru и т.п.). */
function chatCompletionsUrl(settings: OrgLlmSettings): string {
  if (settings.llm_provider === "openrouter") {
    const base = (settings.llm_base_url ?? "").replace(/\/$/, "");
    if (!base) {
      throw new ApiError("LLM base URL not configured", 503, "llm_no_base_url");
    }
    return `${base}/chat/completions`;
  }
  return "https://api.openai.com/v1/chat/completions";
}

/**
 * Загружает настройки LLM для организации (таблица org_settings + опционально env).
 * Возвращает null, если провайдер и ключ задать нельзя — тогда API отвечает 503.
 */
export async function fetchOrgLlmSettings(
  organizationId: string,
): Promise<OrgLlmSettings | null> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("org_settings")
    .select("llm_provider, llm_api_key, llm_model, llm_base_url")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new ApiError(error.message, 500, "org_settings_fetch_failed");
  }

  const providerRaw =
    data?.llm_provider?.trim() ||
    envDefaultProvider() ||
    process.env.LLM_PROVIDER?.trim() ||
    "";
  const apiKey =
    data?.llm_api_key?.trim() ||
    envDefaultApiKey() ||
    process.env.LLM_API_KEY?.trim() ||
    "";
  const modelMerged =
    data?.llm_model?.trim() || process.env.LLM_MODEL?.trim() || null;
  const baseMerged =
    data?.llm_base_url?.trim() || process.env.LLM_BASE_URL?.trim() || null;

  if (!providerRaw || !apiKey) {
    return null;
  }

  if (!isLlmProviderId(providerRaw)) {
    return null;
  }

  if (providerRaw === "openrouter") {
    if (!baseMerged?.trim() || !modelMerged?.trim()) {
      return null;
    }
    return {
      llm_provider: "openrouter",
      llm_api_key: apiKey,
      llm_model: modelMerged,
      llm_base_url: baseMerged.replace(/\/$/, ""),
    };
  }

  return {
    llm_provider: providerRaw,
    llm_api_key: apiKey,
    llm_model: modelMerged,
    llm_base_url: baseMerged ? baseMerged.replace(/\/$/, "") : null,
  };
}

function modelForProvider(settings: OrgLlmSettings): string {
  if (settings.llm_model?.trim()) {
    return settings.llm_model.trim();
  }
  if (settings.llm_provider === "anthropic") {
    return ANTHROPIC_DEFAULT_MODEL;
  }
  return OPENAI_DEFAULT_MODEL;
}

async function callOpenAI(
  messages: LLMChatMessage[],
  settings: OrgLlmSettings,
): Promise<string> {
  const model = modelForProvider(settings);
  const res = await fetch(chatCompletionsUrl(settings), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${settings.llm_api_key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  const body = (await res.json().catch(() => ({}))) as {
    error?: { message?: string };
    choices?: { message?: { content?: string | null } }[];
  };

  if (!res.ok) {
    const msg = body.error?.message || res.statusText || "OpenAI error";
    throw new ApiError(msg, 502, "llm_openai_failed");
  }

  const text = body.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) {
    throw new ApiError("Empty OpenAI response", 502, "llm_openai_empty");
  }
  return text;
}

type AnthropicContentBlock = { type: string; text?: string };

async function callAnthropic(
  messages: LLMChatMessage[],
  settings: OrgLlmSettings,
): Promise<string> {
  const model = modelForProvider(settings);
  const systemParts: string[] = [];
  const apiMessages: { role: "user" | "assistant"; content: string }[] = [];

  for (const m of messages) {
    if (m.role === "system") {
      systemParts.push(m.content);
      continue;
    }
    if (m.role === "user" || m.role === "assistant") {
      apiMessages.push({ role: m.role, content: m.content });
    }
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": settings.llm_api_key,
      "anthropic-version": ANTHROPIC_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      ...(systemParts.length
        ? { system: systemParts.join("\n\n") }
        : {}),
      messages: apiMessages,
    }),
  });

  const body = (await res.json().catch(() => ({}))) as {
    error?: { message?: string };
    content?: AnthropicContentBlock[];
  };

  if (!res.ok) {
    const msg = body.error?.message || res.statusText || "Anthropic error";
    throw new ApiError(msg, 502, "llm_anthropic_failed");
  }

  const blocks = body.content ?? [];
  const text = blocks
    .filter((b): b is AnthropicContentBlock & { text: string } =>
      b.type === "text" && typeof b.text === "string",
    )
    .map((b) => b.text)
    .join("");

  if (!text.trim()) {
    throw new ApiError("Empty Anthropic response", 502, "llm_anthropic_empty");
  }
  return text;
}

export async function callLLM(
  messages: LLMChatMessage[],
  orgSettings: OrgLlmSettings,
): Promise<string> {
  if (messages.length === 0) {
    throw new ApiError("No messages for LLM", 400, "llm_no_messages");
  }

  if (orgSettings.llm_provider === "openai" || orgSettings.llm_provider === "openrouter") {
    return callOpenAI(messages, orgSettings);
  }
  if (orgSettings.llm_provider === "anthropic") {
    return callAnthropic(messages, orgSettings);
  }
  throw new ApiError("Unsupported LLM provider", 500, "llm_bad_provider");
}

async function* streamOpenAIDeltas(
  messages: LLMChatMessage[],
  settings: OrgLlmSettings,
): AsyncGenerator<string, LlmStreamUsage, undefined> {
  const model = modelForProvider(settings);
  let promptTokens: number | null = null;
  let completionTokens: number | null = null;
  let totalTokens = 0;

  const res = await fetch(chatCompletionsUrl(settings), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${settings.llm_api_key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      stream: true,
      stream_options: { include_usage: true },
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!res.ok) {
    const raw = await res.text();
    let msg = res.statusText;
    try {
      const j = JSON.parse(raw) as { error?: { message?: string } };
      if (j.error?.message) msg = j.error.message;
    } catch {
      if (raw.trim()) msg = raw.slice(0, 500);
    }
    throw new ApiError(msg, 502, "llm_openai_failed");
  }

  if (!res.body) {
    throw new ApiError("Empty OpenAI stream", 502, "llm_openai_empty");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const parseOpenAiSseLine = function* (line: string) {
    const trimmed = line.trimStart();
    if (!trimmed.startsWith("data:")) return;
    const payload = trimmed.slice(5).trim();
    if (payload === "[DONE]") return;
    try {
      const json = JSON.parse(payload) as {
        choices?: { delta?: { content?: string | null } }[];
        usage?: {
          prompt_tokens?: number;
          completion_tokens?: number;
          total_tokens?: number;
        };
      };
      if (json.usage?.total_tokens != null) {
        totalTokens = json.usage.total_tokens;
        promptTokens = json.usage.prompt_tokens ?? null;
        completionTokens = json.usage.completion_tokens ?? null;
      }
      const c = json.choices?.[0]?.delta?.content;
      if (typeof c === "string" && c.length > 0) yield c;
    } catch {
      /* ignore partial JSON lines */
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        yield* parseOpenAiSseLine(line);
      }
    }
    if (buffer.trim()) {
      for (const line of buffer.split("\n")) {
        yield* parseOpenAiSseLine(line);
      }
    }
  } finally {
    reader.releaseLock();
  }

  return {
    totalTokens,
    promptTokens,
    completionTokens,
  };
}

async function* streamAnthropicDeltas(
  messages: LLMChatMessage[],
  settings: OrgLlmSettings,
): AsyncGenerator<string, LlmStreamUsage, undefined> {
  const model = modelForProvider(settings);
  const systemParts: string[] = [];
  const apiMessages: { role: "user" | "assistant"; content: string }[] = [];

  for (const m of messages) {
    if (m.role === "system") {
      systemParts.push(m.content);
      continue;
    }
    if (m.role === "user" || m.role === "assistant") {
      apiMessages.push({ role: m.role, content: m.content });
    }
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": settings.llm_api_key,
      "anthropic-version": ANTHROPIC_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      stream: true,
      ...(systemParts.length
        ? { system: systemParts.join("\n\n") }
        : {}),
      messages: apiMessages,
    }),
  });

  if (!res.ok) {
    const raw = await res.text();
    let msg = res.statusText;
    try {
      const j = JSON.parse(raw) as { error?: { message?: string } };
      if (j.error?.message) msg = j.error.message;
    } catch {
      if (raw.trim()) msg = raw.slice(0, 500);
    }
    throw new ApiError(msg, 502, "llm_anthropic_failed");
  }

  if (!res.body) {
    throw new ApiError("Empty Anthropic stream", 502, "llm_anthropic_empty");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let inputTokens = 0;
  let outputTokens = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      for (;;) {
        const idx = buf.indexOf("\n\n");
        if (idx < 0) break;
        const block = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        let eventName = "";
        const dataLines: string[] = [];
        for (const line of block.split("\n")) {
          if (line.startsWith("event:")) {
            eventName = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            dataLines.push(line.slice(5).trimStart());
          }
        }
        const dataStr = dataLines.join("\n");
        if (!dataStr) continue;
        try {
          const data = JSON.parse(dataStr) as {
            type?: string;
            message?: { usage?: { input_tokens?: number } };
            usage?: { output_tokens?: number };
            delta?: { type?: string; text?: string };
          };

          if (
            eventName === "message_start" ||
            data.type === "message_start"
          ) {
            const n = data.message?.usage?.input_tokens;
            if (typeof n === "number" && n > 0) {
              inputTokens = n;
            }
          }

          if (eventName === "message_delta" || data.type === "message_delta") {
            const o = data.usage?.output_tokens;
            if (typeof o === "number" && o >= 0) {
              outputTokens = o;
            }
          }

          if (
            eventName === "content_block_delta" ||
            data.type === "content_block_delta"
          ) {
            if (
              data.delta?.type === "text_delta" &&
              typeof data.delta.text === "string" &&
              data.delta.text.length > 0
            ) {
              yield data.delta.text;
            }
          }
        } catch {
          /* skip */
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  const total = inputTokens + outputTokens;
  return {
    totalTokens: total > 0 ? total : 0,
    promptTokens: inputTokens > 0 ? inputTokens : null,
    completionTokens: outputTokens > 0 ? outputTokens : null,
  };
}

/** Поток текстовых дельт от выбранного провайдера (OpenAI / Anthropic). */
export async function* streamLLMDeltas(
  messages: LLMChatMessage[],
  orgSettings: OrgLlmSettings,
): AsyncGenerator<string, LlmStreamUsage, undefined> {
  if (messages.length === 0) {
    throw new ApiError("No messages for LLM", 400, "llm_no_messages");
  }

  if (orgSettings.llm_provider === "openai" || orgSettings.llm_provider === "openrouter") {
    const gen = streamOpenAIDeltas(messages, orgSettings);
    while (true) {
      const step = await gen.next();
      if (step.done) {
        return step.value;
      }
      yield step.value;
    }
  }
  if (orgSettings.llm_provider === "anthropic") {
    const gen = streamAnthropicDeltas(messages, orgSettings);
    while (true) {
      const step = await gen.next();
      if (step.done) {
        return step.value;
      }
      yield step.value;
    }
  }
  throw new ApiError("Unsupported LLM provider", 500, "llm_bad_provider");
}
