import { ApiError } from "@/lib/server/errors";
import type { OrgRole } from "@/lib/server/supabase/database.types";
import { createServerSupabaseClient } from "@/lib/server/supabase/server";
import {
  listMembershipRowsForUser,
  listOrganizationNames,
} from "@/lib/server/repositories/memberships-repository";

export type OrganizationMembership = {
  membershipId: string;
  organizationId: string;
  organizationName: string;
  role: OrgRole;
};

export async function listMemberships(
  userId: string,
): Promise<OrganizationMembership[]> {
  const supabase = await createServerSupabaseClient();
  const rows = await listMembershipRowsForUser(supabase, userId);
  const orgIds = [...new Set(rows.map((r) => r.organization_id))];
  const names = await listOrganizationNames(supabase, orgIds);

  return rows.map((row) => ({
    membershipId: row.id,
    organizationId: row.organization_id,
    organizationName: names.get(row.organization_id) ?? "",
    role: row.role,
  }));
}

/**
 * Resolves organization: explicit header wins, otherwise first membership.
 */
export async function resolveOrganizationId(
  userId: string,
  headerOrgId: string | null,
): Promise<{ organizationId: string; memberships: OrganizationMembership[] }> {
  const memberships = await listMemberships(userId);
  if (memberships.length === 0) {
    throw new ApiError(
      "No organization membership. Seed an organization and organization_members in Supabase.",
      403,
      "no_org_membership",
    );
  }

  if (headerOrgId?.trim()) {
    const hit = memberships.find((m) => m.organizationId === headerOrgId.trim());
    if (!hit) {
      throw new ApiError("Forbidden for this organization", 403, "org_forbidden");
    }
    return { organizationId: headerOrgId.trim(), memberships };
  }

  return { organizationId: memberships[0].organizationId, memberships };
}

export async function requireOrgMember(
  userId: string,
  organizationId: string,
): Promise<OrganizationMembership> {
  const memberships = await listMemberships(userId);
  const hit = memberships.find((m) => m.organizationId === organizationId);
  if (!hit) {
    throw new ApiError("Forbidden for this organization", 403, "org_forbidden");
  }
  return hit;
}

/** Только owner или admin организации. */
export async function requireOrgAdminAccess(
  userId: string,
  organizationId: string,
): Promise<OrganizationMembership> {
  const hit = await requireOrgMember(userId, organizationId);
  if (hit.role !== "owner" && hit.role !== "admin") {
    throw new ApiError("Требуются права администратора", 403, "admin_required");
  }
  return hit;
}
