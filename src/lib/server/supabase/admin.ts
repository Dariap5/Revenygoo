import "server-only";

import { createClient } from "@supabase/supabase-js";

import {
  getPublicSupabaseAnonKey,
  getPublicSupabaseUrl,
  getSupabaseServiceRoleKey,
} from "@/lib/server/env";

import type { Database } from "./database.types";

/**
 * Service role client — bypasses RLS. Use only on the server for admin tasks.
 */
export function createAdminSupabaseClient() {
  return createClient<Database>(
    getPublicSupabaseUrl(),
    getSupabaseServiceRoleKey(),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

/**
 * Optional: anon key + RLS when you intentionally avoid user cookies (rare).
 */
export function createAnonSupabaseClient() {
  return createClient<Database>(getPublicSupabaseUrl(), getPublicSupabaseAnonKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
