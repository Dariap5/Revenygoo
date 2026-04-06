"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import type { AIModelBadge, Scenario } from "@/types";

import { ScenarioSection } from "./scenario-section";

import { cn } from "@/lib/utils";

const MODEL_TAGS: { id: "all" | AIModelBadge; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "Auto", label: "Auto" },
  { id: "GPT", label: "GPT" },
  { id: "Claude", label: "Claude" },
  { id: "Gemini", label: "Gemini" },
];

export function ScenarioCatalog({ scenarios }: { scenarios: Scenario[] }) {
  const [q, setQ] = useState("");
  const [modelTag, setModelTag] = useState<"all" | AIModelBadge>("all");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return scenarios.filter((x) => {
      if (modelTag !== "all" && x.modelBadge !== modelTag) return false;
      if (!s) return true;
      return (
        x.title.toLowerCase().includes(s) ||
        x.description.toLowerCase().includes(s)
      );
    });
  }, [q, scenarios, modelTag]);

  const popular = filtered.filter((x) => x.popular);
  const recent = filtered.filter((x) => x.recent);
  const favorites = filtered.filter((x) => x.favorite);

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
        {MODEL_TAGS.map((t) => {
          const active = modelTag === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setModelTag(t.id)}
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

      {!q.trim() && modelTag === "all" && (
        <>
          <ScenarioSection title="Популярные сценарии" scenarios={popular} />
          <ScenarioSection title="Последние" scenarios={recent} />
          <ScenarioSection title="Избранные" scenarios={favorites} />
        </>
      )}

      <ScenarioSection
        title={
          q.trim() || modelTag !== "all" ? "Результаты" : "Все сценарии"
        }
        scenarios={filtered}
        emptyLabel={
          q.trim() || modelTag !== "all"
            ? "Ничего не найдено. Попробуйте другой запрос или тег."
            : undefined
        }
      />
    </div>
  );
}
