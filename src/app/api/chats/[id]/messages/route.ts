import { jsonCreated, jsonError, jsonOk } from "@/lib/server/http/json-response";
import { resolveOrganizationId } from "@/lib/server/auth/membership";
import { requireUser } from "@/lib/server/auth/session";
import { ApiError } from "@/lib/server/errors";
import { isUuid } from "@/lib/server/http/uuid";
import {
  serviceAppendUserMessageAndPlaceholder,
  serviceListMessages,
} from "@/lib/server/services/chat-service";

function orgHeader(request: Request): string | null {
  return request.headers.get("x-organization-id");
}

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteCtx) {
  try {
    const { id } = await context.params;
    if (!isUuid(id)) {
      throw new ApiError("Invalid thread id", 400, "invalid_thread_id");
    }
    const user = await requireUser();
    const { organizationId } = await resolveOrganizationId(user.id, orgHeader(request));
    const messages = await serviceListMessages(user.id, organizationId, id);
    return jsonOk({ organizationId, threadId: id, messages });
  } catch (e) {
    return jsonError(e);
  }
}

type PostBody = {
  content: string;
  title?: string;
  scenarioId?: string | null;
  organizationId?: string;
};

export async function POST(request: Request, context: RouteCtx) {
  try {
    const { id } = await context.params;
    if (!isUuid(id)) {
      throw new ApiError("Invalid thread id", 400, "invalid_thread_id");
    }
    const user = await requireUser();
    const json = (await request.json().catch(() => ({}))) as PostBody;
    const { organizationId } = await resolveOrganizationId(
      user.id,
      json.organizationId?.trim() ?? orgHeader(request),
    );
    const result = await serviceAppendUserMessageAndPlaceholder(
      user.id,
      organizationId,
      id,
      typeof json.content === "string" ? json.content : "",
      { title: json.title, scenarioId: json.scenarioId },
    );
    return jsonCreated(result);
  } catch (e) {
    return jsonError(e);
  }
}
