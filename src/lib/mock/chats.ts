import type { ChatThread } from "@/types";

/** Поток «Новый чат» — без сообщений и без привязки к сценарию */
export const NEW_CHAT_THREAD_ID = "chat-new" as const;

export const newChatThreadTemplate: ChatThread = {
  id: NEW_CHAT_THREAD_ID,
  title: "Новый чат",
  scenarioTitle: "Свободный запрос",
  updatedAt: "2026-04-06T12:00:00",
  modelLabel: "Auto",
  lastMessagePreview: "",
};

/** Mock-история чатов (единый источник для чата и боковой истории) */
export const mockChatThreads: ChatThread[] = [
  newChatThreadTemplate,
  {
    id: "chat-1",
    title: "Письмо партнёру по интеграции",
    scenarioId: "write-email",
    scenarioTitle: "Написать письмо",
    updatedAt: "2026-04-03T10:21:30",
    modelLabel: "Auto",
    lastMessagePreview:
      "Мы готовы продолжить обсуждение интеграции и согласовать формат…",
  },
  {
    id: "chat-2",
    title: "Резюме Q1 отчёта (обезличенно)",
    scenarioId: "doc-summary",
    scenarioTitle: "Summary документа",
    updatedAt: "2026-04-02T16:46:20",
    modelLabel: "GPT",
    lastMessagePreview:
      "5. Закрепить план митигации по двум направлениям.",
  },
  {
    id: "chat-res",
    title: "Исследование конкурентов в сегменте",
    scenarioId: "research",
    scenarioTitle: "Исследование",
    updatedAt: "2026-04-02T14:10:00",
    modelLabel: "Claude",
    lastMessagePreview:
      "Список из 6 вопросов для углубления и сравнительная таблица…",
  },
  {
    id: "chat-mt",
    title: "Синк с продуктом — 1 апреля",
    scenarioId: "meeting-recap",
    scenarioTitle: "Разобрать встречу",
    updatedAt: "2026-04-01T18:00:00",
    modelLabel: "Claude",
    lastMessagePreview:
      "Решения: запуск пилота в мае. Action: подготовить макет до пятницы.",
  },
  {
    id: "chat-5",
    title: "Рефакторинг утилиты дат",
    scenarioId: "code-help",
    scenarioTitle: "Помочь с кодом",
    updatedAt: "2026-04-01T15:30:00",
    modelLabel: "GPT",
    lastMessagePreview:
      "Предлагаю вынести парсинг в отдельную функцию и покрыть тестами…",
  },
  {
    id: "chat-4",
    title: "Перевод релиз-нот",
    scenarioId: "translate",
    scenarioTitle: "Перевод",
    updatedAt: "2026-04-02T11:05:30",
    modelLabel: "Claude",
    lastMessagePreview:
      "Готовый вариант: сохраняю структуру абзацев и термины продукта…",
  },
  {
    id: "chat-3",
    title: "Идеи для внутреннего воркшопа",
    scenarioId: "brainstorm",
    scenarioTitle: "Brainstorm идей",
    updatedAt: "2026-04-01T09:10:00",
    modelLabel: "Auto",
    lastMessagePreview: "Чат пуст — можно продолжить с примера ниже.",
  },
  {
    id: "chat-8",
    title: "Ответ клиенту по SLA",
    scenarioId: "write-email",
    scenarioTitle: "Написать письмо",
    updatedAt: "2026-03-30T11:20:00",
    modelLabel: "Auto",
    lastMessagePreview:
      "Черновик: подтверждаем соблюдение SLA без указания штрафов.",
  },
  {
    id: "chat-9",
    title: "Питч: структура на 3 минуты",
    scenarioId: "presentation",
    scenarioTitle: "Подготовить презентацию",
    updatedAt: "2026-03-29T09:45:00",
    modelLabel: "Gemini",
    lastMessagePreview: "Хук → проблема → решение → попросить встречу.",
  },
];

export function getChatById(id: string) {
  return mockChatThreads.find((c) => c.id === id) ?? mockChatThreads[0];
}
