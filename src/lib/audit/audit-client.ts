export type AuditListItem = {
  id: string;
  createdAt: string;
  actorUserId: string | null;
  actorDisplayName: string | null;
  eventType: string;
  resourceType: string | null;
  resourceId: string | null;
  model: string | null;
  tokens: number | null;
  dlpCount: number;
  dlpTypes: string[];
  hasDlpFindings: boolean;
};

export type AuditListResult =
  | {
      kind: "ok";
      organizationId: string;
      items: AuditListItem[];
      total: number;
      limit: number;
      offset: number;
      eventTypes: string[];
    }
  | { kind: "unauthorized" }
  | { kind: "forbidden" }
  | { kind: "http_error"; status: number }
  | { kind: "network" };

export type AuditListParams = {
  limit?: number;
  offset?: number;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  eventType?: string;
  hasDlpFindings?: "" | "true" | "false";
};

function buildQuery(params: AuditListParams): string {
  const q = new URLSearchParams();
  if (params.limit != null) q.set("limit", String(params.limit));
  if (params.offset != null) q.set("offset", String(params.offset));
  if (params.userId?.trim()) q.set("user_id", params.userId.trim());
  if (params.dateFrom) q.set("date_from", params.dateFrom);
  if (params.dateTo) q.set("date_to", params.dateTo);
  if (params.eventType) q.set("event_type", params.eventType);
  if (params.hasDlpFindings) q.set("has_dlp_findings", params.hasDlpFindings);
  const s = q.toString();
  return s ? `?${s}` : "";
}

export async function fetchAuditList(params: AuditListParams): Promise<AuditListResult> {
  try {
    const res = await fetch(`/api/audit${buildQuery(params)}`, {
      credentials: "include",
      cache: "no-store",
    });
    if (res.status === 401) return { kind: "unauthorized" };
    if (res.status === 403) return { kind: "forbidden" };
    if (!res.ok) return { kind: "http_error", status: res.status };
    const data = (await res.json()) as {
      organizationId?: string;
      items?: AuditListItem[];
      total?: number;
      limit?: number;
      offset?: number;
      eventTypes?: string[];
    };
    return {
      kind: "ok",
      organizationId: data.organizationId ?? "",
      items: data.items ?? [],
      total: data.total ?? 0,
      limit: data.limit ?? 50,
      offset: data.offset ?? 0,
      eventTypes: data.eventTypes ?? [],
    };
  } catch {
    return { kind: "network" };
  }
}

export function buildAuditCsvUrl(params: AuditListParams): string {
  const q = new URLSearchParams();
  if (params.userId?.trim()) q.set("user_id", params.userId.trim());
  if (params.dateFrom) q.set("date_from", params.dateFrom);
  if (params.dateTo) q.set("date_to", params.dateTo);
  if (params.eventType) q.set("event_type", params.eventType);
  if (params.hasDlpFindings) q.set("has_dlp_findings", params.hasDlpFindings);
  q.set("format", "csv");
  return `/api/audit?${q.toString()}`;
}
