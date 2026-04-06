/** Первый fenced code block в markdown-подобном тексте. */
export function extractFirstCodeBlock(text: string): string | null {
  const m = text.match(/```(?:[\w-]+)?\n([\s\S]*?)```/);
  const inner = m?.[1]?.trim();
  return inner && inner.length > 0 ? inner : null;
}
