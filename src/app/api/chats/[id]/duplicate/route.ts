import { jsonCreated, jsonError } from "@/lib/server/http/json-response";
import { resolveOrganizationId } from "@/lib/server/auth/membership";
import { requireUser } from "@/lib/server/auth/session";
import { isUuid } from "@/lib/server/http/uuid";
import { serviceDuplicateThread } from "@/lib/server/services/chat-service";
import { ApiError } from "@/lib/server/errors";

function orgHeader(request: Request): string | null {
  return request.headers.get("x-organization-id");
}

type RouteCtx = { params: Promise<{ id: string }> };

type PostBody = { title?: string };

export async function POST(request: Request, context: RouteCtx) {
  try {
    const { id: sourceId } = await context.params;
    if (!isUuid(sourceId)) {
      throw new ApiError("Invalid thread id", 400, "invalid_thread_id");
    }
    const user = await requireUser();
    const { organizationId } = await resolveOrganizationId(user.id, orgHeader(request));
    const json = (await request.json().catch(() => ({}))) as PostBody;
    const result = await serviceDuplicateThread(
      user.id,
      organizationId,
      sourceId,
      { title: json.title },
    );
    return jsonCreated({ organizationId, ...result });
  } catch (e) {
    return jsonError(e);
  }
}
