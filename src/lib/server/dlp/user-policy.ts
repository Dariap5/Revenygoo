import type { SupabaseClient } from "@supabase/supabase-js";

import type { DLPType } from "@/lib/server/dlp/scanner";
import { ALL_DLP_TYPES } from "@/lib/server/dlp/scanner";
import type { OrgRole } from "@/lib/server/supabase/database.types";
import type { Database } from "@/lib/server/supabase/database.types";

const ALLOWED_ACTIONS = new Set(["warn", "block", "redact"] as const);
const ALLOWED_APPLIES_TO = new Set(["all", "role", "user"] as const);

export type DlpPolicyAction = "warn" | "block" | "redact";
export type DlpPolicyAppliesTo = "all" | "role" | "user";

export type DlpPolicy = {
  id: string;
  name: string;
  action: DlpPolicyAction;
  applies_to: DlpPolicyAppliesTo;
  target_id: string | null;
  priority: number;
  active: boolean;
  enabled_types: DLPType[];
};

export const DLP_ROLE_TARGET_IDS: Record<OrgRole, string> = {
  owner: "00000000-0000-0000-0000-000000000001",
  admin: "00000000-0000-0000-0000-000000000002",
  manager: "00000000-0000-0000-0000-000000000003",
  employee: "00000000-0000-0000-0000-000000000004",
};

const typeSet = new Set<string>(ALL_DLP_TYPES);

function parseEnabledTypes(raw: unknown): DLPType[] {
  if (!Array.isArray(raw)) return [];
  const out: DLPType[] = [];
  for (const x of raw) {
    if (typeof x === "string" && typeSet.has(x)) {
      out.push(x as DLPType);
    }
  }
  return out;
}

/**
 * Resolves most specific active policy:
 * user > role > all; inside same scope higher priority first.
 */
export async function getUserPolicy(
  supabase: SupabaseClient<Database>,
  userId: string,
  organizationId: string,
): Promise<DlpPolicy | null> {
  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (membershipError || !membership?.role) {
    return null;
  }
  const roleTargetId = DLP_ROLE_TARGET_IDS[membership.role];
  if (!roleTargetId) {
    return null;
  }

  const { data, error } = await supabase
    .from("dlp_policies")
    .select("id, name, action, applies_to, target_id, priority, active, enabled_types")
    .eq("org_id", organizationId)
    .eq("active", true)
    .or(
      [
        "applies_to.eq.all",
        `and(applies_to.eq.user,target_id.eq.${userId})`,
        `and(applies_to.eq.role,target_id.eq.${roleTargetId})`,
      ].join(","),
    )
    .order("priority", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error || !data?.length) {
    return null;
  }
  const rank = (appliesTo: DlpPolicyAppliesTo): number => {
    if (appliesTo === "user") return 3;
    if (appliesTo === "role") return 2;
    return 1;
  };
  const top = [...data]
    .filter(
      (x) =>
        typeof x.action === "string" &&
        ALLOWED_ACTIONS.has(x.action as DlpPolicyAction) &&
        typeof x.applies_to === "string" &&
        ALLOWED_APPLIES_TO.has(x.applies_to as DlpPolicyAppliesTo),
    )
    .sort((a, b) => {
      const scope = rank(b.applies_to as DlpPolicyAppliesTo) - rank(a.applies_to as DlpPolicyAppliesTo);
      if (scope !== 0) return scope;
      return (b.priority ?? 0) - (a.priority ?? 0);
    })[0];

  if (!top) {
    return null;
  }

  return {
    id: top.id,
    name: top.name,
    action: top.action as DlpPolicyAction,
    applies_to: top.applies_to as DlpPolicyAppliesTo,
    target_id: top.target_id,
    priority: top.priority ?? 0,
    active: Boolean(top.active),
    enabled_types: parseEnabledTypes(top.enabled_types),
  };
}
