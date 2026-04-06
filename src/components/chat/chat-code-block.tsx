"use client";

import { useState } from "react";
import { Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ChatCodeBlock({
  code,
  lang,
  className,
}: {
  code: string;
  lang?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "my-2 overflow-hidden rounded-xl border border-gray-200 bg-muted/30",
        className,
      )}
    >
      <div className="relative max-h-72 overflow-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-gray-200/80 bg-muted/95 px-2 py-1.5 backdrop-blur-sm">
          <span className="truncate pl-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {lang || "код"}
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-7 shrink-0 gap-1 rounded-lg px-2 text-[11px]"
            onClick={() => void copy()}
          >
            <Copy className="size-3.5" />
            {copied ? "Скопировано" : "Копировать"}
          </Button>
        </div>
        <pre className="overflow-x-auto p-3 text-[13px] leading-relaxed">
          <code className="text-foreground">{code}</code>
        </pre>
      </div>
    </div>
  );
}
