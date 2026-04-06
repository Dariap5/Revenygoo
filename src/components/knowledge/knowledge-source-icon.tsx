import {
  FileText,
  FileType2,
  BookOpen,
  Table2,
  ScrollText,
  CircleHelp,
  type LucideIcon,
} from "lucide-react";

import type { KnowledgeSourceType } from "@/types";

import { cn } from "@/lib/utils";

const map: Record<KnowledgeSourceType, LucideIcon> = {
  PDF: FileText,
  DOCX: FileType2,
  Notion: BookOpen,
  Таблица: Table2,
  Регламент: ScrollText,
  FAQ: CircleHelp,
};

export function KnowledgeSourceIcon({
  type,
  className,
}: {
  type: KnowledgeSourceType;
  className?: string;
}) {
  const Icon = map[type];
  return <Icon className={cn("size-4 shrink-0", className)} aria-hidden />;
}
