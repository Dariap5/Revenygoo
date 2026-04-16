import { jsonError, jsonOk } from "@/lib/server/http/json-response";
import { requireOrgAdminAccess, resolveOrganizationId } from "@/lib/server/auth/membership";
import { requireUser } from "@/lib/server/auth/session";
import { testLlmProviderConnection } from "@/lib/server/admin/llm-connection-test";
import { decryptLlmApiKey } from "@/lib/server/crypto/llm-settings-crypto";
import { ApiError } from "@/lib/server/errors";
import { isUuid } from "@/lib/server/http/uuid";
import { createServerSupabaseClient } from "@/lib/server/supabase/server";

function orgHeader(request: Request): string | null {
  return request.headers.get("x-organization-id");
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { organizationId } = await resolveOrganizationId(
      user.id,
      orgHeader(request),
    );
    await requireOrgAdminAccess(user.id, organizationId);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")?.trim();

    const supabase = await createServerSupabaseClient();
    let query = supabase
      .from("org_llm_settings")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("enabled", true);

    if (id && isUuid(id)) {
      query = query.eq("id", id);
    }

    const { data: rows, error } = await query
      .order("updated_at", { ascending: false })
      .limit(1);

    if (error) {
      throw new ApiError(error.message, 500, "org_llm_test_fetch_failed");
    }
    const row = rows?.[0];
    if (!row) {
      return jsonOk({
        ok: false,
        message: id
          ? "Запись не найдена или отключена"
          : "Нет активной модели. Сохраните конфигурацию и включите её.",
      });
    }

    const apiKey = decryptLlmApiKey(row.api_key_encrypted);
    const result = await testLlmProviderConnection({
      provider: row.provider,
      apiKey,
      modelName: row.model_name,
      maxTokens: row.max_tokens,
      baseUrl: row.base_url,
    });

    if (result.ok) {
      return jsonOk({ ok: true, modelId: row.id });
    }
    return jsonOk({ ok: false, message: result.message, modelId: row.id });
  } catch (e) {
    return jsonError(e);
  }
}
