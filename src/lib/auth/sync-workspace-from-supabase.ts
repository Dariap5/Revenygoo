import type { User } from "@supabase/supabase-js";

import { createBrowserSupabaseClient } from "@/lib/server/supabase/browser";
import {
  defaultWorkspaceSession,
  patchWorkspaceSession,
  readWorkspaceSession,
} from "@/lib/session/workspace-session";

/**
 * Подтягивает email из Supabase в локальную демо-сессию, чтобы не ломать onboarding / guard.
 */
export function applySupabaseUserToWorkspaceSession(user: User): void {
  const login = user.email?.trim() || user.id;
  const prev = readWorkspaceSession();
  const base =
    prev.authenticated && prev.login === login
      ? prev
      : { ...defaultWorkspaceSession(), authenticated: true, login };

  patchWorkspaceSession({
    ...base,
    authenticated: true,
    login,
  });
}

/**
 * Если в браузере есть валидная Supabase-сессия — синхронизирует workspace localStorage.
 * Без env или при ошибке клиента — no-op / false.
 */
export async function trySyncWorkspaceSessionFromSupabase(): Promise<boolean> {
  try {
    const supabase = createBrowserSupabaseClient();
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.user) {
      return false;
    }
    applySupabaseUserToWorkspaceSession(data.session.user);
    return true;
  } catch {
    return false;
  }
}
