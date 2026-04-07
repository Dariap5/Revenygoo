import { jsonError, jsonOk } from "@/lib/server/http/json-response";
import { requireUser } from "@/lib/server/auth/session";
import { buildMePayload } from "@/lib/server/services/me-service";

export async function GET() {
  try {
    const user = await requireUser();
    const body = await buildMePayload(user);
    return jsonOk(body);
  } catch (e) {
    return jsonError(e);
  }
}
