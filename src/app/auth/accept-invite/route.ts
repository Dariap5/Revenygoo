import { type NextRequest, NextResponse } from "next/server";

import { getSessionUser } from "@/lib/server/auth/session";
import { createAdminSupabaseClient } from "@/lib/server/supabase/admin";
import { isUuid } from "@/lib/server/http/uuid";

function safeNextPath(raw: string): string {
  if (!raw.startsWith("/") || raw.startsWith("//")) {
    return "/organization";
  }
  return raw;
}

function loginWithNext(nextPath: string, requestUrl: URL): URL {
  const u = new URL("/login", requestUrl.origin);
  u.searchParams.set("next", nextPath);
  return u;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token = requestUrl.searchParams.get("token")?.trim() ?? "";
  if (!token || !isUuid(token)) {
    return NextResponse.redirect(new URL("/organization?invite=invalid", requestUrl.origin));
  }

  const resumePath = `/auth/accept-invite?token=${encodeURIComponent(token)}`;
  const user = await getSessionUser();
  if (!user?.email) {
    return NextResponse.redirect(loginWithNext(resumePath, requestUrl));
  }

  const email = user.email.trim().toLowerCase();
  const admin = createAdminSupabaseClient();

  const { data: inv, error: invErr } = await admin
    .from("invitations")
    .select("id, org_id, email, role, expires_at, accepted_at")
    .eq("token", token)
    .maybeSingle();

  if (invErr || !inv) {
    return NextResponse.redirect(new URL("/organization?invite=invalid", requestUrl.origin));
  }

  if (inv.accepted_at) {
    return NextResponse.redirect(new URL(safeNextPath("/organization"), requestUrl.origin));
  }

  if (new Date(inv.expires_at).getTime() < Date.now()) {
    return NextResponse.redirect(new URL("/organization?invite=expired", requestUrl.origin));
  }

  if (inv.email !== email) {
    return NextResponse.redirect(new URL("/organization?invite=email_mismatch", requestUrl.origin));
  }

  const { data: existing } = await admin
    .from("organization_members")
    .select("id")
    .eq("organization_id", inv.org_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    const { error: memErr } = await admin.from("organization_members").insert({
      organization_id: inv.org_id,
      user_id: user.id,
      role: inv.role,
    });
    if (memErr) {
      console.error("[accept-invite] insert member", memErr.message);
      return NextResponse.redirect(new URL("/organization?invite=failed", requestUrl.origin));
    }
  }

  const { error: updErr } = await admin
    .from("invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", inv.id)
    .is("accepted_at", null);

  if (updErr) {
    console.error("[accept-invite] update invitation", updErr.message);
    return NextResponse.redirect(new URL("/organization?invite=failed", requestUrl.origin));
  }

  return NextResponse.redirect(new URL("/organization?invite=accepted", requestUrl.origin));
}
