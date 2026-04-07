"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Camera } from "lucide-react";

import { Button } from "@/components/ui/button";
import { signOutApp } from "@/lib/auth/sign-out-app";
import {
  displayNameFromLogin,
  readWorkspaceSession,
  type WorkspaceSessionV1,
} from "@/lib/session/workspace-session";
import { cn } from "@/lib/utils";

const ACCENT_THEMES = [
  { id: "violet", label: "Фиолетовый", from: "#7C3AED", to: "#C026D3" },
  { id: "ocean", label: "Океан", from: "#2563EB", to: "#0D9488" },
  { id: "sunset", label: "Закат", from: "#EA580C", to: "#DB2777" },
  { id: "forest", label: "Лес", from: "#16A34A", to: "#0D9488" },
  { id: "gold", label: "Золото", from: "#D97706", to: "#EA580C" },
  { id: "slate", label: "Нейтральный", from: "#475569", to: "#64748B" },
] as const;

const AVATAR_STORAGE_KEY = "user_avatar";

export function EmployeeProfilePage() {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<WorkspaceSessionV1 | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [activeTheme, setActiveTheme] = useState<string>("violet");
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setSession(readWorkspaceSession());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setAvatarUrl(localStorage.getItem(AVATAR_STORAGE_KEY));
    setActiveTheme(localStorage.getItem("accent_theme") ?? "violet");
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || pathname !== "/profile") return;
    if (window.location.hash !== "#profile-settings") return;
    requestAnimationFrame(() => {
      document
        .getElementById("profile-settings")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [pathname]);

  const displayName = session?.login
    ? displayNameFromLogin(session.login)
    : "Пользователь";
  const profile = session?.profile;

  const emailLine = useMemo(() => {
    if (!session?.login) return "—";
    return session.login;
  }, [session?.login]);

  const isEmail = emailLine.includes("@");

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setAvatarUrl(url);
      localStorage.setItem(AVATAR_STORAGE_KEY, url);
    };
    reader.readAsDataURL(file);
  }

  function applyTheme(themeId: string) {
    setActiveTheme(themeId);
    localStorage.setItem("accent_theme", themeId);
    document.documentElement.setAttribute("data-accent", themeId);
  }

  function toggleDark() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme_dark", String(next));
  }

  if (!session?.authenticated || !profile) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
        Профиль недоступен. Завершите вход и onboarding.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          Профиль
        </h1>
        <p className="mt-1.5 max-w-xl text-sm leading-snug text-muted-foreground">
          Основные данные и оформление интерфейса. Сохраняется локально в браузере
          (демо).
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex flex-col items-center sm:items-start">
            <button
              type="button"
              className="group relative size-20 shrink-0 cursor-pointer rounded-full outline-none"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- локальный data URL из FileReader
                <img
                  src={avatarUrl}
                  alt="Аватар"
                  className="size-20 rounded-full object-cover"
                />
              ) : (
                <div className="flex size-20 items-center justify-center rounded-full text-2xl font-bold text-white rg-shimmer-btn">
                  {displayName[0] ?? "U"}
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="size-[18px] text-white" aria-hidden />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </button>
            <p className="mt-1.5 text-center text-xs text-muted-foreground sm:text-left">
              Нажмите чтобы изменить
            </p>
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Имя</p>
              <p className="text-base font-semibold text-foreground">
                {displayName}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {isEmail ? "Email" : "Логин"}
              </p>
              <p className="text-sm text-foreground/90">{emailLine}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Должность / роль
              </p>
              <p className="text-sm text-foreground">{profile.jobTitle}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Компания
              </p>
              <p className="text-sm text-foreground">
                Revenygo{profile.department ? ` · ${profile.department}` : ""}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">
          Цвет платформы
        </h2>
        <p className="text-xs text-muted-foreground">
          Влияет на акценты интерфейса (кнопки, метки, точки статуса).
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {ACCENT_THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              title={theme.label}
              onClick={() => applyTheme(theme.id)}
              className={cn(
                "size-8 rounded-full transition-all duration-200",
                activeTheme === theme.id
                  ? "scale-110 ring-2 ring-offset-2 ring-offset-background"
                  : "opacity-70 hover:opacity-100 hover:scale-105",
              )}
              style={{
                background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`,
                ...(activeTheme === theme.id
                  ? {
                      outline: `2px solid ${theme.from}`,
                      outlineOffset: "2px",
                    }
                  : {}),
              }}
            />
          ))}
        </div>
      </section>

      <section
        id="profile-settings"
        className="scroll-mt-8 space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
      >
        <div className="flex items-center justify-between gap-4 border-b border-border py-1 pb-4">
          <div>
            <p className="text-sm font-medium text-foreground">Тёмный режим</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Переключить тему интерфейса
            </p>
          </div>
          <button
            type="button"
            onClick={toggleDark}
            className={cn(
              "relative h-[22px] w-11 shrink-0 rounded-full transition-all duration-300",
              isDark
                ? "rg-shimmer-btn"
                : "border border-border bg-muted",
            )}
            aria-pressed={isDark}
          >
            <span
              className={cn(
                "absolute top-0.5 size-[18px] rounded-full bg-white shadow-sm transition-transform duration-300",
                isDark ? "translate-x-[22px]" : "translate-x-0.5",
              )}
            />
          </button>
        </div>
      </section>

      <section>
        <Button
          type="button"
          variant="outline"
          className="rounded-xl text-destructive hover:bg-destructive/5 hover:text-destructive"
          onClick={() => {
            void (async () => {
              await signOutApp();
              router.push("/login");
            })();
          }}
        >
          Выйти из аккаунта
        </Button>
      </section>
    </div>
  );
}
