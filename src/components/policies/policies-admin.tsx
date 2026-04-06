"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockSecurityPolicies } from "@/lib/mock/policies";
import type { SecurityPolicy } from "@/lib/mock/policies";

import { PoliciesRulesTable } from "./policies-rules-table";
import {
  PolicyRuleFormDialog,
  type PolicyFormPayload,
} from "./policy-rule-form-dialog";

const selectFilterClass =
  "h-9 rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 text-xs text-[hsl(var(--foreground))] outline-none transition-colors hover:border-[hsl(var(--border-strong))] focus:border-[hsl(var(--border-strong))] focus:ring-0";

export function PoliciesAdmin() {
  const [policies, setPolicies] = useState<SecurityPolicy[]>(() => [
    ...mockSecurityPolicies,
  ]);
  const [search, setSearch] = useState("");
  const [filterDataType, setFilterDataType] = useState<string>("all");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterModel, setFilterModel] = useState<string>("all");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SecurityPolicy | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return policies.filter((p) => {
      if (q) {
        const hay = `${p.name} ${p.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filterDataType !== "all" && p.dataType !== filterDataType) {
        return false;
      }
      if (filterRole !== "all" && p.role !== filterRole) return false;
      if (filterModel !== "all" && p.model !== filterModel) return false;
      if (filterAction !== "all" && p.action !== filterAction) return false;
      if (filterStatus !== "all" && p.status !== filterStatus) return false;
      return true;
    });
  }, [
    policies,
    search,
    filterDataType,
    filterRole,
    filterModel,
    filterAction,
    filterStatus,
  ]);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (p: SecurityPolicy) => {
    setEditing(p);
    setDialogOpen(true);
  };

  const handleSave = (payload: PolicyFormPayload, id?: string) => {
    if (id) {
      setPolicies((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...payload } : p)),
      );
      return;
    }
    const newId = `pol-${Date.now()}`;
    setPolicies((prev) => [...prev, { id: newId, ...payload }]);
  };

  const handleToggle = (p: SecurityPolicy) => {
    setPolicies((list) =>
      list.map((x) =>
        x.id === p.id
          ? {
              ...x,
              status: x.status === "active" ? "inactive" : "active",
            }
          : x,
      ),
    );
  };

  const handleDelete = (p: SecurityPolicy) => {
    if (!window.confirm(`Удалить правило «${p.name}»?`)) return;
    setPolicies((list) => list.filter((x) => x.id !== p.id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="mb-1 text-xl font-semibold text-[hsl(var(--foreground))]">
            Правила безопасности
          </h1>
          <p className="mb-5 max-w-xl text-sm text-[hsl(var(--muted-foreground))]">
            Политики обработки данных и поведения моделей. Демо-режим: только
            локальный mock state.
          </p>
        </div>
        <Button type="button" size="sm" className="shrink-0" onClick={openCreate}>
          Создать правило
        </Button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по названию и описанию…"
          className="max-w-md"
        />
        <div className="flex flex-wrap gap-2">
          <select
            className={selectFilterClass}
            value={filterDataType}
            onChange={(e) => setFilterDataType(e.target.value)}
            aria-label="Тип данных"
          >
            <option value="all">Все типы данных</option>
            <option value="credentials">credentials</option>
            <option value="client data">client data</option>
            <option value="financial data">financial data</option>
            <option value="internal documents">internal documents</option>
            <option value="code / secrets">code / secrets</option>
          </select>
          <select
            className={selectFilterClass}
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            aria-label="Роль"
          >
            <option value="all">Все роли</option>
            <option value="employee">employee</option>
            <option value="manager">manager</option>
            <option value="finance">finance</option>
            <option value="legal">legal</option>
            <option value="developer">developer</option>
            <option value="admin">admin</option>
          </select>
          <select
            className={selectFilterClass}
            value={filterModel}
            onChange={(e) => setFilterModel(e.target.value)}
            aria-label="Модель"
          >
            <option value="all">Все модели</option>
            <option value="Auto">Auto</option>
            <option value="GPT">GPT</option>
            <option value="Claude">Claude</option>
            <option value="Gemini">Gemini</option>
            <option value="All models">All models</option>
          </select>
          <select
            className={selectFilterClass}
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            aria-label="Действие"
          >
            <option value="all">Все действия</option>
            <option value="warn">warn</option>
            <option value="hide">hide</option>
            <option value="block">block</option>
          </select>
          <select
            className={selectFilterClass}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            aria-label="Статус"
          >
            <option value="all">Все статусы</option>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
        </div>
      </div>

      <PoliciesRulesTable
        policies={filtered}
        onEdit={openEdit}
        onToggleStatus={handleToggle}
        onDelete={handleDelete}
      />

      <PolicyRuleFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSave={handleSave}
      />
    </div>
  );
}
