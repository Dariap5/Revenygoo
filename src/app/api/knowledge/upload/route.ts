import { randomUUID } from "node:crypto";

import {
  requireOrgMember,
  resolveOrganizationId,
} from "@/lib/server/auth/membership";
import { requireUser } from "@/lib/server/auth/session";
import { ApiError } from "@/lib/server/errors";
import { jsonError, jsonCreated } from "@/lib/server/http/json-response";
import {
  assertKnowledgeUploadAllowed,
  KNOWLEDGE_BUCKET,
  sanitizeKnowledgeStorageName,
} from "@/lib/server/knowledge/knowledge-upload";
import { createAdminSupabaseClient } from "@/lib/server/supabase/admin";

function orgHeader(request: Request): string | null {
  return request.headers.get("x-organization-id");
}

function orgFromForm(form: FormData): string | null {
  const v = form.get("organizationId");
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new ApiError("Ожидается поле file", 400, "validation_error");
    }

    const { organizationId } = await resolveOrganizationId(
      user.id,
      orgFromForm(form) ?? orgHeader(request),
    );
    await requireOrgMember(user.id, organizationId);

    const { contentType } = assertKnowledgeUploadAllowed(file.name, file.size);
    const safeName = sanitizeKnowledgeStorageName(file.name);
    const id = randomUUID();
    const objectPath = `${organizationId}/${id}/${safeName}`;

    const buf = Buffer.from(await file.arrayBuffer());
    const admin = createAdminSupabaseClient();

    const { error: upErr } = await admin.storage
      .from(KNOWLEDGE_BUCKET)
      .upload(objectPath, buf, {
        contentType,
        upsert: false,
      });

    if (upErr) {
      throw new ApiError(
        upErr.message || "Ошибка загрузки в хранилище",
        502,
        "storage_upload_failed",
      );
    }

    const { data: row, error: insErr } = await admin
      .from("knowledge_sources")
      .insert({
        id,
        org_id: organizationId,
        name: file.name.replace(/^.*[/\\]/, "").trim() || safeName,
        file_path: objectPath,
        size: file.size,
        status: "processing",
      })
      .select("id, org_id, name, file_path, size, status, created_at")
      .single();

    if (insErr || !row) {
      await admin.storage.from(KNOWLEDGE_BUCKET).remove([objectPath]);
      throw new ApiError(
        insErr?.message ?? "Не удалось сохранить запись",
        500,
        "knowledge_insert_failed",
      );
    }

    return jsonCreated({
      item: {
        id: row.id,
        orgId: row.org_id,
        name: row.name,
        filePath: row.file_path,
        size: row.size,
        status: row.status,
        createdAt: row.created_at,
      },
    });
  } catch (e) {
    return jsonError(e);
  }
}
