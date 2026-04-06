"use client";

import { useMemo, useState } from "react";
import { Search, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  mockKnowledgeSources,
  knowledgeSourceTypes,
} from "@/lib/mock/knowledge-sources";
import type { KnowledgeSource, KnowledgeSourceType } from "@/types";

import { cn } from "@/lib/utils";

import { KnowledgeSourceCard } from "./knowledge-source-card";

export function KnowledgeCatalog() {
  const [sources, setSources] = useState<KnowledgeSource[]>(mockKnowledgeSources);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<KnowledgeSourceType | "all">(
    "all",
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return sources.filter((x) => {
      const typeOk = typeFilter === "all" || x.type === typeFilter;
      if (!typeOk) return false;
      if (!s) return true;
      return (
        x.title.toLowerCase().includes(s) ||
        x.description.toLowerCase().includes(s) ||
        x.type.toLowerCase().includes(s)
      );
    });
  }, [sources, q, typeFilter]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-md flex-1">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]"
              aria-hidden
            />
            <Input
              placeholder="Поиск по названию или типу…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
              aria-label="Поиск источников"
            />
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 shrink-0 gap-1.5"
          onClick={() => {
            /* mock */
          }}
        >
          <Upload className="size-3.5" />
          Загрузить файл
        </Button>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setTypeFilter("all")}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors",
            typeFilter === "all"
              ? "border-[hsl(var(--foreground))] bg-[hsl(var(--foreground))] text-[hsl(var(--primary-foreground))]"
              : "cursor-pointer border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--border-strong))] hover:text-[hsl(var(--foreground))]",
          )}
        >
          Все типы
        </button>
        {knowledgeSourceTypes.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTypeFilter(t)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors",
              typeFilter === t
                ? "border-[hsl(var(--foreground))] bg-[hsl(var(--foreground))] text-[hsl(var(--primary-foreground))]"
                : "cursor-pointer border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--border-strong))] hover:text-[hsl(var(--foreground))]",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Ничего не найдено.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((s) => (
            <KnowledgeSourceCard
              key={s.id}
              source={s}
              onDelete={(id) =>
                setSources((prev) => prev.filter((x) => x.id !== id))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
