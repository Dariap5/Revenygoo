import "server-only";

import { ApiError } from "@/lib/server/errors";

export const KNOWLEDGE_BUCKET = "org-knowledge";

const MAX_BYTES = 50 * 1024 * 1024;

const EXT_TO_MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".txt": "text/plain",
  ".md": "text/markdown",
};

export function knowledgeFileExtension(filename: string): string | null {
  const base = filename.replace(/^.*[/\\]/, "").trim();
  const dot = base.lastIndexOf(".");
  if (dot < 0 || dot === base.length - 1) return null;
  return base.slice(dot).toLowerCase();
}

export function assertKnowledgeUploadAllowed(filename: string, size: number): {
  ext: string;
  contentType: string;
} {
  if (!Number.isFinite(size) || size <= 0) {
    throw new ApiError("Пустой файл", 400, "validation_error");
  }
  if (size > MAX_BYTES) {
    throw new ApiError("Файл больше 50 МБ", 400, "file_too_large");
  }
  const ext = knowledgeFileExtension(filename);
  if (!ext || !(ext in EXT_TO_MIME)) {
    throw new ApiError(
      "Допустимы только PDF, DOCX, TXT, MD",
      400,
      "unsupported_file_type",
    );
  }
  return { ext, contentType: EXT_TO_MIME[ext]! };
}

export function sanitizeKnowledgeStorageName(filename: string): string {
  const base = filename.replace(/^.*[/\\]/, "").trim() || "file";
  const cleaned = base.replace(/[^\w.\- ()\u0400-\u04FF]+/g, "_").slice(0, 180);
  return cleaned.length ? cleaned : "file";
}
