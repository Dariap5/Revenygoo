import type { ChatWorkspaceProviderId } from "@/types";

export type ProviderModeOption = { id: string; label: string };
export type ProviderModelOption = { id: string; label: string };

export type ProviderQuickItem = { id: string; label: string; prompt: string };

export interface ChatProviderUIConfig {
  id: ChatWorkspaceProviderId;
  /** Короткое имя в селекторе */
  shortLabel: string;
  /** Подпись в header */
  brandLabel: string;
  emptyGreeting: string;
  emptySubtitle: string;
  placeholder: string;
  modes: ProviderModeOption[];
  models: ProviderModelOption[];
  defaultModeId: string;
  defaultModelId: string;
  /** Быстрые сценарии в empty state / composer */
  quickTasks: ProviderQuickItem[];
  /** Доп. чипы над полем ввода (dock) */
  composerChips: string[];
  /** Паттерн Claude: крупные pills */
  actionPills?: ProviderQuickItem[];
  /** Паттерн Gemini */
  showToolsButton?: boolean;
  geminiTaskChips?: ProviderQuickItem[];
  /** Подпись блока инструментов */
  toolsLabel?: string;
}

export const CHAT_WORKSPACE_PROVIDERS: ChatProviderUIConfig[] = [
  {
    id: "openai",
    shortLabel: "ChatGPT",
    brandLabel: "OpenAI",
    emptyGreeting: "Чем помочь сегодня?",
    emptySubtitle:
      "Опишите задачу или выберите быстрый сценарий. Enter — отправить, Shift+Enter — новая строка.",
    placeholder: "Сообщение…",
    modes: [
      { id: "std", label: "Стандартный" },
      { id: "think", label: "Думающий" },
      { id: "web", label: "С веб-поиском" },
      { id: "files", label: "Работа с файлами" },
    ],
    models: [
      { id: "gpt-4o", label: "GPT-4o" },
      { id: "gpt-4o-mini", label: "GPT-4o mini" },
      { id: "o1", label: "o1" },
    ],
    defaultModeId: "std",
    defaultModelId: "gpt-4o",
    quickTasks: [
      {
        id: "mail",
        label: "Написать письмо",
        prompt: "Помоги составить нейтральное деловое письмо без персональных данных клиента.",
      },
      {
        id: "sum",
        label: "Summary",
        prompt: "Сделай краткое summary текста ниже в 5 пунктах, без цифр и имён.",
      },
      {
        id: "doc",
        label: "Анализ документа",
        prompt: "Проанализируй структуру документа и выдели риски без цитирования чувствительных фрагментов.",
      },
      {
        id: "ideas",
        label: "Идеи",
        prompt: "Предложи 8 идей для внутреннего воркшопа в формате коротких тезисов.",
      },
      {
        id: "code",
        label: "Код",
        prompt: "Объясни паттерн на учебном примере без прод-кода и секретов.",
      },
    ],
    composerChips: [
      "Упростить",
      "Короче",
      "Таблица",
      "Список шагов",
    ],
  },
  {
    id: "anthropic",
    shortLabel: "Claude",
    brandLabel: "Anthropic",
    emptyGreeting: "С чего начнём?",
    emptySubtitle:
      "Сфокусируйтесь на задаче — подскажем формулировку. Ниже — быстрые направления.",
    placeholder: "Ваш запрос…",
    modes: [
      { id: "std", label: "Standard" },
      { id: "extended", label: "Extended reasoning" },
    ],
    models: [
      { id: "claude-35", label: "Claude 3.5" },
      { id: "claude-37", label: "Claude 3.7" },
    ],
    defaultModeId: "std",
    defaultModelId: "claude-35",
    quickTasks: [
      {
        id: "deep",
        label: "Разобрать текст",
        prompt: "Разбери аргументацию текста: сильные стороны, пробелы, что уточнить.",
      },
      {
        id: "outline",
        label: "План",
        prompt: "Составь логичный план ответа на вопрос пользователя в 4–6 пунктах.",
      },
    ],
    composerChips: ["Шаг за шагом", "Нюансы", "Альтернативы"],
    actionPills: [
      { id: "strat", label: "Стратегия", prompt: "Помоги сформулировать стратегию на квартал в общих чертах." },
      { id: "code", label: "Код", prompt: "Разбери учебный пример кода и предложи улучшения без секретов." },
      { id: "text", label: "Текст", prompt: "Отредактируй текст в спокойном деловом стиле." },
      { id: "learn", label: "Обучение", prompt: "Объясни концепцию простыми шагами с мини-примером." },
      { id: "analysis", label: "Анализ", prompt: "Сравни два подхода нейтрально, плюсы и минусы." },
    ],
  },
  {
    id: "google",
    shortLabel: "Gemini",
    brandLabel: "Google",
    emptyGreeting: "Готов к задаче",
    emptySubtitle:
      "Выберите инструмент или быстрый сценарий. Режим «Думающий» — для многошаговых ответов.",
    placeholder: "Введите запрос или выберите chip…",
    modes: [
      { id: "std", label: "Стандартный" },
      { id: "think", label: "Думающий" },
    ],
    models: [
      { id: "gemini-15", label: "Gemini 1.5" },
      { id: "gemini-20", label: "Gemini 2.0" },
    ],
    defaultModeId: "std",
    defaultModelId: "gemini-15",
    quickTasks: [
      {
        id: "img",
        label: "Создать изображение",
        prompt: "Опиши сцену для иллюстрации в нейтральном стиле (демо, без генерации файла).",
      },
      {
        id: "file",
        label: "Проанализировать файл",
        prompt: "Какие вопросы задать по загруженному файлу, чтобы не раскрывать лишнего?",
      },
      {
        id: "tr",
        label: "Перевести",
        prompt: "Переведи абзац на английский в нейтральном стиле.",
      },
      {
        id: "ideas",
        label: "Идеи",
        prompt: "10 идей для поста в LinkedIn без обещаний и цифр.",
      },
      {
        id: "write",
        label: "Написать текст",
        prompt: "Черновик текста для внутренней рассылки, без персональных данных.",
      },
    ],
    composerChips: ["Факты", "Короче", "Таблица", "Шаги"],
    showToolsButton: true,
    toolsLabel: "Инструменты",
    geminiTaskChips: [
      { id: "g1", label: "Сводка", prompt: "Краткая сводка ключевых мыслей из текста пользователя." },
      { id: "g2", label: "Сравнение", prompt: "Сравни два варианта в табличной форме текстом." },
      { id: "g3", label: "Чеклист", prompt: "Чеклист из 6 пунктов перед отправкой отчёта." },
    ],
  },
];

const byId = Object.fromEntries(
  CHAT_WORKSPACE_PROVIDERS.map((c) => [c.id, c]),
) as Record<ChatWorkspaceProviderId, ChatProviderUIConfig>;

export function getChatProviderConfig(
  id: ChatWorkspaceProviderId,
): ChatProviderUIConfig {
  return byId[id] ?? byId.openai;
}

export function getModelLabel(
  cfg: ChatProviderUIConfig,
  modelId: string,
): string {
  return cfg.models.find((m) => m.id === modelId)?.label ?? cfg.models[0]!.label;
}

export function getModeLabel(cfg: ChatProviderUIConfig, modeId: string): string {
  return cfg.modes.find((m) => m.id === modeId)?.label ?? cfg.modes[0]!.label;
}
