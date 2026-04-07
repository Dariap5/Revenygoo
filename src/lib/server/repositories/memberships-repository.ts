import type { SupabaseClient } from "@supabase/supabase-js";

import { ApiError } from "@/lib/server/errors";
import type { Database, OrgRole } from "@/lib/server/supabase/database.types";

export type MembershipRow = {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrgRole;
};

export async function listMembershipRowsForUser(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<MembershipRow[]> {
  const { data, error } = await supabase
    .from("organization_members")
    .select("id, organization_id, user_id, role")
    .eq("user_id", userId);

  if (error) {
    throw new ApiError(error.message, 500, "membership_query_failed");
  }
  return (data as MembershipRow[] | null) ?? [];
}

export async function listOrganizationNames(
  supabase: SupabaseClient<Database>,
  organizationIds: string[],
): Promise<Map<string, string>> {
  if (organizationIds.length === 0) {
    return new Map();
  }
  const { data, error } = await supabase
    .from("organizations")
    .select("id, name")
    .in("id", organizationIds);

  if (error) {
    throw new ApiError(error.message, 500, "organizations_query_failed");
  }
  const map = new Map<string, string>();
  for (const row of data ?? []) {
    map.set(row.id, row.name);
  }
  return map;
}
