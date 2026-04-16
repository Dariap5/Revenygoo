"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LlmAdminProvider =
  | "openai"
  | "anthropic"
  | "gigachat"
  | "yandexgpt"
  | "routerai";

type ModelRow = {
  id: string;
  provider: LlmAdminProvider;
  modelName: string;
  maxTokens: number;
  enabled: boolean;
  baseUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  hasApiKey: boolean;
};

const PROVIDER_LABELS: Record<LlmAdminProvider, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  gigachat: "GigaChat",
  yandexgpt: "YandexGPT",
  routerai: "RouterAI",
};

export function AdminModelsSettings() {
  const [models, setModels] = useState<ModelRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testHint, setTestHint] = useState<string | null>(null);
  const [testModelId, setTestModelId] = useState<string>("");

  const [provider, setProvider] = useState<LlmAdminProvider>("openai");
  const [apiKey, setApiKey] = useState("");
  const [modelName, setModelName] = useState("");
  const [maxTokens, setMaxTokens] = useState("4096");
  const [baseUrl, setBaseUrl] = useState("https://routerai.ru/api/v1");
  const [formError, setFormError] = useState<string | null>(null);

  const loadModels = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/llm/models", {
        credentials: "include",
        cache: "no-store",
      });
      const data = (await res.json().catch(() => ({}))) as {
        models?: ModelRow[];
        error?: string;
      };
      if (!res.ok) {
        setLoadError(data.error ?? `HTTP ${res.status}`);
        setModels([]);
        return;
      }
      const list = data.models ?? [];
      setModels(list);
      setTestModelId((prev) => {
        if (prev && list.some((m) => m.id === prev)) return prev;
        const firstOn = list.find((m) => m.enabled) ?? list[0];
        return firstOn?.id ?? "";
      });
    } catch {
      setLoadError("Не удалось загрузить список");
      setModels([]);
    }
  }, []);

  useEffect(() => {
    void loadModels();
  }, [loadModels]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      const mt = parseInt(maxTokens, 10);
      const res = await fetch("/api/admin/llm/models", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          apiKey,
          modelName,
          maxTokens: Number.isFinite(mt) ? mt : 4096,
          enabled: true,
          ...(provider === "routerai" ? { baseUrl: baseUrl.trim() } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        model?: ModelRow;
      };
      if (!res.ok) {
        setFormError(data.error ?? `Ошибка ${res.status}`);
        return;
      }
      setApiKey("");
      setModelName("");
      await loadModels();
      if (data.model?.id) {
        setTestModelId(data.model.id);
      }
    } finally {
      setSaving(false);
    }
  };

  const runTest = async () => {
    setTestHint(null);
    if (!testModelId) {
      setTestHint("Выберите модель в списке или сохраните новую.");
      return;
    }
    setTesting(true);
    try {
      const res = await fetch(
        `/api/admin/llm/test?id=${encodeURIComponent(testModelId)}`,
        { credentials: "include", cache: "no-store" },
      );
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };
      if (!res.ok) {
        setTestHint(data.error ?? `HTTP ${res.status}`);
        return;
      }
      if (data.ok) {
        setTestHint("Подключение успешно.");
      } else {
        setTestHint(data.message ?? "Проверка не прошла");
      }
    } catch {
      setTestHint("Сетевая ошибка");
    } finally {
      setTesting(false);
    }
  };

  const toggleEnabled = async (row: ModelRow, enabled: boolean) => {
    try {
      const res = await fetch(`/api/admin/llm/models/${row.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (res.ok) await loadModels();
    } catch {
      /* ignore */
    }
  };

  const removeRow = async (id: string) => {
    if (!confirm("Удалить эту конфигурацию?")) return;
    try {
      const res = await fetch(`/api/admin/llm/models/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        await loadModels();
        if (testModelId === id) setTestModelId("");
      }
    } catch {
      /* ignore */
    }
  };

  const activeModels = models.filter((m) => m.enabled);

  return (
    <div className="space-y-10">
      <header className="space-y-1">
        <h1 className="text-lg font-medium text-[hsl(var(--foreground))]">
          Модели
        </h1>
        <p className="text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
          Ключи хранятся в базе в зашифрованном виде (AES-256-GCM). Нужен{" "}
          <code className="rounded bg-[hsl(var(--muted))]/40 px-1 py-0.5 text-xs">
            LLM_SETTINGS_ENCRYPTION_KEY
          </code>{" "}
          на сервере.
        </p>
      </header>

      {loadError ? (
        <p className="text-sm text-destructive">{loadError}</p>
      ) : null}
      {formError ? (
        <p className="text-sm text-destructive">{formError}</p>
      ) : null}

      <form onSubmit={onSubmit} className="divide-y divide-[hsl(var(--border))]">
        <div className="space-y-6 py-6 first:pt-0">
          <div className="space-y-2">
            <Label
              htmlFor="llm-provider"
              className="text-sm font-normal text-[hsl(var(--muted-foreground))]"
            >
              Провайдер
            </Label>
            <select
              id="llm-provider"
              value={provider}
              onChange={(e) =>
                setProvider(e.target.value as LlmAdminProvider)
              }
              className="flex h-10 w-full border-0 border-b border-[hsl(var(--border))] bg-transparent px-0 text-sm text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--foreground))]"
            >
              {(Object.keys(PROVIDER_LABELS) as LlmAdminProvider[]).map((p) => (
                <option key={p} value={p}>
                  {PROVIDER_LABELS[p]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="llm-api-key"
              className="text-sm font-normal text-[hsl(var(--muted-foreground))]"
            >
              API-ключ
            </Label>
            <Input
              id="llm-api-key"
              type="password"
              autoComplete="off"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-…"
              className="border-0 border-b border-[hsl(var(--border))] bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          {provider === "routerai" ? (
            <div className="space-y-2">
              <Label
                htmlFor="llm-base-url"
                className="text-sm font-normal text-[hsl(var(--muted-foreground))]"
              >
                Base URL (OpenAI-compatible)
              </Label>
              <Input
                id="llm-base-url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://routerai.ru/api/v1"
                className="border-0 border-b border-[hsl(var(--border))] bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label
              htmlFor="llm-model"
              className="text-sm font-normal text-[hsl(var(--muted-foreground))]"
            >
              Модель
            </Label>
            <Input
              id="llm-model"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="gpt-4o-mini, claude-3-5-sonnet-20241022, …"
              className="border-0 border-b border-[hsl(var(--border))] bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="llm-max-tokens"
              className="text-sm font-normal text-[hsl(var(--muted-foreground))]"
            >
              Max tokens
            </Label>
            <Input
              id="llm-max-tokens"
              type="number"
              min={1}
              max={200000}
              value={maxTokens}
              onChange={(e) => setMaxTokens(e.target.value)}
              className="border-0 border-b border-[hsl(var(--border))] bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Сохранение…" : "Сохранить"}
            </Button>
          </div>
        </div>
      </form>

      <section className="space-y-4 border-t border-[hsl(var(--border))] pt-8">
        <h2 className="text-sm font-medium text-[hsl(var(--foreground))]">
          Проверка подключения
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-2">
            <Label
              htmlFor="test-model"
              className="text-sm font-normal text-[hsl(var(--muted-foreground))]"
            >
              Конфигурация
            </Label>
            <select
              id="test-model"
              value={testModelId}
              onChange={(e) => setTestModelId(e.target.value)}
              className="flex h-10 w-full border-0 border-b border-[hsl(var(--border))] bg-transparent px-0 text-sm outline-none focus:border-[hsl(var(--foreground))]"
            >
              <option value="">— выберите —</option>
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {PROVIDER_LABELS[m.provider]} · {m.modelName}
                  {!m.enabled ? " (выкл.)" : ""}
                </option>
              ))}
            </select>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 border-[hsl(var(--border))]"
            disabled={testing || !testModelId}
            onClick={() => void runTest()}
          >
            {testing ? "Проверка…" : "Проверить подключение"}
          </Button>
        </div>
        {testHint ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{testHint}</p>
        ) : null}
      </section>

      <section className="space-y-4 border-t border-[hsl(var(--border))] pt-8">
        <h2 className="text-sm font-medium text-[hsl(var(--foreground))]">
          Активные модели
        </h2>
        {activeModels.length === 0 ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Нет включённых моделей. Сохраните конфигурацию и включите её в
            списке ниже.
          </p>
        ) : (
          <ul className="divide-y divide-[hsl(var(--border))] border-t border-b border-[hsl(var(--border))]">
            {activeModels.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
              >
                <span className="text-[hsl(var(--foreground))]">
                  <span className="text-[hsl(var(--muted-foreground))]">
                    {PROVIDER_LABELS[m.provider]}
                  </span>{" "}
                  · {m.modelName}
                  {m.baseUrl ? (
                    <span className="block truncate text-xs text-[hsl(var(--muted-foreground))]">
                      {m.baseUrl}
                    </span>
                  ) : null}
                </span>
                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                  max {m.maxTokens}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4 border-t border-[hsl(var(--border))] pt-8">
        <h2 className="text-sm font-medium text-[hsl(var(--foreground))]">
          Все конфигурации
        </h2>
        {models.length === 0 ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Пока пусто.
          </p>
        ) : (
          <ul className="divide-y divide-[hsl(var(--border))] border-t border-b border-[hsl(var(--border))]">
            {models.map((m) => (
              <li
                key={m.id}
                className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 text-sm">
                  <div className="font-medium text-[hsl(var(--foreground))]">
                    {PROVIDER_LABELS[m.provider]} · {m.modelName}
                  </div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))]">
                    Ключ сохранён · max {m.maxTokens} ·{" "}
                    {m.enabled ? "включена" : "выключена"}
                    {m.baseUrl ? ` · ${m.baseUrl}` : ""}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => void toggleEnabled(m, !m.enabled)}
                  >
                    {m.enabled ? "Выключить" : "Включить"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-destructive hover:text-destructive"
                    onClick={() => void removeRow(m.id)}
                  >
                    Удалить
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
