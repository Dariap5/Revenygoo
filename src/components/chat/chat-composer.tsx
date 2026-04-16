"use client";

import { useEffect, useRef, useState, type ChangeEvent, type ClipboardEvent } from "react";
import { FileText, Paperclip, SendHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { composerPlaceholder, getUnifiedModelDef, type ModelFamily } from "@/lib/chat/unified-chat-models";
import {
  dlpPreviewTypeLabel,
  scanDlpPreview,
  type DlpPreviewType,
} from "@/lib/chat/dlp-preview";
import type {
  ChatAttachmentPreview,
  GptReasoningMode,
  UnifiedChatModelId,
} from "@/types";
import { cn } from "@/lib/utils";

export type ChatComposerVariant = "empty" | "dock";

const LARGE_PASTE_MIN_LEN = 1800;
const DLP_SCAN_DEBOUNCE_MS = 500;

export function ChatComposer({
  variant,
  value,
  onChange,
  onSend,
  disabledSend,
  unifiedModelId,
  onUnifiedModelChange,
  gptReasoningMode,
  onGptReasoningModeChange,
  bulkDraft,
  onClearBulkDraft,
  attachments,
  onRemoveAttachment,
  onAddAttachments,
  onLargeTextPaste,
  onOpenContextPicker,
  geminiActiveTools,
  onToggleGeminiTool,
  className,
}: {
  variant: ChatComposerVariant;
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabledSend?: boolean;
  unifiedModelId: UnifiedChatModelId;
  onUnifiedModelChange: (id: UnifiedChatModelId) => void;
  gptReasoningMode: GptReasoningMode;
  onGptReasoningModeChange: (m: GptReasoningMode) => void;
  bulkDraft: string;
  onClearBulkDraft: () => void;
  attachments: ChatAttachmentPreview[];
  onRemoveAttachment: (id: string) => void;
  onAddAttachments: (files: FileList | null) => void;
  onLargeTextPaste: (text: string) => void;
  onOpenContextPicker?: () => void;
  geminiActiveTools: Set<string>;
  onToggleGeminiTool: (id: string) => void;
  className?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  // Keep API-compatible props while composer visuals are simplified.
  void onUnifiedModelChange;
  void gptReasoningMode;
  void onGptReasoningModeChange;
  void onOpenContextPicker;
  void geminiActiveTools;
  void onToggleGeminiTool;

  const modelDef = getUnifiedModelDef(unifiedModelId);
  const family: ModelFamily = modelDef.family;
  const placeholder = composerPlaceholder(family);

  const canSend = value.trim().length > 0 && !(disabledSend ?? false);
  const [previewTypes, setPreviewTypes] = useState<DlpPreviewType[]>([]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      const text = value.trim();
      if (!text) {
        setPreviewTypes([]);
        return;
      }
      const preview = scanDlpPreview(text);
      setPreviewTypes(preview.findings.map((f) => f.type));
    }, DLP_SCAN_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [value]);

  const onFiles = (e: ChangeEvent<HTMLInputElement>) => {
    onAddAttachments(e.target.files);
    e.target.value = "";
  };

  const autoResize = () => {
    const el = taRef.current;
    if (!el) return;
    const minHeight = 24;
    const lineHeight = 22;
    const maxHeight = lineHeight * 8;
    el.style.height = "auto";
    el.style.height = `${Math.max(minHeight, Math.min(el.scrollHeight, maxHeight))}px`;
  };

  const onPaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const t = e.clipboardData.getData("text/plain");
    if (t.length >= LARGE_PASTE_MIN_LEN) {
      e.preventDefault();
      onChange("");
      onLargeTextPaste(t);
    }
  };

  const bulkBlock = bulkDraft.trim().length > 0 ? (
    <div className="rounded-xl border border-border/80 bg-muted/20 px-3 py-2">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-muted-foreground">Вставленный текст</span>
        <button
          type="button"
          className="text-[11px] text-muted-foreground hover:text-foreground"
          onClick={onClearBulkDraft}
        >
          Убрать
        </button>
      </div>
      <p className="max-h-24 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-foreground">
        {bulkDraft.length > 1200 ? `${bulkDraft.slice(0, 1200)}…` : bulkDraft}
      </p>
    </div>
  ) : null;

  const attachmentRow =
    attachments.length > 0 ? (
      <div className="flex flex-wrap gap-2">
        {attachments.map((a) => (
          <div
            key={a.id}
            className="flex max-w-[min(100%,280px)] items-center gap-2 rounded-xl border border-border/80 bg-muted/20 px-2 py-1.5 pr-1"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground">
              <FileText className="size-4" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium leading-tight">{a.name}</p>
              <p className="text-[10px] text-muted-foreground">Файл</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 rounded-full text-muted-foreground"
              title="Убрать"
              onClick={() => onRemoveAttachment(a.id)}
            >
              <span className="text-lg leading-none">×</span>
            </Button>
          </div>
        ))}
      </div>
    ) : null;

  const panel = (
    <div className="space-y-2">
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        multiple
        onChange={onFiles}
      />

      <div
        className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-2 transition-colors focus-within:border-[hsl(var(--border-strong))]"
      >
        <div className="shrink-0 space-y-1.5">
          {attachmentRow}
          {bulkBlock}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-1">
          <Textarea
            ref={taRef}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              requestAnimationFrame(autoResize);
            }}
            onPaste={onPaste}
            placeholder={placeholder}
            rows={1}
            className="min-h-[24px] w-full resize-none border-0 bg-transparent px-1 py-1 text-sm leading-[22px] text-[hsl(var(--foreground))] shadow-none outline-none focus-visible:ring-0"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (canSend) onSend();
              }
            }}
          />
        </div>
        <div className="flex min-h-[36px] shrink-0 items-center gap-2 px-1 py-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 rounded-full text-muted-foreground"
            onClick={() => fileRef.current?.click()}
            title="Прикрепить"
          >
            <Paperclip className="size-4" />
          </Button>
          <div className="min-w-0 flex-1 text-center text-[11px] text-muted-foreground">
            {previewTypes.length === 0
              ? "🛡 Защита активна"
              : `Обнаружено: ${previewTypes.map((t) => dlpPreviewTypeLabel(t)).join(", ")}`}
          </div>
          <div className="shrink-0">
            <Button
              type="button"
              variant={canSend ? "default" : "secondary"}
              size="icon"
              className="size-9 shrink-0"
              onClick={onSend}
              disabled={!canSend}
              title="Отправить"
            >
              <SendHorizontal className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  if (variant === "empty") {
    /* Ширину задаёт родитель (колонка в ChatWorkspace / ChatEmptyState). */
    return <div className={cn("w-full min-w-0", className)}>{panel}</div>;
  }

  return (
    <div className={cn("w-full min-w-0 bg-background py-3", className)}>
      {panel}
    </div>
  );
}
