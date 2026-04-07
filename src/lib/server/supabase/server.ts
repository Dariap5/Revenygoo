import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getPublicSupabaseAnonKey, getPublicSupabaseUrl } from "@/lib/server/env";

import type { Database } from "./database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client for Route Handlers / Server Components (user session + RLS).
 */
export async function createServerSupabaseClient(): Promise<
  SupabaseClient<Database>
> {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    getPublicSupabaseUrl(),
    getPublicSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            /* set from Server Component — ignore */
          }
        },
      },
    },
  );
}
