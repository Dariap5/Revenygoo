import { Resend } from "resend";

import { ApiError } from "@/lib/server/errors";
import { createAdminSupabaseClient } from "@/lib/server/supabase/admin";
import {
  getAppOrigin,
  getFromEmail,
  getResendApiKey,
} from "@/lib/server/env";
import { jsonError, jsonOk } from "@/lib/server/http/json-response";

export async function POST(request: Request) {
  const resendKey = getResendApiKey();
  if (!resendKey) {
    return jsonError(
      new ApiError("Сброс пароля временно недоступен (нет RESEND_API_KEY).", 503),
    );
  }

  let from: string;
  try {
    from = getFromEmail();
  } catch {
    return jsonError(new ApiError("FROM_EMAIL не настроен.", 503));
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(new ApiError("Некорректное тело запроса.", 400));
  }

  const email =
    typeof body === "object" &&
    body !== null &&
    "email" in body &&
    typeof (body as { email: unknown }).email === "string"
      ? (body as { email: string }).email.trim().toLowerCase()
      : "";

  if (!email || !email.includes("@")) {
    return jsonError(new ApiError("Укажите корректный email.", 400));
  }

  const origin = getAppOrigin();
  const nextPath = "/auth/reset-password";
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo },
  });

  const actionLink = data?.properties?.action_link;
  if (error || !actionLink) {
    console.warn("[forgot-password] generateLink skipped or failed", error?.message ?? "no link");
    return jsonOk({
      ok: true,
      message:
        "Если такой email зарегистрирован, мы отправили ссылку для сброса пароля.",
    });
  }

  const resend = new Resend(resendKey);
  const { error: sendError } = await resend.emails.send({
    from,
    to: email,
    subject: "Сброс пароля — Revenygo",
    html: `
      <p>Здравствуйте!</p>
      <p>Чтобы задать новый пароль для входа в Revenygo, перейдите по ссылке (действует ограниченное время):</p>
      <p><a href="${actionLink}">Сбросить пароль</a></p>
      <p>Если вы не запрашивали сброс, проигнорируйте это письмо.</p>
    `,
  });

  if (sendError) {
    console.error("[forgot-password] Resend error", sendError);
    return jsonError(
      new ApiError("Не удалось отправить письмо. Попробуйте позже.", 502),
    );
  }

  return jsonOk({
    ok: true,
    message:
      "Если такой email зарегистрирован, мы отправили ссылку для сброса пароля.",
  });
}
