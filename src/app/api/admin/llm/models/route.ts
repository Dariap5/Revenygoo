import { jsonCreated, jsonError, jsonOk } from "@/lib/server/http/json-response";
import { requireOrgAdminAccess, resolveOrganizationId } from "@/lib/server/auth/membership";
import { requireUser } from "@/lib/server/auth/session";
import { ApiError } from "@/lib/server/errors";
import { encryptLlmApiKey } from "@/lib/server/crypto/llm-settings-crypto";
import { createServerSupabaseClient } from "@/lib/server/supabase/server";
import type { LlmAdminProvider } from "@/lib/server/supabase/database.types";

function orgHeader(request: Request): string | null {
  return request.headers.get("x-organization-id");
}

const PROVIDERS: LlmAdminProvider[] = [
  "openai",
  "anthropic",
  "gigachat",
  "yandexgpt",
  "routerai",
];

function parseProvider(v: unknown): LlmAdminProvider | null {
  if (typeof v !== "string") return null;
  return PROVIDERS.includes(v as LlmAdminProvider) ? (v as LlmAdminProvider) : null;
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { organizationId } = await resolveOrganizationId(
      user.id,
      orgHeader(request),
    );
    await requireOrgAdminAccess(user.id, organizationId);

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("org_llm_settings")
      .select(
        "id, organization_id, provider, model_name, max_tokens, enabled, base_url, created_at, updated_at",
      )
      .eq("organization_id", organizationId)
      .order("enabled", { ascending: false })
      .order("model_name", { ascending: true });

    if (error) {
      throw new ApiError(error.message, 500, "org_llm_list_failed");
    }

    const models = (data ?? []).map((row) => ({
      id: row.id,
      provider: row.provider,
      modelName: row.model_name,
      maxTokens: row.max_tokens,
      enabled: row.enabled,
      baseUrl: row.base_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      hasApiKey: true,
    }));

    return jsonOk({ organizationId, models });
  } catch (e) {
    return jsonError(e);
  }
}

type PostBody = {
  provider?: string;
  apiKey?: string;
  modelName?: string;
  maxTokens?: number;
  enabled?: boolean;
  baseUrl?: string;
  organizationId?: string;
};

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const json = (await request.json().catch(() => ({}))) as PostBody;
    const { organizationId } = await resolveOrganizationId(
      user.id,
      json.organizationId?.trim() ?? orgHeader(request),
    );
    await requireOrgAdminAccess(user.id, organizationId);

    const provider = parseProvider(json.provider);
    const apiKey = typeof json.apiKey === "string" ? json.apiKey.trim() : "";
    const modelName =
      typeof json.modelName === "string" ? json.modelName.trim() : "";
    if (!provider) {
      throw new ApiError("Некорректный провайдер", 400, "validation_error");
    }
    if (!apiKey) {
      throw new ApiError("API-ключ обязателен", 400, "validation_error");
    }
    if (!modelName) {
      throw new ApiError("Укажите модель", 400, "validation_error");
    }

    const baseUrl =
      typeof json.baseUrl === "string" ? json.baseUrl.trim().replace(/\/$/, "") : "";
    if (provider === "routerai" && !baseUrl) {
      throw new ApiError("Для RouterAI укажите base URL", 400, "validation_error");
    }

    let maxTokens = 4096;
    if (typeof json.maxTokens === "number" && Number.isFinite(json.maxTokens)) {
      maxTokens = Math.floor(json.maxTokens);
    }
    if (maxTokens < 1 || maxTokens > 200_000) {
      throw new ApiError("max_tokens вне допустимого диапазона", 400, "validation_error");
    }

    const apiKeyEncrypted = encryptLlmApiKey(apiKey);
    const enabled = json.enabled !== false;

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("org_llm_settings")
      .insert({
        organization_id: organizationId,
        provider,
        api_key_encrypted: apiKeyEncrypted,
        model_name: modelName,
        max_tokens: maxTokens,
        enabled,
        base_url: baseUrl || null,
      })
      .select(
        "id, organization_id, provider, model_name, max_tokens, enabled, base_url, created_at, updated_at",
      )
      .single();

    if (error) {
      throw new ApiError(error.message, 500, "org_llm_insert_failed");
    }

    return jsonCreated({
      organizationId,
      model: {
        id: data.id,
        provider: data.provider,
        modelName: data.model_name,
        maxTokens: data.max_tokens,
        enabled: data.enabled,
        baseUrl: data.base_url,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        hasApiKey: true,
      },
    });
  } catch (e) {
    return jsonError(e);
  }
}
