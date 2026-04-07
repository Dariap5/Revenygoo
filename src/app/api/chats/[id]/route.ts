import { jsonError, jsonOk } from "@/lib/server/http/json-response";
import { resolveOrganizationId } from "@/lib/server/auth/membership";
import { requireUser } from "@/lib/server/auth/session";
import { isUuid } from "@/lib/server/http/uuid";
import {
  serviceDeleteThread,
  serviceGetThread,
  serviceUpdateThread,
} from "@/lib/server/services/chat-service";
import { ApiError } from "@/lib/server/errors";

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
    const thread = await serviceGetThread(user.id, organizationId, id);
    return jsonOk({ organizationId, thread });
  } catch (e) {
    return jsonError(e);
  }
}

type PatchBody = {
  title?: string;
  pinned?: boolean;
};

export async function PATCH(request: Request, context: RouteCtx) {
  try {
    const { id } = await context.params;
    if (!isUuid(id)) {
      throw new ApiError("Invalid thread id", 400, "invalid_thread_id");
    }
    const user = await requireUser();
    const { organizationId } = await resolveOrganizationId(user.id, orgHeader(request));
    const json = (await request.json().catch(() => ({}))) as PatchBody;
    const thread = await serviceUpdateThread(user.id, organizationId, id, {
      title: json.title,
      pinned: json.pinned,
    });
    return jsonOk({ organizationId, thread });
  } catch (e) {
    return jsonError(e);
  }
}

export async function DELETE(_request: Request, context: RouteCtx) {
  try {
    const { id } = await context.params;
    if (!isUuid(id)) {
      throw new ApiError("Invalid thread id", 400, "invalid_thread_id");
    }
    const user = await requireUser();
    const { organizationId } = await resolveOrganizationId(user.id, orgHeader(_request));
    await serviceDeleteThread(user.id, organizationId, id);
    return jsonOk({ organizationId, ok: true as const });
  } catch (e) {
    return jsonError(e);
  }
}
