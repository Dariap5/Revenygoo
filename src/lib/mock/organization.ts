/**
 * Mock org chart + доступы (company → department → employee).
 * Без backend и без реальной матрицы прав.
 */

export type EmployeeStatus = "active" | "limited";

export interface CompanyAccessDefaults {
  /** Человекочитаемые названия контекста */
  context: string[];
  models: string[];
  /** id сценариев из mockScenarios */
  scenarioIds: string[];
}

export interface OrgDepartment {
  id: string;
  name: string;
  parentId: string | null;
  headEmployeeId: string;
  /** Дополнения к company default на уровне отдела */
  departmentAccess: {
    contextAdd: string[];
    /** полный список моделей для отдела (MVP: замена набора компании) */
    models: string[];
    scenarioIds: string[];
  };
}

export interface OrgEmployee {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  /** null только у CEO */
  departmentId: string | null;
  managerId: string | null;
  directReportIds: string[];
  status: EmployeeStatus;
  /** null = только company + department */
  accessOverride: {
    contextAdd: string[];
    extraModels: string[];
    extraScenarioIds: string[];
  } | null;
}

export const mockCompanyDefaults: CompanyAccessDefaults = {
  context: [
    "Брендбук 2025",
    "Регламент ИБ (краткий)",
    "FAQ по продукту",
  ],
  models: ["Auto", "GPT"],
  scenarioIds: [
    "write-email",
    "doc-summary",
    "translate",
    "research",
  ],
};

export const mockDepartments: OrgDepartment[] = [
  {
    id: "dept-sales",
    name: "Sales",
    parentId: null,
    headEmployeeId: "emp-sales-vp",
    departmentAccess: {
      contextAdd: ["База знаний отдела продаж", "KPI и планы Q1"],
      models: ["Auto", "GPT", "Claude"],
      scenarioIds: [
        "write-email",
        "doc-summary",
        "presentation",
        "research",
      ],
    },
  },
  {
    id: "dept-sales-ent",
    name: "Enterprise Sales",
    parentId: "dept-sales",
    headEmployeeId: "emp-ent-lead",
    departmentAccess: {
      contextAdd: ["Шаблон NDA"],
      models: ["Auto", "GPT", "Claude", "Gemini"],
      scenarioIds: [
        "write-email",
        "presentation",
        "research",
        "meeting-recap",
      ],
    },
  },
  {
    id: "dept-sales-com",
    name: "Commercial",
    parentId: "dept-sales",
    headEmployeeId: "emp-com-lead",
    departmentAccess: {
      contextAdd: [],
      models: ["Auto", "GPT"],
      scenarioIds: ["write-email", "doc-summary", "research"],
    },
  },
  {
    id: "dept-mkt",
    name: "Marketing",
    parentId: null,
    headEmployeeId: "emp-mkt-head",
    departmentAccess: {
      contextAdd: ["Брендбук 2025"],
      models: ["Auto", "Gemini", "GPT"],
      scenarioIds: [
        "presentation",
        "research",
        "brainstorm",
        "doc-summary",
      ],
    },
  },
  {
    id: "dept-product",
    name: "Product",
    parentId: null,
    headEmployeeId: "emp-pm-lead",
    departmentAccess: {
      contextAdd: ["Roadmap Q2 (черновик)"],
      models: ["Auto", "Claude", "GPT"],
      scenarioIds: [
        "research",
        "doc-summary",
        "meeting-recap",
        "brainstorm",
      ],
    },
  },
  {
    id: "dept-eng",
    name: "Engineering",
    parentId: null,
    headEmployeeId: "emp-eng-vp",
    departmentAccess: {
      contextAdd: ["Внутренний styleguide API"],
      models: ["Auto", "GPT", "Claude"],
      scenarioIds: ["code-help", "doc-summary", "research"],
    },
  },
  {
    id: "dept-eng-plat",
    name: "Platform",
    parentId: "dept-eng",
    headEmployeeId: "emp-plat-lead",
    departmentAccess: {
      contextAdd: ["Runbooks инфраструктуры"],
      models: ["Auto", "GPT", "Claude", "Gemini"],
      scenarioIds: ["code-help", "doc-summary", "translate"],
    },
  },
  {
    id: "dept-eng-app",
    name: "Applications",
    parentId: "dept-eng",
    headEmployeeId: "emp-app-lead",
    departmentAccess: {
      contextAdd: [],
      models: ["Auto", "GPT"],
      scenarioIds: ["code-help", "doc-summary", "research"],
    },
  },
  {
    id: "dept-legal",
    name: "Legal",
    parentId: null,
    headEmployeeId: "emp-gc",
    departmentAccess: {
      contextAdd: ["Шаблон NDA", "Политика данных"],
      models: ["Auto", "Claude"],
      scenarioIds: ["write-email", "doc-summary", "translate"],
    },
  },
  {
    id: "dept-finance",
    name: "Finance",
    parentId: null,
    headEmployeeId: "emp-cfo",
    departmentAccess: {
      contextAdd: ["KPI и планы Q1"],
      models: ["Auto", "GPT"],
      scenarioIds: ["doc-summary", "research", "presentation"],
    },
  },
];

export const mockEmployees: OrgEmployee[] = [
  {
    id: "emp-ceo",
    firstName: "Анна",
    lastName: "Петрова",
    title: "CEO",
    departmentId: null,
    managerId: null,
    directReportIds: [
      "emp-sales-vp",
      "emp-mkt-head",
      "emp-pm-lead",
      "emp-eng-vp",
      "emp-gc",
      "emp-cfo",
    ],
    status: "active",
    accessOverride: {
      contextAdd: ["Стратегия (confidential)"],
      extraModels: ["Gemini"],
      extraScenarioIds: ["presentation", "brainstorm"],
    },
  },
  {
    id: "emp-sales-vp",
    firstName: "Игорь",
    lastName: "Соколов",
    title: "VP Sales",
    departmentId: "dept-sales",
    managerId: "emp-ceo",
    directReportIds: ["emp-ent-lead", "emp-com-lead", "emp-sales-ops"],
    status: "active",
    accessOverride: null,
  },
  {
    id: "emp-sales-ops",
    firstName: "Мария",
    lastName: "Орлова",
    title: "Sales Operations",
    departmentId: "dept-sales",
    managerId: "emp-sales-vp",
    directReportIds: [],
    status: "active",
    accessOverride: {
      contextAdd: [],
      extraModels: [],
      extraScenarioIds: ["meeting-recap"],
    },
  },
  {
    id: "emp-ent-lead",
    firstName: "Денис",
    lastName: "Ким",
    title: "Head of Enterprise",
    departmentId: "dept-sales-ent",
    managerId: "emp-sales-vp",
    directReportIds: ["emp-ent-ae1", "emp-ent-ae2"],
    status: "active",
    accessOverride: null,
  },
  {
    id: "emp-ent-ae1",
    firstName: "Елена",
    lastName: "Ватутина",
    title: "Account Executive",
    departmentId: "dept-sales-ent",
    managerId: "emp-ent-lead",
    directReportIds: [],
    status: "active",
    accessOverride: null,
  },
  {
    id: "emp-ent-ae2",
    firstName: "Павел",
    lastName: "Новиков",
    title: "Account Executive",
    departmentId: "dept-sales-ent",
    managerId: "emp-ent-lead",
    directReportIds: [],
    status: "limited",
    accessOverride: {
      contextAdd: [],
      extraModels: [],
      extraScenarioIds: [],
    },
  },
  {
    id: "emp-com-lead",
    firstName: "Ольга",
    lastName: "Быкова",
    title: "Head of Commercial",
    departmentId: "dept-sales-com",
    managerId: "emp-sales-vp",
    directReportIds: ["emp-com-sdr"],
    status: "active",
    accessOverride: null,
  },
  {
    id: "emp-com-sdr",
    firstName: "Артём",
    lastName: "Зайцев",
    title: "SDR",
    departmentId: "dept-sales-com",
    managerId: "emp-com-lead",
    directReportIds: [],
    status: "active",
    accessOverride: null,
  },
  {
    id: "emp-mkt-head",
    firstName: "Ксения",
    lastName: "Ларина",
    title: "CMO",
    departmentId: "dept-mkt",
    managerId: "emp-ceo",
    directReportIds: ["emp-mkt-growth", "emp-mkt-content", "emp-mkt-design"],
    status: "active",
    accessOverride: null,
  },
  {
    id: "emp-mkt-growth",
    firstName: "Тимур",
    lastName: "Алиев",
    title: "Growth Lead",
    departmentId: "dept-mkt",
    managerId: "emp-mkt-head",
    directReportIds: [],
    status: "active",
    accessOverride: null,
  },
  {
    id: "emp-mkt-content",
    firstName: "Софья",
    lastName: "Ильина",
    title: "Content Lead",
    departmentId: "dept-mkt",
    managerId: "emp-mkt-head",
    directReportIds: [],
    status: "active",
    accessOverride: {
      contextAdd: ["Гайд по тону коммуникаций"],
      extraModels: ["Claude"],
      extraScenarioIds: ["translate"],
    },
  },
  {
    id: "emp-mkt-design",
    firstName: "Виктор",
    lastName: "Чжан",
    title: "Design Lead",
    departmentId: "dept-mkt",
    managerId: "emp-mkt-head",
    directReportIds: [],
    status: "active",
    accessOverride: null,
  },
  {
    id: "emp-pm-lead",
    firstName: "Никита",
    lastName: "Громов",
    title: "CPO",
    departmentId: "dept-product",
    managerId: "emp-ceo",
    directReportIds: ["emp-pm-1", "emp-pm-2"],
    status: "active",
    accessOverride: null,
  },
  {
    id: "emp-pm-1",
    firstName: "Алина",
    lastName: "Морозова",
    title: "Senior PM",
    departmentId: "dept-product",
    managerId: "emp-pm-lead",
    directReportIds: [],
    status: "active",
    accessOverride: null,
  },
  {
    id: "emp-pm-2",
    firstName: "Георгий",
    lastName: "Поляков",
    title: "PM",
    departmentId: "dept-product",
    managerId: "emp-pm-lead",
    directReportIds: [],
    status: "active",
    accessOverride: null,
  },
  {
    id: "emp-eng-vp",
    firstName: "Сергей",
    lastName: "Волков",
    title: "VP Engineering",
    departmentId: "dept-eng",
    managerId: "emp-ceo",
    directReportIds: ["emp-plat-lead", "emp-app-lead"],
    status: "active",
    accessOverride: null,
  },
  {
    id: "emp-plat-lead",
    firstName: "Ирина",
    lastName: "Степанова",
    title: "Head of Platform",
    departmentId: "dept-eng-plat",
    managerId: "emp-eng-vp",
    directReportIds: ["emp-plat-sre", "emp-plat-be"],
    status: "active",
    accessOverride: null,
  },
  {
    id: "emp-plat-sre",
    firstName: "Михаил",
    lastName: "Котов",
    title: "SRE",
    departmentId: "dept-eng-plat",
    managerId: "emp-plat-lead",
    directReportIds: [],
    status: "active",
    accessOverride: null,
  },
  {
    id: "emp-plat-be",
    firstName: "Дарья",
    lastName: "Ефимова",
    title: "Backend Engineer",
    departmentId: "dept-eng-plat",
    managerId: "emp-plat-lead",
    directReportIds: [],
    status: "active",
    accessOverride: {
      contextAdd: ["Доступ к staging-логам (mock)"],
      extraModels: [],
      extraScenarioIds: ["code-help"],
    },
  },
  {
    id: "emp-app-lead",
    firstName: "Роман",
    lastName: "Лебедев",
    title: "Head of Applications",
    departmentId: "dept-eng-app",
    managerId: "emp-eng-vp",
    directReportIds: ["emp-fe", "emp-mobile"],
    status: "active",
    accessOverride: null,
  },
  {
    id: "emp-fe",
    firstName: "Юлия",
    lastName: "Кравцова",
    title: "Frontend Engineer",
    departmentId: "dept-eng-app",
    managerId: "emp-app-lead",
    directReportIds: [],
    status: "active",
    accessOverride: null,
  },
  {
    id: "emp-mobile",
    firstName: "Андрей",
    lastName: "Фомин",
    title: "Mobile Engineer",
    departmentId: "dept-eng-app",
    managerId: "emp-app-lead",
    directReportIds: [],
    status: "limited",
    accessOverride: null,
  },
  {
    id: "emp-gc",
    firstName: "Екатерина",
    lastName: "Дмитриева",
    title: "General Counsel",
    departmentId: "dept-legal",
    managerId: "emp-ceo",
    directReportIds: ["emp-legal-assoc"],
    status: "active",
    accessOverride: null,
  },
  {
    id: "emp-legal-assoc",
    firstName: "Иван",
    lastName: "Серов",
    title: "Legal Counsel",
    departmentId: "dept-legal",
    managerId: "emp-gc",
    directReportIds: [],
    status: "active",
    accessOverride: null,
  },
  {
    id: "emp-cfo",
    firstName: "Марина",
    lastName: "Тихонова",
    title: "CFO",
    departmentId: "dept-finance",
    managerId: "emp-ceo",
    directReportIds: ["emp-fpna", "emp-controller"],
    status: "active",
    accessOverride: null,
  },
  {
    id: "emp-fpna",
    firstName: "Алексей",
    lastName: "Буров",
    title: "FP&A",
    departmentId: "dept-finance",
    managerId: "emp-cfo",
    directReportIds: [],
    status: "active",
    accessOverride: null,
  },
  {
    id: "emp-controller",
    firstName: "Татьяна",
    lastName: "Рыжова",
    title: "Controller",
    departmentId: "dept-finance",
    managerId: "emp-cfo",
    directReportIds: [],
    status: "active",
    accessOverride: null,
  },
];

const empById = Object.fromEntries(mockEmployees.map((e) => [e.id, e]));
const deptById = Object.fromEntries(mockDepartments.map((d) => [d.id, d]));

export function getEmployeeById(id: string): OrgEmployee | undefined {
  return empById[id];
}

export function getDepartmentById(id: string): OrgDepartment | undefined {
  return deptById[id];
}

/** Контекст: company ∪ department.contextAdd */
export function getDepartmentContext(dept: OrgDepartment): string[] {
  const base = new Set(mockCompanyDefaults.context);
  dept.departmentAccess.contextAdd.forEach((c) => base.add(c));
  return [...base];
}

/** Сотрудник: company ∪ dept ∪ override.contextAdd */
export function getEmployeeContext(emp: OrgEmployee): string[] {
  const dept =
    emp.departmentId != null ? deptById[emp.departmentId] : undefined;
  const fromDept = dept
    ? getDepartmentContext(dept)
    : [...mockCompanyDefaults.context];
  const set = new Set(fromDept);
  emp.accessOverride?.contextAdd.forEach((c) => set.add(c));
  return [...set];
}

export function getDepartmentModels(dept: OrgDepartment): string[] {
  return [...dept.departmentAccess.models];
}

export function getEmployeeModels(emp: OrgEmployee): string[] {
  const dept =
    emp.departmentId != null ? deptById[emp.departmentId] : undefined;
  const base = dept
    ? getDepartmentModels(dept)
    : [...mockCompanyDefaults.models];
  const set = new Set(base);
  emp.accessOverride?.extraModels.forEach((m) => set.add(m));
  return [...set];
}

export function getDepartmentScenarios(dept: OrgDepartment): string[] {
  return [...dept.departmentAccess.scenarioIds];
}

export function getEmployeeScenarios(emp: OrgEmployee): string[] {
  const dept =
    emp.departmentId != null ? deptById[emp.departmentId] : undefined;
  const base = dept
    ? getDepartmentScenarios(dept)
    : [...mockCompanyDefaults.scenarioIds];
  const set = new Set(base);
  emp.accessOverride?.extraScenarioIds.forEach((s) => set.add(s));
  return [...set];
}

export function getEmployeeName(emp: OrgEmployee): string {
  return `${emp.firstName} ${emp.lastName}`;
}

export function getManager(emp: OrgEmployee): OrgEmployee | null {
  if (!emp.managerId) return null;
  return empById[emp.managerId] ?? null;
}

export function getDirectReports(emp: OrgEmployee): OrgEmployee[] {
  return emp.directReportIds
    .map((id) => empById[id])
    .filter(Boolean) as OrgEmployee[];
}

export function getDepartmentHead(dept: OrgDepartment): OrgEmployee | undefined {
  return empById[dept.headEmployeeId];
}

export function getDepartmentEmployees(dept: OrgDepartment): OrgEmployee[] {
  return mockEmployees.filter((e) => e.departmentId === dept.id);
}

export function getSubdepartments(parentId: string): OrgDepartment[] {
  return mockDepartments.filter((d) => d.parentId === parentId);
}

/** Корневые отделы (под CEO) */
export function getRootDepartments(): OrgDepartment[] {
  return mockDepartments.filter((d) => d.parentId === null);
}
