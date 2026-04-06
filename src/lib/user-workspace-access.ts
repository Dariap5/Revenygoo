/**
 * Сопоставление профиля onboarding с mock-отделом и вычисление «доступов» для ЛК.
 */

import {
  getDepartmentContext,
  getDepartmentModels,
  getDepartmentScenarios,
  mockDepartments,
  type OrgDepartment,
} from "@/lib/mock/organization";
import { getScenarioById } from "@/lib/mock/scenarios";
import type { UserProfileOnboarding } from "@/lib/session/workspace-session";

function norm(s: string): string {
  return s.trim().toLowerCase();
}

export function resolveMockDepartmentForProfile(
  departmentLabel: string,
): OrgDepartment {
  const n = norm(departmentLabel);
  const exact = mockDepartments.find((d) => norm(d.name) === n);
  if (exact) return exact;

  if (n.includes("product") || n.includes("продукт"))
    return mockDepartments.find((d) => d.id === "dept-product")!;
  if (n.includes("market") || n.includes("маркетинг"))
    return mockDepartments.find((d) => d.id === "dept-mkt")!;
  if (n.includes("sales") || n.includes("продаж"))
    return mockDepartments.find((d) => d.id === "dept-sales")!;
  if (
    n.includes("engineer") ||
    n.includes("разработ") ||
    n.includes("инженер")
  )
    return mockDepartments.find((d) => d.id === "dept-eng")!;
  if (n.includes("finance") || n.includes("финанс"))
    return mockDepartments.find((d) => d.id === "dept-finance")!;
  if (n.includes("legal") || n.includes("юрис"))
    return mockDepartments.find((d) => d.id === "dept-legal")!;
  if (n.includes("hr") || n.includes("кадр") || n.includes("персонал"))
    return mockDepartments.find((d) => d.id === "dept-mkt")!;

  return mockDepartments.find((d) => d.id === "dept-product")!;
}

export function getWorkspaceAccessSummary(profile: UserProfileOnboarding | null) {
  if (!profile) {
    return {
      models: [] as string[],
      context: [] as string[],
      scenarios: [] as { id: string; title: string }[],
      securityLabel: "Не задано",
      departmentName: "—",
    };
  }

  const dept = resolveMockDepartmentForProfile(profile.department);
  const models = getDepartmentModels(dept);
  const context = getDepartmentContext(dept);
  const scenarioIds = getDepartmentScenarios(dept);
  const scenarios = scenarioIds.map((id) => ({
    id,
    title: getScenarioById(id).title,
  }));

  return {
    models,
    context,
    scenarios,
    securityLabel: "Стандартный контур организации",
    departmentName: dept.name,
  };
}
