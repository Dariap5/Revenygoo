import { Quote } from "lucide-react";

export function SafePromptExamples({ examples }: { examples: string[] }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
        <Quote className="size-4 shrink-0 opacity-60" aria-hidden />
        3 примера безопасных запросов
      </div>
      <ul className="space-y-2">
        {examples.map((text) => (
          <li
            key={text}
            className="rounded-md border border-border/80 bg-background px-2.5 py-1.5 text-[13px] leading-snug text-muted-foreground"
          >
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
}
