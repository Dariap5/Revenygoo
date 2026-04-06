"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Building2, ChevronUp, Code2, LogOut, Settings, User } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  displayNameFromLogin,
  getUserInitials,
  logoutWorkspaceSession,
  readWorkspaceSession,
  type WorkspaceSessionV1,
} from "@/lib/session/workspace-session";
import { cn } from "@/lib/utils";

export function WorkspaceUserFooter({ collapsed }: { collapsed?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<WorkspaceSessionV1 | null>(null);

  useEffect(() => {
    const sync = () => setSession(readWorkspaceSession());
    sync();
    window.addEventListener("focus", sync);
    return () => window.removeEventListener("focus", sync);
  }, [pathname]);

  if (!session?.authenticated || !session.profile) {
    return null;
  }

  const name = displayNameFromLogin(session.login);
  const initials = getUserInitials(name);
  const subline =
    session.profile.jobTitle.trim() ||
    session.profile.department.trim() ||
    "Сотрудник";

  const logout = () => {
    logoutWorkspaceSession();
    router.push("/login");
  };

  const menu = (
    <DropdownMenuContent
      className="min-w-[220px]"
      side="top"
      align="start"
      sideOffset={6}
    >
      <DropdownMenuItem asChild>
        <Link href="/profile" className="flex items-center gap-2">
          <User className="size-4 opacity-70" />
          Профиль
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link
          href="/profile#profile-settings"
          className="flex items-center gap-2"
        >
          <Settings className="size-4 opacity-70" />
          Настройки
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link href="/admin" className="flex items-center gap-2">
          <Code2 className="size-4 opacity-70" />
          Разработчики
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem disabled className="text-xs text-muted-foreground">
        <Building2 className="size-4 opacity-50" />
        Компания: Revenygo (демо)
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        destructive
        className="cursor-pointer"
        onSelect={(e) => {
          e.preventDefault();
          logout();
        }}
      >
        <LogOut className="size-4 opacity-70" />
        Выйти
      </DropdownMenuItem>
    </DropdownMenuContent>
  );

  if (collapsed) {
    return (
      <div className="flex shrink-0 justify-center border-t border-border p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex size-9 items-center justify-center rounded-full bg-[hsl(var(--background-tertiary))] text-xs font-semibold text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--border))] outline-none"
              title={name}
            >
              {initials}
            </button>
          </DropdownMenuTrigger>
          {menu}
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div className="shrink-0 border-t border-border p-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex w-full items-center gap-2.5 rounded-[var(--radius)] px-2 py-2 text-left transition-colors duration-150",
              "hover:bg-[hsl(var(--background-tertiary))] outline-none",
            )}
          >
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--background-tertiary))] text-xs font-semibold text-[hsl(var(--muted-foreground))]"
              aria-hidden
            >
              {initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-foreground">
                {name}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {subline}
              </span>
            </span>
            <ChevronUp className="size-4 shrink-0 text-muted-foreground opacity-60" />
          </button>
        </DropdownMenuTrigger>
        {menu}
      </DropdownMenu>
    </div>
  );
}
