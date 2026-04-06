"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { resolveActiveChatKey } from "@/lib/chat/resolve-active-chat-key";
import {
  CHAT_THREADS_CHANGED_EVENT,
  mutateChatThreads,
  readChatThreads,
} from "@/lib/history/chat-threads-storage";
import { NEW_CHAT_THREAD_ID } from "@/lib/mock/chats";
import { getScenarioById } from "@/lib/mock/scenarios";
import type { ChatThread } from "@/types";

export function WorkspaceChatHeaderTitle() {
  const searchParams = useSearchParams();
  const chatParam = searchParams.get("chat");
  const scenarioParam = searchParams.get("scenario");
  const [threads, setThreads] = useState<ChatThread[]>(() => readChatThreads());

  useEffect(() => {
    setThreads(readChatThreads());
    const h = () => setThreads(readChatThreads());
    window.addEventListener(CHAT_THREADS_CHANGED_EVENT, h);
    return () => window.removeEventListener(CHAT_THREADS_CHANGED_EVENT, h);
  }, []);

  const activeKey = useMemo(
    () => resolveActiveChatKey(chatParam, scenarioParam, threads),
    [chatParam, scenarioParam, threads],
  );

  const chatTitle = useMemo(() => {
    if (activeKey.startsWith("virtual:")) {
      const sid = activeKey.slice("virtual:".length);
      return getScenarioById(sid)?.title ?? "Чат";
    }
    const t = threads.find((c) => c.id === activeKey);
    return t?.title ?? "Чат";
  }, [activeKey, threads]);

  const canRename =
    activeKey !== NEW_CHAT_THREAD_ID && !activeKey.startsWith("virtual:");

  const onRename = () => {
    const t = threads.find((c) => c.id === activeKey);
    if (!t) return;
    const next = window.prompt("Название чата", t.title);
    if (next == null || !next.trim()) return;
    mutateChatThreads((prev) =>
      prev.map((x) => (x.id === activeKey ? { ...x, title: next.trim() } : x)),
    );
  };

  return (
    <nav
      className="flex min-w-0 flex-1 items-center gap-2 text-sm"
      aria-label="Навигация"
    >
      <span className="shrink-0 font-medium text-[hsl(var(--foreground))]">
        Чат:
      </span>
      <span className="min-w-0 truncate text-[hsl(var(--foreground))]">
        {chatTitle}
      </span>
      {canRename ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-muted-foreground"
          title="Переименовать"
          onClick={onRename}
        >
          <Pencil className="size-3.5" />
        </Button>
      ) : null}
    </nav>
  );
}
