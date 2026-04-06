"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  FileText,
  Pencil,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ChatCodeBlock } from "@/components/chat/chat-code-block";
import { splitMarkdownCodeBlocks } from "@/lib/chat/message-segments";
import type { ChatMessage } from "@/types";
import { cn } from "@/lib/utils";

const COLLAPSE_LEN = 900;

function downloadTextFile(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ChatMessageBubble({
  message,
  onRegenerate,
  onEditUser,
}: {
  message: ChatMessage;
  onRegenerate?: () => void;
  onEditUser?: (text: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  const segments = useMemo(
    () =>
      message.role === "assistant"
        ? splitMarkdownCodeBlocks(message.content)
        : [{ type: "text" as const, text: message.content }],
    [message.content, message.role],
  );

  const long = message.content.length > COLLAPSE_LEN;
  const collapseText =
    long && !expanded && message.role === "assistant"
      ? (() => {
          let budget = COLLAPSE_LEN;
          const out: typeof segments = [];
          for (const seg of segments) {
            if (seg.type === "code") {
              out.push(seg);
              continue;
            }
            if (budget <= 0) break;
            if (seg.text.length <= budget) {
              out.push(seg);
              budget -= seg.text.length;
            } else {
              out.push({
                type: "text",
                text: `${seg.text.slice(0, budget)}…`,
              });
              budget = 0;
            }
          }
          return out;
        })()
      : segments;

  async function copyMsg() {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (isSystem) {
    return (
      <div className="flex w-full justify-center py-0.5">
        <p className="max-w-lg rounded-md border border-dashed border-border/80 bg-muted/25 px-3 py-2 text-center text-[11px] leading-snug text-muted-foreground">
          {message.content}
        </p>
      </div>
    );
  }

  const renderSegments = (segs: ReturnType<typeof splitMarkdownCodeBlocks>) =>
    segs.map((seg, i) =>
      seg.type === "code" ? (
        <ChatCodeBlock key={`c-${i}`} code={seg.code} lang={seg.lang} />
      ) : (
        <div key={`t-${i}`} className="whitespace-pre-wrap">
          {seg.text}
        </div>
      ),
    );

  return (
    <div
      className={cn(
        "flex w-full",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "min-w-0 text-sm",
          isUser
            ? "ml-auto max-w-[75%] rounded-[var(--radius-md)] rounded-br-sm bg-[hsl(var(--background-tertiary))] px-4 py-2.5 text-[hsl(var(--foreground))]"
            : "max-w-[75%] leading-relaxed text-[hsl(var(--foreground))]",
        )}
      >
        {message.attachments && message.attachments.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {message.attachments.map((a) => (
              <span
                key={a.id}
                className="inline-flex items-center gap-1 rounded-lg border border-border/80 bg-background/80 px-2 py-1 text-[11px] text-muted-foreground"
              >
                <FileText className="size-3 shrink-0 opacity-70" aria-hidden />
                <span className="truncate">{a.name}</span>
              </span>
            ))}
          </div>
        ) : null}
        {message.sendMeta ? (
          <p className="mb-1.5 text-[10px] text-muted-foreground">
            {message.sendMeta.modelLabel}
            {message.sendMeta.gptReasoningLabel
              ? ` · ${message.sendMeta.gptReasoningLabel}`
              : ""}
          </p>
        ) : null}
        {message.role === "assistant" ? (
          <div className="space-y-1">{renderSegments(collapseText)}</div>
        ) : (
          <div className="whitespace-pre-wrap">
            {long && !expanded
              ? `${message.content.slice(0, COLLAPSE_LEN)}…`
              : message.content}
          </div>
        )}
        {long ? (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="mt-1 flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
          >
            {expanded ? (
              <>
                <ChevronUp className="size-3.5" />
                Свернуть
              </>
            ) : (
              <>
                <ChevronDown className="size-3.5" />
                Развернуть полностью
              </>
            )}
          </button>
        ) : null}


        {message.role === "assistant" &&
        message.citations &&
        message.citations.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {message.citations.map((c) => (
              <a
                key={c.id}
                href={c.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex max-w-full items-center rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-muted/70"
              >
                <span className="truncate">{c.label}</span>
              </a>
            ))}
          </div>
        ) : null}

        {message.role === "assistant" &&
        message.documentCards &&
        message.documentCards.length > 0 ? (
          <div className="mt-3 space-y-2">
            {message.documentCards.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-2 rounded-xl border border-border bg-muted/25 px-3 py-2"
              >
                <FileText
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate text-xs font-medium">
                  {d.title}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 text-muted-foreground"
                  title="Скачать"
                  onClick={() => downloadTextFile(d.title, message.content)}
                >
                  <Download className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : null}

        <div
          className={cn(
            "mt-3 flex flex-wrap items-center gap-0.5 pt-1",
            isUser ? "justify-end" : "justify-start",
          )}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground"
            onClick={() => void copyMsg()}
            title={copied ? "Скопировано" : "Копировать"}
          >
            <Copy className="size-3.5" />
            <span className="sr-only">
              {copied ? "Скопировано" : "Копировать"}
            </span>
          </Button>
          {isUser && onEditUser ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground"
              title="В поле ввода"
              onClick={() => onEditUser(message.content)}
            >
              <Pencil className="size-3.5" />
              <span className="sr-only">Правка</span>
            </Button>
          ) : null}
          {message.role === "assistant" ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground"
              onClick={() => onRegenerate?.()}
              title="Перегенерировать"
            >
              <RefreshCw className="size-3.5" />
              <span className="sr-only">Перегенерировать</span>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
