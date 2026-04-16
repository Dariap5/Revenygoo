"use client";

import type { ChangeEvent, DragEvent, KeyboardEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  KNOWLEDGE_ACCEPT,
  deleteKnowledgeFile,
  fetchKnowledgeList,
  knowledgeStatusLabel,
  uploadKnowledgeFile,
  type KnowledgeFileDto,
} from "@/lib/knowledge/knowledge-client";
import { cn } from "@/lib/utils";

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

const EXT_OK = /\.(pdf|docx|txt|md)$/i;

function isAllowedKnowledgeFile(f: File): boolean {
  return EXT_OK.test(f.name);
}

export function KnowledgeCatalog() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<KnowledgeFileDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetchKnowledgeList();
    if (res.kind === "ok") {
      setItems(res.data.items ?? []);
    } else if (res.kind === "unauthorized") {
      setError("Нужна авторизация.");
    } else if (res.kind === "forbidden") {
      setError("Нет доступа.");
    } else if (res.kind === "http_error") {
      setError(res.message ?? `Ошибка ${res.status}`);
    } else {
      setError("Сеть");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const runUpload = async (files: File[]) => {
    const ok = files.filter(isAllowedKnowledgeFile);
    if (ok.length === 0) {
      setActionError("Допустимы только PDF, DOCX, TXT, MD.");
      return;
    }
    setActionError(null);
    setUploading(true);
    for (const file of ok) {
      const res = await uploadKnowledgeFile(file);
      if (res.kind === "ok") {
        setItems((prev) => [res.data.item, ...prev]);
      } else if (res.kind === "http_error") {
        setActionError(res.message ?? `Ошибка загрузки (${res.status})`);
        break;
      } else if (res.kind === "unauthorized" || res.kind === "forbidden") {
        setActionError("Нет доступа.");
        break;
      } else {
        setActionError("Сеть");
        break;
      }
    }
    setUploading(false);
  };

  const onPickFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length) return;
    void runUpload(Array.from(list));
    e.target.value = "";
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const list = e.dataTransfer.files;
    if (!list?.length) return;
    void runUpload(Array.from(list));
  };

  const remove = async (id: string) => {
    setActionError(null);
    const res = await deleteKnowledgeFile(id);
    if (res.kind === "ok") {
      setItems((prev) => prev.filter((x) => x.id !== id));
      return;
    }
    if (res.kind === "http_error") {
      setActionError(res.message ?? `Ошибка удаления (${res.status})`);
    } else if (res.kind === "unauthorized" || res.kind === "forbidden") {
      setActionError("Нет доступа.");
    } else {
      setActionError("Сеть");
    }
  };

  return (
    <div className="space-y-5">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e: KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(e: DragEvent) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(e: DragEvent) => {
          e.preventDefault();
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDragOver(false);
          }
        }}
        onDragOver={(e: DragEvent) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center transition-colors",
          dragOver
            ? "border-[hsl(var(--foreground))]/40 bg-[hsl(var(--background-tertiary))]"
            : "border-[hsl(var(--border))] bg-[hsl(var(--background))] hover:border-[hsl(var(--border-strong))]",
          uploading && "pointer-events-none opacity-60",
        )}
      >
        <Upload className="size-8 text-[hsl(var(--muted-foreground))]" aria-hidden />
        <p className="text-sm text-[hsl(var(--foreground))]">
          Перетащите файлы сюда или нажмите для выбора
        </p>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          PDF, DOCX, TXT, MD · до 50 МБ
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="pointer-events-none mt-1 h-9 gap-1.5"
          tabIndex={-1}
        >
          <Upload className="size-3.5" />
          Загрузить файл
        </Button>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept={KNOWLEDGE_ACCEPT}
          multiple
          onChange={onPickFiles}
          aria-label="Выбор файлов для базы знаний"
        />
      </div>

      {actionError ? (
        <p className="text-sm text-destructive">{actionError}</p>
      ) : null}
      {uploading ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Загрузка…</p>
      ) : null}

      {loading ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Загрузка списка…</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="h-10 px-2 py-0 font-medium">Имя</th>
                <th className="h-10 px-2 py-0 font-medium">Размер</th>
                <th className="h-10 px-2 py-0 font-medium">Дата</th>
                <th className="h-10 px-2 py-0 font-medium">Статус</th>
                <th className="h-10 w-12 px-2 py-0 text-right font-medium" aria-label="Удалить" />
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="h-10 px-2 text-muted-foreground">
                    Нет загруженных файлов
                  </td>
                </tr>
              ) : (
                items.map((it) => (
                  <tr
                    key={it.id}
                    className="border-b border-[hsl(var(--border))] last:border-0"
                  >
                    <td className="h-10 max-w-[280px] truncate px-2 align-middle font-medium">
                      {it.name}
                    </td>
                    <td className="h-10 whitespace-nowrap px-2 align-middle tabular-nums text-muted-foreground">
                      {formatSize(it.size)}
                    </td>
                    <td className="h-10 whitespace-nowrap px-2 align-middle text-muted-foreground">
                      {formatTime(it.createdAt)}
                    </td>
                    <td className="h-10 whitespace-nowrap px-2 align-middle text-muted-foreground">
                      {knowledgeStatusLabel(it.status)}
                    </td>
                    <td className="h-10 px-2 text-right align-middle">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-9 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          void remove(it.id);
                        }}
                        aria-label={`Удалить ${it.name}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}