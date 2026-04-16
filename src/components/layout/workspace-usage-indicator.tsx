"use client";

import { useEffect, useState } from "react";

type MeUsage = { used: number; limit: number | null; percent: number | null };

function formatTokens(n: number) {
  return n.toLocaleString("ru-RU", { maximumFractionDigits: 0 });
}

export function WorkspaceUsageIndicator() {
  const [usage, setUsage] = useState<MeUsage | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/me", { credentials: "same-origin" });
        if (!res.ok) return;
        const data = (await res.json()) as { usage?: MeUsage };
        if (!cancelled && data.usage) setUsage(data.usage);
      } catch {
        /* */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!usage) return null;

  const { used, limit, percent } = usage;
  const pctForUi = limit != null ? (percent ?? 0) : null;

  const textClass =
    limit != null && pctForUi != null
      ? pctForUi > 95
        ? "text-red-600 dark:text-red-400"
        : pctForUi > 80
          ? "text-amber-600 dark:text-amber-400"
          : "text-[hsl(var(--muted-foreground))]"
      : "text-[hsl(var(--muted-foreground))]";

  const fillClass =
    limit != null && pctForUi != null
      ? pctForUi > 95
        ? "bg-red-500"
        : pctForUi > 80
          ? "bg-amber-500"
          : "bg-[hsl(var(--muted-foreground))]/45"
      : "bg-[hsl(var(--border))]";

  const label =
    limit != null
      ? `${formatTokens(used)} / ${formatTokens(limit)} токенов`
      : `${formatTokens(used)} токенов`;

  return (
    <div
      className="flex min-w-0 shrink-0 flex-col items-end gap-0.5 pr-1 text-right"
      title={
        limit != null && pctForUi != null
          ? `Около ${pctForUi}% месячного лимита`
          : undefined
      }
    >
      <span className={`text-xs leading-none tabular-nums ${textClass}`}>
        {label}
      </span>
      {limit != null ? (
        <div className="h-px w-[120px] max-w-full overflow-hidden rounded-full bg-[hsl(var(--muted))]/35">
          <div
            className={`h-full rounded-full transition-[width] duration-300 ${fillClass}`}
            style={{ width: `${Math.min(100, pctForUi ?? 0)}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}
