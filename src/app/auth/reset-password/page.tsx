"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { applySupabaseUserToWorkspaceSession } from "@/lib/auth/sync-workspace-from-supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBrowserSupabaseClient } from "@/lib/server/supabase/browser";
import { getPostAuthPath, readWorkspaceSession } from "@/lib/session/workspace-session";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createBrowserSupabaseClient();
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (!data.session) {
          setError(
            "Сессия сброса не найдена. Откройте ссылку из письма ещё раз или запросите новую.",
          );
          return;
        }
        setReady(true);
      } catch {
        if (!cancelled) {
          setError("Не удалось проверить сессию. Проверьте настройки Supabase.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Пароль не короче 6 символов.");
      return;
    }
    if (password !== confirm) {
      setError("Пароли не совпадают.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error: upError } = await supabase.auth.updateUser({ password });
      if (upError) {
        setError(upError.message);
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        applySupabaseUserToWorkspaceSession(userData.user);
      }
      const next = readWorkspaceSession();
      router.replace(getPostAuthPath(next));
    } catch {
      setError("Ошибка при сохранении пароля.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[hsl(var(--background))] p-4">
      <div className="mb-8 flex items-center gap-1">
        <span className="font-black text-lg tracking-tighter text-[hsl(var(--foreground))]">
          II
        </span>
        <span className="text-lg font-semibold tracking-tight text-[hsl(var(--foreground))]">
          Revenygo
        </span>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-3"
      >
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">
            Новый пароль
          </h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Придумайте пароль для входа в рабочее место.
          </p>
        </div>

        <div className="mt-5 space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-[hsl(var(--foreground))]">
            Новый пароль
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading || !ready}
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="confirm"
            className="text-sm font-medium text-[hsl(var(--foreground))]"
          >
            Повторите пароль
          </Label>
          <Input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={loading || !ready}
          />
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="mt-2 h-10 w-full" disabled={loading || !ready}>
          {loading ? "Сохранение…" : "Сохранить и войти"}
        </Button>

        <p className="mt-2 text-center text-sm">
          <Link
            href="/login"
            className="text-[hsl(var(--foreground))] underline-offset-2 hover:underline"
          >
            На страницу входа
          </Link>
        </p>
      </form>
    </div>
  );
}
