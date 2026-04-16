"use client";

import Link from "next/link";

import { useChatApiBannerState } from "@/lib/chat/chat-api-banner-store";

export function ChatBackendBanner() {
  const banner = useChatApiBannerState();
  if (!banner) return null;

  let message: string;
  if (banner.kind === "unauthorized") {
    message = "Сессия недействительна или вы не авторизованы.";
  } else if (banner.kind === "forbidden") {
    message =
      "Нет доступа к организации или чату. Проверьте membership в Supabase.";
  } else if (banner.kind === "dlp_blocked") {
    const list = (banner.dlpTypes ?? [])
      .filter((x) => x.trim().length > 0)
      .join(", ");
    message = list
      ? `Сообщение заблокировано политикой: ${list}`
      : "Сообщение заблокировано политикой безопасности.";
  } else {
    message =
      banner.detail?.trim() ||
      "Запрос к серверу не выполнен. Повторите попытку позже.";
  }

  return (
    <div
      role="status"
      className="shrink-0 border-b border-destructive/25 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive"
    >
      <span>{message}</span>
      {banner.kind === "unauthorized" ? (
        <Link
          href="/login"
          className="ml-2 font-medium text-destructive underline underline-offset-2"
        >
          Войти снова
        </Link>
      ) : null}
      {banner.kind === "dlp_blocked" ? (
        <Link
          href="/policies"
          className="ml-2 font-medium text-destructive underline underline-offset-2"
        >
          Узнать подробнее
        </Link>
      ) : null}
    </div>
  );
}
