"use client";

import type { ReactNode } from "react";
import { Suspense, useEffect } from "react";
import { usePathname } from "next/navigation";
import { HelpCircle, MessageSquare, Share2 } from "lucide-react";

import { ChatBackendBanner } from "@/components/chat/chat-backend-banner";
import { syncChatThreadsFromBackend } from "@/lib/history/chat-threads-storage";
import { cn } from "@/lib/utils";

import { WorkspaceChatHeaderTitle } from "./workspace-chat-header-title";
import { WorkspaceSidebar, useWorkspaceSidebarCollapsedInit } from "./workspace-sidebar";
import { WorkspaceUsageIndicator } from "./workspace-usage-indicator";

function workspacePageTitle(pathname: string): string {
  if (pathname.startsWith("/chat")) return "Чат";
  if (pathname.startsWith("/scenarios")) return "Сценарии";
  if (pathname.startsWith("/knowledge")) return "База знаний";
  if (pathname.startsWith("/pricing")) return "Тарифы";
  if (pathname.startsWith("/policies")) return "Политики";
  if (pathname.startsWith("/organization")) return "Организация";
  if (pathname.startsWith("/audit")) return "Аудит";
  if (pathname.startsWith("/admin")) return "Администрирование";
  if (pathname.startsWith("/profile")) return "Профиль";
  return "Страница";
}

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isChat = pathname.startsWith("/chat");
  const [sidebarCollapsed, setSidebarCollapsed] = useWorkspaceSidebarCollapsedInit();
  const title = workspacePageTitle(pathname);

  useEffect(() => {
    const accent = localStorage.getItem("accent_theme") ?? "violet";
    document.documentElement.setAttribute("data-accent", accent);
    const dark = localStorage.getItem("theme_dark") === "true";
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  useEffect(() => {
    void syncChatThreadsFromBackend();
  }, []);

  const subtleBtn =
    "text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors px-3 py-1.5 rounded-[var(--radius)] hover:bg-[hsl(var(--background-tertiary))] outline-none";

  return (
    <div className="flex h-screen min-h-0 w-full overflow-hidden bg-[hsl(var(--background))]">
      <WorkspaceSidebar
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex h-[52px] shrink-0 items-center gap-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4">
          {isChat ? (
            <Suspense
              fallback={
                <nav
                  className="flex min-w-0 flex-1 items-center text-sm"
                  aria-label="Навигация"
                >
                  <span className="font-medium text-[hsl(var(--foreground))]">
                    Чат
                  </span>
                </nav>
              }
            >
              <WorkspaceChatHeaderTitle />
            </Suspense>
          ) : (
            <nav
              className="flex min-w-0 flex-1 items-center gap-2 text-sm"
              aria-label="Навигация"
            >
              <span className="truncate font-medium text-[hsl(var(--foreground))]">
                {title}
              </span>
            </nav>
          )}
          <WorkspaceUsageIndicator />
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" className={subtleBtn}>
              Feedback
            </button>
            <button type="button" className={subtleBtn}>
              Docs
            </button>
            <button
              type="button"
              className={cn(subtleBtn, "flex items-center gap-1.5")}
            >
              <MessageSquare className="size-4 shrink-0" />
              Ask
            </button>
            <button
              type="button"
              className={cn(subtleBtn, "flex items-center gap-1.5")}
            >
              <Share2 className="size-4 shrink-0" />
              Share
            </button>
            <button type="button" className={cn(subtleBtn, "px-2")} title="Справка">
              <HelpCircle className="size-4" />
            </button>
          </div>
        </header>
        <ChatBackendBanner />
        <main
          className={cn(
            "min-h-0 flex-1",
            isChat ? "flex flex-col overflow-hidden" : "overflow-y-auto",
          )}
        >
          <div
            className={cn(
              "page-enter mx-auto w-full min-h-0",
              isChat
                ? cn(
                    "flex h-full min-h-0 flex-1 flex-col pb-4 pt-0 sm:pb-5",
                    sidebarCollapsed
                      ? "px-4 sm:px-10 md:px-16 lg:px-24 xl:px-32"
                      : "px-3 sm:px-5",
                  )
                : "max-w-[1200px] p-6 lg:px-10",
            )}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
