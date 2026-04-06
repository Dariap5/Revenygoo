export type MessageContentSegment =
  | { type: "text"; text: string }
  | { type: "code"; lang?: string; code: string };

/** Делит текст на сегменты по fenced-блокам ```…``` */
export function splitMarkdownCodeBlocks(content: string): MessageContentSegment[] {
  const re = /```([\w-]*)\n([\s\S]*?)```/g;
  const segments: MessageContentSegment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    if (m.index > last) {
      const t = content.slice(last, m.index);
      if (t.trim()) segments.push({ type: "text", text: t });
    }
    const lang = m[1]?.trim() || undefined;
    segments.push({ type: "code", lang, code: m[2].trim() });
    last = m.index + m[0].length;
  }
  if (last < content.length) {
    const t = content.slice(last);
    if (t.trim()) segments.push({ type: "text", text: t });
  }
  if (segments.length === 0) {
    segments.push({ type: "text", text: content });
  }
  return segments;
}
