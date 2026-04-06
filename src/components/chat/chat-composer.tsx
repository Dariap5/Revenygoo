"use client";

import { useRef, useState, type ChangeEvent, type ClipboardEvent } from "react";
import {
  Camera,
  ChevronDown,
  ChevronRight,
  Feather,
  FileText,
  Globe,
  ImageIcon,
  Layers,
  LayoutGrid,
  Mic,
  Plus,
  ScrollText,
  Search,
  SendHorizontal,
  SlidersHorizontal,
  Paperclip,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import {
  GEMINI_TOOL_STRIP,
  composerPlaceholder,
  getUnifiedModelDef,
  gptReasoningLabel,
  isGptThinkingModel,
  type ModelFamily,
  UNIFIED_CHAT_MODELS,
} from "@/lib/chat/unified-chat-models";
import type {
  ChatAttachmentPreview,
  GptReasoningMode,
  UnifiedChatModelId,
} from "@/types";
import { cn } from "@/lib/utils";

export type ChatComposerVariant = "empty" | "dock";

const LARGE_PASTE_MIN_LEN = 1800;

/** Максимальная высота панели ввода (рамка + вложения + текст + панель действий). */
const COMPOSER_PANEL_MAX_PX = 212;

function menuSide(variant: ChatComposerVariant): "top" | "bottom" {
  return variant === "dock" ? "top" : "bottom";
}

function ClaudePlusMenu({
  variant,
  onPickFiles,
  onOpenContext,
}: {
  variant: ChatComposerVariant;
  onPickFiles: () => void;
  onOpenContext?: () => void;
}) {
  const [webSearchOn, setWebSearchOn] = useState(true);
  const side = menuSide(variant);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 rounded-lg text-muted-foreground"
          title="Добавить"
        >
          <Plus className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={side}
        align="start"
        sideOffset={8}
        className="w-64 rounded-2xl p-1.5 shadow-lg"
      >
        <DropdownMenuItem
          className="gap-2 rounded-xl"
          onClick={() => onPickFiles()}
        >
          <Paperclip className="size-4 shrink-0 opacity-80" />
          Прикрепить файл или фото
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 rounded-xl" disabled>
          <Camera className="size-4 shrink-0 opacity-80" />
          Сделать скриншот
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="gap-2 rounded-xl">
            <Layers className="size-4 shrink-0 opacity-80" />
            Добавить в проект
            <ChevronRight className="ml-auto size-4 opacity-50" />
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-52 rounded-xl p-1">
            <DropdownMenuItem disabled className="rounded-lg text-xs">
              Проект 1 (демо)
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="rounded-lg text-xs">
              Новый проект…
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator className="my-1" />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="gap-2 rounded-xl">
            <ScrollText className="size-4 shrink-0 opacity-80" />
            Скиллы
            <ChevronRight className="ml-auto size-4 opacity-50" />
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-52 rounded-xl p-1">
            <DropdownMenuItem disabled className="rounded-lg text-xs">
              Обзор скиллов
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem className="gap-2 rounded-xl" disabled>
          <LayoutGrid className="size-4 shrink-0 opacity-80" />
          Добавить коннектор
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1" />

        <DropdownMenuItem className="gap-2 rounded-xl" disabled>
          <Search className="size-4 shrink-0 opacity-80" />
          Исследование
        </DropdownMenuItem>
        <DropdownMenuCheckboxItem
          className="rounded-xl"
          checked={webSearchOn}
          onCheckedChange={setWebSearchOn}
          onSelect={(e) => e.preventDefault()}
        >
          <Globe
            className={cn(
              "size-4 shrink-0",
              webSearchOn ? "text-primary" : "opacity-80",
            )}
          />
          <span className={cn(webSearchOn && "text-primary")}>Web поиск</span>
        </DropdownMenuCheckboxItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="gap-2 rounded-xl">
            <Feather className="size-4 shrink-0 opacity-80" />
            Стиль
            <ChevronRight className="ml-auto size-4 opacity-50" />
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48 rounded-xl p-1">
            <DropdownMenuItem disabled className="rounded-lg text-xs">
              Деловой
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="rounded-lg text-xs">
              Кратко
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {onOpenContext ? (
          <>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem
              className="gap-2 rounded-xl"
              onClick={() => onOpenContext()}
            >
              <FileText className="size-4 shrink-0 opacity-80" />
              Добавить источники
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

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

  const modelDef = getUnifiedModelDef(unifiedModelId);
  const family: ModelFamily = modelDef.family;
  const placeholder = composerPlaceholder(family);
  const side = menuSide(variant);

  const canSend =
    (value.trim().length > 0 || bulkDraft.trim().length > 0) &&
    !(disabledSend ?? false);

  const onFiles = (e: ChangeEvent<HTMLInputElement>) => {
    onAddAttachments(e.target.files);
    e.target.value = "";
  };

  const autoResize = () => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 40)}px`;
  };

  const onPaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const t = e.clipboardData.getData("text/plain");
    if (t.length >= LARGE_PASTE_MIN_LEN) {
      e.preventDefault();
      onChange("");
      onLargeTextPaste(t);
    }
  };

  const plusOpenai = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 rounded-lg text-muted-foreground"
          title="Добавить"
        >
          <Plus className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={side}
        align="start"
        sideOffset={8}
        className="w-60 rounded-2xl p-1.5 shadow-lg"
      >
        <DropdownMenuLabel className="px-2 text-[11px] font-normal text-muted-foreground">
          ChatGPT
        </DropdownMenuLabel>
        <DropdownMenuItem
          className="gap-2 rounded-xl"
          onClick={() => fileRef.current?.click()}
        >
          <Paperclip className="size-4 opacity-80" />
          Документы
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 rounded-xl" disabled>
          <ImageIcon className="size-4 opacity-80" />
          Создать изображение
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 rounded-xl" disabled>
          <Search className="size-4 opacity-80" />
          Глубокое исследование
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 rounded-xl" disabled>
          <Globe className="size-4 opacity-80" />
          Поиск в сети
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="gap-2 rounded-xl">
            Ещё
            <ChevronRight className="ml-auto size-4 opacity-50" />
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-52 rounded-xl p-1">
            <DropdownMenuItem disabled>GitHub</DropdownMenuItem>
            <DropdownMenuItem disabled>Учёба и обучение</DropdownMenuItem>
            <DropdownMenuItem disabled>Режим агента</DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                onOpenContextPicker?.();
              }}
            >
              Добавить источники
            </DropdownMenuItem>
            <DropdownMenuItem disabled>Холст</DropdownMenuItem>
            <DropdownMenuItem disabled>Викторины</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const plusGoogle = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 rounded-lg text-muted-foreground"
          title="Добавить"
        >
          <Plus className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={side}
        align="start"
        sideOffset={8}
        className="w-60 rounded-2xl p-1.5 shadow-lg"
      >
        <DropdownMenuLabel className="px-2 text-[11px] font-normal text-muted-foreground">
          Gemini
        </DropdownMenuLabel>
        <DropdownMenuItem
          className="gap-2 rounded-xl"
          onClick={() => fileRef.current?.click()}
        >
          <Paperclip className="size-4 opacity-80" />
          Загрузить файлы
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 rounded-xl" disabled>
          <FileText className="size-4 opacity-80" />
          Добавить с Google Диска
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 rounded-xl" disabled>
          <Camera className="size-4 opacity-80" />
          Фото
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 rounded-xl" disabled>
          <ScrollText className="size-4 opacity-80" />
          Импортировать код
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 rounded-xl" disabled>
          <Layers className="size-4 opacity-80" />
          NotebookLM
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const geminiToolsMenu =
    family === "google" ? (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-7 shrink-0 gap-1 rounded-full px-2.5 text-[11px] font-medium"
          >
            <SlidersHorizontal className="size-3 opacity-80" />
            Инструменты
            <ChevronDown className="size-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side={side}
          align="start"
          sideOffset={8}
          className="w-64 rounded-2xl p-1.5 shadow-lg"
        >
          <DropdownMenuLabel className="px-2 text-[11px] font-normal text-muted-foreground">
            Инструменты
          </DropdownMenuLabel>
          {GEMINI_TOOL_STRIP.map((t) => (
            <DropdownMenuCheckboxItem
              key={t.id}
              className="rounded-xl pl-8"
              checked={geminiActiveTools.has(t.id)}
              onCheckedChange={(checked) => {
                const on = geminiActiveTools.has(t.id);
                if (checked !== on) onToggleGeminiTool(t.id);
              }}
              onSelect={(e) => e.preventDefault()}
            >
              {t.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    ) : null;

  const plusControl =
    family === "openai"
      ? plusOpenai
      : family === "google"
        ? plusGoogle
        : (
            <ClaudePlusMenu
              variant={variant}
              onPickFiles={() => fileRef.current?.click()}
              onOpenContext={onOpenContextPicker}
            />
          );

  const modelMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 max-w-[min(100%,220px)] shrink gap-1 rounded-full border-border px-2 text-[11px] font-medium"
        >
          <span className="truncate">{modelDef.label}</span>
          <ChevronDown className="size-3 shrink-0 opacity-50" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={side}
        align="end"
        sideOffset={8}
        className="max-h-72 w-64 overflow-y-auto rounded-2xl p-1.5 shadow-lg"
      >
        <DropdownMenuLabel className="text-[11px] font-normal text-muted-foreground">
          Модель
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {UNIFIED_CHAT_MODELS.map((m) => (
          <DropdownMenuItem
            key={m.id}
            className="rounded-lg text-sm"
            onClick={() => onUnifiedModelChange(m.id)}
          >
            {m.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const reasoningMenu =
    isGptThinkingModel(unifiedModelId) ? (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-7 max-w-[min(100%,200px)] shrink gap-1 rounded-full px-2 text-[11px] font-medium"
          >
            <span className="truncate">{gptReasoningLabel(gptReasoningMode)}</span>
            <ChevronDown className="size-3 shrink-0 opacity-50" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side={side}
          align="end"
          sideOffset={8}
          className="w-56 rounded-2xl p-1.5 shadow-lg"
        >
          <DropdownMenuLabel className="text-[11px] font-normal text-muted-foreground">
            Рассуждение
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="rounded-lg"
            onClick={() => onGptReasoningModeChange("standard")}
          >
            Стандартное рассуждение
          </DropdownMenuItem>
          <DropdownMenuItem
            className="rounded-lg"
            onClick={() => onGptReasoningModeChange("extended")}
          >
            Расширенное рассуждение
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ) : null;

  const bulkBlock =
    bulkDraft.trim().length > 0 ? (
      <div className="rounded-xl border border-border bg-muted/30 px-3 py-2">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium text-muted-foreground">
            Вставленный текст
          </span>
          <button
            type="button"
            className="text-[11px] text-muted-foreground hover:text-foreground"
            onClick={onClearBulkDraft}
          >
            Убрать
          </button>
        </div>
        <p className="max-h-24 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-foreground">
          {bulkDraft.length > 1200
            ? `${bulkDraft.slice(0, 1200)}…`
            : bulkDraft}
        </p>
      </div>
    ) : null;

  const attachmentRow =
    attachments.length > 0 ? (
      <div className="flex flex-wrap gap-2">
        {attachments.map((a) => (
          <div
            key={a.id}
            className="flex max-w-[min(100%,280px)] items-center gap-2 rounded-xl border border-border bg-muted/30 px-2 py-1.5 pr-1"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
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
    <div className="space-y-3">
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        multiple
        onChange={onFiles}
      />

      <div
        className="flex min-h-0 flex-col overflow-hidden rounded-[var(--radius-md)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-1.5 transition-colors focus-within:border-[hsl(var(--border-strong))]"
        style={{ maxHeight: COMPOSER_PANEL_MAX_PX }}
      >
        <div className="shrink-0 space-y-2">
          {attachmentRow}
          {bulkBlock}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
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
            className="min-h-[40px] w-full resize-none border-0 bg-transparent px-2 py-1.5 text-sm leading-snug text-[hsl(var(--foreground))] shadow-none outline-none focus-visible:ring-0"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (canSend) onSend();
              }
            }}
          />
        </div>
        <div className="flex min-h-[36px] shrink-0 items-center gap-0.5 py-0.5">
          {plusControl}
          {family === "google" ? (
            <>
              {geminiToolsMenu}
              <div className="min-w-0 flex-1" />
            </>
          ) : (
            <div className="min-w-0 flex-1" />
          )}
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-0.5 sm:ml-auto">
            {reasoningMenu}
            {modelMenu}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 rounded-full text-muted-foreground"
              title="Голос (демо)"
              disabled
            >
              <Mic className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant={canSend ? "default" : "outline"}
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
