import { cn } from "@/lib/utils";

/**
 * Единая колонка чата (712px + горизонтальные отступы).
 * `self-center min-w-0` — в flex-колонке без этого дочерние блоки растягиваются на всю ширину
 * и визуально игнорируют max-width.
 */
export const CHAT_COLUMN_CLASS =
  "mx-auto w-full min-w-0 max-w-[712px] shrink-0 self-center px-4" as const;

export function chatColumnClassName(...extra: (string | undefined)[]) {
  return cn(CHAT_COLUMN_CLASS, ...extra);
}
