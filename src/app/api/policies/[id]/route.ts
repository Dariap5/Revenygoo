import { requireOrgAdminAccess, resolveOrganizationId } from "@/lib/server/auth/membership";
import { requireUser } from "@/lib/server/auth/session";
import type { DLPType } from "@/lib/server/dlp/scanner";
import { ALL_DLP_TYPES } from "@/lib/server/dlp/scanner";
import { ApiError } from "@/lib/server/errors";
import { isUuid } from "@/lib/server/http/uuid";
import { jsonError, jsonOk } from "@/lib/server/http/json-response";
import { createServerSupabaseClient } from "@/lib/server/supabase/server";

function orgHeader(request: Request): string | null {
  return request.headers.get("x-organization-id");
}

const ALLOWED_ACTIONS = new Set(["warn", "block", "redact"] as const);
const ALLOWED_APPLIES_TO = new Set(["all", "role", "user"] as const);
const ALLOWED_TYPES = new Set<string>(ALL_DLP_TYPES);

type RouteCtx = { params: Promise<{ id: string }> };

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

type PatchBody = {
  organizationId?: string;
  name?: string;
  enabledTypes?: unknown;
  action?: string;
  appliesTo?: string;
  targetId?: string | null;
  priority?: number;
  active?: boolean;
};

export async function PATCH(request: Request, context: RouteCtx) {
  try {
    const { id } = await context.params;
    if (!isUuid(id)) {
      throw new ApiError("Invalid id", 400, "invalid_id");
    }
    const user = await requireUser();
    const json = (await request.json().catch(() => ({}))) as PatchBody;
    const { organizationId } = await resolveOrganizationId(
      user.id,
      json.organizationId?.trim() ?? orgHeader(request),
    );
    await requireOrgAdminAccess(user.id, organizationId);
    const supabase = await createServerSupabaseClient();
    const { data: existing, error: existingError } = await supabase
      .from("dlp_policies")
      .select("id, applies_to, target_id")
      .eq("id", id)
      .eq("org_id", organizationId)
      .maybeSingle();
    if (existingError) {
      throw new ApiError(existingError.message, 500, "policy_fetch_failed");
    }
    if (!existing) {
      throw new ApiError("Policy not found", 404, "not_found");
    }

    const patch: Record<string, unknown> = {};
    if (typeof json.name === "string" && json.name.trim()) {
      patch.name = json.name.trim();
    }
    if (json.action !== undefined) {
      if (!ALLOWED_ACTIONS.has(json.action as "warn" | "block" | "redact")) {
        throw new ApiError("invalid action", 400, "validation_error");
      }
      patch.action = json.action;
    }
    if (json.appliesTo !== undefined) {
      if (!ALLOWED_APPLIES_TO.has(json.appliesTo as "all" | "role" | "user")) {
        throw new ApiError("invalid appliesTo", 400, "validation_error");
      }
      patch.applies_to = json.appliesTo;
    }
    if (json.enabledTypes !== undefined) {
      patch.enabled_types = parseEnabledTypes(json.enabledTypes);
    }
    if (typeof json.priority === "number" && Number.isFinite(json.priority)) {
      patch.priority = Math.trunc(json.priority);
    }
    if (typeof json.active === "boolean") {
      patch.active = json.active;
    }
    if (json.targetId !== undefined) {
      patch.target_id =
        typeof json.targetId === "string" && json.targetId.trim()
          ? json.targetId.trim()
          : null;
    }

    const nextAppliesTo =
      (patch.applies_to as string | undefined) ?? existing.applies_to;
    const nextTargetId =
      (patch.target_id as string | null | undefined) ?? existing.target_id;
    if (nextAppliesTo === "all" && nextTargetId && nextTargetId.length > 0) {
      throw new ApiError("targetId must be null for appliesTo=all", 400, "validation_error");
    }
    if (
      (nextAppliesTo === "user" || nextAppliesTo === "role") &&
      (!nextTargetId || nextTargetId.length === 0)
    ) {
      throw new ApiError("targetId is required for appliesTo=user|role", 400, "validation_error");
    }

    if (Object.keys(patch).length === 0) {
      throw new ApiError("No fields to update", 400, "validation_error");
    }

    const { data, error } = await supabase
      .from("dlp_policies")
      .update(patch)
      .eq("id", id)
      .eq("org_id", organizationId)
      .select(
        "id, org_id, name, enabled_types, action, applies_to, target_id, priority, active, created_at, updated_at",
      )
      .maybeSingle();

    if (error) {
      throw new ApiError(error.message, 500, "policy_update_failed");
    }
    if (!data) {
      throw new ApiError("Policy not found", 404, "not_found");
    }

    return jsonOk({ organizationId, policy: mapPolicy(data) });
  } catch (e) {
    return jsonError(e);
  }
}

export async function DELETE(request: Request, context: RouteCtx) {
  try {
    const { id } = await context.params;
    if (!isUuid(id)) {
      throw new ApiError("Invalid id", 400, "invalid_id");
    }
    const user = await requireUser();
    const { organizationId } = await resolveOrganizationId(user.id, orgHeader(request));
    await requireOrgAdminAccess(user.id, organizationId);

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("dlp_policies")
      .update({ active: false })
      .eq("id", id)
      .eq("org_id", organizationId)
      .select(
        "id, org_id, name, enabled_types, action, applies_to, target_id, priority, active, created_at, updated_at",
      )
      .maybeSingle();

    if (error) {
      throw new ApiError(error.message, 500, "policy_delete_failed");
    }
    if (!data) {
      throw new ApiError("Policy not found", 404, "not_found");
    }

    return jsonOk({ organizationId, policy: mapPolicy(data), deleted: true });
  } catch (e) {
    return jsonError(e);
  }
}
