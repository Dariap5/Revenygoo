"use client";

import { Badge } from "@/components/ui/badge";
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
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function statusBadgeClass(status: AuditLogEvent["status"]): string {
  if (status === "success")
    return "border-emerald-500/35 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200";
  if (status === "attention")
    return "border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100";
  return "border-destructive/40 bg-destructive/10 text-destructive";
}

function actionBadgeVariant(
  a: AuditLogEvent["systemAction"],
): "secondary" | "outline" | "default" {
  if (a === "blocked") return "default";
  if (a === "warned" || a === "hidden") return "secondary";
  return "outline";
}

export function AuditLogTable({
  events,
  onRowClick,
}: {
  events: AuditLogEvent[];
  onRowClick: (e: AuditLogEvent) => void;
}) {
  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-12 text-center text-sm text-muted-foreground">
        Нет событий по текущим фильтрам и поиску.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius-md)] border border-[hsl(var(--border))]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead>
            <tr className="border-b border-[hsl(var(--border))] text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              <th className="whitespace-nowrap px-3 py-2.5">Время</th>
              <th className="px-3 py-2.5">Сотрудник</th>
              <th className="px-3 py-2.5">Отдел</th>
              <th className="px-3 py-2.5">Роль</th>
              <th className="px-3 py-2.5">Сценарий</th>
              <th className="whitespace-nowrap px-3 py-2.5">Модель</th>
              <th className="px-3 py-2.5">Тип события</th>
              <th className="px-3 py-2.5">Данные / правило</th>
              <th className="px-3 py-2.5">Действие</th>
              <th className="px-3 py-2.5">Статус</th>
            </tr>
          </thead>
          <tbody>
            {events.map((ev) => {
              const emp = getEmployeeById(ev.employeeId);
              const dept = ev.departmentId
                ? getDepartmentById(ev.departmentId)
                : null;
              return (
                <tr
                  key={ev.id}
                  className="cursor-pointer border-b border-[hsl(var(--border))] last:border-0 hover:bg-[hsl(var(--background-secondary))]"
                  onClick={() => onRowClick(ev)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onRowClick(ev);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                >
                  <td className="whitespace-nowrap px-3 py-3 align-top text-sm text-[hsl(var(--muted-foreground))]">
                    {formatAt(ev.at)}
                  </td>
                  <td className="px-3 py-3 align-top text-sm font-medium text-[hsl(var(--foreground))]">
                    {emp ? getEmployeeName(emp) : ev.employeeId}
                  </td>
                  <td className="px-3 py-3 align-top text-sm text-muted-foreground">
                    {dept?.name ?? "Компания"}
                  </td>
                  <td className="px-3 py-3 align-top text-sm text-muted-foreground">
                    {emp?.title ?? "—"}
                  </td>
                  <td className="max-w-[140px] truncate px-3 py-3 align-top text-sm">
                    {scenarioTitle(ev.scenarioId)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 align-top text-sm">
                    {ev.model}
                  </td>
                  <td className="max-w-[160px] px-3 py-3 align-top text-sm text-muted-foreground">
                    {ev.eventType}
                  </td>
                  <td className="max-w-[140px] px-3 py-3 align-top text-sm text-muted-foreground">
                    {ev.dataRuleType}
                  </td>
                  <td className="px-3 py-2.5 align-top">
                    <Badge
                      variant={actionBadgeVariant(ev.systemAction)}
                      className="text-[10px] font-normal capitalize"
                    >
                      {ev.systemAction}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 align-top">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-normal capitalize",
                        statusBadgeClass(ev.status),
                      )}
                    >
                      {ev.status}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
