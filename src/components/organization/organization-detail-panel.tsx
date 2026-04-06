"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getDepartmentById,
  getDepartmentContext,
  getDepartmentEmployees,
  getDepartmentHead,
  getDepartmentScenarios,
  getDepartmentModels,
  getDirectReports,
  getEmployeeById,
  getEmployeeContext,
  getEmployeeModels,
  getEmployeeName,
  getEmployeeScenarios,
  getManager,
  getSubdepartments,
  mockCompanyDefaults,
  mockEmployees,
} from "@/lib/mock/organization";
import { mockScenarios } from "@/lib/mock/scenarios";

import type { OrgTreeSelection } from "./organization-tree";

import { cn } from "@/lib/utils";

function scenarioTitle(id: string): string {
  return mockScenarios.find((s) => s.id === id)?.title ?? id;
}

function Sheet({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border/60 bg-background/80 px-4 py-3.5 shadow-sm",
        className,
      )}
    >
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </h3>
      <div className="mt-2.5 space-y-2 text-sm leading-snug">{children}</div>
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground">—</p>;
  }
  return (
    <ul className="space-y-1 text-xs text-muted-foreground">
      {items.map((x) => (
        <li key={x} className="flex gap-2">
          <span className="mt-1.5 size-1 shrink-0 rounded-full bg-border" />
          <span>{x}</span>
        </li>
      ))}
    </ul>
  );
}

function MutedActions() {
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      <Button type="button" size="sm" variant="ghost" className="h-8 text-xs" disabled>
        Отдел
      </Button>
      <Button type="button" size="sm" variant="ghost" className="h-8 text-xs" disabled>
        Сотрудник
      </Button>
      <Button type="button" size="sm" variant="ghost" className="h-8 text-xs" disabled>
        Доступы
      </Button>
    </div>
  );
}

export function OrganizationDetailPanel({
  selection,
}: {
  selection: OrgTreeSelection;
}) {
  if (selection.kind === "company") {
    const ceo = mockEmployees.find((e) => e.id === "emp-ceo");
    const reports = ceo ? getDirectReports(ceo) : [];
    return (
      <div className="flex min-h-0 flex-col gap-3 lg:max-h-[min(85vh,720px)] lg:overflow-y-auto lg:pr-1">
        <div className="rounded-2xl border border-border/60 bg-gradient-to-b from-muted/20 to-transparent px-4 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Компания
          </p>
          {ceo ? (
            <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-base font-semibold tracking-tight text-foreground">
                {getEmployeeName(ceo)}
              </span>
              <span className="text-sm text-muted-foreground">{ceo.title}</span>
              <Badge
                variant="outline"
                className={cn(
                  "border-0 bg-transparent px-0 text-[10px] font-normal text-muted-foreground",
                  ceo.status === "active" && "text-emerald-600 dark:text-emerald-400",
                )}
              >
                {ceo.status}
              </Badge>
            </div>
          ) : null}
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Базовые доступы и прямые подчинённые CEO (демо).
          </p>
        </div>

        <Sheet title="Контекст по умолчанию">
          <BulletList items={mockCompanyDefaults.context} />
        </Sheet>
        <Sheet title="Модели">
          <BulletList items={mockCompanyDefaults.models} />
        </Sheet>
        <Sheet title="Сценарии">
          <BulletList
            items={mockCompanyDefaults.scenarioIds.map(scenarioTitle)}
          />
        </Sheet>

        <Sheet title="Прямые подчинённые">
          <ul className="space-y-2 text-sm text-foreground">
            {reports.map((r) => (
              <li key={r.id} className="flex flex-col border-b border-border/40 pb-2 last:border-0 last:pb-0">
                <span className="font-medium">{getEmployeeName(r)}</span>
                <span className="text-xs text-muted-foreground">{r.title}</span>
              </li>
            ))}
          </ul>
        </Sheet>

        <MutedActions />
      </div>
    );
  }

  if (selection.kind === "department") {
    const dept = getDepartmentById(selection.id);
    if (!dept) {
      return (
        <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          Отдел не найден.
        </div>
      );
    }
    const head = getDepartmentHead(dept);
    const emps = getDepartmentEmployees(dept);
    const subs = getSubdepartments(dept.id);
    const mergedContext = getDepartmentContext(dept);
    const deptModels = getDepartmentModels(dept);
    const deptScenarios = getDepartmentScenarios(dept);

    return (
      <div className="flex min-h-0 flex-col gap-3 lg:max-h-[min(85vh,720px)] lg:overflow-y-auto lg:pr-1">
        <div className="rounded-2xl border border-border/60 bg-gradient-to-b from-muted/20 to-transparent px-4 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Отдел
          </p>
          <h2 className="mt-2 text-base font-semibold tracking-tight text-foreground">
            {dept.name}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {emps.length} сотр. · {subs.length} подотд.
          </p>
          <p className="mt-3 text-sm text-foreground">
            <span className="text-muted-foreground">Руководитель:</span>{" "}
            {head ? (
              <>
                <span className="font-medium">{getEmployeeName(head)}</span>
                <span className="text-muted-foreground"> · {head.title}</span>
              </>
            ) : (
              "—"
            )}
          </p>
        </div>

        {subs.length > 0 ? (
          <Sheet title="Подотделы">
            <BulletList items={subs.map((s) => s.name)} />
          </Sheet>
        ) : null}

        <Sheet title="Сотрудники">
          <ul className="space-y-2.5">
            {emps.map((e) => (
              <li
                key={e.id}
                className="flex flex-col gap-0.5 border-b border-border/30 pb-2.5 last:border-0 last:pb-0"
              >
                <span className="text-sm font-medium text-foreground">
                  {getEmployeeName(e)}
                </span>
                <span className="text-xs text-muted-foreground">{e.title}</span>
              </li>
            ))}
          </ul>
        </Sheet>

        <Sheet title="База компании">
          <p className="text-[11px] text-muted-foreground">Контекст</p>
          <BulletList items={mockCompanyDefaults.context} />
          <p className="mt-3 text-[11px] text-muted-foreground">Модели</p>
          <BulletList items={mockCompanyDefaults.models} />
          <p className="mt-3 text-[11px] text-muted-foreground">Сценарии</p>
          <BulletList
            items={mockCompanyDefaults.scenarioIds.map(scenarioTitle)}
          />
        </Sheet>

        <Sheet title="Доступ отдела">
          <p className="text-[11px] text-muted-foreground">Доп. контекст</p>
          <BulletList items={dept.departmentAccess.contextAdd} />
          <p className="mt-3 text-[11px] text-muted-foreground">Модели</p>
          <BulletList items={deptModels} />
          <p className="mt-3 text-[11px] text-muted-foreground">Сценарии</p>
          <BulletList items={deptScenarios.map(scenarioTitle)} />
        </Sheet>

        <Sheet title="Итого (mock)">
          <p className="text-[11px] text-muted-foreground">Контекст</p>
          <BulletList items={mergedContext} />
          <p className="mt-3 text-[11px] text-muted-foreground">Модели</p>
          <BulletList items={deptModels} />
          <p className="mt-3 text-[11px] text-muted-foreground">Сценарии</p>
          <BulletList items={deptScenarios.map(scenarioTitle)} />
        </Sheet>

        <MutedActions />
      </div>
    );
  }

  const emp = getEmployeeById(selection.id);
  if (!emp) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
        Сотрудник не найден.
      </div>
    );
  }

  const dept = emp.departmentId ? getDepartmentById(emp.departmentId) : null;
  const mgr = getManager(emp);
  const reports = getDirectReports(emp);
  const effCtx = getEmployeeContext(emp);
  const effModels = getEmployeeModels(emp);
  const effScenarios = getEmployeeScenarios(emp);

  return (
    <div className="flex min-h-0 flex-col gap-3 lg:max-h-[min(85vh,720px)] lg:overflow-y-auto lg:pr-1">
      <div className="rounded-2xl border border-border/60 bg-gradient-to-b from-muted/20 to-transparent px-4 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Сотрудник
        </p>
        <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            {getEmployeeName(emp)}
          </h2>
          <span className="text-sm text-muted-foreground">{emp.title}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {dept?.name ?? "Без отдела"}
        </p>
        <Badge
          variant="outline"
          className={cn(
            "mt-2 border-0 bg-transparent px-0 text-[10px] font-normal",
            emp.status === "active" && "text-emerald-600 dark:text-emerald-400",
            emp.status === "limited" && "text-amber-700 dark:text-amber-300",
          )}
        >
          {emp.status}
        </Badge>
      </div>

      <Sheet title="Иерархия">
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-[11px] text-muted-foreground">Подчиняется</p>
            <p className="mt-0.5 text-foreground">
              {mgr ? `${getEmployeeName(mgr)} · ${mgr.title}` : "—"}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Подчинённые</p>
            {reports.length === 0 ? (
              <p className="mt-0.5 text-muted-foreground">—</p>
            ) : (
              <ul className="mt-1.5 space-y-2">
                {reports.map((r) => (
                  <li key={r.id} className="text-foreground">
                    <span className="font-medium">{getEmployeeName(r)}</span>
                    <span className="text-muted-foreground"> · {r.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Sheet>

      <Sheet title="База компании">
        <p className="text-[11px] text-muted-foreground">Контекст</p>
        <BulletList items={mockCompanyDefaults.context} />
        <p className="mt-3 text-[11px] text-muted-foreground">Модели</p>
        <BulletList items={mockCompanyDefaults.models} />
        <p className="mt-3 text-[11px] text-muted-foreground">Сценарии</p>
        <BulletList
          items={mockCompanyDefaults.scenarioIds.map(scenarioTitle)}
        />
      </Sheet>

      <Sheet title="Отдел">
        {dept ? (
          <>
            <p className="text-[11px] text-muted-foreground">Доп. контекст</p>
            <BulletList items={dept.departmentAccess.contextAdd} />
            <p className="mt-3 text-[11px] text-muted-foreground">Модели</p>
            <BulletList items={getDepartmentModels(dept)} />
            <p className="mt-3 text-[11px] text-muted-foreground">Сценарии</p>
            <BulletList
              items={getDepartmentScenarios(dept).map(scenarioTitle)}
            />
          </>
        ) : (
          <p className="text-xs text-muted-foreground">Нет отдела (CEO).</p>
        )}
      </Sheet>

      <Sheet title="Персонально">
        {emp.accessOverride &&
        (emp.accessOverride.contextAdd.length > 0 ||
          emp.accessOverride.extraModels.length > 0 ||
          emp.accessOverride.extraScenarioIds.length > 0) ? (
          <>
            <p className="text-[11px] text-muted-foreground">Контекст</p>
            <BulletList items={emp.accessOverride.contextAdd} />
            <p className="mt-3 text-[11px] text-muted-foreground">Модели</p>
            <BulletList items={emp.accessOverride.extraModels} />
            <p className="mt-3 text-[11px] text-muted-foreground">Сценарии</p>
            <BulletList
              items={emp.accessOverride.extraScenarioIds.map(scenarioTitle)}
            />
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            Нет персональных добавлений.
          </p>
        )}
      </Sheet>

      <Sheet title="Эффективно (mock)">
        <p className="text-[11px] text-muted-foreground">Контекст</p>
        <BulletList items={effCtx} />
        <p className="mt-3 text-[11px] text-muted-foreground">Модели</p>
        <BulletList items={effModels} />
        <p className="mt-3 text-[11px] text-muted-foreground">Сценарии</p>
        <BulletList items={effScenarios.map(scenarioTitle)} />
      </Sheet>

      <MutedActions />
    </div>
  );
}
