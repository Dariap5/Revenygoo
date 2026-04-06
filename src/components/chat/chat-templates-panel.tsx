"use client";

import { FileText, LayoutGrid } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ChatPromptTemplate } from "@/lib/mock/chat-templates";
import { mockChatTemplates } from "@/lib/mock/chat-templates";

import { cn } from "@/lib/utils";

function TemplateCard({
  template,
  onPick,
}: {
  template: ChatPromptTemplate;
  onPick: (t: ChatPromptTemplate) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(template)}
      className="flex w-full flex-col rounded-xl border border-border bg-card px-3 py-3 text-left transition-colors hover:bg-muted/40"
    >
      <span className="text-xs font-medium text-foreground">
        {template.title}
      </span>
      <span className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
        {template.description}
      </span>
    </button>
  );
}

export function ChatTemplatesPanel({
  templates = mockChatTemplates,
  onPick,
  variant = "grid",
  dropdownTrigger = "default",
  className,
}: {
  templates?: ChatPromptTemplate[];
  onPick: (template: ChatPromptTemplate) => void;
  variant?: "grid" | "dropdown";
  /** Внешний вид кнопки в режиме dropdown */
  dropdownTrigger?: "default" | "outline-row";
  className?: string;
}) {
  if (variant === "dropdown") {
    const triggerOutlineRow = dropdownTrigger === "outline-row";
    return (
      <div className={cn(className)}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                "shrink-0 gap-1.5 rounded-lg border-border text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                triggerOutlineRow
                  ? "h-auto min-h-[52px] px-3 py-2"
                  : "h-8 rounded-xl px-2.5 text-xs font-medium",
              )}
            >
              {triggerOutlineRow ? (
                <LayoutGrid className="size-3.5 shrink-0" aria-hidden />
              ) : (
                <FileText className="size-3.5 shrink-0" aria-hidden />
              )}
              Шаблоны
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72">
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              Выберите шаблон — текст подставится в поле ввода
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {templates.map((t) => (
              <DropdownMenuItem
                key={t.id}
                className="flex cursor-pointer flex-col items-start gap-0.5 py-2"
                onClick={() => onPick(t)}
              >
                <span className="text-xs font-medium">{t.title}</span>
                <span className="text-[11px] font-normal text-muted-foreground">
                  {t.description}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <p className="mb-3 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        Шаблоны запросов
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {templates.map((t) => (
          <TemplateCard key={t.id} template={t} onPick={onPick} />
        ))}
      </div>
    </div>
  );
}
