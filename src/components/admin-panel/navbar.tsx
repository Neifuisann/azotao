import { UserNav } from "@/components/admin-panel/user-nav";
import { SheetMenu } from "@/components/admin-panel/sheet-menu";
import { ModeToggle } from "@/components/mode-toggle";

interface NavbarProps {
  title: string;
}

export function Navbar({ title }: NavbarProps) {
  return (
    <header className="sticky top-0 z-10 w-full bg-white dark:bg-zinc-800 shadow backdrop-blur supports-[backdrop-filter]:bg-white/95 dark:supports-[backdrop-filter]:bg-zinc-800/90 dark:shadow-secondary">
      <div className="mx-4 sm:mx-8 flex h-14 items-center justify-between">
        <div className="flex items-center space-x-4 lg:space-x-0">
          <SheetMenu />
          <h1 className="font-bold text-lg text-gray-800 dark:text-gray-100">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle className="text-black dark:text-white" />
          <UserNav />
        </div>
      </div>
    </header>
  );
}