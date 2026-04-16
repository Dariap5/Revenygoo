"use client";

import { useMemo, useState, type ComponentType } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Building2,
  ClipboardList,
  Cpu,
  Shield,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mockKnowledgeSources } from "@/lib/mock/knowledge-sources";
import { mockModelOptions } from "@/lib/mock/models";
import {
  mockDepartments,
  mockEmployees,
} from "@/lib/mock/organization";
import { mockSecurityPolicies } from "@/lib/mock/policies";
import { cn } from "@/lib/utils";

function localDateYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const MODEL_LABELS = ["Auto", "GPT", "Claude", "Gemini"] as const;

type SafetyMode = "standard" | "strict";

export function AdminDashboard() {
  const todayYmd = useMemo(() => localDateYmd(new Date()), []);

  const metrics = useMemo(() => {
    const warningsToday = 0;
    const blockedToday = 0;
    const readySources = mockKnowledgeSources.filter(
      (s) => s.status === "ready",
    ).length;
    const activePolicies = mockSecurityPolicies.filter(
      (p) => p.status === "active",
    ).length;

    return {
      employees: mockEmployees.length,
      departments: mockDepartments.length,
      activePolicies,
      contextSources: readySources,
      warningsToday,
      blockedToday,
      syncingSources: mockKnowledgeSources.filter(
        (s) => s.status === "processing",
      ).length,
    };
  }, []);

  const knowledgeSyncing = metrics.syncingSources > 0;

  const [companyName, setCompanyName] = useState("ООО «Ревениго»");
  const [industry, setIndustry] = useState("B2B SaaS");
  const [uiLanguage, setUiLanguage] = useState("Русский");
  const [safetyMode, setSafetyMode] = useState<SafetyMode>("standard");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [defaultModel, setDefaultModel] = useState<string>("auto");
  const [allowUserModelPick, setAllowUserModelPick] = useState(true);
  const [allowExternalModels, setAllowExternalModels] = useState(false);
  const [enabledModels, setEnabledModels] = useState<Record<string, boolean>>(
    () =>
      Object.fromEntries(MODEL_LABELS.map((m) => [m, true])) as Record<
        string,
        boolean
      >,
  );

  const toggleModel = (id: string) => {
    setEnabledModels((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-1 text-xl font-semibold text-[hsl(var(--foreground))]">
          Администрирование
        </h1>
        <p className="mb-5 max-w-2xl text-sm text-[hsl(var(--muted-foreground))]">
          Обзор состояния платформы и быстрый доступ к ключевым разделам
          управления. Данные демонстрационные, без сохранения на сервер.
        </p>
      </div>

      {/* 1. Общий обзор */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">
          Общий обзор системы
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <MetricCard
            label="Сотрудников"
            value={metrics.employees}
            hint="Все учётные записи в демо-организации"
          />
          <MetricCard
            label="Отделов"
            value={metrics.departments}
            hint="Узлы структуры компании"
          />
          <MetricCard
            label="Активных политик"
            value={metrics.activePolicies}
            hint="Из раздела «Политики»"
          />
          <MetricCard
            label="Источников контекста"
            value={metrics.contextSources}
            hint={
              metrics.syncingSources > 0
                ? `Ещё ${metrics.syncingSources} в синхронизации`
                : "Статус «готов» в каталоге"
            }
          />
          <MetricCard
            label="Предупреждений сегодня"
            value={metrics.warningsToday}
            hint={`Дата: ${todayYmd} (журнал аудита)`}
          />
          <MetricCard
            label="Заблокировано сегодня"
            value={metrics.blockedToday}
            hint={`Дата: ${todayYmd} (журнал аудита)`}
          />
        </div>
      </section>

      {/* 2. Состояние системы */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">
          Состояние системы
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatusRow label="AI chat" status="active" />
          <StatusRow label="Safety checks" status="active" />
          <StatusRow
            label="Knowledge sources"
            status={knowledgeSyncing ? "syncing" : "active"}
            detail={
              knowledgeSyncing
                ? `${metrics.syncingSources} источника обновляется`
                : "Все подключённые источники в норме"
            }
          />
          <StatusRow label="Audit log" status="active" />
          <StatusRow label="Model routing" status="active" />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 3. Настройки компании */}
        <section className="divide-y divide-[hsl(var(--border))] rounded-[var(--radius-md)] border border-[hsl(var(--border))] bg-[hsl(var(--background))]">
          <div className="flex flex-wrap items-start justify-between gap-3 p-5 pb-4">
            <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">
              Настройки компании
            </h2>
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button type="button" size="sm" variant="outline">
                  Изменить настройки
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Настройки компании</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="co-name">Название компании</Label>
                    <Input
                      id="co-name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="co-ind">Отрасль</Label>
                    <Input
                      id="co-ind"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Размер команды</Label>
                    <p className="text-sm text-muted-foreground">
                      {mockEmployees.length} сотрудников (из мок-данных
                      «Организация»)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="co-lang">Язык интерфейса</Label>
                    <select
                      id="co-lang"
                      className="flex h-9 w-full rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm text-[hsl(var(--foreground))] outline-none transition-colors hover:border-[hsl(var(--border-strong))] focus:border-[hsl(var(--border-strong))] focus:ring-0"
                      value={uiLanguage}
                      onChange={(e) => setUiLanguage(e.target.value)}
                    >
                      <option>Русский</option>
                      <option>English</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Режим безопасности</Label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={safetyMode === "standard" ? "default" : "outline"}
                        onClick={() => setSafetyMode("standard")}
                      >
                        Standard
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={safetyMode === "strict" ? "default" : "outline"}
                        onClick={() => setSafetyMode("strict")}
                      >
                        Strict
                      </Button>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    onClick={() => setSettingsOpen(false)}
                  >
                    Готово
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <dl className="grid gap-0 divide-y divide-[hsl(var(--border))] px-5 pb-5 text-sm">
            <div className="flex items-center justify-between gap-4 py-4">
              <dt className="text-sm font-medium text-[hsl(var(--foreground))]">Название</dt>
              <dd className="text-right font-medium text-[hsl(var(--foreground))]">
                {companyName}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-4">
              <dt className="text-sm font-medium text-[hsl(var(--foreground))]">Отрасль</dt>
              <dd className="text-right font-medium text-[hsl(var(--foreground))]">
                {industry}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-4">
              <dt className="text-sm font-medium text-[hsl(var(--foreground))]">Размер команды</dt>
              <dd className="text-right font-medium text-[hsl(var(--foreground))]">
                {mockEmployees.length} человек
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-4">
              <dt className="text-sm font-medium text-[hsl(var(--foreground))]">Язык интерфейса</dt>
              <dd className="text-right font-medium text-[hsl(var(--foreground))]">
                {uiLanguage}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-4">
              <dt className="text-sm font-medium text-[hsl(var(--foreground))]">Безопасность</dt>
              <dd className="text-right">
                <Badge variant="secondary" className="font-normal">
                  {safetyMode === "strict" ? "Strict" : "Standard"}
                </Badge>
              </dd>
            </div>
          </dl>
        </section>

        {/* 4. Управление моделями */}
        <section
          id="admin-models-management"
          className="space-y-4 rounded-[var(--radius-md)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-5"
        >
          <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">
            Управление моделями
          </h2>
          <p className="text-xs leading-snug text-[hsl(var(--muted-foreground))]">
            Доступные в чате варианты и политика выбора. Изменения действуют
            только в этой сессии (демо).
          </p>

          <div className="space-y-3">
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Доступные модели
              </p>
              <div className="flex flex-wrap gap-2">
                {MODEL_LABELS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleModel(m)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                      enabledModels[m]
                        ? "border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]"
                        : "border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] line-through opacity-60",
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-model" className="text-xs">
                Модель по умолчанию
              </Label>
              <select
                id="default-model"
                className="flex h-9 w-full max-w-xs rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm text-[hsl(var(--foreground))] outline-none transition-colors hover:border-[hsl(var(--border-strong))] focus:border-[hsl(var(--border-strong))] focus:ring-0"
                value={defaultModel}
                onChange={(e) => setDefaultModel(e.target.value)}
              >
                {mockModelOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="divide-y divide-[hsl(var(--border))]">
              <ToggleRow
                label="Пользователи могут вручную менять модель"
                checked={allowUserModelPick}
                onChange={setAllowUserModelPick}
              />
              <ToggleRow
                label="Разрешить внешние модели (провайдеры вне allowlist)"
                checked={allowExternalModels}
                onChange={setAllowExternalModels}
              />
            </div>
          </div>
        </section>
      </div>

      {/* 5. Быстрые действия */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">
          Быстрые действия
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AdminActionCard
            href="/organization"
            title="Организация"
            description="Структура, отделы и доступы сотрудников"
            icon={Building2}
          />
          <AdminActionCard
            href="/policies"
            title="Политики"
            description="Правила безопасности и сценарии реакции"
            icon={Shield}
          />
          <AdminActionCard
            href="/audit"
            title="Журнал аудита"
            description="События, предупреждения и блокировки"
            icon={ClipboardList}
          />
          <AdminActionCard
            href="/knowledge"
            title="Контекст"
            description="Источники знаний для ответов модели"
            icon={BookOpen}
          />
          <AdminActionCard
            href="/admin/models"
            title="Настройки моделей"
            description="Провайдер, ключ, модель и проверка подключения"
            icon={Cpu}
          />
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="flex flex-col justify-between rounded-[var(--radius-md)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4 transition-all duration-200 hover:border-[hsl(var(--border-strong))] hover:shadow-[0_1px_8px_rgba(0,0,0,0.06)]">
      <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-[hsl(var(--foreground))]">
        {value}
      </p>
      <p className="mt-2 text-[11px] leading-snug text-[hsl(var(--muted-foreground))]">
        {hint}
      </p>
    </div>
  );
}

function StatusRow({
  label,
  status,
  detail,
}: {
  label: string;
  status: "active" | "syncing";
  detail?: string;
}) {
  const active = status === "active";
  return (
    <div className="rounded-[var(--radius-md)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-[hsl(var(--foreground))]">{label}</span>
        <Badge
          variant={active ? "secondary" : "outline"}
          className={cn(
            "shrink-0 font-normal",
            active && "border-emerald-200 bg-emerald-50 text-emerald-900",
            !active && "border-amber-200 bg-amber-50 text-amber-900",
          )}
        >
          {active ? "active" : "syncing"}
        </Badge>
      </div>
      {detail ? (
        <p className="mt-1.5 text-xs leading-snug text-[hsl(var(--muted-foreground))]">
          {detail}
        </p>
      ) : null}
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 py-4 text-left text-sm transition-colors"
    >
      <span className="text-[hsl(var(--foreground))]">{label}</span>
      <span
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--background-tertiary))] transition-colors",
          checked &&
            "border-[hsl(var(--foreground))] bg-[hsl(var(--foreground))]",
        )}
      >
        <span
          className={cn(
            "pointer-events-none absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-sm transition-transform",
            checked && "translate-x-4",
          )}
        />
      </span>
    </button>
  );
}

function AdminActionCard({
  href,
  title,
  description,
  icon: Icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="group card-pressable flex gap-3 rounded-[var(--radius-md)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4 transition-all duration-200 hover:border-[hsl(var(--border-strong))] hover:shadow-[0_1px_8px_rgba(0,0,0,0.06)]"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[hsl(var(--border))] bg-[hsl(var(--background-secondary))]">
        <Icon className="size-4 text-[hsl(var(--muted-foreground))]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <span className="text-sm font-semibold text-[hsl(var(--foreground))]">{title}</span>
          <ArrowRight className="size-3.5 shrink-0 text-[hsl(var(--muted-foreground))] opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        <p className="mt-1 text-xs leading-snug text-[hsl(var(--muted-foreground))]">
          {description}
        </p>
      </div>
    </Link>
  );
}
