/**
 * Локальная mock-проверка «чувствительных данных» (без DLP / backend).
 */

export type SafetyTier = "block" | "hide" | "warn";

export type SafetyStatusLabel =
  | "заблокировано"
  | "скрыто"
  | "предупреждение";

export interface SafetyRule {
  id: string;
  /** Человекочитаемая категория */
  label: string;
  tier: SafetyTier;
  /** Регулярки с флагом g (и i при необходимости) */
  patterns: RegExp[];
}

function tierToLabel(tier: SafetyTier): SafetyStatusLabel {
  if (tier === "block") return "заблокировано";
  if (tier === "hide") return "скрыто";
  return "предупреждение";
}

function placeholder(tier: SafetyTier): string {
  if (tier === "block") return "[заблокировано]";
  if (tier === "hide") return "[скрыто]";
  return "[уточните без деталей]";
}

/** Порядок применения замен в безопасной версии */
const APPLY_ORDER: SafetyTier[] = ["block", "hide", "warn"];

export const safetyRules: SafetyRule[] = [
  {
    id: "credentials",
    label: "Учётные данные",
    tier: "block",
    patterns: [
      /\bpassword\b/gi,
      /пароль/gi,
      /\btoken\b/gi,
      /\bapikey\b/gi,
      /api\s*key/gi,
    ],
  },
  {
    id: "card",
    label: "Платёжные реквизиты",
    tier: "block",
    patterns: [/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g],
  },
  {
    id: "passport",
    label: "Паспорт / идентификатор",
    tier: "block",
    patterns: [/паспорт\s*[:\s]?\d[\d\s]{5,}/gi, /\b\d{4}\s?\d{6}\b/g],
  },
  {
    id: "confidential",
    label: "Коммерческая информация",
    tier: "hide",
    patterns: [
      /данные\s+клиента/gi,
      /\bклиент[аеу]?\b/gi,
      /договор/gi,
      /внутренн(ий|его|ие|их)?\s+документ/gi,
      /конфиденциально/gi,
    ],
  },
  {
    id: "finance",
    label: "Финансы",
    tier: "warn",
    patterns: [/бюджет/gi, /\bсумма\b/gi, /\d[\d\s]*\s*(тыс|млн|руб|\$|€)/gi],
  },
];

export interface SafetyFinding {
  /** Укороченный фрагмент для отображения */
  snippet: string;
  label: string;
  status: SafetyStatusLabel;
}

export interface SafetyCheckResult {
  hasRisk: boolean;
  findings: SafetyFinding[];
  safeText: string;
}

function collectFindings(text: string): SafetyFinding[] {
  const findings: SafetyFinding[] = [];
  for (const rule of safetyRules) {
    for (const re of rule.patterns) {
      const r = new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`);
      for (const m of text.matchAll(r)) {
        const raw = m[0];
        findings.push({
          snippet: raw.length > 48 ? `${raw.slice(0, 45)}…` : raw,
          label: rule.label,
          status: tierToLabel(rule.tier),
        });
      }
    }
  }
  return findings;
}

function applySafeReplacements(text: string): string {
  let safe = text;
  for (const tier of APPLY_ORDER) {
    const rules = safetyRules.filter((r) => r.tier === tier);
    const ph = placeholder(tier);
    for (const rule of rules) {
      for (const re of rule.patterns) {
        const r = new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`);
        safe = safe.replace(r, ph);
      }
    }
  }
  return safe;
}

export function analyzeSafety(text: string): SafetyCheckResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { hasRisk: false, findings: [], safeText: "" };
  }
  const findings = collectFindings(trimmed);
  const safeText = applySafeReplacements(trimmed);
  return {
    hasRisk: findings.length > 0,
    findings,
    safeText,
  };
}

/** Системное уведомление после отправки безопасной версии */
export const safetySystemNotice =
  "Часть данных была скрыта. Запрос отправлен в безопасном формате.";
