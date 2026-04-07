"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { PersonalizingScreen } from "@/components/onboarding/personalizing-screen";
import { trySyncWorkspaceSessionFromSupabase } from "@/lib/auth/sync-workspace-from-supabase";
import { readWorkspaceSession } from "@/lib/session/workspace-session";

export default function PersonalizingPage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await trySyncWorkspaceSessionFromSupabase();
      if (cancelled) return;
      const s = readWorkspaceSession();
      if (!s.authenticated) {
        router.replace("/login");
        return;
      }
      if (!s.profile) {
        router.replace("/onboarding/profile");
        return;
      }
      if (s.personalizationViewed && !s.aiGuideCompleted) {
        router.replace("/onboarding/ai-guide");
        return;
      }
      if (s.aiGuideCompleted) {
        router.replace("/scenarios");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-12 shrink-0 items-center border-b border-border px-5 sm:px-6">
        <Link
          href="/login"
          className="text-sm font-semibold tracking-tight text-foreground"
        >
          Revenygo
        </Link>
        <span className="ml-2 text-xs text-muted-foreground">Настройка</span>
      </header>
      <div className="flex flex-1 flex-col items-center px-5 py-10">
        <PersonalizingScreen />
      </div>
    </div>
  );
}
