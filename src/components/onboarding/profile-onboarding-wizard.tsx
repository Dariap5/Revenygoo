"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AI_TASK_OPTIONS, DEPARTMENT_SUGGESTIONS } from "@/lib/onboarding-profile-options";
import type { AiTaskId } from "@/lib/session/workspace-session";
import {
  patchWorkspaceSession,
  readWorkspaceSession,
  type UserProfileOnboarding,
} from "@/lib/session/workspace-session";
import { cn } from "@/lib/utils";

const STEP_COUNT = 3;

export function ProfileOnboardingWizard() {
  const router = useRouter();
  const initial = useMemo(() => readWorkspaceSession().profileDraft, []);

  const [step, setStep] = useState(initial.stepIndex);
  const [jobTitle, setJobTitle] = useState(initial.jobTitle);
  const [department, setDepartment] = useState(initial.department);
  const [taskIds, setTaskIds] = useState<AiTaskId[]>(initial.taskIds);
  const [otherTaskNote, setOtherTaskNote] = useState(initial.otherTaskNote);
  const [stepError, setStepError] = useState<string | null>(null);

  const toggleTask = (id: AiTaskId) => {
    setTaskIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    setStepError(null);
  };

  const validateStep = (i: number): boolean => {
    setStepError(null);
    if (i === 0) {
      if (!jobTitle.trim()) {
        setStepError("Укажите должность.");
        return false;
      }
    }
    if (i === 1) {
      if (!department.trim()) {
        setStepError("Укажите отдел или выберите из списка.");
        return false;
      }
    }
    if (i === 2) {
      if (taskIds.length === 0) {
        setStepError("Выберите хотя бы одну задачу.");
        return false;
      }
      if (taskIds.includes("other") && !otherTaskNote.trim()) {
        setStepError("Кратко опишите задачу в поле «Другое».");
        return false;
      }
    }
    return true;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    if (step >= STEP_COUNT - 1) {
      const profile: UserProfileOnboarding = {
        jobTitle: jobTitle.trim(),
        department: department.trim(),
        taskIds,
        otherTaskNote: taskIds.includes("other") ? otherTaskNote.trim() : "",
      };
      patchWorkspaceSession({
        profile,
        profileDraft: {
          stepIndex: step,
          jobTitle: profile.jobTitle,
          department: profile.department,
          taskIds: profile.taskIds,
          otherTaskNote: profile.otherTaskNote,
        },
      });
      router.push("/onboarding/personalizing");
      return;
    }
    const next = step + 1;
    setStep(next);
    patchWorkspaceSession({
      profileDraft: {
        stepIndex: next,
        jobTitle,
        department,
        taskIds,
        otherTaskNote,
      },
    });
  };

  const goBack = () => {
    setStepError(null);
    const next = Math.max(0, step - 1);
    setStep(next);
    patchWorkspaceSession({
      profileDraft: {
        stepIndex: next,
        jobTitle,
        department,
        taskIds,
        otherTaskNote,
      },
    });
  };

  const placeholder =
    [
      "Product Manager",
      "Marketing Lead",
      "Developer",
      "Analyst",
      "HR Manager",
    ][step % 5];

  const hasTaskSelection = taskIds.length > 0;

  return (
    <Card className="w-full max-w-md rounded-[var(--radius-md)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] shadow-none">
      <CardContent className="px-6 pb-6 pt-6">
        <div
          className="mb-6 flex items-center justify-between gap-3"
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

        {step === 0 ? (
          <>
            <h2 className="text-lg font-semibold tracking-tight text-[hsl(var(--foreground))]">
              Ваша должность в компании
            </h2>
            <p className="mt-2 text-sm leading-snug text-[hsl(var(--muted-foreground))]">
              Так мы сможем лучше подобрать сценарии и подсказки.
            </p>
            <div className="mt-5 space-y-2">
              <Label htmlFor="job-title" className="text-sm font-medium text-[hsl(var(--foreground))]">
                Должность
              </Label>
              <Input
                id="job-title"
                value={jobTitle}
                onChange={(e) => {
                  setJobTitle(e.target.value);
                  setStepError(null);
                }}
                placeholder={placeholder}
              />
            </div>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <h2 className="text-lg font-semibold tracking-tight text-[hsl(var(--foreground))]">
              В каком отделе вы работаете
            </h2>
            <p className="mt-2 text-sm leading-snug text-[hsl(var(--muted-foreground))]">
              Можно выбрать из подсказок или ввести название вручную.
            </p>
            <div className="mt-5 space-y-2">
              <Label htmlFor="department" className="text-sm font-medium text-[hsl(var(--foreground))]">
                Отдел
              </Label>
              <Input
                id="department"
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  setStepError(null);
                }}
                placeholder="Например, Product"
                list="department-suggestions"
              />
              <datalist id="department-suggestions">
                {DEPARTMENT_SUGGESTIONS.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <h2 className="text-lg font-semibold tracking-tight text-[hsl(var(--foreground))]">
              Какие задачи вы чаще всего делаете через AI
            </h2>
            <p className="mt-2 text-sm leading-snug text-[hsl(var(--muted-foreground))]">
              Отметьте всё подходящее. Это поможет настроить кабинет.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              {AI_TASK_OPTIONS.map(({ id, label }) => {
                const checked = taskIds.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleTask(id)}
                    className={cn(
                      "card-pressable flex flex-col items-start gap-3 rounded-[var(--radius-md)] border bg-[hsl(var(--background))] p-4 text-left transition-all duration-200 hover:border-[hsl(var(--border-strong))] hover:shadow-sm",
                      checked
                        ? "border-[1.5px] border-[hsl(var(--foreground))]"
                        : "border-[hsl(var(--border))]",
                      hasTaskSelection && !checked && "opacity-40 transition-opacity duration-200",
                    )}
                  >
                    <Sparkles
                      className="size-5 shrink-0 text-[hsl(var(--foreground))]"
                      aria-hidden
                    />
                    <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
            {taskIds.includes("other") ? (
              <div className="mt-4 space-y-2">
                <Label htmlFor="other-task" className="text-sm font-medium text-[hsl(var(--foreground))]">
                  Уточните задачу
                </Label>
                <Input
                  id="other-task"
                  value={otherTaskNote}
                  onChange={(e) => {
                    setOtherTaskNote(e.target.value);
                    setStepError(null);
                  }}
                  placeholder="Кратко опишите"
                />
              </div>
            ) : null}
          </>
        ) : null}

        {stepError ? (
          <p className="mt-4 text-sm text-destructive" role="alert">
            {stepError}
          </p>
        ) : null}
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-3 border-t border-[hsl(var(--border))] px-6 py-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={step === 0}
          onClick={goBack}
          className="gap-1"
        >
          <ChevronLeft className="size-4" />
          Назад
        </Button>
        <Button type="button" onClick={goNext}>
          {step === STEP_COUNT - 1 ? "Готово" : "Продолжить"}
        </Button>
      </CardFooter>
    </Card>
  );
}
