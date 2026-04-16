import "server-only";

import { ApiError } from "@/lib/server/errors";
import { createAdminSupabaseClient } from "@/lib/server/supabase/admin";
import type { LLMChatMessage } from "@/types";

/** Первый день месяца UTC в формате YYYY-MM-DD (совпадает с `month` в БД). */
export function utcMonthStartIso(d = new Date()): string {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);
}

export function estimateTokensFromText(s: string): number {
  return Math.max(1, Math.ceil(s.length / 4));
}

export function estimateTokensFromMessagesAndReply(
  messages: LLMChatMessage[],
  reply: string,
): number {
  const joined = messages.map((m) => m.content).join("\n") + reply;
  return estimateTokensFromText(joined);
}

export async function getOrgMonthlyTokenLimit(
  organizationId: string,
): Promise<number | null> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("org_llm_settings")
    .select("monthly_token_limit")
    .eq("organization_id", organizationId)
    .eq("enabled", true);

  if (error) {
    throw new ApiError(error.message, 500, "token_limit_fetch_failed");
  }

  const limits = (data ?? [])
    .map((r) => r.monthly_token_limit)
    .filter((v): v is number => typeof v === "number" && v > 0);
  if (limits.length === 0) return null;
  return Math.max(...limits);
}

export async function getUserMonthlyTokensUsed(
  organizationId: string,
  userId: string,
  month = utcMonthStartIso(),
): Promise<number> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("token_usage")
    .select("tokens_used")
    .eq("org_id", organizationId)
    .eq("user_id", userId)
    .eq("month", month)
    .maybeSingle();

  if (error) {
    throw new ApiError(error.message, 500, "token_usage_fetch_failed");
  }
  return Number(data?.tokens_used ?? 0);
}

export async function incrementTokenUsage(params: {
  organizationId: string;
  userId: string;
  tokens: number;
  month?: string;
}): Promise<void> {
  const delta = Math.max(0, Math.floor(params.tokens));
  if (delta <= 0) return;

  const admin = createAdminSupabaseClient();
  const month = params.month ?? utcMonthStartIso();
  const { error } = await admin.rpc("increment_token_usage", {
    p_org_id: params.organizationId,
    p_user_id: params.userId,
    p_month: month,
    p_delta: delta,
  });

  if (error) {
    throw new ApiError(error.message, 500, "token_usage_increment_failed");
  }
}

export async function assertUnderMonthlyTokenLimit(
  organizationId: string,
  userId: string,
): Promise<void> {
  const limit = await getOrgMonthlyTokenLimit(organizationId);
  if (limit == null) return;

  const used = await getUserMonthlyTokensUsed(organizationId, userId);
  if (used >= limit) {
    throw new ApiError(
      "Достигнут месячный лимит токенов",
      429,
      "token_limit_exceeded",
    );
  }
}

export type MeTokenUsage = {
  used: number;
  limit: number | null;
  percent: number | null;
};

export async function getMeTokenUsage(
  userId: string,
  organizationId: string | null,
): Promise<MeTokenUsage> {
  if (!organizationId) {
    return { used: 0, limit: null, percent: null };
  }

  const [used, limit] = await Promise.all([
    getUserMonthlyTokensUsed(organizationId, userId),
    getOrgMonthlyTokenLimit(organizationId),
  ]);

  const percent =
    limit != null && limit > 0
      ? Math.min(100, Math.round((used / limit) * 100))
      : null;

  return { used, limit, percent };
}
