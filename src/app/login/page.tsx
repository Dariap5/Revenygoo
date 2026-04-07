"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { isDemoLoginEnabled } from "@/lib/auth/demo-login-flag";
import { trySyncWorkspaceSessionFromSupabase } from "@/lib/auth/sync-workspace-from-supabase";
import {
  getPostAuthPath,
  readWorkspaceSession,
} from "@/lib/session/workspace-session";

export default function LoginPage() {
  const router = useRouter();
  const demoEnabled = isDemoLoginEnabled();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await trySyncWorkspaceSessionFromSupabase();
      if (cancelled) return;
      const s = readWorkspaceSession();
      if (s.authenticated) {
        router.replace(getPostAuthPath(s));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[hsl(var(--background))] p-4">
      <div className="mb-8 flex items-center gap-1">
        <span className="font-black text-lg tracking-tighter text-[hsl(var(--foreground))]">
          II
        </span>
        <span className="text-lg font-semibold tracking-tight text-[hsl(var(--foreground))]">
          Revenygo
        </span>
      </div>
      <LoginForm />
      {demoEnabled ? (
        <p className="mt-4 max-w-sm text-center text-sm text-[hsl(var(--muted-foreground))]">
          Демо-режим: пароль{" "}
          <span className="font-mono font-medium text-[hsl(var(--foreground))]">demo</span>
        </p>
      ) : null}
    </div>
  );
}
