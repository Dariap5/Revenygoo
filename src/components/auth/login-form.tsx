"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { applySupabaseUserToWorkspaceSession } from "@/lib/auth/sync-workspace-from-supabase";
import { signInAsDemoSupabaseUser } from "@/lib/auth/demo-supabase-sign-in";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getPostAuthPath,
  readWorkspaceSession,
} from "@/lib/session/workspace-session";
import { createBrowserSupabaseClient } from "@/lib/server/supabase/browser";

type LoginFormProps = {
  /** Безопасный внутренний путь после входа (из `?next=`). */
  nextPath?: string | null;
};

export function LoginForm({ nextPath = null }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email: string | null;
    password: string | null;
    demo: string | null;
  }>({
    email: null,
    password: null,
    demo: null,
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const redirectAfterLogin = () => {
    const session = readWorkspaceSession();
    router.push(nextPath ?? getPostAuthPath(session));
  };

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({ email: null, password: null, demo: null });

    const normalizedEmail = email.trim().toLowerCase();
    let hasValidationError = false;
    const nextErrors = { email: null, password: null, demo: null } as {
      email: string | null;
      password: string | null;
      demo: string | null;
    };

    if (!normalizedEmail) {
      nextErrors.email = "Введите email.";
      hasValidationError = true;
    }
    if (!password) {
      nextErrors.password = "Введите пароль.";
      hasValidationError = true;
    }
    if (hasValidationError) {
      setFieldErrors(nextErrors);
      return;
    }

    setSubmitLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
      if (error || !data.user) {
        const message = error?.message ?? "Не удалось войти.";
        if (message === "Invalid login credentials") {
          setFieldErrors((prev) => ({
            ...prev,
            password: "Неверный email или пароль.",
          }));
          return;
        }
        setFieldErrors((prev) => ({
          ...prev,
          password: message,
        }));
        return;
      }
      applySupabaseUserToWorkspaceSession(data.user);
      redirectAfterLogin();
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setFieldErrors((prev) => ({ ...prev, demo: null }));
    setDemoLoading(true);
    try {
      const result = await signInAsDemoSupabaseUser();
      if (!result.ok) {
        setFieldErrors((prev) => ({ ...prev, demo: result.message }));
        return;
      }
      redirectAfterLogin();
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[400px] rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 space-y-2 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Вход в рабочее место</h1>
        <p className="text-sm text-gray-500">Введите email и пароль.</p>
      </div>

      <form className="space-y-4" onSubmit={handleSignIn} noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="login-email" className="text-gray-700">
            Email
          </Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="bg-white"
          />
          {fieldErrors.email ? (
            <p className="text-xs text-destructive" role="alert">
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="login-password" className="text-gray-700">
            Пароль
          </Label>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="bg-white"
          />
          {fieldErrors.password ? (
            <p className="text-xs text-destructive" role="alert">
              {fieldErrors.password}
            </p>
          ) : null}
        </div>

        <div className="flex justify-end">
          <Link href="/login/forgot" className="text-sm text-gray-500 hover:text-gray-800">
            Забыли пароль?
          </Link>
        </div>

        <Button type="submit" className="h-10 w-full" disabled={submitLoading || demoLoading}>
          {submitLoading ? "Вход…" : "Войти"}
        </Button>
      </form>

      <div className="mt-6 border-t border-gray-100 pt-4 text-center">
        <button
          type="button"
          onClick={handleDemoSignIn}
          disabled={submitLoading || demoLoading}
          className="text-xs text-gray-500 underline-offset-2 hover:text-gray-800 hover:underline disabled:opacity-60"
        >
          {demoLoading ? "Вход в демо…" : "Демо-доступ"}
        </button>
        {fieldErrors.demo ? (
          <p className="mt-2 text-xs text-destructive" role="alert">
            {fieldErrors.demo}
          </p>
        ) : null}
      </div>
    </div>
  );
}
