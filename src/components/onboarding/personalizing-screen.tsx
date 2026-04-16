"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  patchWorkspaceSession,
  readWorkspaceSession,
} from "@/lib/session/workspace-session";

const LINE =
  "Настраиваем под вас кабинет, ещё немного";

const DELAY_MS = 5000;
const TYPE_MS = 42;

export function PersonalizingScreen() {
  const router = useRouter();
  const [typed, setTyped] = useState("");

  useEffect(() => {
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setTyped(LINE.slice(0, i));
      if (i >= LINE.length) window.clearInterval(id);
    }, TYPE_MS);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      patchWorkspaceSession({ aiGuideCompleted: true });
      router.replace("/chat");
    }, DELAY_MS);
    return () => window.clearTimeout(t);
  }, [router]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-5 text-center">
      <div
        className="relative mb-10 size-28 overflow-hidden rounded-full border border-[hsl(var(--border))] shadow-sm"
        aria-hidden
      >
        <div className="rg-orb-sheen absolute -inset-[45%] rounded-full" />
        <div className="absolute inset-[10%] rounded-full bg-white/85 shadow-inner backdrop-blur-[2px]" />
      </div>

      <p className="max-w-md text-lg font-medium tracking-tight text-foreground sm:text-xl">
        {typed}
        <span className="inline-block w-2 animate-pulse text-primary">|</span>
      </p>

      <div className="mt-6 space-y-1 text-sm text-muted-foreground">
        <p>Подбираем рабочие сценарии</p>
        <p>Готовим интерфейс под ваши задачи</p>
      </div>

      <p className="mt-10 text-xs text-muted-foreground">
        Профиль:{" "}
        <span className="text-foreground/80">
          {readWorkspaceSession().profile?.jobTitle ?? "—"}
        </span>
        {" · "}
        <span className="text-foreground/80">
          {readWorkspaceSession().profile?.department ?? "—"}
        </span>
      </p>
    </div>
  );
}
