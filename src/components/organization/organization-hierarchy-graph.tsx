"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Minus, Plus } from "lucide-react";

import {
  getEmployeeById,
  getEmployeeName,
  type OrgEmployee,
} from "@/lib/mock/organization";
import { cn } from "@/lib/utils";

export type OrgHierarchyNode = {
  id: string;
  name: string;
  role: string;
  children: OrgHierarchyNode[];
};

export type NodeLabelOverrides = Record<
  string,
  { name?: string; role?: string }
>;

function employeeToNode(emp: OrgEmployee): OrgHierarchyNode {
  return {
    id: emp.id,
    name: getEmployeeName(emp),
    role: emp.title,
    children: emp.directReportIds
      .map((id) => getEmployeeById(id))
      .filter((e): e is OrgEmployee => Boolean(e))
      .map((e) => employeeToNode(e)),
  };
}

export function buildOrgHierarchyFromCeo(): OrgHierarchyNode | null {
  const ceo = getEmployeeById("emp-ceo");
  if (!ceo) return null;
  return employeeToNode(ceo);
}

function FullHierarchyNode({
  node,
  level,
  overrides,
  onEditNode,
}: {
  node: OrgHierarchyNode;
  level: number;
  overrides: NodeLabelOverrides;
  onEditNode: (id: string, patch: { name?: string; role?: string }) => void;
}) {
  const o = overrides[node.id];
  const name = o?.name ?? node.name;
  const role = o?.role ?? node.role;

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        title="Двойной клик — изменить подпись (демо)"
        onMouseDown={(e) => e.stopPropagation()}
        onDoubleClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const nn = window.prompt("Имя на графе", name);
          if (nn === null) return;
          if (nn.trim()) onEditNode(node.id, { name: nn.trim() });
          const rr = window.prompt(
            "Должность (пусто — без изменений)",
            role,
          );
          if (rr !== null && rr.trim()) onEditNode(node.id, { role: rr.trim() });
        }}
        className={cn(
          "relative flex max-w-[220px] cursor-grab items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left transition-all active:cursor-grabbing",
          "hover:border-purple-300/80 hover:shadow-sm dark:hover:border-purple-600/80",
          level === 0
            ? "rg-gradient-border bg-background font-semibold"
            : "border-border bg-background",
        )}
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white rg-shimmer-btn">
          {name[0]}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{role}</p>
        </div>
      </button>

      {node.children.length > 0 ? (
        <>
          <div className="h-5 w-px shrink-0 bg-border" />
          <div className="relative flex max-w-none flex-wrap justify-center gap-x-10 gap-y-2 px-3 pb-1 pt-0">
            {node.children.length > 1 ? (
              <div
                className="absolute left-[8%] right-[8%] top-0 hidden h-px bg-border/90 sm:block"
                aria-hidden
              />
            ) : null}
            {node.children.map((child) => (
              <div key={child.id} className="flex flex-col items-center">
                <div className="h-5 w-px shrink-0 bg-border" />
                <FullHierarchyNode
                  node={child}
                  level={level + 1}
                  overrides={overrides}
                  onEditNode={onEditNode}
                />
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

export function OrganizationHierarchyGraphCanvas({
  root,
}: {
  root: OrgHierarchyNode | null;
}) {
  const [scale, setScale] = useState(0.75);
  const [pan, setPan] = useState({ x: 40, y: 28 });
  const [overrides, setOverrides] = useState<NodeLabelOverrides>({});
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  const onEditNode = useCallback(
    (id: string, patch: { name?: string; role?: string }) => {
      setOverrides((prev) => ({
        ...prev,
        [id]: { ...prev[id], ...patch },
      }));
    },
    [],
  );

  const onWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.06 : 0.06;
    setScale((s) => Math.min(2.4, Math.max(0.2, s + delta)));
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      setPan((p) => ({
        x: p.x + e.clientX - last.current.x,
        y: p.y + e.clientY - last.current.y,
      }));
      last.current = { x: e.clientX, y: e.clientY };
    };
    const onUp = () => {
      dragging.current = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
  };

  const graph = useMemo(() => {
    if (!root) return null;
    return (
      <FullHierarchyNode
        node={root}
        level={0}
        overrides={overrides}
        onEditNode={onEditNode}
      />
    );
  }, [root, overrides, onEditNode]);

  if (!root) {
    return (
      <p className="text-sm text-muted-foreground">Нет данных для графа.</p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Граф иерархии
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="inline-flex size-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted"
            title="Уменьшить"
            onClick={() =>
              setScale((s) => Math.max(0.2, Number((s - 0.12).toFixed(2))))
            }
          >
            <Minus className="size-4" />
          </button>
          <button
            type="button"
            className="inline-flex size-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted"
            title="Увеличить"
            onClick={() =>
              setScale((s) => Math.min(2.4, Number((s + 0.12).toFixed(2))))
            }
          >
            <Plus className="size-4" />
          </button>
          <span className="min-w-[3rem] text-right text-xs tabular-nums text-muted-foreground">
            {Math.round(scale * 100)}%
          </span>
        </div>
      </div>

      <div
        role="application"
        aria-label="Граф организации: масштаб колёсиком, сдвиг перетаскиванием"
        className="relative h-[min(72vh,640px)] overflow-hidden rounded-xl border border-border bg-gradient-to-b from-muted/25 to-muted/5"
        onWheel={onWheel}
        onMouseDown={onMouseDown}
      >
        <div
          className="inline-block will-change-transform select-none"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: "0 0",
          }}
        >
          <div className="p-6 pr-16 pb-16">{graph}</div>
        </div>
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Колёсико мыши — масштаб. Зажмите левую кнопку и тяните поле — сдвиг.
        Двойной клик по карточке — правка подписи (только в браузере, демо).
      </p>
    </div>
  );
}
