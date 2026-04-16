"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ProfileOnboardingWizard } from "@/components/onboarding/profile-onboarding-wizard";
import { hydrateWorkspaceAuthFromBrowser } from "@/lib/auth/demo-supabase-sign-in";
import {
  getPostAuthPath,
  readWorkspaceSession,
} from "@/lib/session/workspace-session";

export default function ProfileOnboardingPage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await hydrateWorkspaceAuthFromBrowser();
      if (cancelled) return;
      const s = readWorkspaceSession();
      if (!s.authenticated) {
        router.replace("/login");
        return;
      }
      const target = getPostAuthPath(s);
      if (target !== "/onboarding/profile") {
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
        <span className="ml-2 text-xs text-muted-foreground">Onboarding</span>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-8">
        <ProfileOnboardingWizard />
      </div>
    </div>
  );
}
