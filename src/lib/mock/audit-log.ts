/**
 * Mock журнал аудита AI-событий.
 * Сотрудники и отделы ссылаются на id из @/lib/mock/organization.
 */

export type AuditEventType =
  | "prompt submitted"
  | "safety warning"
  | "data hidden"
  | "request blocked"
  | "context attached"
  | "policy triggered";

export type AuditDataRuleType =
  | "client data"
  | "financial data"
  | "internal document"
  | "credentials"
  | "code secrets";

export type AuditSystemAction = "allowed" | "warned" | "hidden" | "blocked";

export type AuditStatus = "success" | "attention" | "blocked";

export interface AuditLogEvent {
  id: string;
  at: string;
  employeeId: string;
  /** null = уровень компании (например CEO) */
  departmentId: string | null;
  scenarioId: string;
  model: string;
  eventType: AuditEventType;
  dataRuleType: AuditDataRuleType;
  systemAction: AuditSystemAction;
  status: AuditStatus;
  outcomeSummary: string;
  triggeredRule: string;
  systemNarrative: string;
  /** Обезличенный или безопасный фрагмент, если применимо */
  safePromptPreview: string | null;
  adminNote: string;
}

export const mockAuditLogEvents: AuditLogEvent[] = [
  {
    id: "aud-001",
    at: "2026-04-03T09:12:00",
    employeeId: "emp-ent-ae1",
    departmentId: "dept-sales-ent",
    scenarioId: "write-email",
    model: "GPT",
    eventType: "prompt submitted",
    dataRuleType: "client data",
    systemAction: "allowed",
    status: "success",
    outcomeSummary: "Запрос ушёл в модель без изменений.",
    triggeredRule: "Client data — hide PII (inactive для AE)",
    systemNarrative:
      "Политика маскировки не сработала: в тексте не найдены маркеры PII по шаблону.",
    safePromptPreview:
      "Напиши нейтральное письмо клиенту по статусу пилота без цифр и имён.",
    adminNote: "Типичный рабочий запрос, без срабатываний.",
  },
  {
    id: "aud-002",
    at: "2026-04-03T09:45:22",
    employeeId: "emp-fpna",
    departmentId: "dept-finance",
    scenarioId: "doc-summary",
    model: "Claude",
    eventType: "safety warning",
    dataRuleType: "financial data",
    systemAction: "warned",
    status: "attention",
    outcomeSummary: "Пользователь подтвердил отправку после предупреждения.",
    triggeredRule: "Financial data — warn before external model",
    systemNarrative:
      "Обнаружены формулировки выручки/маржи; показано предупреждение и краткая безопасная версия.",
    safePromptPreview:
      "Сделай summary отчёта: структура разделов, риски, без числовых показателей.",
    adminNote: "Проверить покрытие шаблонов для Q-отчётов.",
  },
  {
    id: "aud-003",
    at: "2026-04-03T10:03:11",
    employeeId: "emp-com-sdr",
    departmentId: "dept-sales-com",
    scenarioId: "research",
    model: "Auto",
    eventType: "data hidden",
    dataRuleType: "client data",
    systemAction: "hidden",
    status: "success",
    outcomeSummary: "Часть текста заменена плейсхолдерами перед отправкой.",
    triggeredRule: "Client data — mask before provider",
    systemNarrative:
      "Email и название компании заменены на [REDACTED]; модель получила очищенный prompt.",
    safePromptPreview:
      "Сравни трёх вендоров по функциям, без цен и контактов клиента.",
    adminNote: "Корректное срабатывание маскировки.",
  },
  {
    id: "aud-004",
    at: "2026-04-03T10:18:44",
    employeeId: "emp-plat-be",
    departmentId: "dept-eng-plat",
    scenarioId: "code-help",
    model: "GPT",
    eventType: "request blocked",
    dataRuleType: "code secrets",
    systemAction: "blocked",
    status: "blocked",
    outcomeSummary: "Запрос не отправлен провайдеру.",
    triggeredRule: "Code secrets — block env-style strings",
    systemNarrative:
      "Обнаружена последовательность, похожая на API key; запрос заблокирован до ручного review.",
    safePromptPreview: null,
    adminNote: "Рекомендовано обучение: не вставлять ключи в чат.",
  },
  {
    id: "aud-005",
    at: "2026-04-03T11:02:00",
    employeeId: "emp-legal-assoc",
    departmentId: "dept-legal",
    scenarioId: "translate",
    model: "Gemini",
    eventType: "policy triggered",
    dataRuleType: "internal document",
    systemAction: "warned",
    status: "attention",
    outcomeSummary: "Отправка разрешена после предупреждения legal-потока.",
    triggeredRule: "Internal document — legal role warning",
    systemNarrative:
      "Фрагмент договора классифицирован как внутренний; показано уведомление о внешней модели.",
    safePromptPreview:
      "Переведи абзац 3.2 на английский, нейтральный юридический стиль.",
    adminNote: "Ожидаемое поведение для Legal.",
  },
  {
    id: "aud-006",
    at: "2026-04-03T11:34:09",
    employeeId: "emp-mkt-content",
    departmentId: "dept-mkt",
    scenarioId: "brainstorm",
    model: "Gemini",
    eventType: "prompt submitted",
    dataRuleType: "internal document",
    systemAction: "allowed",
    status: "success",
    outcomeSummary: "Идеи для кампании, без чувствительных вложений.",
    triggeredRule: "—",
    systemNarrative: "Классификация: общий маркетинговый контент.",
    safePromptPreview: "10 идей постов для запуска продукта B2B, без обещаний SLA.",
    adminNote: "Норма.",
  },
  {
    id: "aud-007",
    at: "2026-04-03T13:20:15",
    employeeId: "emp-pm-1",
    departmentId: "dept-product",
    scenarioId: "meeting-recap",
    model: "Claude",
    eventType: "context attached",
    dataRuleType: "internal document",
    systemAction: "allowed",
    status: "success",
    outcomeSummary: "К контексту добавлен источник из разрешённого набора отдела.",
    triggeredRule: "Context allowlist — Product",
    systemNarrative:
      "Пользователь прикрепил «Roadmap Q2 (черновик)»; проверка политики пройдена.",
    safePromptPreview: null,
    adminNote: "Проверить, что черновик не попал в логи провайдера (демо).",
  },
  {
    id: "aud-008",
    at: "2026-04-03T14:05:33",
    employeeId: "emp-fe",
    departmentId: "dept-eng-app",
    scenarioId: "code-help",
    model: "Auto",
    eventType: "safety warning",
    dataRuleType: "code secrets",
    systemAction: "warned",
    status: "attention",
    outcomeSummary: "Пользователь продолжил с редактированным текстом.",
    triggeredRule: "Code secrets — soft warning",
    systemNarrative:
      "Найдены длинные base64-подстроки; предупреждение, отправка по кнопке «Продолжить».",
    safePromptPreview: "Объясни паттерн оптимистичного UI на примере формы логина (без прод-кода).",
    adminNote: "Снизить чувствительность для внутренних песочниц (mock).",
  },
  {
    id: "aud-009",
    at: "2026-04-03T14:48:00",
    employeeId: "emp-ceo",
    departmentId: null,
    scenarioId: "presentation",
    model: "Gemini",
    eventType: "prompt submitted",
    dataRuleType: "financial data",
    systemAction: "allowed",
    status: "success",
    outcomeSummary: "Executive-запрос с пониженным уровнем блокировок (mock).",
    triggeredRule: "Executive bypass — demo flag",
    systemNarrative:
      "Для CEO применён упрощённый контур; событие помечено для аудита.",
    safePromptPreview: "Структура слайдов: итоги квартала для совета директоров.",
    adminNote: "Убедиться, что в проде bypass отключён.",
  },
  {
    id: "aud-010",
    at: "2026-04-03T15:11:40",
    employeeId: "emp-ent-ae2",
    departmentId: "dept-sales-ent",
    scenarioId: "write-email",
    model: "Claude",
    eventType: "data hidden",
    dataRuleType: "client data",
    systemAction: "hidden",
    status: "success",
    outcomeSummary: "Имя контрагента скрыто в промпте.",
    triggeredRule: "Client data — hide names",
    systemNarrative: "Замена на [CLIENT]; ответ сгенерирован по обезличенному тексту.",
    safePromptPreview: "Черновик ответа по срокам поставки без названия контрагента.",
    adminNote: "Сотрудник в статусе limited — ок.",
  },
  {
    id: "aud-011",
    at: "2026-04-03T16:22:18",
    employeeId: "emp-controller",
    departmentId: "dept-finance",
    scenarioId: "doc-summary",
    model: "GPT",
    eventType: "request blocked",
    dataRuleType: "financial data",
    systemAction: "blocked",
    status: "blocked",
    outcomeSummary: "Полный PDF с таблицей не пропущен в чат.",
    triggeredRule: "Financial data — block raw tables",
    systemNarrative:
      "Вложение распознано как таблица с суммами; политика запрещает прямую загрузку.",
    safePromptPreview: null,
    adminNote: "Предложить пользователю summary вручную или внутренний инструмент.",
  },
  {
    id: "aud-012",
    at: "2026-04-03T16:55:02",
    employeeId: "emp-mkt-growth",
    departmentId: "dept-mkt",
    scenarioId: "research",
    model: "GPT",
    eventType: "policy triggered",
    dataRuleType: "client data",
    systemAction: "warned",
    status: "attention",
    outcomeSummary: "Предупреждение о конкурентах и публичных данных.",
    triggeredRule: "Competitive intel — disclosure warning",
    systemNarrative:
      "Запрос содержит формулировки «внутренние цифры конкурента»; показано предупреждение.",
    safePromptPreview: "Список публичных источников по трём игрокам рынка, без NDA-данных.",
    adminNote: "Пересечение с client data — оставить внимание.",
  },
  {
    id: "aud-013",
    at: "2026-04-03T17:30:45",
    employeeId: "emp-plat-sre",
    departmentId: "dept-eng-plat",
    scenarioId: "doc-summary",
    model: "Claude",
    eventType: "context attached",
    dataRuleType: "internal document",
    systemAction: "allowed",
    status: "success",
    outcomeSummary: "Runbook прикреплён из allowlist Platform.",
    triggeredRule: "Context allowlist — Platform",
    systemNarrative: "Источник «Runbooks инфраструктуры» разрешён для dept-eng-plat.",
    safePromptPreview: null,
    adminNote: "OK.",
  },
  {
    id: "aud-014",
    at: "2026-04-03T18:05:00",
    employeeId: "emp-sales-ops",
    departmentId: "dept-sales",
    scenarioId: "meeting-recap",
    model: "Auto",
    eventType: "prompt submitted",
    dataRuleType: "internal document",
    systemAction: "allowed",
    status: "success",
    outcomeSummary: "Краткий разбор звонка, без приложений.",
    triggeredRule: "—",
    systemNarrative: "Текст не содержит маркеров чувствительных классов.",
    safePromptPreview: "Action items из синка: CRM, прогноз, блокеры.",
    adminNote: "Норма.",
  },
  /** События «сегодня» для демо-метрик на экране администратора (локальная дата 2026-04-04). */
  {
    id: "aud-015",
    at: "2026-04-04T08:40:12",
    employeeId: "emp-mkt-growth",
    departmentId: "dept-mkt",
    scenarioId: "research",
    model: "GPT",
    eventType: "safety warning",
    dataRuleType: "client data",
    systemAction: "warned",
    status: "attention",
    outcomeSummary: "Показано предупреждение перед отправкой.",
    triggeredRule: "Client data — disclosure check",
    systemNarrative: "Обнаружены формулировки внутренних метрик; пользователь подтвердил.",
    safePromptPreview: "Сравни позиционирование трёх конкурентов по публичным материалам.",
    adminNote: "Демо: событие за текущий день.",
  },
  {
    id: "aud-016",
    at: "2026-04-04T09:15:00",
    employeeId: "emp-fe",
    departmentId: "dept-eng-app",
    scenarioId: "code-help",
    model: "Auto",
    eventType: "policy triggered",
    dataRuleType: "code secrets",
    systemAction: "warned",
    status: "attention",
    outcomeSummary: "Политика code secrets: мягкое предупреждение.",
    triggeredRule: "Code secrets — soft warning",
    systemNarrative: "Длинные строки в примере кода; отправка после подтверждения.",
    safePromptPreview: null,
    adminNote: "Демо: событие за текущий день.",
  },
  {
    id: "aud-017",
    at: "2026-04-04T10:02:33",
    employeeId: "emp-controller",
    departmentId: "dept-finance",
    scenarioId: "doc-summary",
    model: "Claude",
    eventType: "request blocked",
    dataRuleType: "financial data",
    systemAction: "blocked",
    status: "blocked",
    outcomeSummary: "Вложение не пропущено по политике financial data.",
    triggeredRule: "Financial data — block attachments",
    systemNarrative: "Распознан табличный фрагмент с суммами.",
    safePromptPreview: null,
    adminNote: "Демо: блокировка за текущий день.",
  },
  {
    id: "aud-018",
    at: "2026-04-04T11:50:00",
    employeeId: "emp-com-sdr",
    departmentId: "dept-sales-com",
    scenarioId: "write-email",
    model: "GPT",
    eventType: "prompt submitted",
    dataRuleType: "internal document",
    systemAction: "allowed",
    status: "success",
    outcomeSummary: "Черновик письма без чувствительных вложений.",
    triggeredRule: "—",
    systemNarrative: "Классификация: общий деловой текст.",
    safePromptPreview: "Краткое напоминание клиенту о следующем шаге воронки.",
    adminNote: "Демо: штатная работа.",
  },
];
