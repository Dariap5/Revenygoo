"use client";

import { Button } from "@/components/ui/button";
import { chatColumnClassName } from "@/lib/chat/chat-column-layout";
import type { KnowledgeSource } from "@/types";

export function ChatContextBar({
  sources,
  onEdit,
}: {
  sources: KnowledgeSource[];
  onEdit: () => void;
}) {
  if (sources.length === 0) return null;

  const labels = sources.map((s) => s.title).join(" · ");

  return (
    <div className="w-full border-b border-border bg-muted/25">
      <div
        className={chatColumnClassName("flex items-center gap-2 py-2")}
      >
        <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          База знаний
        </span>
        <p
          className="min-w-0 flex-1 truncate text-xs text-foreground/90"
          title={labels}
        >
          {labels}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 shrink-0 px-2 text-xs text-muted-foreground"
          onClick={onEdit}
        >
          Изменить
        </Button>
      </div>
    </div>
  );
}
