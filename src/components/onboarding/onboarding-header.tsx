import Link from "next/link";

export function OnboardingHeader() {
  return (
    <header className="flex h-12 shrink-0 items-center border-b border-[hsl(var(--border))] px-5 sm:px-6">
      <Link href="/scenarios" className="flex items-center gap-1">
        <span className="font-black text-sm tracking-tighter text-[hsl(var(--foreground))]">
          II
        </span>
        <span className="text-sm font-semibold tracking-tight text-[hsl(var(--foreground))]">
          Revenygo
        </span>
      </Link>
      <span className="ml-2 text-xs text-[hsl(var(--muted-foreground))]">Workspace</span>
    </header>
  );
}
