"use client";

import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ALL_DLP_POLICY_TYPES,
  createPolicy,
  fetchPolicies,
  patchPolicy,
  type DlpPolicyAction,
  type DlpPolicyAppliesTo,
  type DlpPolicyDto,
  type DlpPolicyType,
} from "@/lib/policies/policies-client";
import { cn } from "@/lib/utils";

type OrgRoleKey = "owner" | "admin" | "manager" | "employee";

const ROLE_TARGET_UUID: Record<OrgRoleKey, string> = {
  owner: "00000000-0000-0000-0000-000000000001",
  admin: "00000000-0000-0000-0000-000000000002",
  manager: "00000000-0000-0000-0000-000000000003",
  employee: "00000000-0000-0000-0000-000000000004",
};

const UUID_TO_ROLE: Record<string, OrgRoleKey> = {
  [ROLE_TARGET_UUID.owner]: "owner",
  [ROLE_TARGET_UUID.admin]: "admin",
  [ROLE_TARGET_UUID.manager]: "manager",
  [ROLE_TARGET_UUID.employee]: "employee",
};

const ROLE_LABEL: Record<OrgRoleKey, string> = {
  owner: "Владелец",
  admin: "Админ",
  manager: "Менеджер",
  employee: "Сотрудник",
};

const TYPE_LABEL: Record<DlpPolicyType, string> = {
  EMAIL: "Email",
  PHONE: "Телефон",
  API_KEY: "API-ключ",
  JWT: "JWT",
  CREDIT_CARD: "Карта",
  PASSPORT_RF: "Паспорт РФ",
  SNILS: "СНИЛС",
  IP_ADDRESS: "IP",
};

const ACTION_OPTIONS: {
  value: DlpPolicyAction;
  title: string;
  hint: string;
}[] = [
  { value: "warn", title: "Предупреждать", hint: "Отправка разрешена, фиксируем в аудите." },
  { value: "block", title: "Блокировать", hint: "Сообщение не уйдёт в модель." },
  { value: "redact", title: "Скрывать", hint: "В модель уходит без чувствительных фрагментов." },
];

function appliesToLabel(p: DlpPolicyDto): string {
  if (p.appliesTo === "all") return "Все";
  if (p.appliesTo === "user") {
    const id = p.targetId ?? "";
    return id ? `Пользователь · ${id.slice(0, 8)}…` : "Пользователь";
  }
  const role = p.targetId ? UUID_TO_ROLE[p.targetId] : undefined;
  return role ? `Роль · ${ROLE_LABEL[role]}` : "Роль";
}

function actionLabel(a: DlpPolicyAction): string {
  return ACTION_OPTIONS.find((x) => x.value === a)?.title ?? a;
}

const selectClass =
  "h-9 w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2.5 text-sm text-[hsl(var(--foreground))] outline-none focus-visible:border-[hsl(var(--border-strong))] focus-visible:ring-0";

export function PoliciesSecurityPage() {
  const [policies, setPolicies] = useState<DlpPolicyDto[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<DlpPolicyDto | null>(null);

  const [name, setName] = useState("");
  const [action, setAction] = useState<DlpPolicyAction>("warn");
  const [enabledTypes, setEnabledTypes] = useState<DlpPolicyType[]>([]);
  const [appliesTo, setAppliesTo] = useState<DlpPolicyAppliesTo>("all");
  const [roleKey, setRoleKey] = useState<OrgRoleKey>("employee");
  const [userTargetId, setUserTargetId] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetchPolicies();
    if (res.kind === "ok") {
      setPolicies(res.policies);
      setCanManage(res.canManagePolicies);
    } else if (res.kind === "unauthorized") {
      setError("Нужна авторизация.");
    } else if (res.kind === "forbidden") {
      setError("Нет доступа.");
    } else if (res.kind === "http_error") {
      setError(`Ошибка ${res.status}`);
    } else {
      setError("Сеть");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setAction("warn");
    setEnabledTypes([]);
    setAppliesTo("all");
    setRoleKey("employee");
    setUserTargetId("");
    setSheetOpen(true);
  };

  const openEdit = (p: DlpPolicyDto) => {
    setEditing(p);
    setName(p.name);
    setAction(p.action);
    setEnabledTypes([...p.enabledTypes]);
    setAppliesTo(p.appliesTo);
    if (p.appliesTo === "role" && p.targetId) {
      setRoleKey(UUID_TO_ROLE[p.targetId] ?? "employee");
      setUserTargetId("");
    } else if (p.appliesTo === "user") {
      setUserTargetId(p.targetId ?? "");
      setRoleKey("employee");
    } else {
      setUserTargetId("");
      setRoleKey("employee");
    }
    setSheetOpen(true);
  };

  const formValid = useMemo(() => {
    if (!name.trim()) return false;
    if (appliesTo === "all") return true;
    if (appliesTo === "role") return Boolean(ROLE_TARGET_UUID[roleKey]);
    return userTargetId.trim().length > 0;
  }, [name, appliesTo, roleKey, userTargetId]);

  const handleSave = async () => {
    if (!formValid) return;
    const targetId =
      appliesTo === "all"
        ? null
        : appliesTo === "role"
          ? ROLE_TARGET_UUID[roleKey]
          : userTargetId.trim() || null;
    if (appliesTo !== "all" && !targetId) return;

    setSaving(true);
    try {
      if (editing) {
        const res = await patchPolicy(editing.id, {
          name: name.trim(),
          action,
          enabledTypes,
          appliesTo,
          targetId,
          priority: editing.priority,
        });
        if (res.kind === "ok") {
          setPolicies((prev) => prev.map((x) => (x.id === editing.id ? res.policy : x)));
          setSheetOpen(false);
        }
      } else {
        const res = await createPolicy({
          name: name.trim(),
          action,
          enabledTypes,
          appliesTo,
          targetId,
          priority: 0,
          active: true,
        });
        if (res.kind === "ok") {
          setPolicies((prev) => [res.policy, ...prev]);
          setSheetOpen(false);
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (p: DlpPolicyDto, e: MouseEvent) => {
    e.stopPropagation();
    if (!canManage) return;
    const res = await patchPolicy(p.id, { active: !p.active });
    if (res.kind === "ok") {
      setPolicies((list) => list.map((x) => (x.id === p.id ? res.policy : x)));
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold tracking-tight text-[hsl(var(--foreground))]">
          Политики безопасности
        </h1>
        {canManage ? (
          <Button type="button" variant="ghost" size="sm" className="h-8 gap-1 px-2 text-sm" onClick={openCreate}>
            <span className="text-base leading-none">+</span>
            Добавить политику
          </Button>
        ) : null}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : policies.length === 0 ? (
        <p className="text-sm text-muted-foreground">Нет политик</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Название</th>
                <th className="py-2 pr-4 font-medium">Применяется к</th>
                <th className="py-2 pr-4 font-medium">Действие</th>
                <th className="py-2 pr-4 font-medium">Типы данных</th>
                <th className="w-14 py-2 text-right font-medium">Статус</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((p) => (
                <tr
                  key={p.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openEdit(p)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openEdit(p);
                    }
                  }}
                  className="cursor-pointer border-b border-[hsl(var(--border))] last:border-0 hover:bg-muted/40"
                >
                  <td className="max-w-[200px] truncate py-2.5 pr-4 font-medium text-foreground">{p.name}</td>
                  <td className="whitespace-nowrap py-2.5 pr-4 text-muted-foreground">{appliesToLabel(p)}</td>
                  <td className="whitespace-nowrap py-2.5 pr-4 text-muted-foreground">{actionLabel(p.action)}</td>
                  <td className="max-w-[220px] truncate py-2.5 pr-4 text-xs text-muted-foreground">
                    {p.enabledTypes.length ? p.enabledTypes.map((t) => TYPE_LABEL[t]).join(", ") : "—"}
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={p.active}
                      disabled={!canManage}
                      onClick={(e) => void toggleActive(p, e)}
                      className={cn(
                        "relative inline-flex h-5 w-9 shrink-0 rounded-full border border-transparent transition-colors",
                        p.active ? "bg-foreground/80" : "bg-muted",
                        !canManage && "cursor-not-allowed opacity-50",
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none absolute top-0.5 size-4 rounded-full bg-background transition-transform",
                          p.active ? "translate-x-[1.125rem]" : "translate-x-0.5",
                        )}
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent aria-describedby={undefined}>
          <SheetHeader>
            <SheetTitle>{editing ? (name.trim() || editing.name) : "Новая политика"}</SheetTitle>
          </SheetHeader>
          <SheetBody className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="policy-name" className="text-xs text-muted-foreground">
                Название
              </Label>
              <Input
                id="policy-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 rounded-md border-border"
                disabled={!canManage}
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Действие</p>
              <div className="space-y-2" role="radiogroup" aria-label="Действие">
                {ACTION_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={cn(
                      "flex cursor-pointer gap-3 rounded-md border border-transparent px-2 py-2 hover:bg-muted/50",
                      action === opt.value && "border-border bg-muted/30",
                      !canManage && "pointer-events-none opacity-60",
                    )}
                  >
                    <input
                      type="radio"
                      name="policy-action"
                      className="mt-1"
                      checked={action === opt.value}
                      onChange={() => setAction(opt.value)}
                      disabled={!canManage}
                    />
                    <span>
                      <span className="text-sm font-medium">{opt.title}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{opt.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Типы данных</p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-3">
                {ALL_DLP_POLICY_TYPES.map((t) => {
                  const checked = enabledTypes.includes(t);
                  return (
                    <label key={t} className="flex cursor-pointer items-center gap-2 text-sm">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => {
                          const on = v === true;
                          setEnabledTypes((prev) => {
                            if (on) return prev.includes(t) ? prev : [...prev, t];
                            return prev.filter((x) => x !== t);
                          });
                        }}
                        disabled={!canManage}
                      />
                      <span className="text-muted-foreground">{TYPE_LABEL[t]}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="policy-scope" className="text-xs text-muted-foreground">
                Применяется к
              </Label>
              <select
                id="policy-scope"
                className={selectClass}
                value={appliesTo}
                onChange={(e) => setAppliesTo(e.target.value as DlpPolicyAppliesTo)}
                disabled={!canManage}
              >
                <option value="all">Все</option>
                <option value="role">Роль</option>
                <option value="user">Пользователь</option>
              </select>
              {appliesTo === "role" ? (
                <select
                  className={cn(selectClass, "mt-2")}
                  value={roleKey}
                  onChange={(e) => setRoleKey(e.target.value as OrgRoleKey)}
                  disabled={!canManage}
                >
                  {(Object.keys(ROLE_LABEL) as OrgRoleKey[]).map((k) => (
                    <option key={k} value={k}>
                      {ROLE_LABEL[k]}
                    </option>
                  ))}
                </select>
              ) : null}
              {appliesTo === "user" ? (
                <Input
                  value={userTargetId}
                  onChange={(e) => setUserTargetId(e.target.value)}
                  placeholder="UUID пользователя"
                  className="mt-2 h-9"
                  disabled={!canManage}
                />
              ) : null}
            </div>

          </SheetBody>
          {canManage ? (
            <SheetFooter>
              <Button type="button" variant="ghost" size="sm" onClick={() => setSheetOpen(false)}>
                Отмена
              </Button>
              <Button type="button" size="sm" disabled={!formValid || saving} onClick={() => void handleSave()}>
                {saving ? "…" : "Сохранить"}
              </Button>
            </SheetFooter>
          ) : (
            <SheetFooter>
              <p className="text-xs text-muted-foreground">Только просмотр</p>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
