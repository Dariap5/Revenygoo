import type { Scenario } from "@/types";

/** 8 корпоративных сценариев (mock) */
export const mockScenarios: Scenario[] = [
  {
    id: "write-email",
    title: "Написать письмо",
    description: "Деловые письма и ответы",
    icon: "mail",
    modelBadge: "Auto",
    popular: true,
    recent: true,
  },
  {
    id: "doc-summary",
    title: "Summary документа",
    description: "Краткое резюме текста",
    icon: "file-text",
    modelBadge: "GPT",
    popular: true,
    favorite: true,
  },
  {
    id: "research",
    title: "Исследование",
    description: "Структура и вопросы по теме",
    icon: "search",
    modelBadge: "Claude",
    popular: true,
    recent: true,
  },
  {
    id: "presentation",
    title: "Подготовить презентацию",
    description: "Слайды и тезисы",
    icon: "presentation",
    modelBadge: "Gemini",
    favorite: true,
  },
  {
    id: "translate",
    title: "Перевод",
    description: "С учётом терминов компании",
    icon: "languages",
    modelBadge: "Auto",
    recent: true,
  },
  {
    id: "code-help",
    title: "Помочь с кодом",
    description: "Объяснения и примеры",
    icon: "code-2",
    modelBadge: "GPT",
    popular: true,
  },
  {
    id: "meeting-recap",
    title: "Разобрать встречу",
    description: "Решения и задачи",
    icon: "calendar-clock",
    modelBadge: "Claude",
    recent: true,
  },
  {
    id: "brainstorm",
    title: "Brainstorm идей",
    description: "Гипотезы и варианты",
    icon: "lightbulb",
    modelBadge: "Auto",
    favorite: true,
  },
];

export function getScenarioById(id: string) {
  return mockScenarios.find((s) => s.id === id) ?? mockScenarios[0];
}
