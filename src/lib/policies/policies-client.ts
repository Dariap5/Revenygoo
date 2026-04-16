export type DlpPolicyAction = "warn" | "block" | "redact";
export type DlpPolicyAppliesTo = "all" | "role" | "user";
export type DlpPolicyType =
  | "PHONE"
  | "EMAIL"
  | "API_KEY"
  | "CREDIT_CARD"
  | "PASSPORT_RF"
  | "SNILS"
  | "JWT"
  | "IP_ADDRESS";

export type DlpPolicyDto = {
  id: string;
  orgId: string;
  name: string;
  enabledTypes: DlpPolicyType[];
  action: DlpPolicyAction;
  appliesTo: DlpPolicyAppliesTo;
  targetId: string | null;
  priority: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

type FetchResult<T> =
  | { kind: "ok"; data: T }
  | { kind: "unauthorized" }
  | { kind: "forbidden" }
  | { kind: "http_error"; status: number }
  | { kind: "network" };

async function apiFetch<T>(url: string, init?: RequestInit): Promise<FetchResult<T>> {
  try {
    const res = await fetch(url, {
      ...init,
      credentials: "include",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    if (res.status === 401) return { kind: "unauthorized" };
    if (res.status === 403) return { kind: "forbidden" };
    if (!res.ok) return { kind: "http_error", status: res.status };
    const data = (await res.json()) as T;
    return { kind: "ok", data };
  } catch {
    return { kind: "network" };
  }
}

export async function fetchPolicies() {
  const r = await apiFetch<{
    policies?: DlpPolicyDto[];
    canManagePolicies?: boolean;
  }>("/api/policies");
  if (r.kind !== "ok") return r;
  return {
    kind: "ok" as const,
    policies: r.data.policies ?? [],
    canManagePolicies: Boolean(r.data.canManagePolicies),
  };
}

/** Все DLP-типы в порядке для чекбоксов формы. */
export const ALL_DLP_POLICY_TYPES: readonly DlpPolicyType[] = [
  "EMAIL",
  "PHONE",
  "API_KEY",
  "JWT",
  "CREDIT_CARD",
  "PASSPORT_RF",
  "SNILS",
  "IP_ADDRESS",
] as const;

export async function createPolicy(payload: {
  name: string;
  enabledTypes: DlpPolicyType[];
  action: DlpPolicyAction;
  appliesTo: DlpPolicyAppliesTo;
  targetId: string | null;
  priority: number;
  active: boolean;
}) {
  const r = await apiFetch<{ policy?: DlpPolicyDto }>("/api/policies", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (r.kind !== "ok") return r;
  if (!r.data.policy) return { kind: "network" as const };
  return { kind: "ok" as const, policy: r.data.policy };
}

export async function patchPolicy(
  id: string,
  payload: Partial<{
    name: string;
    enabledTypes: DlpPolicyType[];
    action: DlpPolicyAction;
    appliesTo: DlpPolicyAppliesTo;
    targetId: string | null;
    priority: number;
    active: boolean;
  }>,
) {
  const r = await apiFetch<{ policy?: DlpPolicyDto }>(`/api/policies/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  if (r.kind !== "ok") return r;
  if (!r.data.policy) return { kind: "network" as const };
  return { kind: "ok" as const, policy: r.data.policy };
}

export async function softDeletePolicy(id: string) {
  const r = await apiFetch<{ policy?: DlpPolicyDto }>(`/api/policies/${id}`, {
    method: "DELETE",
  });
  if (r.kind !== "ok") return r;
  if (!r.data.policy) return { kind: "network" as const };
  return { kind: "ok" as const, policy: r.data.policy };
}
