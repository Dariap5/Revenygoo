import "server-only";

import type { LlmAdminProvider } from "@/lib/server/supabase/database.types";

const ANTHROPIC_VERSION = "2023-06-01";

export async function testLlmProviderConnection(params: {
  provider: LlmAdminProvider;
  apiKey: string;
  modelName: string;
  maxTokens: number;
  baseUrl?: string | null;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const maxTok = Math.min(32, Math.max(1, params.maxTokens));

  try {
    if (params.provider === "routerai") {
      const base = (params.baseUrl ?? "").replace(/\/$/, "");
      if (!base) {
        return {
          ok: false,
          message: "Для RouterAI укажите base URL (например https://routerai.ru/api/v1).",
        };
      }
      const res = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${params.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: params.modelName,
          max_tokens: maxTok,
          messages: [{ role: "user", content: "ping" }],
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        let msg = res.statusText;
        try {
          const j = JSON.parse(t) as { error?: { message?: string } };
          if (j.error?.message) msg = j.error.message;
        } catch {
          if (t.trim()) msg = t.slice(0, 400);
        }
        return { ok: false, message: msg };
      }
      return { ok: true };
    }

    if (params.provider === "openai") {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${params.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: params.modelName,
          max_tokens: maxTok,
          messages: [{ role: "user", content: "ping" }],
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        let msg = res.statusText;
        try {
          const j = JSON.parse(t) as { error?: { message?: string } };
          if (j.error?.message) msg = j.error.message;
        } catch {
          if (t.trim()) msg = t.slice(0, 400);
        }
        return { ok: false, message: msg };
      }
      return { ok: true };
    }

    if (params.provider === "anthropic") {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": params.apiKey,
          "anthropic-version": ANTHROPIC_VERSION,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: params.modelName,
          max_tokens: maxTok,
          messages: [{ role: "user", content: "ping" }],
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        let msg = res.statusText;
        try {
          const j = JSON.parse(t) as { error?: { message?: string } };
          if (j.error?.message) msg = j.error.message;
        } catch {
          if (t.trim()) msg = t.slice(0, 400);
        }
        return { ok: false, message: msg };
      }
      return { ok: true };
    }

    if (params.provider === "gigachat") {
      return {
        ok: false,
        message: "Проверка GigaChat пока не подключена (нужны OAuth и endpoint).",
      };
    }

    if (params.provider === "yandexgpt") {
      return {
        ok: false,
        message: "Проверка YandexGPT пока не подключена (нужен IAM и folder).",
      };
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    return { ok: false, message: msg };
  }

  return { ok: false, message: "Неизвестный провайдер" };
}
