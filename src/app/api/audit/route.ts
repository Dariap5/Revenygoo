import { createAdminSupabaseClient } from "@/lib/server/supabase/admin";
import { requireOrgMember, resolveOrganizationId } from "@/lib/server/auth/membership";
import { requireUser } from "@/lib/server/auth/session";
import { ApiError } from "@/lib/server/errors";
import { isUuid } from "@/lib/server/http/uuid";
import { jsonError, jsonOk } from "@/lib/server/http/json-response";
import type { Json } from "@/lib/server/supabase/database.types";
import { createServerSupabaseClient } from "@/lib/server/supabase/server";

function orgHeader(request: Request): string | null {
  return request.headers.get("x-organization-id");
}

const MAX_LIMIT = 200;
const CSV_MAX_ROWS = 10_000;

function parseLimit(v: string | null): number {
  const n = v ? Number.parseInt(v, 10) : 50;
  if (!Number.isFinite(n) || n < 1) return 50;
  return Math.min(MAX_LIMIT, n);
}

function parseOffset(v: string | null): number {
  const n = v ? Number.parseInt(v, 10) : 0;
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

function parsePayload(payload: Json): {
  model: string | null;
  tokens: number | null;
  dlpTypes: string[];
  dlpCount: number;
} {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { model: null, tokens: null, dlpTypes: [], dlpCount: 0 };
  }
  const p = payload as Record<string, unknown>;
  const model =
    typeof p.model === "string"
      ? p.model
      : typeof p.modelLabel === "string"
        ? p.modelLabel
        : typeof p.unifiedModelId === "string"
          ? p.unifiedModelId
          : null;
  let tokens: number | null = null;
  if (typeof p.totalTokens === "number" && Number.isFinite(p.totalTokens)) {
    tokens = Math.trunc(p.totalTokens);
  } else if (typeof p.tokens === "number" && Number.isFinite(p.tokens)) {
    tokens = Math.trunc(p.tokens);
  } else if (typeof p.promptTokens === "number" && typeof p.completionTokens === "number") {
    tokens = Math.trunc(p.promptTokens + p.completionTokens);
  }
  const dlp = p.dlp_findings;
  if (!dlp || typeof dlp !== "object" || Array.isArray(dlp)) {
    return { model, tokens, dlpTypes: [], dlpCount: 0 };
  }
  const d = dlp as Record<string, unknown>;
  const countRaw = d.count;
  const count =
    typeof countRaw === "number" && Number.isFinite(countRaw) ? Math.trunc(countRaw) : 0;
  const typesRaw = d.types;
  const dlpTypes = Array.isArray(typesRaw)
    ? typesRaw.filter((x): x is string => typeof x === "string")
    : [];
  return { model, tokens, dlpTypes, dlpCount: count };
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function rowToCsvLine(fields: string[]): string {
  return fields.map(csvEscape).join(",");
}

type AuditFilterOpts = {
  userId: string;
  dateFrom: string;
  dateTo: string;
  eventType: string;
  hasDlp: string;
};

/** Postgrest builder: тип шире, чем `Filterable`, чтобы цепочка `.order()` проходила в TS. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function withAuditFilters(q: any, organizationId: string, opts: AuditFilterOpts) {
  let x = q.eq("organization_id", organizationId);
  if (opts.userId && isUuid(opts.userId)) {
    x = x.eq("actor_user_id", opts.userId);
  }
  if (opts.dateFrom) {
    x = x.gte("created_at", `${opts.dateFrom}T00:00:00.000Z`);
  }
  if (opts.dateTo) {
    x = x.lte("created_at", `${opts.dateTo}T23:59:59.999Z`);
  }
  if (opts.eventType) {
    x = x.eq("event_type", opts.eventType);
  }
  if (opts.hasDlp === "true") {
    x = x.eq("has_dlp_findings", true);
  } else if (opts.hasDlp === "false") {
    x = x.eq("has_dlp_findings", false);
  }
  return x;
}

const AUDIT_ROW_SELECT =
  "id, organization_id, actor_user_id, event_type, resource_type, resource_id, payload, has_dlp_findings, created_at";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);
    const format = url.searchParams.get("format");
    const { organizationId } = await resolveOrganizationId(user.id, orgHeader(request));
    const member = await requireOrgMember(user.id, organizationId);
    const isPrivileged = member.role === "owner" || member.role === "admin";

    const limit = parseLimit(url.searchParams.get("limit"));
    const offset = parseOffset(url.searchParams.get("offset"));
    const userId = url.searchParams.get("user_id")?.trim() ?? "";
    const dateFrom = url.searchParams.get("date_from")?.trim() ?? "";
    const dateTo = url.searchParams.get("date_to")?.trim() ?? "";
    const eventType = url.searchParams.get("event_type")?.trim() ?? "";
    const hasDlp = url.searchParams.get("has_dlp_findings")?.trim().toLowerCase() ?? "";

    const supabase = await createServerSupabaseClient();
    const filterOpts: AuditFilterOpts = { userId, dateFrom, dateTo, eventType, hasDlp };

    const { data: typeRows, error: typeErr } = await supabase
      .from("audit_events")
      .select("event_type")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(4000);
    if (typeErr) {
      throw new ApiError(typeErr.message, 500, "audit_types_failed");
    }
    const eventTypes = [...new Set((typeRows ?? []).map((r) => r.event_type))].sort();

    const countQuery = withAuditFilters(
      supabase.from("audit_events").select("id", { count: "exact", head: true }),
      organizationId,
      filterOpts,
    );
    const { count, error: countError } = await countQuery;
    if (countError) {
      throw new ApiError(countError.message, 500, "audit_count_failed");
    }
    const total = count ?? 0;

    let rows: {
      id: string;
      organization_id: string;
      actor_user_id: string | null;
      event_type: string;
      resource_type: string | null;
      resource_id: string | null;
      payload: Json;
      has_dlp_findings: boolean;
      created_at: string;
    }[] = [];

    if (format === "csv") {
      const n = Math.min(CSV_MAX_ROWS, total);
      if (n > 0) {
        const { data, error } = await withAuditFilters(
          supabase.from("audit_events").select(AUDIT_ROW_SELECT),
          organizationId,
          filterOpts,
        )
          .order("created_at", { ascending: false })
          .range(0, n - 1);
        if (error) throw new ApiError(error.message, 500, "audit_list_failed");
        rows = data ?? [];
      }
    } else {
      const { data, error } = await withAuditFilters(
        supabase.from("audit_events").select(AUDIT_ROW_SELECT),
        organizationId,
        filterOpts,
      )
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) throw new ApiError(error.message, 500, "audit_list_failed");
      rows = data ?? [];
    }

    const actorIds = [
      ...new Set(rows.map((r) => r.actor_user_id).filter((id): id is string => Boolean(id))),
    ];
    const profileMap = new Map<string, string | null>();
    if (isPrivileged && actorIds.length > 0) {
      try {
        const admin = createAdminSupabaseClient();
        const { data: profs } = await admin
          .from("profiles")
          .select("id, display_name")
          .in("id", actorIds);
        for (const p of profs ?? []) {
          profileMap.set(p.id, p.display_name ?? null);
        }
      } catch {
        /* service role missing */
      }
    }

    const items = rows.map((r) => {
      const parsed = parsePayload(r.payload);
      const aid = r.actor_user_id;
      const displayName = aid ? (profileMap.get(aid) ?? null) : null;
      return {
        id: r.id,
        createdAt: r.created_at,
        actorUserId: r.actor_user_id,
        actorDisplayName: displayName,
        eventType: r.event_type,
        resourceType: r.resource_type,
        resourceId: r.resource_id,
        model: parsed.model,
        tokens: parsed.tokens,
        dlpCount: parsed.dlpCount,
        dlpTypes: parsed.dlpTypes,
        hasDlpFindings: Boolean(r.has_dlp_findings),
      };
    });

    if (format === "csv") {
      const header = rowToCsvLine([
        "created_at",
        "actor_user_id",
        "actor_display_name",
        "event_type",
        "model",
        "dlp_count",
        "dlp_types",
        "tokens",
        "resource_type",
        "resource_id",
      ]);
      const lines = items.map((it) =>
        rowToCsvLine([
          it.createdAt,
          it.actorUserId ?? "",
          it.actorDisplayName ?? "",
          it.eventType,
          it.model ?? "",
          String(it.dlpCount),
          it.dlpTypes.join(";"),
          it.tokens === null ? "" : String(it.tokens),
          it.resourceType ?? "",
          it.resourceId ?? "",
        ]),
      );
      const body = [header, ...lines].join("\n");
      return new Response(body, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="audit-export.csv"',
          "Cache-Control": "no-store",
        },
      });
    }

    return jsonOk({
      organizationId,
      items,
      total,
      limit,
      offset,
      eventTypes,
    });
  } catch (e) {
    return jsonError(e);
  }
}
