import { requireOrgAdminAccess, resolveOrganizationId } from "@/lib/server/auth/membership";
import { requireUser } from "@/lib/server/auth/session";
import { ApiError } from "@/lib/server/errors";
import { jsonCreated, jsonError, jsonOk } from "@/lib/server/http/json-response";
import { createServerSupabaseClient } from "@/lib/server/supabase/server";

function orgHeader(request: Request): string | null {
  return request.headers.get("x-organization-id");
}

const CATEGORY_SET = new Set([
  "communication",
  "code",
  "analysis",
  "documents",
] as const);

type ScenarioCategory = "communication" | "code" | "analysis" | "documents";

function categoryOf(value: unknown): ScenarioCategory | null {
  if (typeof value !== "string") return null;
  return CATEGORY_SET.has(value as ScenarioCategory)
    ? (value as ScenarioCategory)
    : null;
}

function mapRow(row: {
  id: string;
  title: string;
  description: string;
  category: string;
  prompt_template: string;
  is_public: boolean;
  org_id: string | null;
}) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    promptTemplate: row.prompt_template,
    isPublic: row.is_public,
    organizationId: row.org_id,
  };
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { organizationId } = await resolveOrganizationId(user.id, orgHeader(request));
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from("scenario_templates")
      .select("id, title, description, category, prompt_template, is_public, org_id")
      .or(`is_public.eq.true,org_id.eq.${organizationId}`)
      .order("is_public", { ascending: false })
      .order("title", { ascending: true });

    if (error) {
      throw new ApiError(error.message, 500, "scenarios_list_failed");
    }

    return jsonOk({
      organizationId,
      scenarios: (data ?? []).map(mapRow),
    });
  } catch (e) {
    return jsonError(e);
  }
}

type PostBody = {
  title?: string;
  description?: string;
  category?: string;
  promptTemplate?: string;
  organizationId?: string;
};

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const json = (await request.json().catch(() => ({}))) as PostBody;
    const { organizationId } = await resolveOrganizationId(
      user.id,
      json.organizationId?.trim() ?? orgHeader(request),
    );
    await requireOrgAdminAccess(user.id, organizationId);

    const title = json.title?.trim() ?? "";
    const description = json.description?.trim() ?? "";
    const promptTemplate = json.promptTemplate?.trim() ?? "";
    const category = categoryOf(json.category);

    if (!title) {
      throw new ApiError("Укажите название шаблона", 400, "validation_error");
    }
    if (!description) {
      throw new ApiError("Укажите описание шаблона", 400, "validation_error");
    }
    if (!promptTemplate) {
      throw new ApiError("Укажите prompt template", 400, "validation_error");
    }
    if (!category) {
      throw new ApiError("Некорректная категория", 400, "validation_error");
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("scenario_templates")
      .insert({
        org_id: organizationId,
        title,
        description,
        category,
        prompt_template: promptTemplate,
        is_public: false,
        created_by: user.id,
      })
      .select("id, title, description, category, prompt_template, is_public, org_id")
      .single();

    if (error || !data) {
      throw new ApiError(error?.message ?? "Не удалось создать шаблон", 500, "scenario_create_failed");
    }

    return jsonCreated({ scenario: mapRow(data) });
  } catch (e) {
    return jsonError(e);
  }
}
