/**
 * Server-side env access for API routes and lib/server.
 * Client code must use only NEXT_PUBLIC_* vars.
 */

function required(name: string, value: string | undefined): string {
  if (!value?.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getPublicSupabaseUrl(): string {
  return required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
}

/** Публичный ключ: legacy `anon` или новый publishable (`sb_publishable_…`). */
export function tryGetPublicSupabaseAnonKey(): string | undefined {
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  return anon || publishable || undefined;
}

export function getPublicSupabaseAnonKey(): string {
  return required(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY (или NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)",
    tryGetPublicSupabaseAnonKey(),
  );
}

export function getSupabaseServiceRoleKey(): string {
  return required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** Публичный origin приложения (письма с ссылкой сброса, redirect в Supabase). */
export function getAppOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "");
    return `https://${host}`;
  }
  return "http://localhost:3000";
}

export function getResendApiKey(): string | undefined {
  const k = process.env.RESEND_API_KEY?.trim();
  return k || undefined;
}

export function getFromEmail(): string {
  return required("FROM_EMAIL", process.env.FROM_EMAIL);
}
