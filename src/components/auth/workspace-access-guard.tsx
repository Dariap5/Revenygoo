"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  readWorkspaceSession,
  workspaceEntryRedirect,
} from "@/lib/session/workspace-session";

export function WorkspaceAccessGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const session = readWorkspaceSession();
    const next = workspaceEntryRedirect(session);
    if (next) router.replace(next);
  }, [hydrated, pathname, router]);

  if (!hydrated) {
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
