"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  mockAuditLogEvents,
  type AuditLogEvent,
  type AuditStatus,
  type AuditSystemAction,
} from "@/lib/mock/audit-log";
import { mockDepartments, mockEmployees } from "@/lib/mock/organization";
import { mockScenarios } from "@/lib/mock/scenarios";

import { AuditEventDetailDialog } from "./audit-event-detail-dialog";
import { AuditLogTable } from "./audit-log-table";

const selectClass =
  "h-9 rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 text-xs text-[hsl(var(--foreground))] outline-none transition-colors hover:border-[hsl(var(--border-strong))] focus:border-[hsl(var(--border-strong))] focus:ring-0";

export function AuditLogAdmin() {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [empFilter, setEmpFilter] = useState<string>("all");
  const [scenarioFilter, setScenarioFilter] = useState<string>("all");
  const [modelFilter, setModelFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<AuditLogEvent | null>(null);

  const models = useMemo(() => {
    const s = new Set<string>();
    mockAuditLogEvents.forEach((e) => s.add(e.model));
    return [...s].sort();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return mockAuditLogEvents.filter((ev) => {
      if (deptFilter !== "all") {
        if (deptFilter === "company" && ev.departmentId !== null) return false;
        if (deptFilter !== "company" && ev.departmentId !== deptFilter) {
          return false;
        }
      }
      if (empFilter !== "all" && ev.employeeId !== empFilter) return false;
      if (scenarioFilter !== "all" && ev.scenarioId !== scenarioFilter) {
        return false;
      }
      if (modelFilter !== "all" && ev.model !== modelFilter) return false;
      if (
        actionFilter !== "all" &&
        ev.systemAction !== (actionFilter as AuditSystemAction)
      ) {
        return false;
      }
      if (statusFilter !== "all" && ev.status !== (statusFilter as AuditStatus)) {
        return false;
      }
      if (q) {
        const emp = mockEmployees.find((e) => e.id === ev.employeeId);
        const name = emp
          ? `${emp.firstName} ${emp.lastName}`.toLowerCase()
          : "";
        const dept = ev.departmentId
          ? mockDepartments.find((d) => d.id === ev.departmentId)?.name ?? ""
          : "компания";
        const scen =
          mockScenarios.find((s) => s.id === ev.scenarioId)?.title ?? ev.scenarioId;
        const rule = ev.dataRuleType.toLowerCase();
        const hay = `${name} ${dept.toLowerCase()} ${scen.toLowerCase()} ${rule} ${ev.triggeredRule.toLowerCase()}`;
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    search,
    deptFilter,
    empFilter,
    scenarioFilter,
    modelFilter,
    actionFilter,
    statusFilter,
  ]);

  const openDetail = (ev: AuditLogEvent) => {
    setSelected(ev);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-1 text-xl font-semibold text-[hsl(var(--foreground))]">
          Журнал аудита
        </h1>
        <p className="mb-5 max-w-2xl text-sm text-[hsl(var(--muted-foreground))]">
          События использования AI: кто запрашивал, из какого отдела, какие
          политики сработали и что сделала система. Демо-данные, без ingestion.
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск: сотрудник, отдел, сценарий, правило…"
          className="max-w-md"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 self-start lg:self-center"
          onClick={() => {
            setSearch("");
            setDeptFilter("all");
            setEmpFilter("all");
            setScenarioFilter("all");
            setModelFilter("all");
            setActionFilter("all");
            setStatusFilter("all");
          }}
        >
          Сбросить фильтры
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          className={selectClass}
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          aria-label="Отдел"
        >
          <option value="all">Все отделы</option>
          <option value="company">Компания (CEO)</option>
          {mockDepartments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={empFilter}
          onChange={(e) => setEmpFilter(e.target.value)}
          aria-label="Сотрудник"
        >
          <option value="all">Все сотрудники</option>
          {mockEmployees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.firstName} {e.lastName}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={scenarioFilter}
          onChange={(e) => setScenarioFilter(e.target.value)}
          aria-label="Сценарий"
        >
          <option value="all">Все сценарии</option>
          {mockScenarios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={modelFilter}
          onChange={(e) => setModelFilter(e.target.value)}
          aria-label="Модель"
        >
          <option value="all">Все модели</option>
          {models.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          aria-label="Действие системы"
        >
          <option value="all">Все действия</option>
          <option value="allowed">allowed</option>
          <option value="warned">warned</option>
          <option value="hidden">hidden</option>
          <option value="blocked">blocked</option>
        </select>
        <select
          className={selectClass}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Статус"
        >
          <option value="all">Все статусы</option>
          <option value="success">success</option>
          <option value="attention">attention</option>
          <option value="blocked">blocked</option>
        </select>
      </div>

      <AuditLogTable events={filtered} onRowClick={openDetail} />

      <AuditEventDetailDialog
        event={selected}
        open={detailOpen}
        onOpenChange={(o) => {
          setDetailOpen(o);
          if (!o) setSelected(null);
        }}
      />
    </div>
  );
}
