import { ApiError } from "@/lib/server/errors";
import type { OrgRole } from "@/lib/server/supabase/database.types";

import type { OrganizationMembership } from "@/lib/server/auth/membership";

const RANK: Record<OrgRole, number> = {
  employee: 1,
  manager: 2,
  admin: 3,
  owner: 4,
};

export function assertMinimumRole(
  member: OrganizationMembership,
  minimum: OrgRole,
): void {
  if (RANK[member.role] < RANK[minimum]) {
    throw new ApiError("Insufficient role", 403, "forbidden_role");
  }
}

export function hasMinimumRole(member: OrganizationMembership, minimum: OrgRole): boolean {
  return RANK[member.role] >= RANK[minimum];
}
