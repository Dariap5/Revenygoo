"use client";

import type { ReactNode } from "react";

import { WorkspaceAccessGuard } from "@/components/auth/workspace-access-guard";
import { WorkspaceShell } from "@/components/layout/workspace-shell";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <WorkspaceAccessGuard>
      <WorkspaceShell>{children}</WorkspaceShell>
    </WorkspaceAccessGuard>
  );
}
