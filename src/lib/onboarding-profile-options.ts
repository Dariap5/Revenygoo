import type { AiTaskId } from "@/lib/session/workspace-session";

export const DEPARTMENT_SUGGESTIONS = [
  "Product",
  "Marketing",
  "Sales",
  "Engineering",
  "Finance",
  "Legal",
  "HR",
] as const;

export const AI_TASK_OPTIONS: { id: AiTaskId; label: string }[] = [
  { id: "emails", label: "Писать письма" },
  { id: "summary", label: "Делать summary документов" },
  { id: "presentations", label: "Готовить презентации" },
  { id: "data", label: "Анализировать данные" },
  { id: "code", label: "Писать код" },
  { id: "meetings", label: "Разбирать встречи" },
  { id: "translate", label: "Переводить тексты" },
  { id: "ideas", label: "Искать идеи" },
  { id: "other", label: "Другое" },
];
