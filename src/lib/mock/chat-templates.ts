/** Шаблоны промптов в чате (mock, без backend) */

export type ChatPromptTemplate = {
  id: string;
  title: string;
  description: string;
  promptTemplate: string;
  /** Соответствие сценарию из @/lib/mock/scenarios */
  scenarioId?: string;
};

export const mockChatTemplates: ChatPromptTemplate[] = [
  {
    id: "tpl-follow-up",
    title: "Follow-up письмо",
    description: "Вежливое напоминание без давления",
    promptTemplate:
      "Напиши follow-up письмо после [события/встречи]. Тон нейтральный, 120–180 слов. Цель: согласовать следующий шаг.",
    scenarioId: "write-email",
  },
  {
    id: "tpl-meeting-summary",
    title: "Summary встречи",
    description: "Решения, риски, action items",
    promptTemplate:
      "Разбери встречу по структуре: цель, решения, риски, action items (owner + срок, если известен). Ниже заметки/транскрипт:\n\n",
    scenarioId: "meeting-recap",
  },
  {
    id: "tpl-presentation",
    title: "Структура презентации",
    description: "Слайды и тезисы под аудиторию",
    promptTemplate:
      "Собери структуру презентации для [аудитория / цель]. Формат: заголовок слайда + 2–3 буллета на слайд, без дизайна.",
    scenarioId: "presentation",
  },
  {
    id: "tpl-doc-analysis",
    title: "Анализ документа",
    description: "Суть, пробелы, вопросы",
    promptTemplate:
      "Проанализируй документ: краткая суть, пробелы/риски, список уточняющих вопросов. Текст:\n\n",
    scenarioId: "doc-summary",
  },
  {
    id: "tpl-brainstorm",
    title: "Идеи для brainstorm",
    description: "Варианты и критерии отбора",
    promptTemplate:
      "Сгенерируй 10 идей по теме [тема], затем отбери 3 лучших по критериям: влияние, срок, ресурсы.",
    scenarioId: "brainstorm",
  },
  {
    id: "tpl-short-translate",
    title: "Краткий перевод",
    description: "Сжато, без лишних слов",
    promptTemplate:
      "Сделай краткий перевод (сохрани смысл и термины). С языка [A] на [B]:\n\n",
    scenarioId: "translate",
  },
];
