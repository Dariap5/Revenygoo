import { ScenarioCatalog } from "@/components/scenarios/scenario-catalog";
import { mockScenarios } from "@/lib/mock/scenarios";

export default function ScenariosPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="mb-1 text-xl font-semibold text-[hsl(var(--foreground))]">
          Сценарии
        </h1>
        <p className="mb-5 max-w-xl text-sm text-[hsl(var(--muted-foreground))]">
          Выберите задачу — откроется чат. Данные и политики задаёт
          администратор.
        </p>
      </div>
      <ScenarioCatalog scenarios={mockScenarios} />
    </div>
  );
}
