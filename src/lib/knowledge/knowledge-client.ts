export type KnowledgeFileStatus = "processing" | "ready" | "failed";

export type KnowledgeFileDto = {
  id: string;
  orgId: string;
  name: string;
  filePath: string;
  size: number;
  status: KnowledgeFileStatus;
  createdAt: string;
};

type ListOk = { items: KnowledgeFileDto[] };

type FetchOutcome<T> =
  | { kind: "ok"; data: T }
  | { kind: "unauthorized" }
  | { kind: "forbidden" }
  | { kind: "http_error"; status: number; message?: string }
  | { kind: "network" };

async function parseJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchKnowledgeList(): Promise<FetchOutcome<ListOk>> {
  try {
    const res = await fetch("/api/knowledge", {
      credentials: "include",
      cache: "no-store",
    });
    if (res.status === 401) return { kind: "unauthorized" };
    if (res.status === 403) return { kind: "forbidden" };
    if (!res.ok) {
      const j = await parseJson<{ error?: string }>(res);
      return {
        kind: "http_error",
        status: res.status,
        message: j?.error,
      };
    }
    const data = await parseJson<ListOk>(res);
    if (!data) return { kind: "network" };
    return { kind: "ok", data };
  } catch {
    return { kind: "network" };
  }
}

export async function uploadKnowledgeFile(
  file: File,
): Promise<FetchOutcome<{ item: KnowledgeFileDto }>> {
  try {
    const form = new FormData();
    form.set("file", file);
    const res = await fetch("/api/knowledge/upload", {
      method: "POST",
      body: form,
      credentials: "include",
    });
    if (res.status === 401) return { kind: "unauthorized" };
    if (res.status === 403) return { kind: "forbidden" };
    if (!res.ok) {
      const j = await parseJson<{ error?: string }>(res);
      return {
        kind: "http_error",
        status: res.status,
        message: j?.error,
      };
    }
    const data = await parseJson<{ item: KnowledgeFileDto }>(res);
    if (!data?.item) return { kind: "network" };
    return { kind: "ok", data };
  } catch {
    return { kind: "network" };
  }
}

export async function deleteKnowledgeFile(
  id: string,
): Promise<FetchOutcome<{ ok: boolean }>> {
  try {
    const res = await fetch(`/api/knowledge/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.status === 401) return { kind: "unauthorized" };
    if (res.status === 403) return { kind: "forbidden" };
    if (!res.ok) {
      const j = await parseJson<{ error?: string }>(res);
      return {
        kind: "http_error",
        status: res.status,
        message: j?.error,
      };
    }
    const data = await parseJson<{ ok: boolean }>(res);
    if (!data) return { kind: "network" };
    return { kind: "ok", data };
  } catch {
    return { kind: "network" };
  }
}

export const KNOWLEDGE_ACCEPT =
  ".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown";

export function knowledgeStatusLabel(status: KnowledgeFileStatus): string {
  switch (status) {
    case "processing":
      return "Обрабатывается";
    case "ready":
      return "Готово";
    case "failed":
      return "Ошибка";
    default:
      return status;
  }
}
