"use client";

import { MoreHorizontal, Pencil, Power, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SecurityPolicy } from "@/lib/mock/policies";

import { cn } from "@/lib/utils";

function actionBadgeVariant(
  action: SecurityPolicy["action"],
): "default" | "secondary" | "outline" {
  if (action === "block") return "default";
  if (action === "hide") return "secondary";
  return "outline";
}

export function PoliciesRulesTable({
  policies,
  onEdit,
  onToggleStatus,
  onDelete,
}: {
  policies: SecurityPolicy[];
  onEdit: (p: SecurityPolicy) => void;
  onToggleStatus: (p: SecurityPolicy) => void;
  onDelete: (p: SecurityPolicy) => void;
}) {
  if (policies.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
        Нет правил по заданным фильтрам. Создайте правило или сбросьте поиск.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius-md)] border border-[hsl(var(--border))]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead>
            <tr className="border-b border-[hsl(var(--border))] text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              <th className="px-3 py-2.5 font-medium">Правило</th>
              <th className="px-3 py-2.5 font-medium">Тип данных</th>
              <th className="px-3 py-2.5 font-medium">Роль</th>
              <th className="px-3 py-2.5 font-medium">Модель</th>
              <th className="px-3 py-2.5 font-medium">Действие</th>
              <th className="px-3 py-2.5 font-medium">Статус</th>
              <th className="w-12 px-2 py-2.5 font-medium" />
            </tr>
          </thead>
          <tbody>
            {policies.map((p) => (
              <tr
                key={p.id}
                className="border-b border-[hsl(var(--border))] last:border-0 hover:bg-[hsl(var(--background-secondary))]"
              >
                <td className="max-w-[240px] px-3 py-3 align-top">
                  <p className="text-sm font-medium text-[hsl(var(--foreground))]">{p.name}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-[hsl(var(--muted-foreground))]">
                    {p.description}
                  </p>
                </td>
                <td className="whitespace-nowrap px-3 py-3 align-top text-xs text-muted-foreground">
                  {p.dataType}
                </td>
                <td className="whitespace-nowrap px-3 py-3 align-top text-xs capitalize text-muted-foreground">
                  {p.role}
                </td>
                <td className="whitespace-nowrap px-3 py-3 align-top text-xs text-muted-foreground">
                  {p.model}
                </td>
                <td className="px-3 py-3 align-top">
                  <Badge variant={actionBadgeVariant(p.action)} className="text-[10px]">
                    {p.action}
                  </Badge>
                </td>
                <td className="px-3 py-3 align-top">
                  <Badge
                    variant={p.status === "active" ? "secondary" : "muted"}
                    className={cn(
                      "text-[10px]",
                      p.status === "active" && "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
                    )}
                  >
                    {p.status}
                  </Badge>
                </td>
                <td className="px-1 py-2 align-top">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground"
                        title="Действия"
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        className="gap-2"
                        onClick={() => onEdit(p)}
                      >
                        <Pencil className="size-3.5" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2"
                        onClick={() => onToggleStatus(p)}
                      >
                        <Power className="size-3.5" />
                        {p.status === "active" ? "Disable" : "Enable"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        destructive
                        className="gap-2"
                        onClick={() => onDelete(p)}
                      >
                        <Trash2 className="size-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
