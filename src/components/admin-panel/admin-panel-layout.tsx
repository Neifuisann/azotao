"use client";

import { Sidebar } from "@/components/admin-panel/sidebar";
import { useSidebar } from "@/hooks/use-sidebar";
import { useStore } from "@/hooks/use-store";
import { cn } from "@/lib/utils";

export default function AdminPanelLayout({
  children,
  showSidebar = true
}: {
  children: React.ReactNode;
  showSidebar?: boolean;
}) {
  const sidebar = useStore(useSidebar, (x) => x);
  if (!sidebar) return null;
  const { getOpenState, settings } = sidebar;
  
  return (
    <>
      {showSidebar && <Sidebar />}
      <main
        className={cn(
          "min-h-screen bg-white dark:bg-zinc-900 transition-[margin-left] duration-200 ease-in-out",
          !settings.disabled && showSidebar && (!getOpenState() ? "lg:ml-[90px]" : "lg:ml-72")
        )}
      >
        {children}
      </main>
    </>
  );
}
