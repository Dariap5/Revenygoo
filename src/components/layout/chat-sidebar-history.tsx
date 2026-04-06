"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CHAT_THREADS_CHANGED_EVENT,
  readChatThreads,
} from "@/lib/history/chat-threads-storage";
import { mockChatThreads, NEW_CHAT_THREAD_ID } from "@/lib/mock/chats";
import type { ChatThread } from "@/types";

import { cn } from "@/lib/utils";

const MAX_CHATS = 8;

function formatUpdated(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return "";
  }
}

export function ChatSidebarHistory() {
  const searchParams = useSearchParams();
  const chatParam = searchParams.get("chat");
  const scenarioParam = searchParams.get("scenario");

  const [threads, setThreads] = useState<ChatThread[]>(mockChatThreads);

  useEffect(() => {
    setThreads(readChatThreads());
    const h = () => setThreads(readChatThreads());
    window.addEventListener(CHAT_THREADS_CHANGED_EVENT, h);
    return () => window.removeEventListener(CHAT_THREADS_CHANGED_EVENT, h);
  }, []);

  const sorted = useMemo(
    () =>
      [...threads].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    [threads],
  );

  const visible = sorted.slice(0, MAX_CHATS);

  const resolvedActiveId = useMemo(() => {
    if (chatParam && threads.some((t) => t.id === chatParam)) {
      return chatParam;
    }
    if (!chatParam && !scenarioParam) {
      if (threads.some((t) => t.id === NEW_CHAT_THREAD_ID)) {
        return NEW_CHAT_THREAD_ID;
      }
      return sorted[0]?.id ?? null;
    }
    return null;
  }, [chatParam, scenarioParam, threads, sorted]);

  return (
    <div className="flex min-h-0 flex-1 flex-col border-t border-border">
      <div className="shrink-0 space-y-2 p-2.5 pt-3">
        <p className="px-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          История в этом разделе
        </p>
        <Button
          variant="outline"
          size="sm"
          className="h-9 w-full justify-center gap-1.5 rounded-xl border-border text-xs font-medium"
          asChild
        >
          <Link href={`/chat?chat=${NEW_CHAT_THREAD_ID}`}>
            <Plus className="size-3.5" aria-hidden />
            Новый чат
          </Link>
        </Button>
      </div>
      <ScrollArea className="min-h-0 flex-1 px-1.5">
        <div className="flex flex-col gap-1 p-1.5 pb-4">
          {visible.map((t) => {
            const active = resolvedActiveId !== null && t.id === resolvedActiveId;
            return (
              <Link
                key={t.id}
                href={`/chat?chat=${t.id}`}
                className={cn(
                  "rounded-xl border border-transparent px-2.5 py-2 text-left transition-colors",
                  active
                    ? "border-border bg-muted/60 font-medium text-foreground shadow-sm"
                    : "text-muted-foreground hover:border-border hover:bg-card hover:text-foreground",
                )}
              >
                <div className="line-clamp-2 text-[12px] leading-snug">
                  {t.title}
                </div>
                <div className="mt-0.5 text-[10px] tabular-nums text-muted-foreground opacity-80">
                  {formatUpdated(t.updatedAt)}
                </div>
              </Link>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
