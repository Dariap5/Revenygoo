"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

import { PricingCard } from "./pricing-card";

const PLANS = {
  basic: {
    features: [
      "До 50 запросов в день",
      "1 пользователь",
      "Базовые сценарии",
      "История чатов 7 дней",
      "Email поддержка",
    ],
  },
  pro: {
    features: [
      "Неограниченные запросы",
      "До 10 пользователей",
      "Все сценарии + кастомные",
      "Неограниченная история",
      "База знаний — 10 ГБ",
      "Приоритетная поддержка",
      "Аналитика и аудит",
    ],
  },
  enterprise: {
    features: [
      "Неограниченные пользователи",
      "On-premise деплой",
      "SSO / SAML",
      "Кастомные интеграции",
      "SLA 99.9%",
      "Персональный менеджер",
    ],
  },
} as const;

export function WorkspacePricingPlans() {
  const [yearly, setYearly] = useState(false);

  return (
    <div className="mx-auto max-w-5xl p-6 sm:p-8">
      <div className="mb-10 text-center sm:mb-12">
        <h1 className="mb-3 text-3xl font-bold tracking-tight">
          Выберите тариф
        </h1>
        <p className="mx-auto max-w-md text-base text-muted-foreground">
          Начните бесплатно. Обновитесь когда будете готовы.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <span className="text-sm text-muted-foreground">Помесячно</span>
          <button
            type="button"
            role="switch"
            aria-checked={yearly}
            onClick={() => setYearly((v) => !v)}
            className={cn(
              "relative h-7 w-12 shrink-0 rounded-full border border-border transition-colors",
              yearly ? "bg-primary" : "bg-muted",
            )}
            aria-label={yearly ? "Ежегодная оплата" : "Помесячная оплата"}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 size-6 rounded-full bg-background shadow transition-transform",
                yearly && "translate-x-5",
              )}
            />
          </button>
          <span className="text-sm text-muted-foreground">Ежегодно</span>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
            −20%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <PricingCard
          name="Базовый"
          price="0 ₽"
          description="Для знакомства с платформой"
          features={[...PLANS.basic.features]}
          cta="Начать бесплатно"
          variant="default"
        />
        <PricingCard
          name="Pro"
          price={yearly ? "9 504 ₽" : "990 ₽"}
          pricePeriod={yearly ? "/год" : "/мес"}
          description="Для команд и активных пользователей"
          features={[...PLANS.pro.features]}
          cta="Начать 14 дней бесплатно"
          variant="featured"
          badge="Популярный"
        />
        <PricingCard
          name="Корпоративный"
          price="По запросу"
          description="Для крупных компаний"
          features={[...PLANS.enterprise.features]}
          cta="Связаться с нами"
          variant="default"
        />
      </div>
    </div>
  );
}
