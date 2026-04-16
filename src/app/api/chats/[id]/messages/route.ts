import { NextResponse } from "next/server";

import { appendAuditEvent } from "@/lib/server/audit/append";
import { resolveOrganizationId } from "@/lib/server/auth/membership";
import { requireUser } from "@/lib/server/auth/session";
import { restoreText, scanText } from "@/lib/server/dlp/scanner";
import { getUserPolicy } from "@/lib/server/dlp/user-policy";
import { ApiError, isApiError } from "@/lib/server/errors";
import { jsonError, jsonOk } from "@/lib/server/http/json-response";
import { isUuid } from "@/lib/server/http/uuid";
import type { LlmStreamUsage } from "@/lib/server/llm/router";
import { fetchOrgLlmSettings, streamLLMDeltas } from "@/lib/server/llm/router";
import {
  touchThreadUpdatedAt,
  updateChatMessageContentForUserThread,
} from "@/lib/server/repositories/chat-repository";
import {
  serviceAppendUserMessageAndPlaceholder,
  serviceListMessages,
} from "@/lib/server/services/chat-service";
import {
  assertUnderMonthlyTokenLimit,
  estimateTokensFromMessagesAndReply,
  incrementTokenUsage,
} from "@/lib/server/token-usage";
import { createServerSupabaseClient } from "@/lib/server/supabase/server";
import type { Json } from "@/lib/server/supabase/database.types";
import type { LLMChatMessage, MessageRole } from "@/types";

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
    const messages = await serviceListMessages(user.id, organizationId, id);
    return jsonOk({ organizationId, threadId: id, messages });
  } catch (e) {
    return jsonError(e);
  }
}

type PostBody = {
  content: string;
  title?: string;
  scenarioId?: string | null;
  organizationId?: string;
};

export async function POST(request: Request, context: RouteCtx) {
  try {
    const { id } = await context.params;
    if (!isUuid(id)) {
      throw new ApiError("Invalid thread id", 400, "invalid_thread_id");
    }
    const user = await requireUser();
    const json = (await request.json().catch(() => ({}))) as PostBody;
    const { organizationId } = await resolveOrganizationId(
      user.id,
      json.organizationId?.trim() ?? orgHeader(request),
    );
    const orgSettings = await fetchOrgLlmSettings(organizationId);
    if (!orgSettings) {
      throw new ApiError("LLM not configured", 503, "llm_not_configured");
    }
    await assertUnderMonthlyTokenLimit(organizationId, user.id);

    const trimmed =
      typeof json.content === "string" ? json.content.trim() : "";
    if (!trimmed) {
      throw new ApiError("content is required", 400, "validation_error");
    }

    const supabase = await createServerSupabaseClient();
    const policy = await getUserPolicy(supabase, user.id, organizationId);
    const enabledTypeSet = new Set(policy?.enabled_types ?? []);
    const dlpScan = scanText(trimmed, { enabledTypes: enabledTypeSet });
    const findings = dlpScan.findings;

    const dlpAuditPayload: Json = {
      dlp_findings: {
        count: findings.length,
        types: [...new Set(findings.map((f) => f.type))],
      },
    };

    if (findings.length > 0 && policy?.action === "block") {
      await appendAuditEvent(supabase, {
        organizationId,
        actorUserId: user.id,
        eventType: "chat.message.dlp_blocked",
        resourceType: "chat_thread",
        resourceId: id,
        payload: dlpAuditPayload,
      });
      return NextResponse.json(
        {
          blocked: true,
          findings: findings.map((f) => ({ type: f.type })),
        },
        { status: 403 },
      );
    }

    const persistedContent =
      findings.length > 0 ? dlpScan.redactedText : trimmed;
    const useLlmOriginalOnWarn =
      policy?.action === "warn" && findings.length > 0;
    const restoreAssistantOutput =
      findings.length > 0 && policy?.action === "redact";

    const result = await serviceAppendUserMessageAndPlaceholder(
      user.id,
      organizationId,
      id,
      trimmed,
      {
        title: json.title,
        scenarioId: json.scenarioId,
        persistedContent,
        auditPayloadExtras: dlpAuditPayload,
      },
    );

    const history = await serviceListMessages(user.id, organizationId, id);
    const last = history[history.length - 1];
    const lastMeta = last?.metadata;
    const historyForLlm =
      last?.role === "assistant" &&
      lastMeta &&
      typeof lastMeta === "object" &&
      "placeholder" in lastMeta &&
      (lastMeta as { placeholder?: unknown }).placeholder === true
        ? history.slice(0, -1)
        : history;

    const llmMessages: LLMChatMessage[] = historyForLlm
      .filter((m) => m.role === "user" || m.role === "assistant" || m.role === "system")
      .map((m) => ({
        role: m.role as MessageRole,
        content: m.content,
      }));

    if (useLlmOriginalOnWarn) {
      for (let i = llmMessages.length - 1; i >= 0; i--) {
        if (llmMessages[i]!.role === "user") {
          llmMessages[i] = { ...llmMessages[i]!, content: trimmed };
          break;
        }
      }
    }

    const assistantRow = result.messages.find((m) => m.role === "assistant");
    if (!assistantRow) {
      throw new ApiError("Assistant message missing", 500, "assistant_message_missing");
    }

    const encoder = new TextEncoder();
    const { readable, writable } = new TransformStream<string, Uint8Array>({
      transform(sseChunk, controller) {
        controller.enqueue(encoder.encode(sseChunk));
      },
    });
    const writer = writable.getWriter();

    const writeSse = async (event: string, data: unknown) => {
      await writer.write(
        `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
      );
    };

    void (async () => {
      try {
        await writeSse("meta", {
          organizationId,
          threadId: id,
          thread: result.thread,
          messages: result.messages,
        });

        let full = "";
        let streamUsage: LlmStreamUsage = {
          totalTokens: 0,
          promptTokens: null,
          completionTokens: null,
        };
        const llmGen = streamLLMDeltas(llmMessages, orgSettings);
        while (true) {
          const step = await llmGen.next();
          if (step.done) {
            streamUsage = step.value;
            break;
          }
          const d = step.value;
          full += d;
          if (!restoreAssistantOutput) {
            await writeSse("delta", { t: d });
          }
        }

        let finalText = full.trim() ? full : " ";
        if (restoreAssistantOutput) {
          finalText = restoreText(finalText, findings);
          if (!finalText.trim()) {
            finalText = " ";
          }
          // For redact mode we only emit restored content to the client.
          await writeSse("delta", { t: finalText });
        }

        const supabase = await createServerSupabaseClient();
        await updateChatMessageContentForUserThread(supabase, {
          messageId: assistantRow.id,
          threadId: id,
          organizationId,
          userId: user.id,
          content: finalText,
          metadata: {},
        });
        await touchThreadUpdatedAt(supabase, id);

        let billedTokens = streamUsage.totalTokens;
        if (billedTokens <= 0) {
          billedTokens = estimateTokensFromMessagesAndReply(
            llmMessages,
            finalText,
          );
        }
        await incrementTokenUsage({
          organizationId,
          userId: user.id,
          tokens: billedTokens,
        });

        await writeSse("done", { ok: true });
      } catch (e) {
        const message = isApiError(e) ? e.message : "Stream failed";
        const code = isApiError(e) ? e.code : undefined;
        try {
          await writeSse("error", { message, code });
        } catch {
          /* writer may be closed */
        }
      } finally {
        try {
          await writer.close();
        } catch {
          /* */
        }
      }
    })();

    return new Response(readable, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (e) {
    return jsonError(e);
  }
}
