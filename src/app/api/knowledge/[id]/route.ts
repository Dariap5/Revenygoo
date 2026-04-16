import {
  requireOrgMember,
  resolveOrganizationId,
} from "@/lib/server/auth/membership";
import { requireUser } from "@/lib/server/auth/session";
import { ApiError } from "@/lib/server/errors";
import { jsonError, jsonOk } from "@/lib/server/http/json-response";
import { isUuid } from "@/lib/server/http/uuid";
import { KNOWLEDGE_BUCKET } from "@/lib/server/knowledge/knowledge-upload";
import { createAdminSupabaseClient } from "@/lib/server/supabase/admin";

function orgHeader(request: Request): string | null {
  return request.headers.get("x-organization-id");
}

type RouteCtx = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, context: RouteCtx) {
  try {
    const { id } = await context.params;
    if (!isUuid(id)) {
      throw new ApiError("Некорректный id", 400, "validation_error");
    }

    const user = await requireUser();
    const { organizationId } = await resolveOrganizationId(
      user.id,
      orgHeader(request),
    );
    await requireOrgMember(user.id, organizationId);

    const admin = createAdminSupabaseClient();
    const { data: row, error: selErr } = await admin
      .from("knowledge_sources")
      .select("id, org_id, file_path")
      .eq("id", id)
      .maybeSingle();

    if (selErr) {
      throw new ApiError(selErr.message, 500, "knowledge_query_failed");
    }
    if (!row || row.org_id !== organizationId) {
      throw new ApiError("Не найдено", 404, "not_found");
    }

    const { error: rmErr } = await admin.storage
      .from(KNOWLEDGE_BUCKET)
      .remove([row.file_path]);
    if (rmErr) {
      throw new ApiError(
        rmErr.message || "Не удалось удалить файл",
        502,
        "storage_delete_failed",
      );
    }

    const { error: delErr } = await admin
      .from("knowledge_sources")
      .delete()
      .eq("id", id)
      .eq("org_id", organizationId);

    if (delErr) {
      throw new ApiError(delErr.message, 500, "knowledge_delete_failed");
    }

    return jsonOk({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}
