export type DLPType =
  | "PHONE"
  | "EMAIL"
  | "API_KEY"
  | "CREDIT_CARD"
  | "PASSPORT_RF"
  | "SNILS"
  | "JWT"
  | "IP_ADDRESS";

export const ALL_DLP_TYPES: readonly DLPType[] = [
  "PHONE",
  "EMAIL",
  "API_KEY",
  "CREDIT_CARD",
  "PASSPORT_RF",
  "SNILS",
  "JWT",
  "IP_ADDRESS",
] as const;

export type ScanTextOptions = {
  /** Only these match types are reported and redacted. Omit to use all types. */
  enabledTypes?: ReadonlySet<DLPType>;
};

export type Finding = {
  type: DLPType;
  value: string;
  placeholder: string;
  startIndex: number;
};

export type DLPResult = {
  findings: Finding[];
  redactedText: string;
};

type RawMatch = {
  type: DLPType;
  start: number;
  end: number;
  value: string;
};

const DLP_TYPE_ORDER: DLPType[] = [
  "JWT",
  "API_KEY",
  "EMAIL",
  "CREDIT_CARD",
  "SNILS",
  "PASSPORT_RF",
  "PHONE",
  "IP_ADDRESS",
];

function typePriority(t: DLPType): number {
  const i = DLP_TYPE_ORDER.indexOf(t);
  return i === -1 ? 999 : i;
}

function luhnValid(digits: string): boolean {
  if (digits.length < 2) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = digits.charCodeAt(i) - 48;
    if (n < 0 || n > 9) return false;
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function collectRegexMatches(
  text: string,
  type: DLPType,
  re: RegExp,
  out: RawMatch[],
): void {
  re.lastIndex = 0;
  let m: RegExpExecArray | null;
  const global = new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`);
  while ((m = global.exec(text)) !== null) {
    const value = m[0];
    const start = m.index;
    out.push({ type, start, end: start + value.length, value });
    if (m[0].length === 0) global.lastIndex++;
  }
}

/** Russian mobile / landline after +7 or 8: 10 subscriber digits (often starting with 9 for mobile). */
const RE_PHONE_RU =
  /(?:\+7|8)(?:[\s\-]?(?:\(\d{3}\)|\d{3}))?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}\b/g;

/** International E.164-style: + then 8–15 digits (excluding pure +7… already matched by RU rule — merge step dedupes). */
const RE_PHONE_INTL = /\+(?:[1-9]\d{6,14})\b/g;

const RE_EMAIL =
  /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*/g;

const RE_API_SK = /\bsk-[a-zA-Z0-9]{20,}\b/g;
const RE_API_BEARER = /\bBearer\s+[A-Za-z0-9._~+/=-]+\b/gi;
const RE_API_AIZA = /\bAIza[0-9A-Za-z_-]{35}\b/g;
const RE_API_SLACK = /\bxoxb-[0-9A-Za-z-]{10,}\b/g;

const RE_CARD_CANDIDATE = /\b(?:\d[ \-]*){12,18}\d\b/g;

/** RF internal passport: 4 + 6 digits, optional spaces between groups. */
const RE_PASSPORT_RF = /\b\d{2}\s?\d{2}\s?\d{6}\b/g;

const RE_SNILS = /\b\d{3}[-\s]?\d{3}[-\s]?\d{3}[-\s]?\d{2}\b/g;

/** Three base64url-like segments (JWT-shaped). */
const RE_JWT =
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g;

const RE_IPV4 =
  /\b(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\b/g;

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

function collectCreditCards(text: string, out: RawMatch[]): void {
  RE_CARD_CANDIDATE.lastIndex = 0;
  let m: RegExpExecArray | null;
  const re = new RegExp(RE_CARD_CANDIDATE.source, "g");
  while ((m = re.exec(text)) !== null) {
    const raw = m[0];
    const d = digitsOnly(raw);
    if (d.length >= 13 && d.length <= 19 && luhnValid(d)) {
      out.push({
        type: "CREDIT_CARD",
        start: m.index,
        end: m.index + raw.length,
        value: raw,
      });
    }
  }
}

function collectSnils(text: string, out: RawMatch[]): void {
  RE_SNILS.lastIndex = 0;
  let m: RegExpExecArray | null;
  const re = new RegExp(RE_SNILS.source, "g");
  while ((m = re.exec(text)) !== null) {
    const d = digitsOnly(m[0]);
    if (d.length === 11) {
      out.push({
        type: "SNILS",
        start: m.index,
        end: m.index + m[0].length,
        value: m[0],
      });
    }
  }
}

function collectPhones(text: string, out: RawMatch[]): void {
  collectRegexMatches(text, "PHONE", RE_PHONE_RU, out);
  collectRegexMatches(text, "PHONE", RE_PHONE_INTL, out);
}

/** Longer span wins; on equal length, lower `typePriority` wins. Overlapping losers are removed. */
function mergeMatches(matches: RawMatch[]): RawMatch[] {
  const sorted = [...matches].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    const la = a.end - a.start;
    const lb = b.end - b.start;
    if (la !== lb) return lb - la;
    return typePriority(a.type) - typePriority(b.type);
  });

  const kept: RawMatch[] = [];

  function better(a: RawMatch, b: RawMatch): number {
    const la = a.end - a.start;
    const lb = b.end - b.start;
    if (la > lb) return -1;
    if (la < lb) return 1;
    const pa = typePriority(a.type);
    const pb = typePriority(b.type);
    if (pa < pb) return -1;
    if (pa > pb) return 1;
    return 0;
  }

  for (const m of sorted) {
    let skipM = false;
    let i = 0;
    while (i < kept.length) {
      const k = kept[i]!;
      if (m.end <= k.start || m.start >= k.end) {
        i++;
        continue;
      }
      const cmp = better(m, k);
      if (cmp < 0) {
        kept.splice(i, 1);
        continue;
      }
      if (cmp > 0) {
        skipM = true;
        break;
      }
      skipM = true;
      break;
    }
    if (!skipM) kept.push(m);
  }

  kept.sort((a, b) => a.start - b.start);
  return kept;
}

function buildRedacted(text: string, spans: { start: number; end: number; placeholder: string }[]): string {
  if (spans.length === 0) return text;
  let out = "";
  let cursor = 0;
  for (const s of spans) {
    out += text.slice(cursor, s.start);
    out += s.placeholder;
    cursor = s.end;
  }
  out += text.slice(cursor);
  return out;
}

/**
 * Detects common sensitive patterns. Overlaps are resolved by type priority and span length.
 */
export function scanText(text: string, options?: ScanTextOptions): DLPResult {
  const raw: RawMatch[] = [];

  collectRegexMatches(text, "JWT", RE_JWT, raw);
  collectRegexMatches(text, "API_KEY", RE_API_SK, raw);
  collectRegexMatches(text, "API_KEY", RE_API_BEARER, raw);
  collectRegexMatches(text, "API_KEY", RE_API_AIZA, raw);
  collectRegexMatches(text, "API_KEY", RE_API_SLACK, raw);
  collectRegexMatches(text, "EMAIL", RE_EMAIL, raw);
  collectCreditCards(text, raw);
  collectSnils(text, raw);
  collectRegexMatches(text, "PASSPORT_RF", RE_PASSPORT_RF, raw);
  collectPhones(text, raw);
  collectRegexMatches(text, "IP_ADDRESS", RE_IPV4, raw);

  const mergedAll = mergeMatches(raw);
  const enabled = options?.enabledTypes;
  const merged =
    enabled !== undefined ? mergedAll.filter((m) => enabled.has(m.type)) : mergedAll;

  const counters: Record<DLPType, number> = {
    PHONE: 0,
    EMAIL: 0,
    API_KEY: 0,
    CREDIT_CARD: 0,
    PASSPORT_RF: 0,
    SNILS: 0,
    JWT: 0,
    IP_ADDRESS: 0,
  };

  const findings: Finding[] = [];
  const spans: { start: number; end: number; placeholder: string }[] = [];

  for (const m of merged) {
    const value = text.slice(m.start, m.end);
    counters[m.type] += 1;
    const placeholder = `[${m.type}_${counters[m.type]}]`;
    findings.push({
      type: m.type,
      value,
      placeholder,
      startIndex: m.start,
    });
    spans.push({ start: m.start, end: m.end, placeholder });
  }

  const redactedText = buildRedacted(text, spans);
  return { findings, redactedText };
}

/**
 * Replaces placeholders in `text` using `findings` (longest placeholder first to avoid partial matches).
 */
export function restoreText(text: string, findings: Finding[]): string {
  if (findings.length === 0) return text;
  const sorted = [...findings].sort((a, b) => b.placeholder.length - a.placeholder.length);
  let out = text;
  for (const f of sorted) {
    out = out.split(f.placeholder).join(f.value);
  }
  return out;
}
