import Link from "next/link";
import { MoreHorizontal, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { KnowledgeSource } from "@/types";

import { cn } from "@/lib/utils";

import { KnowledgeSourceIcon } from "./knowledge-source-icon";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function KnowledgeSourceCard({
  source,
  onDelete,
}: {
  source: KnowledgeSource;
  onDelete: (id: string) => void;
}) {
  const ready = source.status === "ready";

  return (
    <div className="card-pressable flex flex-col rounded-[var(--radius-md)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4 transition-all duration-200 hover:border-[hsl(var(--border-strong))] hover:shadow-[0_1px_8px_rgba(0,0,0,0.06)]">
      <div className="space-y-2 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--background-secondary))]">
              <KnowledgeSourceIcon type={source.type} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-tight text-[hsl(var(--foreground))]">
                {source.title}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <Badge variant="outline" className="text-[10px] font-normal">
                  {source.type}
                </Badge>
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-[10px] font-normal",
                    ready ? "text-muted-foreground" : "text-amber-800 dark:text-amber-200",
                  )}
                >
                  {ready ? "Готов" : "В обработке"}
                </Badge>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8 shrink-0">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Действия</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                destructive
                className="gap-2"
                onClick={() => onDelete(source.id)}
              >
                <Trash2 className="size-3.5 shrink-0" />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <p className="text-xs leading-snug text-[hsl(var(--muted-foreground))]">
          {source.description}
        </p>
      </div>
      <div className="flex-1">
        <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
          Добавлено {formatDate(source.addedAt)}
        </p>
      </div>
      <div className="mt-3">
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href="/chat">Подключить</Link>
        </Button>
      </div>
    </div>
  );
}
