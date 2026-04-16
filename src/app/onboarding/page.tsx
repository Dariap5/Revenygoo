"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { hydrateWorkspaceAuthFromBrowser } from "@/lib/auth/demo-supabase-sign-in";
import { patchWorkspaceSession, readWorkspaceSession } from "@/lib/session/workspace-session";

const RULES = [
  "Не отправляйте в чат пароли, API-ключи и токены.",
  "Перед отправкой удаляйте персональные и финансовые данные.",
  "Проверяйте ответы ИИ перед внешним использованием.",
];

export default function OnboardingPage() {
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
      if (s.aiGuideCompleted && s.profile) {
        router.replace("/chat");
      }
      if (s.aiGuideCompleted && !s.profile) {
        router.replace("/onboarding/profile");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-4 px-6 py-6">
          <h1 className="text-lg font-semibold text-foreground">Правила использования ИИ</h1>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {RULES.map((rule) => (
              <li key={rule} className="flex items-start gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-border" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              patchWorkspaceSession({ aiGuideCompleted: true });
              router.push("/onboarding/profile");
            }}
          >
            Принять и продолжить
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
