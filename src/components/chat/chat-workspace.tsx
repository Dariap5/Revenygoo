"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { readChatUIPrefs, writeChatUIPrefs } from "@/lib/chat/chat-ui-prefs-storage";
import {
  clearChatApiBanner,
  setChatApiBanner,
} from "@/lib/chat/chat-api-banner-store";
import type { ChatMessagesResult } from "@/lib/chat/chat-backend-client";
import {
  fetchChatMessagesFromApi,
  isPersistedChatThreadId,
  postChatMessageToApi,
} from "@/lib/chat/chat-backend-client";
import {
  DEFAULT_UNIFIED_MODEL,
  getUnifiedModelDef,
  gptReasoningLabel,
  isGptThinkingModel,
} from "@/lib/chat/unified-chat-models";
import {
  CHAT_THREADS_CHANGED_EVENT,
  readChatThreads,
  syncChatThreadsFromBackend,
} from "@/lib/history/chat-threads-storage";
import type { ChatQuickAction } from "@/lib/mock/chat-quick-actions";
import type { ChatPromptTemplate } from "@/lib/mock/chat-templates";
import { mockChatThreads, NEW_CHAT_THREAD_ID } from "@/lib/mock/chats";
import {
  emptyThreadStarterCopy,
  mockMessagesByChatId,
  newChatEmptyCopy,
} from "@/lib/mock/messages";
import { getKnowledgeSourcesByIds } from "@/lib/mock/knowledge-sources";
import { getScenarioById } from "@/lib/mock/scenarios";
import {
  analyzeSafety,
  type SafetyCheckResult,
  safetySystemNotice,
} from "@/lib/mock/safety-check";
import {
  displayNameFromLogin,
  readWorkspaceSession,
} from "@/lib/session/workspace-session";
import type {
  ChatAttachmentPreview,
  ChatMessage,
  ChatThread,
  GptReasoningMode,
  UnifiedChatModelId,
} from "@/types";
import { chatColumnClassName } from "@/lib/chat/chat-column-layout";
import { resolveActiveChatKey } from "@/lib/chat/resolve-active-chat-key";
import { ChatComposer } from "./chat-composer";
import { ChatContextBar } from "./chat-context-bar";
import { ChatContextPickerDialog } from "./chat-context-picker-dialog";
import { ChatEmptyState } from "./chat-empty-state";
import { ChatMessageList } from "./chat-message-list";
import { ChatQuickActionsRow } from "./chat-quick-actions-row";
import { ChatTopBar } from "./chat-top-bar";
import { SafetyReviewDialog } from "./safety-review-dialog";

function firstNameFromSession(): string {
  const s = readWorkspaceSession();
  if (!s.login) return "";
  const full = displayNameFromLogin(s.login);
  return full.split(/\s+/)[0] ?? "";
}

function applyChatMessagesFetchResult(
  r: ChatMessagesResult,
  setMsgs: (m: ChatMessage[]) => void,
): void {
  if (r.kind === "ok") {
    clearChatApiBanner();
    setMsgs(r.messages);
    return;
  }
  if (r.kind === "unauthorized") {
    setChatApiBanner({ kind: "unauthorized" });
    setMsgs([]);
    return;
  }
  if (r.kind === "forbidden") {
    setChatApiBanner({ kind: "forbidden" });
    setMsgs([]);
    return;
  }
  if (r.kind === "http_error") {
    setChatApiBanner({
      kind: "request_failed",
      detail: `Не удалось загрузить сообщения (HTTP ${r.status}).`,
    });
    setMsgs([]);
    return;
  }
  // сеть / таймаут — без демо-подмены истории
  setMsgs([]);
}

const DEMO_ASSISTANT_BODY = `Краткий ответ (демо).

\`\`\`typescript
export function safeId(prefix: string) {
  return \`\${prefix}_\${crypto.randomUUID().slice(0, 8)}\`;
}
\`\`\`

Ниже — ссылки и черновик документа для скачивания.`;

export function ChatWorkspace({
  threads = mockChatThreads,
}: {
  threads?: ChatThread[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatParam = searchParams.get("chat");
  const scenarioParam = searchParams.get("scenario");

  const pendingDraftRef = useRef<string | null>(null);

  const [threadList, setThreadList] = useState<ChatThread[]>(threads);
  const [serverMessages, setServerMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    setThreadList(readChatThreads());
    const onSync = () => setThreadList(readChatThreads());
    window.addEventListener(CHAT_THREADS_CHANGED_EVENT, onSync);
    return () => window.removeEventListener(CHAT_THREADS_CHANGED_EVENT, onSync);
  }, []);

  const activeKey = useMemo(
    () => resolveActiveChatKey(chatParam, scenarioParam, threadList),
    [chatParam, scenarioParam, threadList],
  );

  const activeThread = useMemo((): ChatThread => {
    const found = threadList.find((t) => t.id === activeKey);
    if (found) return found;
    if (activeKey.startsWith("virtual:")) {
      const sid = activeKey.slice("virtual:".length);
      const s = getScenarioById(sid);
      return {
        id: activeKey,
        title: s.title,
        scenarioId: s.id,
        scenarioTitle: s.title,
        updatedAt: new Date().toISOString(),
        modelLabel: s.modelBadge,
        lastMessagePreview: "",
      };
    }
    return threadList[0];
  }, [threadList, activeKey]);

  const [unifiedModelId, setUnifiedModelId] = useState<UnifiedChatModelId>(
    DEFAULT_UNIFIED_MODEL,
  );
  const [gptReasoningMode, setGptReasoningMode] =
    useState<GptReasoningMode>("standard");

  const [draft, setDraft] = useState("");
  const [bulkDraft, setBulkDraft] = useState("");
  const [attachments, setAttachments] = useState<ChatAttachmentPreview[]>([]);
  const [geminiActiveTools, setGeminiActiveTools] = useState<Set<string>>(
    () => new Set(),
  );
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [assistantOverrides, setAssistantOverrides] = useState<
    Record<string, string>
  >({});
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [pendingSafety, setPendingSafety] = useState<SafetyCheckResult | null>(
    null,
  );
  const [contextByChat, setContextByChat] = useState<Record<string, string[]>>(
    {},
  );
  const [contextPickerOpen, setContextPickerOpen] = useState(false);

  useEffect(() => {
    const stored = readChatUIPrefs(activeKey);
    if (stored) {
      setUnifiedModelId(stored.unifiedModelId);
      setGptReasoningMode(stored.gptReasoningMode);
    } else {
      setUnifiedModelId(DEFAULT_UNIFIED_MODEL);
      setGptReasoningMode("standard");
    }
  }, [activeKey]);

  useEffect(() => {
    writeChatUIPrefs(activeKey, { unifiedModelId, gptReasoningMode });
  }, [activeKey, unifiedModelId, gptReasoningMode]);

  useEffect(() => {
    setLocalMessages([]);
    setAssistantOverrides({});
    const pending = pendingDraftRef.current;
    setDraft(pending ?? "");
    pendingDraftRef.current = null;
    setBulkDraft("");
    setSafetyOpen(false);
    setPendingSafety(null);
    setContextPickerOpen(false);
    setAttachments([]);
    setGeminiActiveTools(new Set());
  }, [activeKey]);

  useEffect(() => {
    let cancelled = false;
    if (!isPersistedChatThreadId(activeThread.id)) {
      setServerMessages([]);
      return () => {
        cancelled = true;
      };
    }
    (async () => {
      const r = await fetchChatMessagesFromApi(activeThread.id);
      if (!cancelled) {
        applyChatMessagesFetchResult(r, setServerMessages);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeThread.id]);

  const attachedContextIds = useMemo(
    () => contextByChat[activeThread.id] ?? [],
    [contextByChat, activeThread.id],
  );
  const attachedContextSources = useMemo(
    () => getKnowledgeSourcesByIds(attachedContextIds),
    [attachedContextIds],
  );

  const baseMessages = useMemo(() => {
    if (activeThread.id.startsWith("virtual:")) {
      return [];
    }
    if (isPersistedChatThreadId(activeThread.id)) {
      return serverMessages;
    }
    return mockMessagesByChatId[activeThread.id] ?? [];
  }, [activeThread.id, serverMessages]);

  const messages = useMemo(
    () =>
      [...baseMessages, ...localMessages].map((m) =>
        m.role === "assistant" && assistantOverrides[m.id]
          ? { ...m, content: assistantOverrides[m.id]! }
          : m,
      ),
    [baseMessages, localMessages, assistantOverrides],
  );

  const sendMeta = useMemo(() => {
    const def = getUnifiedModelDef(unifiedModelId);
    const gptR = isGptThinkingModel(unifiedModelId)
      ? gptReasoningLabel(gptReasoningMode)
      : undefined;
    return {
      unifiedModelId,
      modelLabel: def.label,
      gptReasoningLabel: gptR,
    };
  }, [unifiedModelId, gptReasoningMode]);

  const applyStarterPrompt = useCallback(
    (prompt: string, scenarioId?: string) => {
      if (messages.length === 0) {
        setDraft(prompt);
        return;
      }
      const currentSid = activeThread.scenarioId;
      if (scenarioId && scenarioId !== currentSid) {
        pendingDraftRef.current = prompt;
        router.push(`/chat?scenario=${encodeURIComponent(scenarioId)}`);
        return;
      }
      setDraft(prompt);
    },
    [router, activeThread.scenarioId, messages.length],
  );

  const onQuickActionPick = useCallback(
    (action: ChatQuickAction) => {
      applyStarterPrompt(action.prompt, action.scenarioId);
    },
    [applyStarterPrompt],
  );

  const onTemplatePick = useCallback(
    (template: ChatPromptTemplate) => {
      applyStarterPrompt(template.promptTemplate, template.scenarioId);
    },
    [applyStarterPrompt],
  );

  const appendUserAndStub = useCallback(
    (text: string, files: ChatAttachmentPreview[]) => {
      const trimmed = text.trim();
      if (!trimmed && files.length === 0) return;
      const uid = `local-${Date.now()}`;
      const userMsg: ChatMessage = {
        id: uid,
        role: "user",
        content: trimmed || "(вложение)",
        createdAt: new Date().toISOString(),
        attachments: files.length ? files : undefined,
        sendMeta,
      };
      const assistantMsg: ChatMessage = {
        id: `${uid}-a`,
        role: "assistant",
        content: DEMO_ASSISTANT_BODY,
        createdAt: new Date().toISOString(),
        citations: [
          {
            id: "c-demo-1",
            label: "TypeScript Handbook",
            url: "https://www.typescriptlang.org/docs/",
          },
          {
            id: "c-demo-2",
            label: "MDN: crypto.randomUUID",
            url: "https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID",
          },
        ],
        documentCards: [
          { id: "doc-demo-1", title: "Черновик_ответа.md" },
        ],
      };
      setLocalMessages((prev) => [...prev, userMsg, assistantMsg]);
    },
    [sendMeta],
  );

  const appendSafeVersionAndStub = useCallback(
    (safeText: string, files: ChatAttachmentPreview[]) => {
      const trimmed = safeText.trim();
      if (!trimmed && files.length === 0) return;
      const uid = `local-${Date.now()}`;
      const userMsg: ChatMessage = {
        id: uid,
        role: "user",
        content: trimmed || "(вложение)",
        createdAt: new Date().toISOString(),
        attachments: files.length ? files : undefined,
        sendMeta,
      };
      const systemMsg: ChatMessage = {
        id: `${uid}-sys`,
        role: "system",
        content: safetySystemNotice,
        createdAt: new Date().toISOString(),
      };
      const assistantMsg: ChatMessage = {
        id: `${uid}-a`,
        role: "assistant",
        content: DEMO_ASSISTANT_BODY,
        createdAt: new Date().toISOString(),
        citations: [
          {
            id: "c-demo-1",
            label: "TypeScript Handbook",
            url: "https://www.typescriptlang.org/docs/",
          },
        ],
        documentCards: [{ id: "doc-demo-1", title: "Черновик_ответа.md" }],
      };
      setLocalMessages((prev) => [...prev, userMsg, systemMsg, assistantMsg]);
    },
    [sendMeta],
  );

  const deliverToBackendOrDemo = useCallback(
    async (
      combined: string,
      files: ChatAttachmentPreview[],
      fallback: "stub" | "safe-stub",
    ) => {
      const trimmed = combined.trim();
      if (!trimmed && files.length === 0) return;
      const textPayload = trimmed || "(вложение)";
      // TODO: прикреплённые файлы — только в демо; загрузка в API позже
      const needNewPersistedId =
        activeThread.id === NEW_CHAT_THREAD_ID ||
        activeThread.id.startsWith("virtual:");
      const persistedThreadId = needNewPersistedId
        ? crypto.randomUUID()
        : activeThread.id;
      const scenarioForApi =
        activeThread.scenarioId ?? scenarioParam ?? undefined;

      const clearComposer = () => {
        setDraft("");
        setBulkDraft("");
        setAttachments([]);
      };

      const posted = await postChatMessageToApi(persistedThreadId, textPayload, {
        scenarioId: scenarioForApi ?? null,
        title: activeThread.title,
      });

      if (posted.kind === "ok") {
        clearChatApiBanner();
        if (needNewPersistedId) {
          const qs = new URLSearchParams({ chat: persistedThreadId });
          if (scenarioForApi) qs.set("scenario", scenarioForApi);
          router.replace(`/chat?${qs.toString()}`);
        }
        await syncChatThreadsFromBackend();
        const full = await fetchChatMessagesFromApi(persistedThreadId);
        applyChatMessagesFetchResult(full, setServerMessages);
        clearComposer();
        return;
      }

      if (posted.kind === "unauthorized") {
        setChatApiBanner({ kind: "unauthorized" });
        return;
      }
      if (posted.kind === "forbidden") {
        setChatApiBanner({ kind: "forbidden" });
        return;
      }
      if (posted.kind === "http_error") {
        setChatApiBanner({
          kind: "request_failed",
          detail: `Сообщение не отправлено (HTTP ${posted.status}).`,
        });
        return;
      }

      // Сеть / таймаут — единственный случай демо-fallback
      clearChatApiBanner();
      if (fallback === "stub") {
        appendUserAndStub(combined, files);
      } else {
        appendSafeVersionAndStub(combined, files);
      }
      clearComposer();
    },
    [
      activeThread.id,
      activeThread.title,
      activeThread.scenarioId,
      scenarioParam,
      router,
      appendUserAndStub,
      appendSafeVersionAndStub,
    ],
  );

  const onSend = useCallback(() => {
    const parts = [bulkDraft.trim(), draft.trim()].filter(Boolean);
    const combined = parts.join("\n\n");
    if (!combined.trim() && attachments.length === 0) return;
    const check = analyzeSafety(combined.trim() || "вложение");
    if (check.hasRisk) {
      setPendingSafety(check);
      setSafetyOpen(true);
      return;
    }
    void deliverToBackendOrDemo(combined, attachments, "stub");
  }, [deliverToBackendOrDemo, draft, bulkDraft, attachments]);

  const onSafetyBack = useCallback(() => {
    setSafetyOpen(false);
    setPendingSafety(null);
  }, []);

  const onSendSafeVersion = useCallback(() => {
    if (!pendingSafety) return;
    void deliverToBackendOrDemo(
      pendingSafety.safeText,
      attachments,
      "safe-stub",
    );
    setSafetyOpen(false);
    setPendingSafety(null);
  }, [deliverToBackendOrDemo, pendingSafety, attachments]);

  const onRegenerate = useCallback(() => {
    const combined = [...baseMessages, ...localMessages];
    const lastAssistant = [...combined]
      .reverse()
      .find((m) => m.role === "assistant");
    if (!lastAssistant) return;
    setAssistantOverrides((o) => ({
      ...o,
      [lastAssistant.id]:
        "Альтернативная формулировка (демо): тот же смысл, более лаконичный стиль.",
    }));
  }, [baseMessages, localMessages]);

  const onAddAttachments = useCallback((list: FileList | null) => {
    if (!list?.length) return;
    const next: ChatAttachmentPreview[] = [];
    for (let i = 0; i < list.length; i += 1) {
      const f = list.item(i);
      if (!f) continue;
      next.push({
        id: `f-${Date.now()}-${i}`,
        name: f.name,
        sizeLabel: `${Math.max(1, Math.round(f.size / 1024))} КБ`,
      });
    }
    setAttachments((prev) => [...prev, ...next]);
  }, []);

  const fn = firstNameFromSession();
  const emptyGreeting = fn ? `Добрый день, ${fn}` : "Добрый день";

  const emptyCopy =
    activeThread.id === NEW_CHAT_THREAD_ID
      ? newChatEmptyCopy
      : emptyThreadStarterCopy;

  const onEditUserMessage = useCallback((text: string) => {
    setDraft(text);
  }, []);

  const onToggleGeminiTool = useCallback((id: string) => {
    setGeminiActiveTools((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }, []);

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
        <ChatTopBar
          onOpenContextPicker={() => setContextPickerOpen(true)}
          onClearLocalMock={() => {
            setLocalMessages([]);
            setAssistantOverrides({});
            setDraft("");
            setBulkDraft("");
            setAttachments([]);
            if (isPersistedChatThreadId(activeThread.id)) {
              void fetchChatMessagesFromApi(activeThread.id).then((r) => {
                applyChatMessagesFetchResult(r, setServerMessages);
              });
            }
          }}
        />
        <ChatContextBar
          sources={attachedContextSources}
          onEdit={() => setContextPickerOpen(true)}
        />
        <div className="flex min-h-0 flex-1 flex-col items-center overflow-hidden bg-background">
          <div
            className={chatColumnClassName(
              "flex min-h-0 min-w-0 flex-1 flex-col",
            )}
          >
            <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto">
              <div className="flex min-h-0 flex-1 flex-col">
                {messages.length === 0 ? (
                  <ChatEmptyState
                    brandLabel="Revenygo"
                    greeting={emptyGreeting}
                    subtitle={
                      activeThread.id === NEW_CHAT_THREAD_ID
                        ? undefined
                        : emptyCopy.description
                    }
                    minimal={activeThread.id === NEW_CHAT_THREAD_ID}
                  >
                    <>
                      <ChatComposer
                        variant="empty"
                        value={draft}
                        onChange={setDraft}
                        onSend={onSend}
                        unifiedModelId={unifiedModelId}
                        onUnifiedModelChange={setUnifiedModelId}
                        gptReasoningMode={gptReasoningMode}
                        onGptReasoningModeChange={setGptReasoningMode}
                        bulkDraft={bulkDraft}
                        onClearBulkDraft={() => setBulkDraft("")}
                        attachments={attachments}
                        onRemoveAttachment={(id) =>
                          setAttachments((a) => a.filter((x) => x.id !== id))
                        }
                        onAddAttachments={onAddAttachments}
                        onLargeTextPaste={(text) => setBulkDraft(text)}
                        onOpenContextPicker={() => setContextPickerOpen(true)}
                        geminiActiveTools={geminiActiveTools}
                        onToggleGeminiTool={onToggleGeminiTool}
                      />
                      <div className="mt-4 w-full border-t border-[hsl(var(--border))] pt-4">
                        <ChatQuickActionsRow
                          onQuickAction={onQuickActionPick}
                          onTemplate={onTemplatePick}
                        />
                      </div>
                    </>
                  </ChatEmptyState>
                ) : (
                  <ChatMessageList
                    messages={messages}
                    onRegenerateLastAssistant={onRegenerate}
                    onEditUserMessage={onEditUserMessage}
                  />
                )}
              </div>
            </div>
            {messages.length > 0 ? (
              <>
                <ChatComposer
                  variant="dock"
                  value={draft}
                  onChange={setDraft}
                  onSend={onSend}
                  unifiedModelId={unifiedModelId}
                  onUnifiedModelChange={setUnifiedModelId}
                  gptReasoningMode={gptReasoningMode}
                  onGptReasoningModeChange={setGptReasoningMode}
                  bulkDraft={bulkDraft}
                  onClearBulkDraft={() => setBulkDraft("")}
                  attachments={attachments}
                  onRemoveAttachment={(id) =>
                    setAttachments((a) => a.filter((x) => x.id !== id))
                  }
                  onAddAttachments={onAddAttachments}
                  onLargeTextPaste={(text) => setBulkDraft(text)}
                  onOpenContextPicker={() => setContextPickerOpen(true)}
                  geminiActiveTools={geminiActiveTools}
                  onToggleGeminiTool={onToggleGeminiTool}
                />
              </>
            ) : null}
          </div>
        </div>
      </div>

      {pendingSafety ? (
        <SafetyReviewDialog
          open={safetyOpen}
          onOpenChange={(open) => {
            if (!open) onSafetyBack();
          }}
          result={pendingSafety}
          onBack={onSafetyBack}
          onSendSafe={onSendSafeVersion}
        />
      ) : null}

      <ChatContextPickerDialog
        open={contextPickerOpen}
        onOpenChange={setContextPickerOpen}
        attachedIds={attachedContextIds}
        onApply={(ids) =>
          setContextByChat((prev) => ({ ...prev, [activeThread.id]: ids }))
        }
      />
    </div>
  );
}
