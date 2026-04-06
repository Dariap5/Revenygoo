"use client";

import { cn } from "@/lib/utils";

export function ChatEmptyState({
  brandLabel,
  greeting,
  subtitle,
  hint,
  minimal,
  children,
  className,
}: {
  brandLabel: string;
  greeting: string;
  subtitle?: string;
  hint?: string;
  minimal?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const showMeta = !minimal && (subtitle || hint);

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-y-auto py-6",
        className,
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col justify-center">
        <div className="w-full min-w-0">
          <div className="flex flex-col items-center text-center">
            <p className="text-[11px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              {brandLabel}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[hsl(var(--foreground))]">
              {greeting}
            </h2>
            {showMeta ? (
              <>
                {subtitle ? (
                  <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                    {subtitle}
                  </p>
                ) : null}
                {hint ? (
                  <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{hint}</p>
                ) : null}
              </>
            ) : null}
          </div>
          <div className="mt-6 w-full sm:mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
