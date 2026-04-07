import { listMemberships } from "@/lib/server/auth/membership";
import { getProfileById } from "@/lib/server/repositories/profiles-repository";
import { createServerSupabaseClient } from "@/lib/server/supabase/server";
import type { SessionUser } from "@/lib/server/auth/session";

export async function buildMePayload(user: SessionUser) {
  const supabase = await createServerSupabaseClient();
  const [profile, memberships] = await Promise.all([
    getProfileById(supabase, user.id).catch(() => null),
    listMemberships(user.id),
  ]);

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
  };
}
