import { jsonCreated, jsonError, jsonOk } from "@/lib/server/http/json-response";
import { resolveOrganizationId } from "@/lib/server/auth/membership";
import { requireUser } from "@/lib/server/auth/session";
import {
  serviceCreateThread,
  serviceListThreads,
} from "@/lib/server/services/chat-service";

function orgHeader(request: Request): string | null {
  return request.headers.get("x-organization-id");
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { organizationId } = await resolveOrganizationId(user.id, orgHeader(request));
    const threads = await serviceListThreads(user.id, organizationId);
    return jsonOk({ organizationId, threads });
  } catch (e) {
    return jsonError(e);
  }
}

type PostBody = {
  organizationId?: string;
  id?: string;
  title?: string;
  scenarioId?: string | null;
};

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const json = (await request.json().catch(() => ({}))) as PostBody;
    const { organizationId } = await resolveOrganizationId(
      user.id,
      json.organizationId?.trim() ?? orgHeader(request),
    );
    const thread = await serviceCreateThread(user.id, organizationId, {
      id: json.id,
      title: json.title,
      scenarioId: json.scenarioId,
    });
    return jsonCreated({ organizationId, thread });
  } catch (e) {
    return jsonError(e);
  }
}
