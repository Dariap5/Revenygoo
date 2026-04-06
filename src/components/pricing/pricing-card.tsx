"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export type PricingCardProps = {
  name: string;
  price: string;
  pricePeriod?: string;
  description: string;
  features: string[];
  cta: string;
  variant: "default" | "featured";
  badge?: string;
};

export function PricingCard({
  name,
  price,
  pricePeriod,
  description,
  features,
  cta,
  variant,
  badge,
}: PricingCardProps) {
  const isFeatured = variant === "featured";

  return (
    <div
      className={cn(
        "relative flex flex-col gap-5 rounded-2xl p-6 transition-all duration-300",
        isFeatured
          ? "rg-shimmer-card scale-[1.02] text-white shadow-2xl shadow-purple-500/30 sm:scale-[1.03]"
          : "border border-border bg-background hover:border-purple-300 dark:hover:border-purple-700",
      )}
    >
      {badge ? (
        <div
          className={cn(
            "absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-bold",
            isFeatured
              ? "bg-white text-purple-700"
              : "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-200",
          )}
        >
          ⭐ {badge}
        </div>
      ) : null}

      <div>
        <h3
          className={cn(
            "mb-1 text-lg font-bold",
            isFeatured ? "text-white" : "text-foreground",
          )}
        >
          {name}
        </h3>
        <p
          className={cn(
            "text-sm",
            isFeatured ? "text-white/70" : "text-muted-foreground",
          )}
        >
          {description}
        </p>
      </div>

      <div className="flex items-baseline gap-1">
        <span
          className={cn(
            "text-4xl font-black tracking-tight",
            isFeatured ? "text-white" : "rg-gradient-text",
          )}
        >
          {price}
        </span>
        {pricePeriod ? (
          <span
            className={cn(
              "text-sm",
              isFeatured ? "text-white/60" : "text-muted-foreground",
            )}
          >
            {pricePeriod}
          </span>
        ) : null}
      </div>

      <div className={cn("h-px", isFeatured ? "bg-white/20" : "bg-border")} />

      <ul className="flex flex-1 flex-col gap-3">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            <div
              className={cn(
                "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full",
                isFeatured ? "bg-white/25" : "bg-purple-100 dark:bg-purple-950",
              )}
            >
              <Check
                className={cn(
                  "size-[9px]",
                  isFeatured ? "text-white" : "text-purple-600 dark:text-purple-300",
                )}
                strokeWidth={3}
              />
            </div>
            <span
              className={cn(
                isFeatured ? "text-white/85" : "text-muted-foreground",
              )}
            >
              {feature}
            </span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className={cn(
          "w-full rounded-xl py-3 text-sm font-semibold transition-all duration-200",
          isFeatured
            ? "bg-white text-purple-700 hover:bg-white/90 hover:shadow-lg"
            : "rg-shimmer-btn",
        )}
      >
        {cta}
      </button>
    </div>
  );
}
