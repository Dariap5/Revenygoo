"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AiOnboardingGuideWizard } from "@/components/onboarding/ai-onboarding-guide-wizard";
import { trySyncWorkspaceSessionFromSupabase } from "@/lib/auth/sync-workspace-from-supabase";
import {
  getPostAuthPath,
  readWorkspaceSession,
} from "@/lib/session/workspace-session";

export default function AiGuideOnboardingPage() {
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
      if (!s.personalizationViewed) {
        router.replace("/onboarding/personalizing");
        return;
      }
      const target = getPostAuthPath(s);
      if (target !== "/onboarding/ai-guide") {
        router.replace(target);
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
        <span className="ml-2 text-xs text-muted-foreground">
          Инструкция по ИИ
        </span>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-8">
        <AiOnboardingGuideWizard />
      </div>
    </div>
  );
}
