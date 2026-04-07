"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { applySupabaseUserToWorkspaceSession } from "@/lib/auth/sync-workspace-from-supabase";
import { isDemoLoginEnabled } from "@/lib/auth/demo-login-flag";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBrowserSupabaseClient } from "@/lib/server/supabase/browser";
import {
  defaultWorkspaceSession,
  getPostAuthPath,
  patchWorkspaceSession,
  readWorkspaceSession,
} from "@/lib/session/workspace-session";

export function LoginForm() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const demoEnabled = isDemoLoginEnabled();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = login.trim();
    if (!trimmed) {
      setError("Введите email.");
      return;
    }
    if (!password) {
      setError("Введите пароль.");
      return;
    }

    if (demoEnabled && password === "demo") {
      const prev = readWorkspaceSession();
      const base =
        prev.authenticated && prev.login === trimmed
          ? prev
          : { ...defaultWorkspaceSession(), authenticated: true, login: trimmed };

      const next = patchWorkspaceSession({
        ...base,
        authenticated: true,
        login: trimmed,
      });
      router.push(getPostAuthPath(next));
      return;
    }

    setLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error: signError } = await supabase.auth.signInWithPassword({
        email: trimmed,
        password,
      });

      if (signError) {
        setError(
          signError.message === "Invalid login credentials"
            ? "Неверный email или пароль."
            : signError.message,
        );
        return;
      }

      if (!data.user) {
        setError("Не удалось получить пользователя после входа.");
        return;
      }

      applySupabaseUserToWorkspaceSession(data.user);
      const next = readWorkspaceSession();
      router.push(getPostAuthPath(next));
    } catch {
      setError(
        "Не настроен Supabase (проверьте NEXT_PUBLIC_SUPABASE_URL и ANON KEY) или ошибка сети.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-sm flex-col gap-3"
    >
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">
          Вход в рабочее место
        </h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          {demoEnabled
            ? "Основной вход — Supabase Auth. Демо-режим доступен паролем demo."
            : "Вход через Supabase Auth (email и пароль)."}
        </p>
      </div>

      <div className="mt-5 space-y-2">
        <Label htmlFor="login" className="text-sm font-medium text-[hsl(var(--foreground))]">
          Email
        </Label>
        <Input
          id="login"
          name="login"
          type="email"
          autoComplete="username"
          placeholder="name@company.ru"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium text-[hsl(var(--foreground))]">
          Пароль
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" className="mt-2 h-10 w-full" disabled={loading}>
        {loading ? "Вход…" : "Войти"}
      </Button>

      <p className="mt-4 text-center text-sm text-[hsl(var(--muted-foreground))]">
        Забыли доступ?{" "}
        <span className="font-medium text-[hsl(var(--foreground))] underline-offset-2 hover:underline">
          Обратитесь к администратору организации
        </span>
      </p>
    </form>
  );
}
