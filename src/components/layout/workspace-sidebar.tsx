"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Building2,
  ChevronDown,
  ClipboardList,
  LayoutGrid,
  MessageSquare,
  PanelLeft,
  PanelLeftClose,
  Shield,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  readSidebarCollapsed,
  writeSidebarCollapsed,
} from "@/lib/ui/workspace-sidebar-storage";

import { WorkspaceChatHistory } from "./workspace-chat-history";
import { WorkspaceUserFooter } from "./workspace-user-footer";

const mainNav = [
  {
    href: "/chat",
    label: "Чат",
    icon: MessageSquare,
    match: (p: string) => p.startsWith("/chat"),
  },
  {
    href: "/scenarios",
    label: "Сценарии",
    icon: LayoutGrid,
    match: (p: string) => p.startsWith("/scenarios"),
  },
  {
    href: "/knowledge",
    label: "База знаний",
    icon: BookOpen,
    match: (p: string) => p.startsWith("/knowledge"),
  },
  {
    href: "/audit",
    label: "Аудит",
    icon: ClipboardList,
    match: (p: string) => p.startsWith("/audit"),
  },
  {
    href: "/policies",
    label: "Политики",
    icon: Shield,
    match: (p: string) => p.startsWith("/policies"),
  },
  {
    href: "/organization",
    label: "Организация",
    icon: Building2,
    match: (p: string) => p.startsWith("/organization"),
  },
] as const;

function navActive(pathname: string, match: (p: string) => boolean): boolean {
  return match(pathname);
}

export function WorkspaceSidebar({
  collapsed,
  onCollapsedChange,
}: {
  collapsed: boolean;
  onCollapsedChange: (v: boolean) => void;
}) {
  const pathname = usePathname();

  useEffect(() => {
    writeSidebarCollapsed(collapsed);
  }, [collapsed]);

  const toggle = () => onCollapsedChange(!collapsed);

  const navItemBase =
    "flex items-center gap-2.5 px-2 py-1.5 rounded-[var(--radius)] text-sm cursor-pointer transition-colors duration-150 select-none";
  const navInactive =
    "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--background-tertiary))] hover:text-[hsl(var(--foreground))]";
  const navActiveCls =
    "text-[hsl(var(--foreground))] bg-[hsl(var(--background-tertiary))] font-medium";

  return (
    <aside
      className={cn(
        "flex h-screen shrink-0 flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--background-secondary))] px-3 py-3 transition-[width] duration-200 ease-smooth",
        collapsed ? "w-[64px]" : "w-[240px]",
      )}
    >
      <div
        className={cn(
          "mb-1 flex items-center",
          collapsed ? "flex-col gap-1 px-0" : "justify-between gap-1 px-2 py-2",
        )}
      >
        {!collapsed ? (
          <Link href="/scenarios" className="flex min-w-0 flex-1 items-center gap-1">
            <span className="font-black text-base tracking-tighter text-[hsl(var(--foreground))]">
              II
            </span>
            <span className="truncate text-base font-semibold tracking-tight text-[hsl(var(--foreground))]">
              Revenygo
            </span>
          </Link>
        ) : (
          <Link
            href="/scenarios"
            className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius)] text-[10px] font-black leading-none text-[hsl(var(--foreground))]"
            title="Revenygo"
          >
            II
          </Link>
        )}
        <button
          type="button"
          onClick={toggle}
          className="flex size-8 shrink-0 items-center justify-center rounded-[var(--radius)] text-[hsl(var(--muted-foreground))] transition-colors duration-150 outline-none hover:bg-[hsl(var(--background-tertiary))] hover:text-[hsl(var(--foreground))]"
          title={collapsed ? "Развернуть меню" : "Свернуть меню"}
          aria-expanded={!collapsed}
        >
          {collapsed ? (
            <PanelLeft className="size-[15px]" />
          ) : (
            <PanelLeftClose className="size-[15px]" />
          )}
        </button>
      </div>

      {!collapsed ? (
        <button
          type="button"
          className="mb-3 flex w-full cursor-pointer items-center gap-2 rounded-[var(--radius)] px-2 py-1.5 text-left transition-colors duration-150 outline-none hover:bg-[hsl(var(--background-tertiary))]"
        >
          <span
            className="size-3 shrink-0 rounded-full bg-accent ring-2 ring-accent/35"
            aria-hidden
          />
          <span className="min-w-0 flex-1 truncate text-sm text-[hsl(var(--foreground))]">
            Workspace Name
          </span>
          <ChevronDown className="size-[15px] shrink-0 text-[hsl(var(--muted-foreground))]" />
        </button>
      ) : (
        <div className="mb-2 flex justify-center">
          <span
            className="size-3 rounded-full bg-accent ring-2 ring-accent/35"
            title="Workspace"
            aria-hidden
          />
        </div>
      )}

      <nav className="flex flex-col gap-0.5">
        {mainNav.map(({ href, label, icon: Icon, match }) => {
          const active = navActive(pathname, match);
          return (
            <Link
              key={`${href}-${label}`}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                navItemBase,
                collapsed && "justify-center px-0",
                active ? navActiveCls : navInactive,
              )}
            >
              <Icon className="size-[15px] shrink-0" strokeWidth={2} aria-hidden />
              {!collapsed ? <span className="truncate">{label}</span> : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-3 flex min-h-0 flex-1 flex-col border-t border-[hsl(var(--border))] pt-2">
        {!collapsed ? (
          <p className="shrink-0 px-2 pb-2 text-[11px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            История чатов
          </p>
        ) : null}
        <Suspense
          fallback={
            <div className="min-h-[48px] shrink-0 p-2 text-[10px] text-[hsl(var(--muted-foreground))]">
              …
            </div>
          }
        >
          <WorkspaceChatHistory collapsed={collapsed} />
        </Suspense>
      </div>

      <div className="mt-auto shrink-0 space-y-2 border-t border-[hsl(var(--border))] pt-2">
        {!collapsed ? (
          <Link
            href="/pricing"
            className="rg-shimmer-btn mx-1 flex w-[calc(100%-0.5rem)] items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all"
          >
            <Sparkles className="size-[15px] shrink-0" aria-hidden />
            Тарифный план
          </Link>
        ) : (
          <div className="flex justify-center">
            <Link
              href="/pricing"
              title="Тарифный план"
              className="rg-shimmer-btn flex size-9 items-center justify-center rounded-lg"
            >
              <Sparkles className="size-[15px]" aria-hidden />
            </Link>
          </div>
        )}
      </div>

      <WorkspaceUserFooter collapsed={collapsed} />
    </aside>
  );
}

export function useWorkspaceSidebarCollapsedInit(): [boolean, (v: boolean) => void] {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    setCollapsed(readSidebarCollapsed());
  }, []);
  return [collapsed, setCollapsed];
}
