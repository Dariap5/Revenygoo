"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AuditLogEvent } from "@/lib/mock/audit-log";
import { getDepartmentById, getEmployeeById, getEmployeeName } from "@/lib/mock/organization";
import { mockScenarios } from "@/lib/mock/scenarios";

import { cn } from "@/lib/utils";

function scenarioTitle(id: string): string {
  return mockScenarios.find((s) => s.id === id)?.title ?? id;
}

function formatAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[140px_1fr] sm:gap-3">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="text-sm text-foreground">{value}</div>
    </div>
  );
}

export function AuditEventDetailDialog({
  event,
  open,
  onOpenChange,
}: {
  event: AuditLogEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!event) return null;

  const emp = getEmployeeById(event.employeeId);
  const dept = event.departmentId
    ? getDepartmentById(event.departmentId)
    : null;
  const deptLabel = dept?.name ?? "Компания";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,720px)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">Событие аудита</DialogTitle>
          <DialogDescription className="font-mono text-xs">
            {event.id} · {formatAt(event.at)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div className="space-y-2 rounded-md border border-border/80 bg-muted/20 p-3">
            <Row
              label="Сотрудник"
              value={
                emp ? (
                  <>
                    {getEmployeeName(emp)}
                    <span className="block text-xs text-muted-foreground">
                      {emp.title}
                    </span>
                  </>
                ) : (
                  event.employeeId
                )
              }
            />
            <Row label="Отдел" value={deptLabel} />
            <Row label="Роль / позиция" value={emp?.title ?? "—"} />
            <Row label="Дата и время" value={formatAt(event.at)} />
            <Row label="Сценарий" value={scenarioTitle(event.scenarioId)} />
            <Row label="Модель" value={event.model} />
          </div>

          <div className="space-y-2">
            <Row label="Исход / тип события" value={event.eventType} />
            <Row label="Тип данных / правило" value={event.dataRuleType} />
            <Row label="Сработало правило" value={event.triggeredRule} />
            <Row label="Действие системы" value={event.systemAction} />
            <Row label="Итог" value={event.outcomeSummary} />
            <Row
              label="Поведение (система)"
              value={
                <span className="whitespace-pre-wrap">{event.systemNarrative}</span>
              }
            />
          </div>

          {event.safePromptPreview ? (
            <div className="rounded-md border border-border bg-background p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Безопасная версия запроса
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
                {event.safePromptPreview}
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Безопасная версия запроса не применялась или не сохранялась (mock).
            </p>
          )}

          <div
            className={cn(
              "rounded-md border px-3 py-2.5 text-sm",
              "border-amber-500/30 bg-amber-500/5 text-foreground",
            )}
          >
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Комментарий для админа
            </p>
            <p className="mt-1.5 leading-snug">{event.adminNote}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
