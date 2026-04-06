"use client";

import { useRouter } from "next/navigation";
import { BookMarked, MoreHorizontal, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { chatColumnClassName } from "@/lib/chat/chat-column-layout";
import { mockScenarios } from "@/lib/mock/scenarios";

/** Только меню действий: название и сценарий — в шапке workspace. */
export function ChatTopBar({
  onOpenContextPicker,
  onClearLocalMock,
}: {
  onOpenContextPicker?: () => void;
  onClearLocalMock?: () => void;
}) {
  const router = useRouter();

  return (
    <header className="w-full shrink-0 bg-[hsl(var(--background))]">
      <div
        className={chatColumnClassName(
          "box-border flex h-10 max-h-10 min-h-10 items-center justify-end gap-2 overflow-hidden py-1",
        )}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:bg-muted/80"
              aria-label="Меню чата"
            >
              <MoreHorizontal className="size-4 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl">
            <DropdownMenuLabel className="text-[11px] font-normal text-muted-foreground">
              Сценарий
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {mockScenarios.map((s) => (
              <DropdownMenuItem
                key={s.id}
                className="rounded-lg text-sm"
                onClick={() => router.push(`/chat?scenario=${s.id}`)}
              >
                {s.title}
              </DropdownMenuItem>
            ))}
            {onOpenContextPicker ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="rounded-lg text-sm"
                  onClick={() => onOpenContextPicker()}
                >
                  <BookMarked className="size-3.5 opacity-70" />
                  Контекст базы знаний
                </DropdownMenuItem>
              </>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="rounded-lg text-sm"
              onClick={() => {
                onClearLocalMock?.();
              }}
            >
              <Trash2 className="size-3.5 opacity-70" />
              Очистить черновик (демо)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
