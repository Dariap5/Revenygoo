/** Mock: правила безопасности для админ-экрана (без backend) */

export type PolicyDataType =
  | "credentials"
  | "client data"
  | "financial data"
  | "internal documents"
  | "code / secrets";

export type PolicyRole =
  | "employee"
  | "manager"
  | "finance"
  | "legal"
  | "developer"
  | "admin";

export type PolicyModel = "Auto" | "GPT" | "Claude" | "Gemini" | "All models";

export type PolicyAction = "warn" | "hide" | "block";

export type PolicyStatus = "active" | "inactive";

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  dataType: PolicyDataType;
  role: PolicyRole;
  model: PolicyModel;
  action: PolicyAction;
  status: PolicyStatus;
}

export const POLICY_DATA_TYPE_OPTIONS: { value: PolicyDataType; label: string }[] =
  [
    { value: "credentials", label: "Credentials" },
    { value: "client data", label: "Client data" },
    { value: "financial data", label: "Financial data" },
    { value: "internal documents", label: "Internal documents" },
    { value: "code / secrets", label: "Code / secrets" },
  ];

export const POLICY_ROLE_OPTIONS: { value: PolicyRole; label: string }[] = [
  { value: "employee", label: "Employee" },
  { value: "manager", label: "Manager" },
  { value: "finance", label: "Finance" },
  { value: "legal", label: "Legal" },
  { value: "developer", label: "Developer" },
  { value: "admin", label: "Admin" },
];

export const POLICY_MODEL_OPTIONS: { value: PolicyModel; label: string }[] = [
  { value: "Auto", label: "Auto" },
  { value: "GPT", label: "GPT" },
  { value: "Claude", label: "Claude" },
  { value: "Gemini", label: "Gemini" },
  { value: "All models", label: "All models" },
];

export const POLICY_ACTION_OPTIONS: { value: PolicyAction; label: string }[] = [
  { value: "warn", label: "Warn" },
  { value: "hide", label: "Hide" },
  { value: "block", label: "Block" },
];

export const mockSecurityPolicies: SecurityPolicy[] = [
  {
    id: "pol-1",
    name: "Блокировать пароли и токены",
    description: "Запрет отправки credentials во все внешние модели.",
    dataType: "credentials",
    role: "employee",
    model: "All models",
    action: "block",
    status: "active",
  },
  {
    id: "pol-2",
    name: "Скрывать клиентские данные",
    description: "Маскирование client data перед запросом к провайдеру.",
    dataType: "client data",
    role: "employee",
    model: "All models",
    action: "hide",
    status: "active",
  },
  {
    id: "pol-3",
    name: "Предупреждать о финансовых данных",
    description: "Показывать предупреждение при отправке financial data.",
    dataType: "financial data",
    role: "manager",
    model: "GPT",
    action: "warn",
    status: "active",
  },
  {
    id: "pol-4",
    name: "Внутренние документы для сотрудников",
    description: "Блок internal documents для роли employee.",
    dataType: "internal documents",
    role: "employee",
    model: "Claude",
    action: "block",
    status: "active",
  },
  {
    id: "pol-5",
    name: "Секреты в коде",
    description: "Скрытие code / secrets в ответах и перед отправкой.",
    dataType: "code / secrets",
    role: "developer",
    model: "All models",
    action: "hide",
    status: "active",
  },
  {
    id: "pol-6",
    name: "Договоры и legal",
    description: "Предупреждение legal при отправке договоров во внешние модели.",
    dataType: "internal documents",
    role: "legal",
    model: "Gemini",
    action: "warn",
    status: "active",
  },
  {
    id: "pol-7",
    name: "Финансы: только Auto",
    description: "Мягкое предупреждение для finance при выборе конкретной модели.",
    dataType: "financial data",
    role: "finance",
    model: "Auto",
    action: "warn",
    status: "inactive",
  },
  {
    id: "pol-8",
    name: "Админ и credentials",
    description: "Дополнительный контроль credentials для admin.",
    dataType: "credentials",
    role: "admin",
    model: "GPT",
    action: "block",
    status: "active",
  },
];
