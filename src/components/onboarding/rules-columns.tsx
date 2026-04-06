import { CheckCircle2, XCircle } from "lucide-react";

export function RulesColumns({
  allowed,
  forbidden,
}: {
  allowed: string[];
  forbidden: string[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600/90" aria-hidden />
          Что можно делать с AI
        </div>
        <ul className="space-y-1.5 text-[13px] leading-snug text-muted-foreground">
          {allowed.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-1.5 size-1 shrink-0 rounded-full bg-border" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          <XCircle className="size-4 shrink-0 text-red-600/80" aria-hidden />
          Что нельзя отправлять в AI
        </div>
        <ul className="space-y-1.5 text-[13px] leading-snug text-muted-foreground">
          {forbidden.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-1.5 size-1 shrink-0 rounded-full bg-border" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
