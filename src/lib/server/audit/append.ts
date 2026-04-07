import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/lib/server/supabase/database.types";

export type AppendAuditInput = {
  organizationId: string;
  actorUserId: string;
  eventType: string;
  resourceType?: string | null;
  resourceId?: string | null;
  payload?: Json;
};

export async function appendAuditEvent(
  supabase: SupabaseClient<Database>,
  input: AppendAuditInput,
): Promise<void> {
  const { error } = await supabase.from("audit_events").insert({
    organization_id: input.organizationId,
    actor_user_id: input.actorUserId,
    event_type: input.eventType,
    resource_type: input.resourceType ?? null,
    resource_id: input.resourceId ?? null,
    payload: input.payload ?? {},
  });
  if (error) {
    console.error("[audit] insert failed", error.message);
  }
}
