import type { SupabaseClient } from "@supabase/supabase-js";

import { ApiError } from "@/lib/server/errors";
import type { Database, Json } from "@/lib/server/supabase/database.types";

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

export async function updateChatMessageContentForUserThread(
  supabase: SupabaseClient<Database>,
  params: {
    messageId: string;
    threadId: string;
    organizationId: string;
    userId: string;
    content: string;
    metadata?: Json;
  },
) {
  const thread = await getThreadForUser(
    supabase,
    params.threadId,
    params.organizationId,
    params.userId,
  );
  if (!thread) {
    throw new ApiError("Thread not found", 404, "thread_not_found");
  }

  const { data, error } = await supabase
    .from("chat_messages")
    .update({
      content: params.content,
      metadata: params.metadata ?? {},
    })
    .eq("id", params.messageId)
    .eq("thread_id", params.threadId)
    .eq("organization_id", params.organizationId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new ApiError(error.message, 500, "message_update_failed");
  }
  if (!data) {
    throw new ApiError("Message not found", 404, "message_not_found");
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

export async function updateThreadForUser(
  supabase: SupabaseClient<Database>,
  params: {
    threadId: string;
    organizationId: string;
    userId: string;
    title?: string;
    pinned?: boolean;
  },
) {
  const patch: Database["public"]["Tables"]["chat_threads"]["Update"] = {};
  if (params.title !== undefined) patch.title = params.title;
  if (params.pinned !== undefined) patch.pinned = params.pinned;
  if (Object.keys(patch).length === 0) {
    return getThreadForUser(
      supabase,
      params.threadId,
      params.organizationId,
      params.userId,
    );
  }

  const { data, error } = await supabase
    .from("chat_threads")
    .update(patch)
    .eq("id", params.threadId)
    .eq("organization_id", params.organizationId)
    .eq("user_id", params.userId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new ApiError(error.message, 500, "thread_update_failed");
  }
  return data;
}

export async function deleteThreadForUser(
  supabase: SupabaseClient<Database>,
  threadId: string,
  organizationId: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from("chat_threads")
    .delete()
    .eq("id", threadId)
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .select("id");

  if (error) {
    throw new ApiError(error.message, 500, "thread_delete_failed");
  }
  if (!data?.length) {
    return null;
  }
  return data[0];
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
