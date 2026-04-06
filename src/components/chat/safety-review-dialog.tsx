"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  SafetyCheckResult,
  SafetyStatusLabel,
} from "@/lib/mock/safety-check";
import { cn } from "@/lib/utils";

const statusStyles: Record<SafetyStatusLabel, string> = {
  заблокировано: "border-border bg-muted/50 text-muted-foreground",
  скрыто: "border-border bg-muted/40 text-muted-foreground",
  предупреждение:
    "border-amber-200/80 bg-amber-50/90 text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-50",
};

export function SafetyReviewDialog({
  open,
  onOpenChange,
  result,
  onBack,
  onSendSafe,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: SafetyCheckResult;
  onBack: () => void;
  onSendSafe: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "box-border flex min-w-0 w-[calc(100vw-1.5rem)] max-w-md flex-col gap-0 overflow-hidden p-0 sm:w-full",
          "max-h-[min(90vh,32rem)]",
        )}
      >
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-2 pt-6 pr-14">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="text-base font-semibold leading-snug">
              Обнаружены чувствительные данные
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              Мы заметили фрагменты, которые лучше не отправлять в модель. Ниже
              — что подсветили и как будет выглядеть безопасный вариант.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Найдено
            </p>
            <ul className="space-y-2">
              {result.findings.map((f, i) => (
                <li
                  key={`${f.snippet}-${i}`}
                  className="flex min-w-0 flex-col gap-1.5 rounded-md border border-border bg-card/50 px-3 py-2 sm:flex-row sm:items-start sm:justify-between"
                >
                  <span className="min-w-0 break-words font-mono text-[11px] leading-snug text-foreground/90 [overflow-wrap:anywhere]">
                    {f.snippet}
                  </span>
                  <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:justify-end">
                    <span className="text-[11px] text-muted-foreground">
                      {f.label}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-normal",
                        statusStyles[f.status],
                      )}
                    >
                      {f.status}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Безопасная версия запроса
            </p>
            <pre className="mt-2 max-h-36 min-h-0 overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-muted/30 p-3 text-xs leading-relaxed text-foreground [overflow-wrap:anywhere]">
              {result.safeText}
            </pre>
          </div>
        </div>

        <div className="box-border flex w-full min-w-0 max-w-full shrink-0 flex-col gap-2 border-t border-border bg-muted/20 p-4">
          <Button
            type="button"
            variant="outline"
            className="h-auto min-h-9 w-full min-w-0 max-w-full whitespace-normal px-3 py-2.5 text-center text-sm leading-snug"
            onClick={onBack}
          >
            Вернуться и исправить
          </Button>
          <Button
            type="button"
            className="h-auto min-h-9 w-full min-w-0 max-w-full whitespace-normal px-3 py-2.5 text-center text-sm leading-snug"
            onClick={onSendSafe}
          >
            Отправить безопасную версию
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
