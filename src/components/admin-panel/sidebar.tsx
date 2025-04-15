"use client";
import { Menu } from "@/components/admin-panel/menu";
import { SidebarToggle } from "@/components/admin-panel/sidebar-toggle";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/hooks/use-sidebar";
import { useStore } from "@/hooks/use-store";
import { cn } from "@/lib/utils";
import { WebLogo } from "@/components/icons/web-logo";
import { Link } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

export function Sidebar() {
  const sidebar = useStore(useSidebar, (x) => x);
  if (!sidebar) return null;
  const { isOpen, toggleOpen, getOpenState, setIsHover, settings } = sidebar;
  
  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-20 h-screen transition-[width] duration-200 ease-in-out -translate-x-full lg:translate-x-0",
        !getOpenState() ? "w-[90px]" : "w-72",
        settings.disabled && "hidden"
      )}
    >
      <SidebarToggle isOpen={isOpen} setIsOpen={toggleOpen} />
      <div
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        className="relative h-full flex flex-col px-3 py-4 overflow-y-auto bg-white dark:bg-zinc-800 shadow-md border-r border-gray-200 dark:border-zinc-700 dark:shadow-zinc-800"
      >
        <Button
          className={cn(
            "transition-transform ease-in-out duration-200 mb-1",
            !getOpenState() ? "translate-x-1" : "translate-x-0"
          )}
          variant="ghost"
          asChild
        >
          <Link to="/dashboard" className="flex items-center gap-2">
            <WebLogo className="w-10 h-10 mr-1 text-blue-600 dark:text-blue-500" />
            <AnimatePresence>
              {getOpenState() && (
                <h1
                  className="font-bold text-lg whitespace-nowrap opacity-100 text-gray-800 dark:text-gray-100 transition-opacity duration-200"
                >
                  Azotao
                </h1>
              )}
            </AnimatePresence>
          </Link>
        </Button>
        <Menu isOpen={getOpenState()} />
      </div>
    </aside>
  );
}
