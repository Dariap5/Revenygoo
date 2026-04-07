"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Copy,
  MoreHorizontal,
  Pin,
  PinOff,
  Pencil,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CHAT_THREADS_CHANGED_EVENT,
  mutateChatThreads,
  readChatThreads,
  setThreadPinned,
} from "@/lib/history/chat-threads-storage";
import { NEW_CHAT_THREAD_ID } from "@/lib/mock/chats";
import type { ChatThread } from "@/types";
import { cn } from "@/lib/utils";

function formatGroupLabel(key: string): string {
  if (key === "today") return "Сегодня";
  if (key === "yesterday") return "Вчера";
  return "Ранее";
}

function groupBucket(iso: string): "today" | "yesterday" | "earlier" {
  const d = new Date(iso);
  const t0 = new Date();
  t0.setHours(0, 0, 0, 0);
  const t1 = new Date(t0);
  t1.setDate(t1.getDate() - 1);
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  if (day.getTime() === t0.getTime()) return "today";
  if (day.getTime() === t1.getTime()) return "yesterday";
  return "earlier";
}

function sortThreads(list: ChatThread[]): ChatThread[] {
  return [...list].sort((a, b) => {
    const pa = a.pinned ? 1 : 0;
    const pb = b.pinned ? 1 : 0;
    if (pa !== pb) return pb - pa;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export function WorkspaceChatHistory({ collapsed }: { collapsed: boolean }) {
  const searchParams = useSearchParams();
  const chatParam = searchParams.get("chat");
  const [threads, setThreads] = useState<ChatThread[]>([]);

  useEffect(() => {
    setThreads(readChatThreads());
    const h = () => setThreads(readChatThreads());
    window.addEventListener(CHAT_THREADS_CHANGED_EVENT, h);
    return () => window.removeEventListener(CHAT_THREADS_CHANGED_EVENT, h);
  }, []);

  const filtered = useMemo(
    () => threads.filter((t) => t.id !== NEW_CHAT_THREAD_ID),
    [threads],
  );

  const sorted = useMemo(() => sortThreads(filtered), [filtered]);

  const grouped = useMemo(() => {
    const order = ["today", "yesterday", "earlier"] as const;
    const map = new Map<string, ChatThread[]>();
    for (const k of order) map.set(k, []);
    for (const t of sorted) {
      const b = groupBucket(t.updatedAt);
      map.get(b)!.push(t);
    }
    return order
      .map((k) => ({ key: k, items: map.get(k)! }))
      .filter((g) => g.items.length > 0);
  }, [sorted]);

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1 py-2">
        <span
          className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground"
          title="История чатов развёрнута в широком меню"
        >
          …
        </span>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <p className="sr-only">История чатов</p>
      <ScrollArea className="min-h-0 flex-1 px-1.5">
        <div className="space-y-3 pb-3 pr-1 pt-1">
          {grouped.map((g) => (
            <div key={g.key}>
              <p className="mb-1.5 px-2 text-[10px] font-medium text-muted-foreground/90">
                {formatGroupLabel(g.key)}
              </p>
              <ul className="flex flex-col gap-0.5">
                {g.items.map((t) => (
                  <HistoryRow
                    key={t.id}
                    thread={t}
                    active={chatParam === t.id}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function HistoryRow({
  thread,
  active,
}: {
  thread: ChatThread;
  active: boolean;
}) {
  const href = `/chat?chat=${encodeURIComponent(thread.id)}`;

  const onPin = () => {
    const nextPinned = !thread.pinned;
    setThreadPinned(thread.id, nextPinned);
    mutateChatThreads((prev) =>
      prev.map((x) =>
        x.id === thread.id ? { ...x, pinned: nextPinned } : x,
      ),
    );
  };

  const onRename = () => {
    const next = window.prompt("Название чата", thread.title);
    if (next == null || !next.trim()) return;
    mutateChatThreads((prev) =>
      prev.map((x) => (x.id === thread.id ? { ...x, title: next.trim() } : x)),
    );
  };

  const onDelete = () => {
    if (!window.confirm("Удалить чат из истории? (демо)")) return;
    mutateChatThreads((prev) => prev.filter((x) => x.id !== thread.id));
  };

  const onDuplicate = () => {
    // TODO: дублирование треда через API, когда появится endpoint
    const copy: ChatThread = {
      ...thread,
      id: `chat-${Date.now()}`,
      title: `${thread.title} (копия)`,
      updatedAt: new Date().toISOString(),
      pinned: false,
    };
    mutateChatThreads((prev) => {
      const idx = prev.findIndex((x) => x.id === thread.id);
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  };

  return (
    <li className="group relative">
      <Link
        href={href}
        className={cn(
          "flex items-center gap-1 rounded-[var(--radius)] border border-transparent px-2 py-2 pr-8 text-left transition-colors duration-150",
          active
            ? "border-[hsl(var(--border))] bg-[hsl(var(--background-tertiary))] font-medium text-[hsl(var(--foreground))]"
            : "text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--border))] hover:bg-[hsl(var(--background-tertiary))] hover:text-[hsl(var(--foreground))]",
        )}
      >
        <span className="line-clamp-2 min-w-0 flex-1 text-[12px] leading-snug">
          {thread.pinned ? (
            <Pin className="mr-1 inline size-3 shrink-0 opacity-50" aria-hidden />
          ) : null}
          {thread.title}
        </span>
      </Link>
      <div className="absolute right-1 top-1/2 z-10 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground"
              aria-label="Действия"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl">
            <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
              <Link href={href}>Открыть</Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={onRename}>
              <Pencil className="size-3.5 opacity-70" />
              Переименовать
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={onPin}>
              {thread.pinned ? (
                <>
                  <PinOff className="size-3.5 opacity-70" />
                  Открепить
                </>
              ) : (
                <>
                  <Pin className="size-3.5 opacity-70" />
                  Закрепить
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={onDuplicate}>
              <Copy className="size-3.5 opacity-70" />
              Дублировать
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              destructive
              className="cursor-pointer"
              onClick={onDelete}
            >
              <Trash2 className="size-3.5 opacity-70" />
              Удалить
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}
