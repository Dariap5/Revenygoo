"use client";

import type { ChatQuickAction } from "@/lib/mock/chat-quick-actions";
import type { ChatPromptTemplate } from "@/lib/mock/chat-templates";

import { ChatQuickActions } from "./chat-quick-actions";
import { ChatTemplatesPanel } from "./chat-templates-panel";

import { cn } from "@/lib/utils";

/** Быстрые действия в виде сетки карточек + шаблоны. */
export function ChatQuickActionsRow({
  onQuickAction,
  onTemplate,
  className,
}: {
  onQuickAction: (action: ChatQuickAction) => void;
  onTemplate: (template: ChatPromptTemplate) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex w-full flex-col gap-4", className)}>
      <div className="flex flex-wrap items-stretch gap-3">
        <ChatQuickActions onPick={onQuickAction} layout="cards" />
        <ChatTemplatesPanel
          onPick={onTemplate}
          variant="dropdown"
          dropdownTrigger="outline-row"
        />
      </div>
    </div>
  );
}
