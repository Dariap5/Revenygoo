"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Введите корректный email.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = (await res.json()) as { message?: string; error?: string };

      if (!res.ok) {
        setError(data.error ?? "Не удалось отправить запрос.");
        return;
      }

      setMessage(
        data.message ??
          "Если такой email зарегистрирован, мы отправили ссылку для сброса пароля.",
      );
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз.");
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
            Сброс пароля
          </h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Укажите email — отправим ссылку для нового пароля.
          </p>
        </div>

        <div className="mt-5 space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-[hsl(var(--foreground))]">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="name@company.ru"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {message ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))]" role="status">
            {message}
          </p>
        ) : null}

        <Button type="submit" className="mt-2 h-10 w-full" disabled={loading}>
          {loading ? "Отправка…" : "Отправить ссылку"}
        </Button>

        <p className="mt-2 text-center text-sm">
          <Link
            href="/login"
            className="text-[hsl(var(--foreground))] underline-offset-2 hover:underline"
          >
            Назад ко входу
          </Link>
        </p>
      </form>
    </div>
  );
}
