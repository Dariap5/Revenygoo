import { jsonError, jsonOk } from "@/lib/server/http/json-response";
import { requireOrgAdminAccess, resolveOrganizationId } from "@/lib/server/auth/membership";
import { requireUser } from "@/lib/server/auth/session";
import { ApiError } from "@/lib/server/errors";
import { encryptLlmApiKey } from "@/lib/server/crypto/llm-settings-crypto";
import { isUuid } from "@/lib/server/http/uuid";
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

type RouteCtx = { params: Promise<{ id: string }> };

type PatchBody = {
  provider?: string;
  apiKey?: string;
  modelName?: string;
  maxTokens?: number;
  enabled?: boolean;
  baseUrl?: string;
  organizationId?: string;
};

export async function PATCH(request: Request, context: RouteCtx) {
  try {
    const { id } = await context.params;
    if (!isUuid(id)) {
      throw new ApiError("Некорректный id", 400, "invalid_id");
    }
    const user = await requireUser();
    const json = (await request.json().catch(() => ({}))) as PatchBody;
    const { organizationId } = await resolveOrganizationId(
      user.id,
      json.organizationId?.trim() ?? orgHeader(request),
    );
    await requireOrgAdminAccess(user.id, organizationId);

    const supabase = await createServerSupabaseClient();
    const { data: existing, error: fetchErr } = await supabase
      .from("org_llm_settings")
      .select("id")
      .eq("id", id)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (fetchErr) {
      throw new ApiError(fetchErr.message, 500, "org_llm_fetch_failed");
    }
    if (!existing) {
      throw new ApiError("Запись не найдена", 404, "not_found");
    }

    const patch: Record<string, unknown> = {};
    const p = parseProvider(json.provider);
    if (p) patch.provider = p;
    if (typeof json.modelName === "string" && json.modelName.trim()) {
      patch.model_name = json.modelName.trim();
    }
    if (typeof json.maxTokens === "number" && Number.isFinite(json.maxTokens)) {
      const mt = Math.floor(json.maxTokens);
      if (mt < 1 || mt > 200_000) {
        throw new ApiError("max_tokens вне допустимого диапазона", 400, "validation_error");
      }
      patch.max_tokens = mt;
    }
    if (typeof json.enabled === "boolean") {
      patch.enabled = json.enabled;
    }
    if (typeof json.apiKey === "string" && json.apiKey.trim()) {
      patch.api_key_encrypted = encryptLlmApiKey(json.apiKey.trim());
    }
    if (typeof json.baseUrl === "string") {
      patch.base_url = json.baseUrl.trim().replace(/\/$/, "") || null;
    }

    if (Object.keys(patch).length === 0) {
      throw new ApiError("Нет полей для обновления", 400, "validation_error");
    }

    const { data, error } = await supabase
      .from("org_llm_settings")
      .update(patch)
      .eq("id", id)
      .eq("organization_id", organizationId)
      .select(
        "id, organization_id, provider, model_name, max_tokens, enabled, base_url, created_at, updated_at",
      )
      .single();

    if (error) {
      throw new ApiError(error.message, 500, "org_llm_update_failed");
    }

    return jsonOk({
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

export async function DELETE(request: Request, context: RouteCtx) {
  try {
    const { id } = await context.params;
    if (!isUuid(id)) {
      throw new ApiError("Некорректный id", 400, "invalid_id");
    }
    const user = await requireUser();
    const { organizationId } = await resolveOrganizationId(
      user.id,
      orgHeader(request),
    );
    await requireOrgAdminAccess(user.id, organizationId);

    const supabase = await createServerSupabaseClient();
    const { data: deletedRows, error } = await supabase
      .from("org_llm_settings")
      .delete()
      .eq("id", id)
      .eq("organization_id", organizationId)
      .select("id");

    if (error) {
      throw new ApiError(error.message, 500, "org_llm_delete_failed");
    }
    if (!deletedRows?.length) {
      throw new ApiError("Запись не найдена", 404, "not_found");
    }

    return jsonOk({ organizationId, deleted: true });
  } catch (e) {
    return jsonError(e);
  }
}
