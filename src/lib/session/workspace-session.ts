/**
 * Локальная «сессия» рабочего места (mock, без backend).
 * Подходит для последующей персонализации: должность, отдел, типовые AI-задачи.
 */

export const WORKSPACE_SESSION_KEY = "revenygo.workspaceSession.v1";

export type AiTaskId =
  | "emails"
  | "summary"
  | "presentations"
  | "data"
  | "code"
  | "meetings"
  | "translate"
  | "ideas"
  | "other";

export type UserProfileOnboarding = {
  jobTitle: string;
  department: string;
};

/** Настройки из личного кабинета (mock, localStorage). */
export type CabinetPreferences = {
  allowManualModel: boolean;
  showSafetyWarnings: boolean;
  useCorporateContextByDefault: boolean;
  interfaceLanguage: "ru" | "en";
  emailNotifications: boolean;
};

export function defaultCabinetPreferences(): CabinetPreferences {
  return {
    allowManualModel: true,
    showSafetyWarnings: true,
    useCorporateContextByDefault: true,
    interfaceLanguage: "ru",
    emailNotifications: false,
  };
}

export type WorkspaceSessionV1 = {
  version: 1;
  authenticated: boolean;
  login: string;
  profile: UserProfileOnboarding | null;
  /** Первый шаг onboarding: краткие правила ИИ приняты. */
  aiGuideCompleted: boolean;
  /** Черновик onboarding профиля. */
  profileDraft: {
    jobTitle: string;
    department: string;
  };
  cabinetPreferences: CabinetPreferences;
};

const emptyDraft = (): WorkspaceSessionV1["profileDraft"] => ({
  jobTitle: "",
  department: "",
});

export function defaultWorkspaceSession(): WorkspaceSessionV1 {
  return {
    version: 1,
    authenticated: false,
    login: "",
    profile: null,
    aiGuideCompleted: false,
    profileDraft: emptyDraft(),
    cabinetPreferences: defaultCabinetPreferences(),
  };
}

/** Имя для UI из логина (до @), без отдельного поля в onboarding. */
export function displayNameFromLogin(login: string): string {
  const local = login.split("@")[0]?.trim() || "user";
  const parts = local.split(/[._\-+]+/).filter(Boolean);
  if (parts.length === 0) return "Пользователь";
  return parts
    .map((p) => {
      const lower = p.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

export function getUserInitials(displayName: string): string {
  const parts = displayName.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function parseSession(raw: string | null): WorkspaceSessionV1 | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<WorkspaceSessionV1>;
    if (v.version !== 1) return null;
    const base = defaultWorkspaceSession();
    return {
      ...base,
      ...v,
      profileDraft: {
        ...emptyDraft(),
        ...v.profileDraft,
      },
      cabinetPreferences: {
        ...defaultCabinetPreferences(),
        ...v.cabinetPreferences,
      },
    };
  } catch {
    return null;
  }
}

export function readWorkspaceSession(): WorkspaceSessionV1 {
  if (typeof window === "undefined") return defaultWorkspaceSession();
  return parseSession(localStorage.getItem(WORKSPACE_SESSION_KEY)) ?? defaultWorkspaceSession();
}

export function writeWorkspaceSession(session: WorkspaceSessionV1): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(WORKSPACE_SESSION_KEY, JSON.stringify(session));
}

export function patchWorkspaceSession(
  patch: Partial<WorkspaceSessionV1>,
): WorkspaceSessionV1 {
  const next = { ...readWorkspaceSession(), ...patch };
  writeWorkspaceSession(next);
  return next;
}

export function patchCabinetPreferences(
  patch: Partial<CabinetPreferences>,
): WorkspaceSessionV1 {
  const cur = readWorkspaceSession();
  return patchWorkspaceSession({
    cabinetPreferences: { ...cur.cabinetPreferences, ...patch },
  });
}

/** Mock «выход»: сброс сессии и возврат на экран входа. */
export function logoutWorkspaceSession(): void {
  writeWorkspaceSession(defaultWorkspaceSession());
}

/** Куда перенаправить с главной / из login при текущей сессии */
export function getPostAuthPath(session: WorkspaceSessionV1): string {
  if (!session.authenticated) return "/login";
  if (!session.aiGuideCompleted) return "/onboarding";
  if (!session.profile) return "/onboarding/profile";
  return "/chat";
}

/** Редиректы внутри маршрутов с WorkspaceShell. */
export function workspaceEntryRedirect(session: WorkspaceSessionV1): string | null {
  if (!session.authenticated) return "/login";
  if (!session.aiGuideCompleted) return "/onboarding";
  if (!session.profile) return "/onboarding/profile";
  return null;
}
