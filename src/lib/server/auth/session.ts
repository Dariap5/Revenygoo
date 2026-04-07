import type { User } from "@supabase/supabase-js";

import { ApiError } from "@/lib/server/errors";
import { createServerSupabaseClient } from "@/lib/server/supabase/server";

export type SessionUser = User;

export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return null;
  }
  return data.user;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new ApiError("Unauthorized", 401, "unauthorized");
  }
  return user;
}
