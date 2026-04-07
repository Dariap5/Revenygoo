import { jsonOk } from "@/lib/server/http/json-response";

export async function GET() {
  const url = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim());
  const anon = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim());
  const service = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());

  return jsonOk({
    ok: true,
    version: "foundation-v1",
    supabase: {
      publicConfigured: url && anon,
      serviceRoleConfigured: service,
    },
  });
}
