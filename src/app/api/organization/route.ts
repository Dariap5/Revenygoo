import { requireOrgMember, resolveOrganizationId } from "@/lib/server/auth/membership";
import { requireUser } from "@/lib/server/auth/session";
import { ApiError } from "@/lib/server/errors";
import { jsonError, jsonOk } from "@/lib/server/http/json-response";
import { createAdminSupabaseClient } from "@/lib/server/supabase/admin";
import { createServerSupabaseClient } from "@/lib/server/supabase/server";

function orgHeader(request: Request): string | null {
  return request.headers.get("x-organization-id");
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { organizationId, memberships } = await resolveOrganizationId(
      user.id,
      orgHeader(request),
    );
    await requireOrgMember(user.id, organizationId);
    const member = memberships.find((m) => m.organizationId === organizationId)!;
    const canInvite = member.role === "owner" || member.role === "admin";

    const supabase = await createServerSupabaseClient();

    const { data: members, error: mErr } = await supabase
      .from("organization_members")
      .select("id, user_id, role, created_at")
      .eq("organization_id", organizationId)
      .order("role", { ascending: true })
      .order("created_at", { ascending: true });

    if (mErr) {
      throw new ApiError(mErr.message, 500, "members_list_failed");
    }

    const { data: invites, error: iErr } = await supabase
      .from("invitations")
      .select("id, email, role, expires_at, accepted_at, created_at")
      .eq("org_id", organizationId)
      .is("accepted_at", null)
      .order("created_at", { ascending: false });

    if (iErr) {
      throw new ApiError(iErr.message, 500, "invites_list_failed");
    }

    const userIds = [...new Set((members ?? []).map((r) => r.user_id))];
    const nameByUserId = new Map<string, string | null>();
    const emailByUserId = new Map<string, string>();

    if (userIds.length > 0) {
      try {
        const admin = createAdminSupabaseClient();
        const { data: profRows } = await admin
          .from("profiles")
          .select("id, display_name")
          .in("id", userIds);
        for (const p of profRows ?? []) {
          nameByUserId.set(p.id, p.display_name?.trim() || null);
        }
        await Promise.all(
          userIds.map(async (uid) => {
            const { data, error } = await admin.auth.admin.getUserById(uid);
            if (!error && data.user?.email) {
              emailByUserId.set(uid, data.user.email.trim().toLowerCase());
            }
          }),
        );
      } catch {
        /* service role / admin API */
      }
    }

    const items = (members ?? []).map((row) => ({
      membershipId: row.id,
      userId: row.user_id,
      name: nameByUserId.get(row.user_id) ?? null,
      email: emailByUserId.get(row.user_id) ?? null,
      role: row.role,
      status: "active" as const,
    }));

    const now = Date.now();
    const invitationRows = (invites ?? []).map((r) => {
      const expired = new Date(r.expires_at).getTime() < now;
      return {
        id: r.id,
        email: r.email,
        role: r.role,
        expiresAt: r.expires_at,
        status: expired ? ("expired" as const) : ("pending" as const),
      };
    });

    return jsonOk({
      organizationId,
      canInvite,
      members: items,
      invitations: invitationRows,
    });
  } catch (e) {
    return jsonError(e);
  }
}
