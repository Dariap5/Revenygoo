import { listMemberships } from "@/lib/server/auth/membership";
import type { SessionUser } from "@/lib/server/auth/session";
import { getProfileById } from "@/lib/server/repositories/profiles-repository";
import { getMeTokenUsage } from "@/lib/server/token-usage";
import { createServerSupabaseClient } from "@/lib/server/supabase/server";

export async function buildMePayload(user: SessionUser) {
  const supabase = await createServerSupabaseClient();
  const [profile, memberships] = await Promise.all([
    getProfileById(supabase, user.id).catch(() => null),
    listMemberships(user.id),
  ]);

  const primaryOrgId = memberships[0]?.organizationId ?? null;
  const usage = await getMeTokenUsage(user.id, primaryOrgId);

  return {
    user: {
      id: user.id,
      email: user.email ?? null,
    },
    profile: profile
      ? {
          id: profile.id,
          displayName: profile.display_name,
          avatarUrl: profile.avatar_url,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at,
        }
      : null,
    memberships: memberships.map((m) => ({
      membershipId: m.membershipId,
      organizationId: m.organizationId,
      organizationName: m.organizationName,
      role: m.role,
    })),
    usage,
  };
}
