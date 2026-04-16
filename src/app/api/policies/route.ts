import {
  requireOrgAdminAccess,
  requireOrgMember,
  resolveOrganizationId,
} from "@/lib/server/auth/membership";
import { requireUser } from "@/lib/server/auth/session";
import type { DLPType } from "@/lib/server/dlp/scanner";
import { ALL_DLP_TYPES } from "@/lib/server/dlp/scanner";
import { ApiError } from "@/lib/server/errors";
import { jsonCreated, jsonError, jsonOk } from "@/lib/server/http/json-response";
import { createServerSupabaseClient } from "@/lib/server/supabase/server";
import type { Database, DlpPolicyAction, DlpPolicyAppliesTo } from "@/lib/server/supabase/database.types";

function orgHeader(request: Request): string | null {
  return request.headers.get("x-organization-id");
}

const ALLOWED_ACTIONS = new Set(["warn", "block", "redact"] as const);
const ALLOWED_APPLIES_TO = new Set(["all", "role", "user"] as const);
const ALLOWED_TYPES = new Set<string>(ALL_DLP_TYPES);

function parseEnabledTypes(input: unknown): DLPType[] {
  if (!Array.isArray(input)) return [];
  const out: DLPType[] = [];
  for (const x of input) {
    if (typeof x === "string" && ALLOWED_TYPES.has(x) && !out.includes(x as DLPType)) {
      out.push(x as DLPType);
    }
  }
  return out;
}

function mapPolicy(row: {
  id: string;
  org_id: string;
  name: string;
  enabled_types: string[];
  action: string;
  applies_to: string;
  target_id: string | null;
  priority: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}) {
  return {
    id: row.id,
    orgId: row.org_id,
    name: row.name,
    enabledTypes: row.enabled_types,
    action: row.action,
    appliesTo: row.applies_to,
    targetId: row.target_id,
    priority: row.priority,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { organizationId } = await resolveOrganizationId(user.id, orgHeader(request));
    const member = await requireOrgMember(user.id, organizationId);
    const canManagePolicies = member.role === "owner" || member.role === "admin";

    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from("dlp_policies")
      .select(
        "id, org_id, name, enabled_types, action, applies_to, target_id, priority, active, created_at, updated_at",
      )
      .eq("org_id", organizationId)
      .order("active", { ascending: false })
      .order("priority", { ascending: false })
      .order("updated_at", { ascending: false });

    if (error) {
      throw new ApiError(error.message, 500, "policies_list_failed");
    }

    return jsonOk({
      organizationId,
      policies: (data ?? []).map(mapPolicy),
      canManagePolicies,
    });
  } catch (e) {
    return jsonError(e);
  }
}

type PostBody = {
  organizationId?: string;
  name?: string;
  enabledTypes?: unknown;
  action?: string;
  appliesTo?: string;
  targetId?: string | null;
  priority?: number;
  active?: boolean;
};

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const json = (await request.json().catch(() => ({}))) as PostBody;
    const { organizationId } = await resolveOrganizationId(
      user.id,
      json.organizationId?.trim() ?? orgHeader(request),
    );
    await requireOrgAdminAccess(user.id, organizationId);

    const name = typeof json.name === "string" ? json.name.trim() : "";
    if (!name) {
      throw new ApiError("name is required", 400, "validation_error");
    }
    if (!json.action || !ALLOWED_ACTIONS.has(json.action as "warn" | "block" | "redact")) {
      throw new ApiError("invalid action", 400, "validation_error");
    }
    if (
      !json.appliesTo ||
      !ALLOWED_APPLIES_TO.has(json.appliesTo as "all" | "role" | "user")
    ) {
      throw new ApiError("invalid appliesTo", 400, "validation_error");
    }
    const targetId =
      typeof json.targetId === "string" && json.targetId.trim()
        ? json.targetId.trim()
        : null;
    if (json.appliesTo === "all" && targetId !== null) {
      throw new ApiError("targetId must be null for appliesTo=all", 400, "validation_error");
    }
    if (json.appliesTo !== "all" && !targetId) {
      throw new ApiError("targetId is required for appliesTo=user|role", 400, "validation_error");
    }

    const enabledTypes = parseEnabledTypes(json.enabledTypes);
    const priority =
      typeof json.priority === "number" && Number.isFinite(json.priority)
        ? Math.trunc(json.priority)
        : 0;
    const active = json.active !== false;

    const supabase = await createServerSupabaseClient();
    const row: Database["public"]["Tables"]["dlp_policies"]["Insert"] = {
      org_id: organizationId,
      name,
      enabled_types: enabledTypes,
      action: json.action as DlpPolicyAction,
      applies_to: json.appliesTo as DlpPolicyAppliesTo,
      target_id: targetId,
      priority,
      active,
    };
    const { data, error } = await supabase
      .from("dlp_policies")
      .insert(row)
      .select(
        "id, org_id, name, enabled_types, action, applies_to, target_id, priority, active, created_at, updated_at",
      )
      .single();

    if (error) {
      throw new ApiError(error.message, 500, "policy_create_failed");
    }

    return jsonCreated({ organizationId, policy: mapPolicy(data) });
  } catch (e) {
    return jsonError(e);
  }
}
