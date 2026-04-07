import { createBrowserSupabaseClient } from "@/lib/server/supabase/browser";
import { logoutWorkspaceSession } from "@/lib/session/workspace-session";

/** Завершает Supabase-сессию (cookies) и сбрасывает локальный workspace state. */
export async function signOutApp(): Promise<void> {
  try {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
  } catch {
    /* нет env или сеть */
  }
  logoutWorkspaceSession();
}
