import type { SupabaseClient } from "@supabase/supabase-js";

import { createBrowserSupabaseClient } from "@/lib/server/supabase/browser";
import { readWorkspaceSession } from "@/lib/session/workspace-session";

import {
  applySupabaseUserToWorkspaceSession,
  trySyncWorkspaceSessionFromSupabase,
} from "./sync-workspace-from-supabase";

/** Совпадает с миграцией `20250410120000_auth_demo_user.sql`. */
const DEFAULT_DEMO_EMAIL = "demo@revenygo.local";
const DEFAULT_DEMO_PASSWORD = "demo";

export function getDemoAuthCredentials(): { email: string; password: string } {
  return {
    email: process.env.NEXT_PUBLIC_DEMO_USER_EMAIL?.trim() || DEFAULT_DEMO_EMAIL,
    password: process.env.NEXT_PUBLIC_DEMO_USER_PASSWORD?.trim() || DEFAULT_DEMO_PASSWORD,
  };
}

export type DemoSignInResult = { ok: true } | { ok: false; message: string };

async function signInAsDemoWithClient(
  supabase: SupabaseClient,
): Promise<DemoSignInResult> {
  const { email, password } = getDemoAuthCredentials();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.user) {
    const raw = error?.message ?? "Не удалось войти под демо-пользователем.";
    if (raw.includes("Database error querying schema")) {
      return {
        ok: false,
        message:
          "Ошибка Auth в Supabase (часто из‑за NULL в полях токенов у пользователя, созданного SQL). Выполните миграцию 20250411140000_auth_tokens_profile_demo_org.sql в SQL Editor или пересоздайте пользователя через Dashboard.",
      };
    }
    if (raw === "Invalid login credentials") {
      return {
        ok: false,
        message:
          "Демо-пользователь не найден или неверный пароль. В Supabase SQL Editor выполните миграции с demo@revenygo.local (пароль demo).",
      };
    }
    return { ok: false, message: raw };
  }
  applySupabaseUserToWorkspaceSession(data.user);
  return { ok: true };
}

/** Вход под фиксированным демо-пользователем (cookies Supabase + workspace). */
export async function signInAsDemoSupabaseUser(): Promise<DemoSignInResult> {
  try {
    const supabase = createBrowserSupabaseClient();
    let result = await signInAsDemoWithClient(supabase);
    if (
      !result.ok &&
      typeof window !== "undefined" &&
      process.env.NEXT_PUBLIC_DEMO_AUTO_PROVISION === "true"
    ) {
      const res = await fetch("/api/auth/provision-demo", { method: "POST" });
      if (res.ok) {
        result = await signInAsDemoWithClient(supabase);
      }
    }
    return result;
  } catch (e) {
    const raw = e instanceof Error ? e.message : "";
    if (raw.includes("Не настроен Supabase") || raw.includes("Missing NEXT_PUBLIC")) {
      return { ok: false, message: raw };
    }
    const lower = raw.toLowerCase();
    const looksNetwork =
      lower.includes("failed to fetch") ||
      lower.includes("networkerror") ||
      lower.includes("load failed") ||
      lower.includes("network request failed");
    if (looksNetwork) {
      return {
        ok: false,
        message:
          "Ошибка сети при обращении к Supabase. Проверьте интернет, URL проекта и что сайт не блокирует запросы к *.supabase.co.",
      };
    }
    return {
      ok: false,
      message: raw
        ? raw
        : "Не настроен Supabase (проверьте NEXT_PUBLIC_SUPABASE_URL и ANON KEY) или непредвиденная ошибка клиента.",
    };
  }
}

/**
 * Если в workspace уже «вошли», а JWT Supabase нет — тихо логиним демо (чаты/API видят сессию).
 */
export async function ensureDemoSupabaseSessionIfWorkspaceAuthenticated(): Promise<void> {
  const ws = readWorkspaceSession();
  if (!ws.authenticated) return;

  let supabase: SupabaseClient;
  try {
    supabase = createBrowserSupabaseClient();
  } catch {
    return;
  }

  const { data, error } = await supabase.auth.getSession();
  if (!error && data.session?.user) {
    applySupabaseUserToWorkspaceSession(data.session.user);
    return;
  }

  await signInAsDemoWithClient(supabase);
}

/** Синхронизация из существующей Supabase-сессии + при необходимости тихий демо-вход. */
export async function hydrateWorkspaceAuthFromBrowser(): Promise<void> {
  await trySyncWorkspaceSessionFromSupabase();
  await ensureDemoSupabaseSessionIfWorkspaceAuthenticated();
}
