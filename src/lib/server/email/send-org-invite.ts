import { Resend } from "resend";

import { getAppOrigin, getFromEmail, getResendApiKey } from "@/lib/server/env";

export async function sendOrganizationInviteEmail(input: {
  to: string;
  organizationName: string;
  acceptUrl: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const resendKey = getResendApiKey();
  if (!resendKey) {
    return { ok: false, message: "RESEND_API_KEY не настроен" };
  }
  let from: string;
  try {
    from = getFromEmail();
  } catch {
    return { ok: false, message: "FROM_EMAIL не настроен" };
  }

  const origin = getAppOrigin();
  const logoUrl = `${origin}/favicon.ico`;

  const resend = new Resend(resendKey);
  const { error } = await resend.emails.send({
    from,
    to: input.to,
    subject: `Приглашение в ${input.organizationName} — Revenygo`,
    html: `
      <div style="font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.5;color:#111">
        <img src="${logoUrl}" alt="Revenygo" width="40" height="40" style="display:block;margin-bottom:16px;border-radius:8px" />
        <p style="margin:0 0 12px">Вас пригласили в организацию <strong>${escapeHtml(input.organizationName)}</strong>.</p>
        <p style="margin:0 0 20px;color:#444">Нажмите кнопку ниже, чтобы принять приглашение.</p>
        <a href="${input.acceptUrl}" style="display:inline-block;padding:10px 18px;background:#111827;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Принять</a>
      </div>
    `,
  });

  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
