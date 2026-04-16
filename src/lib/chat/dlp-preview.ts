export type DlpPreviewType = "EMAIL" | "PHONE" | "API_KEY" | "JWT";

export type DlpPreviewFinding = {
  type: DlpPreviewType;
};

export type DlpPreviewResult = {
  findings: DlpPreviewFinding[];
};

const RE_EMAIL =
  /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*/g;
const RE_PHONE_RU =
  /(?:\+7|8)(?:[\s\-]?(?:\(\d{3}\)|\d{3}))?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}\b/g;
const RE_PHONE_INTL = /\+(?:[1-9]\d{6,14})\b/g;
const RE_API_SK = /\bsk-[a-zA-Z0-9]{20,}\b/g;
const RE_API_BEARER = /\bBearer\s+[A-Za-z0-9._~+/=-]+\b/gi;
const RE_API_AIZA = /\bAIza[0-9A-Za-z_-]{35}\b/g;
const RE_API_SLACK = /\bxoxb-[0-9A-Za-z-]{10,}\b/g;
const RE_JWT =
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g;

function hasMatch(text: string, re: RegExp): boolean {
  re.lastIndex = 0;
  return re.test(text);
}

export function scanDlpPreview(text: string): DlpPreviewResult {
  const findings: DlpPreviewFinding[] = [];
  const seen = new Set<DlpPreviewType>();
  const push = (type: DlpPreviewType) => {
    if (seen.has(type)) return;
    seen.add(type);
    findings.push({ type });
  };

  if (hasMatch(text, RE_API_SK) || hasMatch(text, RE_API_BEARER) || hasMatch(text, RE_API_AIZA) || hasMatch(text, RE_API_SLACK)) {
    push("API_KEY");
  }
  if (hasMatch(text, RE_EMAIL)) push("EMAIL");
  if (hasMatch(text, RE_PHONE_RU) || hasMatch(text, RE_PHONE_INTL)) push("PHONE");
  if (hasMatch(text, RE_JWT)) push("JWT");

  return { findings };
}

export function dlpPreviewTypeLabel(type: DlpPreviewType): string {
  if (type === "API_KEY") return "API-ключ";
  if (type === "EMAIL") return "email";
  if (type === "PHONE") return "телефон";
  return "JWT";
}
