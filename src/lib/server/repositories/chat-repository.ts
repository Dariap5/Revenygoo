import type { SupabaseClient } from "@supabase/supabase-js";

import { ApiError } from "@/lib/server/errors";
import type { Database } from "@/lib/server/supabase/database.types";

export async function listThreadsForUserOrg(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from("chat_threads")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new ApiError(error.message, 500, "threads_list_failed");
  }
  return data ?? [];
}

export async function getThreadForUser(
  supabase: SupabaseClient<Database>,
  threadId: string,
  organizationId: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from("chat_threads")
    .select("*")
    .eq("id", threadId)
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new ApiError(error.message, 500, "thread_fetch_failed");
  }
  return data;
}

export async function insertThread(
  supabase: SupabaseClient<Database>,
  row: Database["public"]["Tables"]["chat_threads"]["Insert"],
) {
  const { data, error } = await supabase
    .from("chat_threads")
    .insert(row)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new ApiError(
        "Thread id already in use",
        409,
        "thread_id_conflict",
      );
    }
    throw new ApiError(error.message, 500, "thread_insert_failed");
  }
  return data;
}

export async function touchThreadUpdatedAt(
  supabase: SupabaseClient<Database>,
  threadId: string,
) {
  const { error } = await supabase
    .from("chat_threads")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", threadId);

  if (error) {
    console.error("[chat] touchThreadUpdatedAt", error.message);
  }
}

export async function listMessagesForThread(
  supabase: SupabaseClient<Database>,
  threadId: string,
  organizationId: string,
) {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("thread_id", threadId)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new ApiError(error.message, 500, "messages_list_failed");
  }
  return data ?? [];
}

export async function insertMessage(
  supabase: SupabaseClient<Database>,
  row: Database["public"]["Tables"]["chat_messages"]["Insert"],
) {
  const { data, error } = await supabase
    .from("chat_messages")
    .insert(row)
    .select("*")
    .single();

  if (error) {
    throw new ApiError(error.message, 500, "message_insert_failed");
  }
  return data;
}

export async function getThreadById(
  supabase: SupabaseClient<Database>,
  threadId: string,
) {
  const { data, error } = await supabase
    .from("chat_threads")
    .select("*")
    .eq("id", threadId)
    .maybeSingle();

  if (error) {
    throw new ApiError(error.message, 500, "thread_fetch_failed");
  }
  return data;
}

export async function ensureThreadForUser(
  supabase: SupabaseClient<Database>,
  params: {
    threadId: string;
    organizationId: string;
    userId: string;
    title?: string;
    scenarioId?: string | null;
  },
) {
  const existing = await getThreadById(supabase, params.threadId);
  if (existing) {
    if (
      existing.user_id !== params.userId ||
      existing.organization_id !== params.organizationId
    ) {
      throw new ApiError("Thread forbidden", 403, "thread_forbidden");
    }
    return existing;
  }

  return insertThread(supabase, {
    id: params.threadId,
    organization_id: params.organizationId,
    user_id: params.userId,
    title: params.title ?? "Новый чат",
    scenario_id: params.scenarioId ?? null,
  });
}
