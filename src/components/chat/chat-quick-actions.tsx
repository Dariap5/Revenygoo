"use client";

import type { ChatQuickAction } from "@/lib/mock/chat-quick-actions";
import { mockChatQuickActions } from "@/lib/mock/chat-quick-actions";

import { cn } from "@/lib/utils";

const QUICK_ACTION_CORNER: Record<string, string> = {
  "write-email": "rg-corner-violet",
  "doc-summary": "rg-corner-blue",
  presentation: "rg-corner-rose",
  "key-takeaways": "rg-corner-amber",
  translate: "rg-corner-teal",
  "meeting-recap": "rg-corner-emerald",
};

export function ChatQuickActions({
  actions = mockChatQuickActions,
  onPick,
  layout = "grid",
  className,
}: {
  actions?: ChatQuickAction[];
  onPick: (action: ChatQuickAction) => void;
  layout?: "grid" | "scroll" | "rail" | "cards";
  className?: string;
}) {
  const chipClass = cn(
    "shrink-0 rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-left text-xs font-medium text-[hsl(var(--muted-foreground))] transition-all duration-150 hover:border-[hsl(var(--border-strong))] hover:bg-[hsl(var(--background-tertiary))] hover:text-[hsl(var(--foreground))]",
    layout === "grid" ? "px-3 py-2.5" : "max-w-[220px] px-2.5 py-1.5",
  );

  const rowClass =
    "flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

  if (layout === "cards") {
    return (
      <div className={cn("contents", className)}>
        {actions.map((action) => {
          const corner = QUICK_ACTION_CORNER[action.id] ?? "rg-corner-violet";
          return (
            <button
              key={action.id}
              type="button"
              onClick={() => onPick(action)}
              className={cn(
                "card-pressable relative min-w-[140px] max-w-[220px] flex-1 basis-[calc(50%-0.375rem)] overflow-hidden sm:basis-[calc(33.333%-0.5rem)] lg:basis-[calc(25%-0.5625rem)]",
                "flex flex-col items-start rounded-[var(--radius-md)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4 text-left transition-all duration-150 hover:border-[hsl(var(--border-strong))] hover:bg-[hsl(var(--background-tertiary))]",
                "rg-card-corner",
                corner,
              )}
            >
              <span className="relative z-[1] text-sm font-medium text-[hsl(var(--foreground))]">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  if (layout === "rail") {
    return (
      <div className={cn("flex min-w-0 flex-1 flex-wrap items-center gap-2", className)}>
        <span className="shrink-0 text-xs font-medium text-[hsl(var(--muted-foreground))]">
          Быстрые действия
        </span>
        <div className={cn("min-w-0 flex-1", rowClass)}>
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => onPick(action)}
              className={chipClass}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
        Быстрые действия
      </p>
      <div
        className={cn(
          layout === "grid"
            ? "grid grid-cols-1 gap-2 sm:grid-cols-2"
            : rowClass,
        )}
      >
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => onPick(action)}
            className={chipClass}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
