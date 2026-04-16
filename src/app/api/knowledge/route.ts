import {
  requireOrgMember,
  resolveOrganizationId,
} from "@/lib/server/auth/membership";
import { requireUser } from "@/lib/server/auth/session";
import { ApiError } from "@/lib/server/errors";
import { jsonError, jsonOk } from "@/lib/server/http/json-response";
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
    await requireOrgMember(user.id, organizationId);

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("knowledge_sources")
      .select("id, org_id, name, file_path, size, status, created_at")
      .eq("org_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new ApiError(error.message, 500, "knowledge_list_failed");
    }

    const items = (data ?? []).map((row) => ({
      id: row.id,
      orgId: row.org_id,
      name: row.name,
      filePath: row.file_path,
      size: row.size,
      status: row.status,
      createdAt: row.created_at,
    }));

    return jsonOk({ items });
  } catch (e) {
    return jsonError(e);
  }
}
