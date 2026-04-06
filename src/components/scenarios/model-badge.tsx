import type { AIModelBadge } from "@/types";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ModelBadge({
  model,
  className,
}: {
  model: AIModelBadge;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-5 border border-[hsl(var(--border))] bg-transparent px-1.5 py-0 font-normal tabular-nums text-[10px] uppercase tracking-wide text-[hsl(var(--muted-foreground))]",
        className,
      )}
    >
      {model}
    </Badge>
  );
}
