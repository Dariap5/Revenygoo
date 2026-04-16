"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { hydrateWorkspaceAuthFromBrowser } from "@/lib/auth/demo-supabase-sign-in";
import {
  readWorkspaceSession,
  workspaceEntryRedirect,
} from "@/lib/session/workspace-session";

export function WorkspaceAccessGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    (async () => {
      await hydrateWorkspaceAuthFromBrowser();
      if (!cancelled) {
        setSessionReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated]);

  useEffect(() => {
    if (!sessionReady) return;
    const session = readWorkspaceSession();
    const next = workspaceEntryRedirect(session);
    if (next) {
      router.replace(next);
    }
  }, [sessionReady, pathname, router]);

  if (!hydrated || !sessionReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      </div>
    );
  }

  const session = readWorkspaceSession();
  if (workspaceEntryRedirect(session)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Перенаправление…</p>
      </div>
    );
  }

  return <>{children}</>;
}
