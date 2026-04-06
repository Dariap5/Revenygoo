import type { Scenario } from "@/types";

import { ScenarioCard } from "./scenario-card";

export function ScenarioSection({
  title,
  scenarios,
  emptyLabel,
}: {
  title: string;
  scenarios: Scenario[];
  emptyLabel?: string;
}) {
  if (scenarios.length === 0 && emptyLabel) {
    return (
      <section className="space-y-3">
        <h2 className="text-[11px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
          {title}
        </h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">{emptyLabel}</p>
      </section>
    );
  }

  if (scenarios.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-[11px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {scenarios.map((s) => (
          <ScenarioCard key={s.id} scenario={s} />
        ))}
      </div>
    </section>
  );
}
