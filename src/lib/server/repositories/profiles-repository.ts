import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/server/supabase/database.types";

export async function getProfileById(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data;
}
