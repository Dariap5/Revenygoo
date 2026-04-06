"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SecurityPolicy } from "@/lib/mock/policies";
import {
  POLICY_ACTION_OPTIONS,
  POLICY_DATA_TYPE_OPTIONS,
  POLICY_MODEL_OPTIONS,
  POLICY_ROLE_OPTIONS,
} from "@/lib/mock/policies";

import { cn } from "@/lib/utils";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export type PolicyFormPayload = Omit<SecurityPolicy, "id">;

export function PolicyRuleFormDialog({
  open,
  onOpenChange,
  editing,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: SecurityPolicy | null;
  onSave: (payload: PolicyFormPayload, id?: string) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dataType, setDataType] = useState<SecurityPolicy["dataType"]>(
    POLICY_DATA_TYPE_OPTIONS[0]!.value,
  );
  const [role, setRole] = useState<SecurityPolicy["role"]>(
    POLICY_ROLE_OPTIONS[0]!.value,
  );
  const [model, setModel] = useState<SecurityPolicy["model"]>(
    POLICY_MODEL_OPTIONS[0]!.value,
  );
  const [action, setAction] = useState<SecurityPolicy["action"]>(
    POLICY_ACTION_OPTIONS[0]!.value,
  );
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setName(editing.name);
      setDescription(editing.description);
      setDataType(editing.dataType);
      setRole(editing.role);
      setModel(editing.model);
      setAction(editing.action);
      setActive(editing.status === "active");
    } else {
      setName("");
      setDescription("");
      setDataType(POLICY_DATA_TYPE_OPTIONS[0]!.value);
      setRole(POLICY_ROLE_OPTIONS[0]!.value);
      setModel(POLICY_MODEL_OPTIONS[0]!.value);
      setAction(POLICY_ACTION_OPTIONS[0]!.value);
      setActive(true);
    }
  }, [open, editing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    onSave(
      {
        name: trimmedName,
        description: description.trim(),
        dataType,
        role,
        model,
        action,
        status: active ? "active" : "inactive",
      },
      editing?.id,
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Редактировать правило" : "Новое правило"}
          </DialogTitle>
          <DialogDescription>
            Локальный mock: изменения не сохраняются на сервере.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="policy-name">Название</Label>
            <Input
              id="policy-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Краткое название"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="policy-desc">Описание</Label>
            <Textarea
              id="policy-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Коротко, для чего правило"
              rows={2}
              className="resize-none text-sm"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="policy-data-type">Тип данных</Label>
            <select
              id="policy-data-type"
              className={selectClass}
              value={dataType}
              onChange={(e) =>
                setDataType(e.target.value as SecurityPolicy["dataType"])
              }
            >
              {POLICY_DATA_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="policy-role">Роль</Label>
            <select
              id="policy-role"
              className={selectClass}
              value={role}
              onChange={(e) =>
                setRole(e.target.value as SecurityPolicy["role"])
              }
            >
              {POLICY_ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="policy-model">Модель</Label>
            <select
              id="policy-model"
              className={selectClass}
              value={model}
              onChange={(e) =>
                setModel(e.target.value as SecurityPolicy["model"])
              }
            >
              {POLICY_MODEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="policy-action">Действие</Label>
            <select
              id="policy-action"
              className={selectClass}
              value={action}
              onChange={(e) =>
                setAction(e.target.value as SecurityPolicy["action"])
              }
            >
              {POLICY_ACTION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Статус</p>
              <p className="text-xs text-muted-foreground">
                {active ? "Активно" : "Неактивно"}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={active}
              onClick={() => setActive((v) => !v)}
              className={cn(
                "flex h-6 w-10 shrink-0 items-center rounded-full border border-transparent px-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active ? "justify-end bg-primary" : "justify-start bg-muted",
              )}
            >
              <span className="pointer-events-none block size-4 rounded-full bg-background shadow-sm" />
            </button>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Отмена
            </Button>
            <Button type="submit">Сохранить</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
