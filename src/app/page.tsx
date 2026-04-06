"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  getPostAuthPath,
  readWorkspaceSession,
} from "@/lib/session/workspace-session";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(getPostAuthPath(readWorkspaceSession()));
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Загрузка…</p>
    </div>
  );
}
