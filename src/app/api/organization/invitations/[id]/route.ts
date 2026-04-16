import { requireOrgAdminAccess, resolveOrganizationId } from "@/lib/server/auth/membership";
import { requireUser } from "@/lib/server/auth/session";
import { ApiError } from "@/lib/server/errors";
import { isUuid } from "@/lib/server/http/uuid";
import { jsonError, jsonOk } from "@/lib/server/http/json-response";
import { createServerSupabaseClient } from "@/lib/server/supabase/server";

function orgHeader(request: Request): string | null {
  return request.headers.get("x-organization-id");
}

type RouteCtx = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, context: RouteCtx) {
  try {
    const { id } = await context.params;
    if (!isUuid(id)) {
      throw new ApiError("Некорректный id", 400, "invalid_id");
    }
    const user = await requireUser();
    const url = new URL(request.url);
    const orgFromQuery = url.searchParams.get("organizationId")?.trim();
    const json = (await request.json().catch(() => ({}))) as { organizationId?: string };
    const { organizationId } = await resolveOrganizationId(
      user.id,
      json.organizationId?.trim() ?? orgFromQuery ?? orgHeader(request),
    );
    await requireOrgAdminAccess(user.id, organizationId);

    const supabase = await createServerSupabaseClient();
    const { data: deleted, error } = await supabase
      .from("invitations")
      .delete()
      .eq("id", id)
      .eq("org_id", organizationId)
      .is("accepted_at", null)
      .select("id");

    if (error) {
      throw new ApiError(error.message, 500, "invite_delete_failed");
    }
    if (!deleted?.length) {
      throw new ApiError("Приглашение не найдено", 404, "not_found");
    }

    return jsonOk({ deleted: true });
  } catch (e) {
    return jsonError(e);
  }
}
