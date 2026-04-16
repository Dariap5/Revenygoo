"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ScenarioTemplate, ScenarioTemplateCategory } from "@/types";

import { cn } from "@/lib/utils";

const CATEGORY_CHIPS: { id: "all" | ScenarioTemplateCategory; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "communication", label: "Коммуникация" },
  { id: "code", label: "Код" },
  { id: "analysis", label: "Анализ" },
  { id: "documents", label: "Документы" },
];

type ApiResponse = {
  scenarios?: ScenarioTemplate[];
  error?: string;
};

function cardHref(template: ScenarioTemplate): string {
  const qs = new URLSearchParams({
    scenario: template.id,
    title: template.title,
    prompt: template.promptTemplate,
  });
  return `/chat?${qs.toString()}`;
}

export function ScenarioCatalog() {
  const [all, setAll] = useState<ScenarioTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<"all" | ScenarioTemplateCategory>("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/scenarios", { credentials: "include" });
      const json = (await res.json().catch(() => ({}))) as ApiResponse;
      if (cancelled) return;
      if (!res.ok) {
        setError(json.error ?? "Не удалось загрузить шаблоны.");
        setAll([]);
      } else {
        setAll(json.scenarios ?? []);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return all.filter((x) => {
      if (category !== "all" && x.category !== category) return false;
      if (!s) return true;
      return x.title.toLowerCase().includes(s);
    });
  }, [q, all, category]);

  return (
    <div className="space-y-7">
      <div className="max-w-md">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]"
            aria-hidden
          />
          <Input
            placeholder="Поиск по названию…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
            aria-label="Поиск сценариев"
          />
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {CATEGORY_CHIPS.map((t) => {
          const active = category === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setCategory(t.id)}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors",
                active
                  ? "border-[hsl(var(--border-strong))] bg-muted/30 text-[hsl(var(--foreground))]"
                  : "cursor-pointer border-[hsl(var(--border))] bg-transparent text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--border-strong))] hover:bg-muted/20 hover:text-[hsl(var(--foreground))]",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Загрузка…</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {!loading && !error ? (
        filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((scenario) => (
              <div
                key={scenario.id}
                className="flex flex-col rounded-[var(--radius-md)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4"
              >
                <p className="line-clamp-1 text-sm font-medium text-foreground">
                  {scenario.title}
                </p>
                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                  {scenario.description}
                </p>
                <div className="mt-4">
                  <Button className="w-full" variant="outline" size="sm" asChild>
                    <Link href={cardHref(scenario)}>Запустить</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Ничего не найдено. Измените запрос или категорию.
          </p>
        )
      ) : null}
    </div>
  );
}
