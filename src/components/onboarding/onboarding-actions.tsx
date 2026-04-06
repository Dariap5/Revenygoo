"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function OnboardingActions() {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-5">
      <div className="flex items-start gap-3">
        <Checkbox
          id="rules"
          checked={accepted}
          onCheckedChange={(v) => setAccepted(v === true)}
          className="mt-0.5"
        />
        <Label
          htmlFor="rules"
          className="cursor-pointer text-sm font-normal leading-relaxed text-muted-foreground"
        >
          Я понял(а) правила
        </Label>
      </div>
      <div>
        <Button
          disabled={!accepted}
          onClick={() => router.push("/scenarios")}
          className="min-w-[160px]"
        >
          Начать работу
        </Button>
      </div>
    </div>
  );
}
