import { KnowledgeCatalog } from "@/components/knowledge/knowledge-catalog";

export default function KnowledgePage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 px-4 py-8 sm:px-6">
      <div>
        <h1 className="mb-1 text-lg font-semibold tracking-tight text-[hsl(var(--foreground))]">
          База знаний
        </h1>
        <p className="mb-5 max-w-xl text-sm text-[hsl(var(--muted-foreground))]">
          Файлы организации в приватном хранилище. Индексация для RAG — в следующей
          версии; после загрузки статус «Обрабатывается».
        </p>
      </div>
      <KnowledgeCatalog />
    </div>
  );
}
