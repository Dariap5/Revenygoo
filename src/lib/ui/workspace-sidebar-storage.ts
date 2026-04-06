const KEY = "rg_workspace_sidebar_collapsed_v1";

export function readSidebarCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function writeSidebarCollapsed(collapsed: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, collapsed ? "1" : "0");
  } catch {
    /* ignore */
  }
}
