"use client";

import { useMemo, useState } from "react";
import { List, Network } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getEmployeeById, getEmployeeName } from "@/lib/mock/organization";
import { cn } from "@/lib/utils";

import { OrganizationDetailPanel } from "./organization-detail-panel";
import {
  buildOrgHierarchyFromCeo,
  OrganizationHierarchyGraphCanvas,
} from "./organization-hierarchy-graph";
import { OrganizationTree, type OrgTreeSelection } from "./organization-tree";

export function OrganizationAdmin() {
  const [search, setSearch] = useState("");
  const [selection, setSelection] = useState<OrgTreeSelection>({
    kind: "company",
  });
  const [viewMode, setViewMode] = useState<"list" | "tree">("list");

  const ceoLabel = useMemo(() => {
    const ceo = getEmployeeById("emp-ceo");
    return ceo ? getEmployeeName(ceo) : "CEO";
  }, []);

  const hierarchyRoot = useMemo(() => buildOrgHierarchyFromCeo(), []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            Организация
          </h1>
          <p className="mt-1.5 max-w-xl text-sm leading-snug text-muted-foreground">
            Структура компании, отделы и доступы к контексту, моделям и
            сценариям. Демо без синхронизации с HR.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                viewMode === "list"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <List className="size-3.5 shrink-0" />
              Список
            </button>
            <button
              type="button"
              onClick={() => setViewMode("tree")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                viewMode === "tree"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Network className="size-3.5 shrink-0" />
              Граф дерева
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" disabled>
              Add department
            </Button>
            <Button type="button" size="sm" variant="outline" disabled>
              Add employee
            </Button>
            <Button type="button" size="sm" variant="outline" disabled>
              Edit access
            </Button>
          </div>
        </div>
      </div>

      {viewMode === "list" ? (
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по отделу, имени или должности…"
          className="max-w-md"
        />
      ) : null}

      <div className="grid min-h-0 grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr] lg:items-start">
        <div className="min-w-0">
          {viewMode === "list" ? (
            <OrganizationTree
              search={search}
              selection={selection}
              onSelect={setSelection}
              ceoLabel={ceoLabel}
            />
          ) : (
            <div className="rounded-xl border border-border bg-card p-4">
              <OrganizationHierarchyGraphCanvas root={hierarchyRoot} />
            </div>
          )}
        </div>
        <OrganizationDetailPanel selection={selection} />
      </div>
    </div>
  );
}
