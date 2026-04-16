import type { ReactNode } from "react";

import { AdminNavTabs } from "@/components/admin/admin-nav-tabs";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-0 min-w-0 flex-1 overflow-auto bg-[hsl(var(--background))]">
      <div className="mx-auto max-w-2xl px-4 pb-16 pt-6 sm:px-6">
        <AdminNavTabs />
        {children}
      </div>
    </div>
  );
}
