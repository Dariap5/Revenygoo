"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { hydrateWorkspaceAuthFromBrowser } from "@/lib/auth/demo-supabase-sign-in";
import {
  getPostAuthPath,
  readWorkspaceSession,
} from "@/lib/session/workspace-session";

function safeNextPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return null;
  }
  return raw;
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await hydrateWorkspaceAuthFromBrowser();
      if (cancelled) return;
      const s = readWorkspaceSession();
      if (s.authenticated) {
        router.replace(nextPath ?? getPostAuthPath(s));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, nextPath]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="mb-5 flex items-center gap-1">
        <span className="text-lg font-black tracking-tighter text-gray-900">
          II
        </span>
        <span className="text-lg font-semibold tracking-tight text-gray-900">
          Revenygo
        </span>
      </div>
      <LoginForm nextPath={nextPath} />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}
