"use client";

import { createBrowserClient } from "@supabase/ssr";

/** Дублирует логику `tryGetPublicSupabaseAnonKey` без импорта из `lib/server` (клиентский бандл). */
function readPublicSupabaseKey(): string | undefined {
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  return anon || publishable || undefined;
}

/**
 * Browser Supabase client (Client Components only).
 */
export function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = readPublicSupabaseKey();
  if (!url || !key) {
    const parts: string[] = [];
    if (!url) parts.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!key) {
      parts.push(
        "NEXT_PUBLIC_SUPABASE_ANON_KEY (или NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)",
      );
    }
    throw new Error(
      `Не настроен Supabase: задайте ${parts.join(" и ")} в .env.local (или в Vercel → Environment Variables), затем перезапустите dev-сервер.`,
    );
  }
  return createBrowserClient(url, key);
}
