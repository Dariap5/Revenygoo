"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  buildAuditCsvUrl,
  fetchAuditList,
  type AuditListItem,
} from "@/lib/audit/audit-client";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 50;

const selectClass =
  "h-9 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2.5 text-sm text-[hsl(var(--foreground))] outline-none focus-visible:border-[hsl(var(--border-strong))]";

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function userCell(it: AuditListItem): string {
  if (it.actorDisplayName?.trim()) return it.actorDisplayName.trim();
  if (it.actorUserId) return `${it.actorUserId.slice(0, 8)}…`;
  return "—";
}

export function AuditPage() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [eventType, setEventType] = useState("");
  const [hasDlp, setHasDlp] = useState<"" | "true" | "false">("");
  const [userId, setUserId] = useState("");
  const [userDebounced, setUserDebounced] = useState("");

  const [offset, setOffset] = useState(0);
  const [items, setItems] = useState<AuditListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setUserDebounced(userId.trim()), 400);
    return () => window.clearTimeout(t);
  }, [userId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetchAuditList({
      limit: PAGE_SIZE,
      offset,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      eventType: eventType || undefined,
      hasDlpFindings: hasDlp || undefined,
      userId: userDebounced || undefined,
    });
    if (res.kind === "ok") {
      setItems(res.items);
      setTotal(res.total);
      setEventTypes(res.eventTypes);
    } else if (res.kind === "unauthorized") {
      setError("Нужна авторизация.");
    } else if (res.kind === "forbidden") {
      setError("Нет доступа.");
    } else if (res.kind === "http_error") {
      setError(`Ошибка ${res.status}`);
    } else {
      setError("Сеть");
    }
    setLoading(false);
  }, [offset, dateFrom, dateTo, eventType, hasDlp, userDebounced]);

  useEffect(() => {
    void load();
  }, [load]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageIndex = Math.floor(offset / PAGE_SIZE) + 1;

  const csvUrl = useMemo(
    () =>
      buildAuditCsvUrl({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        eventType: eventType || undefined,
        hasDlpFindings: hasDlp || undefined,
        userId: userDebounced || undefined,
      }),
    [dateFrom, dateTo, eventType, hasDlp, userDebounced],
  );

  const exportCsv = async () => {
    const res = await fetch(csvUrl, { credentials: "include", cache: "no-store" });
    if (!res.ok) return;
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "audit-export.csv";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-semibold tracking-tight text-[hsl(var(--foreground))]">Аудит</h1>
        <Button type="button" variant="outline" size="sm" className="h-9 shrink-0 self-start sm:self-auto" onClick={() => void exportCsv()}>
          Экспорт CSV
        </Button>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setOffset(0);
          }}
          className="h-9 w-full sm:w-[150px]"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setOffset(0);
          }}
          className="h-9 w-full sm:w-[150px]"
        />
        <select
          className={cn(selectClass, "w-full sm:w-[220px]")}
          value={eventType}
          onChange={(e) => {
            setEventType(e.target.value);
            setOffset(0);
          }}
          aria-label="Тип события"
        >
          <option value="">Все типы</option>
          {eventTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          className={cn(selectClass, "w-full sm:w-[180px]")}
          value={hasDlp}
          onChange={(e) => {
            setHasDlp(e.target.value as "" | "true" | "false");
            setOffset(0);
          }}
          aria-label="DLP"
        >
          <option value="">DLP: все</option>
          <option value="true">С DLP</option>
          <option value="false">Без DLP</option>
        </select>
        <Input
          value={userId}
          onChange={(e) => {
            setUserId(e.target.value);
            setOffset(0);
          }}
          placeholder="UUID пользователя"
          className="h-9 w-full min-w-0 sm:flex-1 sm:max-w-xs"
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[hsl(var(--border))] text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="h-10 px-2 py-0 font-medium">Время</th>
                  <th className="h-10 px-2 py-0 font-medium">Пользователь</th>
                  <th className="h-10 px-2 py-0 font-medium">Тип</th>
                  <th className="h-10 px-2 py-0 font-medium">Модель</th>
                  <th className="h-10 w-10 px-2 py-0 text-center font-medium">DLP</th>
                  <th className="h-10 px-2 py-0 text-right font-medium">Токены</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="h-10 px-2 text-muted-foreground">
                      Нет событий
                    </td>
                  </tr>
                ) : (
                  items.map((it) => (
                    <tr key={it.id} className="border-b border-[hsl(var(--border))] last:border-0">
                      <td className="h-10 whitespace-nowrap px-2 align-middle text-muted-foreground">
                        {formatTime(it.createdAt)}
                      </td>
                      <td className="h-10 max-w-[200px] truncate px-2 align-middle">{userCell(it)}</td>
                      <td className="h-10 max-w-[240px] truncate px-2 align-middle text-muted-foreground">
                        {it.eventType}
                      </td>
                      <td className="h-10 whitespace-nowrap px-2 align-middle text-muted-foreground">
                        {it.model ?? "—"}
                      </td>
                      <td className="h-10 px-2 align-middle text-center">
                        {it.hasDlpFindings ? (
                          <span
                            title={it.dlpTypes.length ? it.dlpTypes.join(", ") : "DLP"}
                            className="inline-flex justify-center"
                          >
                            <Shield className="size-4 text-amber-600 dark:text-amber-400" aria-hidden />
                            <span className="sr-only">
                              {it.dlpTypes.length ? it.dlpTypes.join(", ") : "DLP"}
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="h-10 whitespace-nowrap px-2 text-right align-middle tabular-nums text-muted-foreground">
                        {it.tokens != null ? it.tokens : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>
              Страница {pageIndex} из {pageCount}
            </span>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9"
                disabled={offset <= 0}
                onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
                aria-label="Предыдущая страница"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9"
                disabled={offset + PAGE_SIZE >= total}
                onClick={() => setOffset((o) => o + PAGE_SIZE)}
                aria-label="Следующая страница"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
