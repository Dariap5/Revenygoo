"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { onboardingSteps } from "@/lib/mock/onboarding";
import { cn } from "@/lib/utils";

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const total = onboardingSteps.length;
  const current = onboardingSteps[step];
  const isLast = step === total - 1;

  return (
    <Card className="w-full max-w-md rounded-[var(--radius-md)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] shadow-none">
      <CardContent className="px-6 pb-6 pt-6">
        <div
          className="mb-6 flex items-center justify-between gap-3"
          aria-live="polite"
        >
          <div className="flex items-center gap-1.5" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={total}>
            {onboardingSteps.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-full transition-all duration-300",
                  i === step
                    ? "h-1.5 w-4 bg-[hsl(var(--foreground))]"
                    : "size-1.5 bg-[hsl(var(--border))]",
                )}
              />
            ))}
          </div>
          <span className="shrink-0 text-xs tabular-nums text-[hsl(var(--muted-foreground))]">
            {step + 1} / {total}
          </span>
        </div>

        <h2 className="text-lg font-semibold tracking-tight text-[hsl(var(--foreground))]">
          {current.title}
        </h2>
        <p className="mt-2 text-sm leading-snug text-[hsl(var(--muted-foreground))]">
          {current.description}
        </p>
        <ul className="mt-5 space-y-2">
          {current.bullets.map((b) => (
            <li
              key={b}
              className="flex items-center gap-2.5 text-sm text-[hsl(var(--foreground))]"
            >
              <span
                className="size-1.5 shrink-0 rounded-full bg-[hsl(var(--border))]"
                aria-hidden
              />
              {b}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-3 border-t border-[hsl(var(--border))] px-6 py-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className="gap-1"
        >
          <ChevronLeft className="size-4" />
          Назад
        </Button>
        {isLast ? (
          <Button type="button" onClick={() => router.push("/scenarios")}>
            Начать работу
          </Button>
        ) : (
          <Button type="button" onClick={() => setStep((s) => s + 1)}>
            Продолжить
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
