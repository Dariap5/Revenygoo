"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { trySyncWorkspaceSessionFromSupabase } from "@/lib/auth/sync-workspace-from-supabase";
import {
  getPostAuthPath,
  readWorkspaceSession,
} from "@/lib/session/workspace-session";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await trySyncWorkspaceSessionFromSupabase();
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
