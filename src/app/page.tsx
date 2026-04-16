"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { hydrateWorkspaceAuthFromBrowser } from "@/lib/auth/demo-supabase-sign-in";
import {
  getPostAuthPath,
  readWorkspaceSession,
} from "@/lib/session/workspace-session";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await hydrateWorkspaceAuthFromBrowser();
      if (cancelled) return;
      router.replace(getPostAuthPath(readWorkspaceSession()));
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Загрузка…</p>
    </div>
  );
}
