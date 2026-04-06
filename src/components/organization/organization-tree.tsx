"use client";

import { ChevronRight, Building2, User } from "lucide-react";
import { useMemo, useState } from "react";

import {
  getDepartmentEmployees,
  getEmployeeName,
  getRootDepartments,
  getSubdepartments,
  type OrgDepartment,
} from "@/lib/mock/organization";

import { cn } from "@/lib/utils";

export type OrgTreeSelection =
  | { kind: "company" }
  | { kind: "department"; id: string }
  | { kind: "employee"; id: string };

function DepartmentBranch({
  dept,
  search,
  selection,
  onSelect,
  depth,
}: {
  dept: OrgDepartment;
  search: string;
  selection: OrgTreeSelection;
  onSelect: (s: OrgTreeSelection) => void;
  depth: number;
}) {
  const [open, setOpen] = useState(false);
  const subs = getSubdepartments(dept.id);
  const emps = getDepartmentEmployees(dept);
  const q = search.trim().toLowerCase();

  const filteredEmps = useMemo(() => {
    if (!q) return emps;
    return emps.filter((e) => {
      const n = getEmployeeName(e).toLowerCase();
      return n.includes(q) || e.title.toLowerCase().includes(q);
    });
  }, [emps, q]);

  const deptSelected =
    selection.kind === "department" && selection.id === dept.id;

  return (
    <li className="select-none">
      <div
        className={cn(
          "flex items-center gap-0.5 rounded-md",
          depth > 0 && "ml-2 border-l border-border/70 pl-2",
        )}
      >
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60"
          aria-expanded={open}
        >
          <ChevronRight
            className={cn("size-4 transition-transform", open && "rotate-90")}
          />
        </button>
        <button
          type="button"
          onClick={() => onSelect({ kind: "department", id: dept.id })}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
            deptSelected
              ? "bg-muted font-medium text-foreground"
              : "text-foreground hover:bg-muted/50",
          )}
        >
          <Building2 className="size-3.5 shrink-0 opacity-60" />
          <span className="truncate">{dept.name}</span>
        </button>
      </div>
      {open ? (
        <ul className="mt-0.5 space-y-0.5">
          {subs.map((s) => (
            <DepartmentBranch
              key={s.id}
              dept={s}
              search={search}
              selection={selection}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
          {filteredEmps.map((emp) => {
            const empSel =
              selection.kind === "employee" && selection.id === emp.id;
            return (
              <li key={emp.id} className={cn(depth > 0 && "ml-9")}>
                <button
                  type="button"
                  onClick={() => onSelect({ kind: "employee", id: emp.id })}
                  className={cn(
                    "flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
                    empSel
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  <User className="size-3.5 shrink-0 opacity-60" />
                  <span className="truncate">{getEmployeeName(emp)}</span>
                  <span className="truncate text-xs opacity-70">
                    · {emp.title}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </li>
  );
}

export function OrganizationTree({
  search,
  selection,
  onSelect,
  ceoLabel,
}: {
  search: string;
  selection: OrgTreeSelection;
  onSelect: (s: OrgTreeSelection) => void;
  ceoLabel: string;
}) {
  const roots = getRootDepartments();
  const companySelected = selection.kind === "company";

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-3 py-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Структура
        </p>
      </div>
      <div className="max-h-[min(70vh,640px)] overflow-y-auto p-2">
        <button
          type="button"
          onClick={() => onSelect({ kind: "company" })}
          className={cn(
            "mb-2 flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm",
            companySelected
              ? "bg-muted font-medium text-foreground"
              : "hover:bg-muted/50",
          )}
        >
          <User className="size-3.5 shrink-0 opacity-60" />
          <span className="truncate font-medium">{ceoLabel}</span>
          <span className="text-xs text-muted-foreground">· CEO</span>
        </button>
        <ul className="space-y-0.5">
          {roots.map((d) => (
            <DepartmentBranch
              key={d.id}
              dept={d}
              search={search}
              selection={selection}
              onSelect={onSelect}
              depth={0}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
