"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronLeft, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  aiGuideAllowed,
  aiGuideForbidden,
  aiGuideSafePromptExamples,
} from "@/lib/mock/onboarding-guide";
import { onboardingSteps } from "@/lib/mock/onboarding";
import { patchWorkspaceSession } from "@/lib/session/workspace-session";
import { cn } from "@/lib/utils";

const STEP_COUNT = 3;

export function AiOnboardingGuideWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [accepted, setAccepted] = useState(false);

  const finish = () => {
    patchWorkspaceSession({ aiGuideCompleted: true });
    router.push("/scenarios");
  };

  const stepCopy = onboardingSteps[step];
  const isLast = step === STEP_COUNT - 1;

  return (
    <Card className="w-full max-w-lg rounded-[var(--radius-md)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] shadow-none">
      <CardContent className="px-6 pb-6 pt-6">
        <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
          Инструкция перед кабинетом
        </p>
        <div
          className="mb-6 mt-3 flex items-center justify-between gap-3"
          aria-live="polite"
        >
          <div
            className="flex items-center gap-1.5"
            role="progressbar"
            aria-valuenow={step + 1}
            aria-valuemin={1}
            aria-valuemax={STEP_COUNT}
          >
            {Array.from({ length: STEP_COUNT }, (_, i) => (
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
            {step + 1} / {STEP_COUNT}
          </span>
        </div>

        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {stepCopy.title}
        </h2>
        <p className="mt-2 text-sm leading-snug text-muted-foreground">
          {stepCopy.description}
        </p>

        {step === 0 ? (
          <div className="mt-6 space-y-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Примеры задач
            </p>
            <ul className="space-y-2">
              {stepCopy.bullets.map((b) => (
                <li
                  key={b}
                  className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-muted/20 px-3 py-2 text-sm text-foreground"
                >
                  <CheckCircle2
                    className="size-4 shrink-0 text-emerald-600/85"
                    aria-hidden
                  />
                  {b}
                </li>
              ))}
            </ul>
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-foreground">
                Что можно делать с AI
              </p>
              <ul className="mt-2 space-y-1.5 text-[13px] leading-snug text-muted-foreground">
                {aiGuideAllowed.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-border" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="mt-6 space-y-4">
            <ul className="space-y-2">
              {stepCopy.bullets.map((b) => (
                <li
                  key={b}
                  className="flex items-center gap-2.5 rounded-xl border border-gray-100 px-3 py-2 text-sm text-foreground"
                >
                  <span
                    className="size-1.5 shrink-0 rounded-full bg-muted-foreground/40"
                    aria-hidden
                  />
                  {b}
                </li>
              ))}
            </ul>
            <div className="rounded-xl border border-red-200/60 bg-red-50/40 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <XCircle
                  className="size-4 shrink-0 text-red-600/75"
                  aria-hidden
                />
                Не отправляйте в модель
              </div>
              <ul className="mt-2 space-y-1.5 text-[13px] leading-snug text-muted-foreground">
                {aiGuideForbidden.map((item) => (
                  <li key={item} className="flex gap-2 pl-0.5">
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-red-300/80" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="mt-6 space-y-5">
            <ul className="space-y-2">
              {stepCopy.bullets.map((b) => (
                <li
                  key={b}
                  className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-muted/15 px-3 py-2 text-sm text-foreground"
                >
                  <span
                    className="size-1.5 shrink-0 rounded-full bg-primary/50"
                    aria-hidden
                  />
                  {b}
                </li>
              ))}
            </ul>
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4">
              <p className="text-sm font-medium text-foreground">
                Примеры безопасных запросов
              </p>
              <ul className="mt-3 space-y-2">
                {aiGuideSafePromptExamples.map((text) => (
                  <li
                    key={text}
                    className="rounded-lg border border-border/80 bg-background px-2.5 py-1.5 text-[13px] leading-snug text-muted-foreground"
                  >
                    {text}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <Checkbox
                id="ai-guide-accept"
                checked={accepted}
                onCheckedChange={(v) => setAccepted(v === true)}
                className="mt-0.5"
              />
              <Label
                htmlFor="ai-guide-accept"
                className="cursor-pointer text-sm font-normal leading-relaxed text-muted-foreground"
              >
                Я понял(а), как безопасно работать с ИИ в Revenygo
              </Label>
            </div>
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-[hsl(var(--border))] px-6 py-4">
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
          <Button type="button" disabled={!accepted} onClick={finish}>
            Перейти в кабинет
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
