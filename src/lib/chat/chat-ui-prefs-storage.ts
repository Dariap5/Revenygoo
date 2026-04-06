import type { GptReasoningMode, UnifiedChatModelId } from "@/types";

const V2_KEY = "rg_chat_ui_prefs_v2";
const V1_KEY = "rg_chat_ui_prefs_v1";

const DEFAULT: StoredChatUIPrefs = {
  unifiedModelId: "gpt-instant-53",
  gptReasoningMode: "standard",
};

/** Старый формат v1 (миграция). */
type LegacyPrefs = {
  providerId?: string;
  modeId?: string;
  modelId?: string;
};

export type StoredChatUIPrefs = {
  unifiedModelId: UnifiedChatModelId;
  gptReasoningMode: GptReasoningMode;
};

type Store = Record<string, StoredChatUIPrefs | LegacyPrefs>;

const UNIFIED_IDS = new Set<string>([
  "gpt-instant-53",
  "gpt-thinking-54",
  "gemini-fast",
  "gemini-thinking",
  "gemini-pro",
  "opus-46",
  "sonnet-46",
  "haiku-46",
  "opus-45",
  "opus-3",
  "sonnet-45",
]);

function isUnifiedId(id: string): id is UnifiedChatModelId {
  return UNIFIED_IDS.has(id);
}

function migrateLegacy(p: LegacyPrefs): StoredChatUIPrefs {
  const pid = p.providerId;
  if (pid === "google") {
    return { unifiedModelId: "gemini-pro", gptReasoningMode: "standard" };
  }
  if (pid === "anthropic") {
    return { unifiedModelId: "sonnet-46", gptReasoningMode: "standard" };
  }
  return { ...DEFAULT };
}

function normalizeEntry(
  raw: StoredChatUIPrefs | LegacyPrefs | undefined,
): StoredChatUIPrefs | null {
  if (!raw) return null;
  if ("unifiedModelId" in raw && raw.unifiedModelId) {
    const id = raw.unifiedModelId;
    return {
      unifiedModelId: isUnifiedId(id) ? id : DEFAULT.unifiedModelId,
      gptReasoningMode:
        raw.gptReasoningMode === "extended" ? "extended" : "standard",
    };
  }
  return migrateLegacy(raw as LegacyPrefs);
}

function readAll(): Store {
  if (typeof window === "undefined") return {};
  try {
    let raw = sessionStorage.getItem(V2_KEY);
    if (!raw) {
      raw = sessionStorage.getItem(V1_KEY);
    }
    if (!raw) return {};
    const v = JSON.parse(raw) as Store;
    return typeof v === "object" && v ? v : {};
  } catch {
    return {};
  }
}

function writeAll(store: Store) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(V2_KEY, JSON.stringify(store));
}

export function readChatUIPrefs(threadId: string): StoredChatUIPrefs | null {
  return normalizeEntry(readAll()[threadId]);
}

export function writeChatUIPrefs(
  threadId: string,
  prefs: StoredChatUIPrefs,
): void {
  const all = readAll();
  all[threadId] = prefs;
  writeAll(all);
}
