import type { KnowledgeSource } from "@/types";

export const knowledgeSourceTypes: KnowledgeSource["type"][] = [
  "PDF",
  "DOCX",
  "Notion",
  "Таблица",
  "Регламент",
  "FAQ",
];

export const mockKnowledgeSources: KnowledgeSource[] = [
  {
    id: "ks-1",
    title: "Брендбук 2025",
    type: "PDF",
    description: "Логотипы, цвета, типографика",
    addedAt: "2026-03-12",
    status: "ready",
  },
  {
    id: "ks-2",
    title: "Шаблон NDA",
    type: "DOCX",
    description: "Юридический шаблон для партнёров",
    addedAt: "2026-03-18",
    status: "ready",
  },
  {
    id: "ks-3",
    title: "База знаний отдела продаж",
    type: "Notion",
    description: "Скрипты, возражения, кейсы",
    addedAt: "2026-03-22",
    status: "ready",
  },
  {
    id: "ks-4",
    title: "KPI и планы Q1",
    type: "Таблица",
    description: "Сводка по командам без персональных данных",
    addedAt: "2026-03-28",
    status: "processing",
  },
  {
    id: "ks-5",
    title: "Регламент удалённой работы",
    type: "Регламент",
    description: "Правила доступа и оборудования",
    addedAt: "2026-04-01",
    status: "ready",
  },
  {
    id: "ks-6",
    title: "IT — частые вопросы",
    type: "FAQ",
    description: "VPN, почта, учётные записи",
    addedAt: "2026-04-02",
    status: "ready",
  },
  {
    id: "ks-7",
    title: "Политика информационной безопасности",
    type: "PDF",
    description: "Требования к данным и доступам",
    addedAt: "2026-04-02",
    status: "ready",
  },
  {
    id: "ks-8",
    title: "Онбординг новых сотрудников",
    type: "Notion",
    description: "Чеклисты и ссылки первой недели",
    addedAt: "2026-04-03",
    status: "processing",
  },
];

export function getKnowledgeSourceById(id: string) {
  return mockKnowledgeSources.find((s) => s.id === id);
}

export function getKnowledgeSourcesByIds(ids: string[]) {
  const set = new Set(ids);
  return mockKnowledgeSources.filter((s) => set.has(s.id));
}
