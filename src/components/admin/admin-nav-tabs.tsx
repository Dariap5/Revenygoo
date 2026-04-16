"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const tabs = [
  { href: "/admin", label: "Обзор" },
  { href: "/admin/models", label: "Модели" },
] as const;

export function AdminNavTabs() {
  const pathname = usePathname();

  return (
    <nav
      className="mb-8 flex gap-8 border-b border-[hsl(var(--border))] text-sm"
      aria-label="Разделы администрирования"
    >
      {tabs.map((t) => {
        const active =
          t.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "-mb-px border-b-2 pb-3 transition-colors",
              active
                ? "border-[hsl(var(--foreground))] font-medium text-[hsl(var(--foreground))]"
                : "border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
