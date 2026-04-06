import {
  CalendarClock,
  Code2,
  FileText,
  Languages,
  Lightbulb,
  Mail,
  Presentation,
  Search,
  type LucideIcon,
} from "lucide-react";

import type { ScenarioIconName } from "@/types";

import { cn } from "@/lib/utils";

const map: Record<ScenarioIconName, LucideIcon> = {
  mail: Mail,
  "file-text": FileText,
  search: Search,
  presentation: Presentation,
  languages: Languages,
  "code-2": Code2,
  "calendar-clock": CalendarClock,
  lightbulb: Lightbulb,
};

export function ScenarioIcon({
  name,
  className,
}: {
  name: ScenarioIconName;
  className?: string;
}) {
  const Icon = map[name];
  return <Icon className={cn("size-5 shrink-0", className)} aria-hidden />;
}
