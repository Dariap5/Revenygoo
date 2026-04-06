import { KnowledgeCatalog } from "@/components/knowledge/knowledge-catalog";

export default function KnowledgePage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="mb-1 text-xl font-semibold text-[hsl(var(--foreground))]">
          База знаний
        </h1>
        <p className="mb-5 max-w-xl text-sm text-[hsl(var(--muted-foreground))]">
          Документы и базы, которые можно подключать к ответам модели в чате.
          Сейчас демо-данные без загрузки на сервер.
        </p>
      </div>
      <KnowledgeCatalog />
    </div>
  );
}
