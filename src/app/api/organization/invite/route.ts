import { requireOrgAdminAccess, resolveOrganizationId } from "@/lib/server/auth/membership";
import { requireUser } from "@/lib/server/auth/session";
import { sendOrganizationInviteEmail } from "@/lib/server/email/send-org-invite";
import { ApiError } from "@/lib/server/errors";
import { jsonCreated, jsonError } from "@/lib/server/http/json-response";
import { getAppOrigin } from "@/lib/server/env";
import type { OrgRole } from "@/lib/server/supabase/database.types";
import { createServerSupabaseClient } from "@/lib/server/supabase/server";

function orgHeader(request: Request): string | null {
  return request.headers.get("x-organization-id");
}

const INVITEABLE_ROLES = new Set<OrgRole>(["admin", "manager", "employee"]);

function orgRole(v: unknown): OrgRole | null {
  if (typeof v !== "string") return null;
  return INVITEABLE_ROLES.has(v as OrgRole) ? (v as OrgRole) : null;
}

type PostBody = {
  email?: string;
  role?: string;
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

    const emailRaw = typeof json.email === "string" ? json.email.trim().toLowerCase() : "";
    if (!emailRaw || !emailRaw.includes("@")) {
      throw new ApiError("Укажите корректный email", 400, "validation_error");
    }
    const role = orgRole(json.role);
    if (!role) {
      throw new ApiError("Некорректная роль", 400, "validation_error");
    }

    const supabase = await createServerSupabaseClient();
    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("id", organizationId)
      .maybeSingle();
    if (orgErr || !org) {
      throw new ApiError(orgErr?.message ?? "Организация не найдена", 404, "org_not_found");
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data: inv, error: insErr } = await supabase
      .from("invitations")
      .insert({
        org_id: organizationId,
        email: emailRaw,
        role,
        expires_at: expiresAt.toISOString(),
      })
      .select("id, token, expires_at, email, role")
      .single();

    if (insErr) {
      if (insErr.code === "23505") {
        throw new ApiError("Приглашение для этого email уже отправлено", 409, "duplicate_invite");
      }
      throw new ApiError(insErr.message, 500, "invite_create_failed");
    }

    const origin = getAppOrigin();
    const acceptUrl = `${origin}/auth/accept-invite?token=${encodeURIComponent(inv.token)}`;
    const sent = await sendOrganizationInviteEmail({
      to: emailRaw,
      organizationName: org.name,
      acceptUrl,
    });

    if (!sent.ok) {
      await supabase.from("invitations").delete().eq("id", inv.id);
      throw new ApiError(sent.message, 503, "email_send_failed");
    }

    return jsonCreated({
      invitation: {
        id: inv.id,
        email: inv.email,
        role: inv.role,
        expiresAt: inv.expires_at,
      },
    });
  } catch (e) {
    return jsonError(e);
  }
}
