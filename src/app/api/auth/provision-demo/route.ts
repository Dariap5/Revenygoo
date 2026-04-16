import { ApiError } from "@/lib/server/errors";
import { jsonError, jsonOk } from "@/lib/server/http/json-response";
import { createAdminSupabaseClient } from "@/lib/server/supabase/admin";

const ORG_SLUG = "demo";
const ORG_ID = "a1111111-1111-4111-8111-111111111111";

function demoEmailPassword() {
  return {
    email: process.env.NEXT_PUBLIC_DEMO_USER_EMAIL?.trim() || "demo@revenygo.local",
    password: process.env.NEXT_PUBLIC_DEMO_USER_PASSWORD?.trim() || "demo",
  };
}

async function findUserIdByEmail(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  email: string,
): Promise<string | null> {
  const want = email.toLowerCase();
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error || !data?.users?.length) {
      break;
    }
    const hit = data.users.find((u) => u.email?.toLowerCase() === want);
    if (hit) {
      return hit.id;
    }
    if (data.users.length < 100) {
      break;
    }
  }
  return null;
}

/**
 * Создаёт демо-пользователя через Admin API (корректные поля Auth) и привязывает к org `demo`.
 * Включите DEMO_AUTO_PROVISION=true только для внутренних / демо-окружений.
 */
export async function POST() {
  if (process.env.DEMO_AUTO_PROVISION !== "true") {
    return jsonError(new ApiError("Not found", 404));
  }

  const { email, password } = demoEmailPassword();
  const admin = createAdminSupabaseClient();

  let userId: string | null = null;
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (created?.user?.id) {
    userId = created.user.id;
  } else if (createErr) {
    const msg = createErr.message.toLowerCase();
    if (
      msg.includes("already") ||
      msg.includes("registered") ||
      msg.includes("duplicate")
    ) {
      userId = await findUserIdByEmail(admin, email);
    } else {
      return jsonError(new ApiError(createErr.message, 500));
    }
  }

  if (!userId) {
    return jsonError(new ApiError("Не удалось получить id демо-пользователя.", 500));
  }

  const { data: orgRow } = await admin
    .from("organizations")
    .select("id")
    .eq("slug", ORG_SLUG)
    .maybeSingle();

  let orgId = orgRow?.id as string | undefined;

  if (!orgId) {
    const { data: inserted, error: orgInsErr } = await admin
      .from("organizations")
      .insert({
        id: ORG_ID,
        name: "Demo Organization",
        slug: ORG_SLUG,
      })
      .select("id")
      .maybeSingle();

    if (!orgInsErr && inserted?.id) {
      orgId = inserted.id;
    } else {
      const { data: again } = await admin
        .from("organizations")
        .select("id")
        .eq("slug", ORG_SLUG)
        .maybeSingle();
      orgId = again?.id;
    }
  }

  if (!orgId) {
    return jsonError(new ApiError("Не удалось создать организацию demo.", 500));
  }

  const { error: memErr } = await admin.from("organization_members").upsert(
    {
      organization_id: orgId,
      user_id: userId,
      role: "owner",
    },
    { onConflict: "organization_id,user_id" },
  );

  if (memErr) {
    return jsonError(new ApiError(memErr.message, 500));
  }

  return jsonOk({ ok: true });
}
