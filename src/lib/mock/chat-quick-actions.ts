/** Быстрые действия в чате (mock, без backend) */

export type ChatQuickAction = {
  id: string;
  label: string;
  prompt: string;
  /** Для подсказки контекста сценария (навигация только когда в чате уже есть сообщения) */
  scenarioId?: string;
};

export const mockChatQuickActions: ChatQuickAction[] = [
  {
    id: "write-email",
    label: "Написать письмо",
    prompt:
      "Напиши нейтральное деловое письмо. Тема: [укажите]. Цель: [запрос]. Без имён и сумм, если не задано.",
    scenarioId: "write-email",
  },
  {
    id: "doc-summary",
    label: "Сделать summary документа",
    prompt:
      "Сделай краткое summary документа: 5–7 буллетов, риски и допущения. Текст:\n\n",
    scenarioId: "doc-summary",
  },
  {
    id: "presentation",
    label: "Подготовить презентацию",
    prompt:
      "Подготовь структуру презентации на [N] минут: цель аудитории, логика слайдов, тезисы без воды.",
    scenarioId: "presentation",
  },
  {
    id: "key-takeaways",
    label: "Выделить ключевые выводы",
    prompt:
      "Выдели ключевые выводы из текста: 3–5 тезисов и что делать дальше. Текст:\n\n",
    scenarioId: "doc-summary",
  },
  {
    id: "translate",
    label: "Перевести текст",
    prompt:
      "Переведи текст нейтрально, сохрани термины продукта. Язык: [укажите]. Текст:\n\n",
    scenarioId: "translate",
  },
  {
    id: "meeting-recap",
    label: "Разобрать встречу",
    prompt:
      "Разбери встречу: цель, решения, риски, action items (owner + срок, если известен). Заметки:\n\n",
    scenarioId: "meeting-recap",
  },
];
