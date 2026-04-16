"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type OrgRole = "owner" | "admin" | "manager" | "employee";

type MemberRow = {
  membershipId: string;
  userId: string;
  name: string | null;
  email: string | null;
  role: OrgRole;
  status: "active";
};

type InviteRow = {
  id: string;
  email: string;
  role: OrgRole;
  expiresAt: string;
  status: "pending" | "expired";
};

type OrgPayload = {
  organizationId: string;
  canInvite: boolean;
  members: MemberRow[];
  invitations: InviteRow[];
};

const ROLE_LABEL: Record<OrgRole, string> = {
  owner: "Владелец",
  admin: "Админ",
  manager: "Менеджер",
  employee: "Сотрудник",
};

function statusLabel(
  kind: "member" | "invite",
  status: MemberRow["status"] | InviteRow["status"],
): string {
  if (kind === "member" && status === "active") return "Активен";
  if (status === "pending") return "Ожидает";
  return "Истёк";
}

export function OrganizationAdmin() {
  const [data, setData] = useState<OrgPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Exclude<OrgRole, "owner">>("employee");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/organization", { credentials: "include" });
      const json = (await res.json().catch(() => ({}))) as OrgPayload & {
        error?: string;
      };
      if (!res.ok) {
        setLoadError(json.error ?? "Не удалось загрузить данные");
        setData(null);
        return;
      }
      setData({
        organizationId: json.organizationId,
        canInvite: json.canInvite,
        members: json.members ?? [],
        invitations: json.invitations ?? [],
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const orgHeaders = useMemo((): Record<string, string> => {
    if (!data?.organizationId) return {};
    return { "X-Organization-Id": data.organizationId };
  }, [data?.organizationId]);

  const submitInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.organizationId) return;
    setInviteError(null);
    setInviteBusy(true);
    try {
      const res = await fetch("/api/organization/invite", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...orgHeaders },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setInviteError(json.error ?? "Ошибка отправки");
        return;
      }
      setInviteEmail("");
      setInviteOpen(false);
      await load();
    } finally {
      setInviteBusy(false);
    }
  };

  const revoke = async (invitationId: string) => {
    if (!data?.organizationId) return;
    setRevokeId(invitationId);
    try {
      const qs = new URLSearchParams({ organizationId: data.organizationId });
      const res = await fetch(`/api/organization/invitations/${invitationId}?${qs}`, {
        method: "DELETE",
        credentials: "include",
        headers: orgHeaders,
      });
      if (res.ok) await load();
    } finally {
      setRevokeId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            Организация
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Участники и приглашения.</p>
        </div>
        {data?.canInvite ? (
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <Button
              type="button"
              size="sm"
              variant={inviteOpen ? "secondary" : "default"}
              onClick={() => {
                setInviteOpen((v) => !v);
                setInviteError(null);
              }}
            >
              {inviteOpen ? "Отмена" : "Пригласить"}
            </Button>
            {inviteOpen ? (
              <form
                onSubmit={submitInvite}
                className="flex w-full max-w-md flex-col gap-2 rounded-lg border border-border bg-card p-3 sm:min-w-[320px]"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="org-invite-email">Email</Label>
                  <Input
                    id="org-invite-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="org-invite-role">Роль</Label>
                  <select
                    id="org-invite-role"
                    className={cn(
                      "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm",
                      "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    )}
                    value={inviteRole}
                    onChange={(e) =>
                      setInviteRole(e.target.value as Exclude<OrgRole, "owner">)
                    }
                  >
                    <option value="employee">Сотрудник</option>
                    <option value="manager">Менеджер</option>
                    <option value="admin">Админ</option>
                  </select>
                </div>
                {inviteError ? (
                  <p className="text-sm text-destructive" role="alert">
                    {inviteError}
                  </p>
                ) : null}
                <Button type="submit" size="sm" disabled={inviteBusy}>
                  {inviteBusy ? "Отправка…" : "Отправить приглашение"}
                </Button>
              </form>
            ) : null}
          </div>
        ) : null}
      </div>

      {loadError ? (
        <p className="text-sm text-destructive" role="alert">
          {loadError}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      ) : data ? (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                <th className="px-3 py-2 font-medium">Имя</th>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Роль</th>
                <th className="px-3 py-2 font-medium">Статус</th>
                <th className="px-3 py-2 font-medium w-[120px]" />
              </tr>
            </thead>
            <tbody>
              {data.members.map((m) => (
                <tr key={m.membershipId} className="border-b border-border/80">
                  <td className="px-3 py-2.5 text-foreground">
                    {m.name ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">{m.email ?? "—"}</td>
                  <td className="px-3 py-2.5">{ROLE_LABEL[m.role]}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {statusLabel("member", m.status)}
                  </td>
                  <td className="px-3 py-2.5" />
                </tr>
              ))}
              {data.invitations.map((inv) => (
                <tr key={inv.id} className="border-b border-border/80 bg-muted/10">
                  <td className="px-3 py-2.5 text-muted-foreground">—</td>
                  <td className="px-3 py-2.5">{inv.email}</td>
                  <td className="px-3 py-2.5">{ROLE_LABEL[inv.role]}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {statusLabel("invite", inv.status)}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {data.canInvite &&
                    (inv.status === "pending" || inv.status === "expired") ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-destructive hover:text-destructive"
                        disabled={revokeId === inv.id}
                        onClick={() => void revoke(inv.id)}
                      >
                        {revokeId === inv.id ? "…" : "Отозвать"}
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.members.length === 0 && data.invitations.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Нет участников.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
