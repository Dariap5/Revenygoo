"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  getKnowledgeSourcesByIds,
  mockKnowledgeSources,
} from "@/lib/mock/knowledge-sources";
import type { KnowledgeSource } from "@/types";

import { KnowledgeSourceIcon } from "@/components/knowledge/knowledge-source-icon";

export function ChatContextPickerDialog({
  open,
  onOpenChange,
  attachedIds,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attachedIds: string[];
  onApply: (ids: string[]) => void;
}) {
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (open) {
      setDraft(new Set(attachedIds));
      setQ("");
    }
  }, [open, attachedIds]);

  const connectedAtOpen = useMemo(
    () => getKnowledgeSourcesByIds(attachedIds),
    [attachedIds],
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return mockKnowledgeSources;
    return mockKnowledgeSources.filter(
      (x) =>
        x.title.toLowerCase().includes(s) ||
        x.type.toLowerCase().includes(s) ||
        x.description.toLowerCase().includes(s),
    );
  }, [q]);

  function toggle(id: string) {
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleApply() {
    onApply([...draft]);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,28rem)] w-[calc(100vw-1.5rem)] max-w-md flex-col gap-0 overflow-hidden p-0 sm:w-full">
        <div className="border-b border-border px-6 pb-4 pt-6">
          <DialogHeader className="space-y-1.5 text-left">
            <DialogTitle className="text-base">База знаний в этом чате</DialogTitle>
            <DialogDescription className="text-xs">
              Отметьте материалы компании, которые учитывать в ответах. Демо, без реальной индексации.
            </DialogDescription>
          </DialogHeader>
          <Input
            className="mt-4 h-9 text-sm"
            placeholder="Поиск…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Поиск источников"
          />
        </div>

        {connectedAtOpen.length > 0 ? (
          <div className="px-6 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Уже подключено
            </p>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {connectedAtOpen.map((s) => (
                <li key={s.id} className="truncate">
                  {s.title}
                </li>
              ))}
            </ul>
            <Separator className="mt-3" />
          </div>
        ) : null}

        <ScrollArea className="h-[min(40vh,220px)] px-6">
          <div className="space-y-0.5 py-2 pr-3">
            {filtered.map((s) => (
              <SourceRow
                key={s.id}
                source={s}
                checked={draft.has(s.id)}
                onToggle={() => toggle(s.id)}
              />
            ))}
          </div>
        </ScrollArea>

        <div className="flex shrink-0 gap-2 border-t border-border bg-muted/20 p-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Отмена
          </Button>
          <Button type="button" className="flex-1" onClick={handleApply}>
            Применить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SourceRow({
  source,
  checked,
  onToggle,
}: {
  source: KnowledgeSource;
  checked: boolean;
  onToggle: () => void;
}) {
  const id = `ctx-${source.id}`;
  return (
    <div className="flex items-start gap-3 rounded-md py-2 pr-1 hover:bg-muted/40">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={() => onToggle()}
        className="mt-0.5"
      />
      <Label
        htmlFor={id}
        className="flex min-w-0 flex-1 cursor-pointer flex-col gap-0.5 font-normal"
      >
        <span className="flex items-center gap-2 text-sm text-foreground">
          <KnowledgeSourceIcon type={source.type} className="size-3.5 opacity-70" />
          <span className="truncate">{source.title}</span>
        </span>
        <span className="text-[11px] text-muted-foreground">
          {source.type}
          {source.status === "processing" ? " · в обработке" : ""}
        </span>
      </Label>
    </div>
  );
}
