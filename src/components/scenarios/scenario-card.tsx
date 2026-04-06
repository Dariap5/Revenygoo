import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getDefaultChatIdForScenario } from "@/lib/mock/chat-helpers";
import { scenarioIconGradientStyle } from "@/lib/scenarios/scenario-icon-gradient";
import type { Scenario } from "@/types";

import { ModelBadge } from "./model-badge";
import { ScenarioIcon } from "./scenario-icon";

export function ScenarioCard({ scenario }: { scenario: Scenario }) {
  const chatId = getDefaultChatIdForScenario(scenario.id);
  const href = chatId
    ? `/chat?chat=${chatId}`
    : `/chat?scenario=${scenario.id}`;

  return (
    <div className="card-pressable flex flex-col rounded-[var(--radius-md)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4 transition-all duration-200 hover:border-[hsl(var(--border-strong))] hover:shadow-[0_1px_8px_rgba(0,0,0,0.06)]">
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-start gap-3">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] shadow-sm ring-1 ring-black/5 dark:ring-white/10"
            style={scenarioIconGradientStyle(scenario.id)}
          >
            <ScenarioIcon
              name={scenario.icon}
              className="size-[18px] text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]"
            />
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="text-sm font-medium leading-tight text-[hsl(var(--foreground))]">
              {scenario.title}
            </p>
            <ModelBadge model={scenario.modelBadge} />
          </div>
        </div>
        <p className="text-xs leading-snug text-[hsl(var(--muted-foreground))]">
          {scenario.description}
        </p>
      </div>
      <div className="mt-4">
        <Button className="w-full" variant="outline" size="sm" asChild>
          <Link href={href}>Открыть чат</Link>
        </Button>
      </div>
    </div>
  );
}
