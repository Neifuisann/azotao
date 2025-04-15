"use client";

import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { ChevronDown, Dot, LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DropdownMenuArrow } from "@radix-ui/react-dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

type Submenu = {
  href: string;
  label: string;
  active?: boolean;
};

interface CollapseMenuButtonProps {
  icon: LucideIcon;
  label: string;
  active: boolean;
  submenus: Submenu[];
  isOpen: boolean | undefined;
}

export function CollapseMenuButton({
  icon: Icon,
  label,
  active,
  submenus,
  isOpen
}: CollapseMenuButtonProps) {
  const pathname = useLocation().pathname;
  const isSubmenuActive = submenus.some((submenu) =>
    submenu.active === undefined ? submenu.href === pathname : submenu.active
  );
  const [isCollapsed, setIsCollapsed] = useState<boolean>(isSubmenuActive);

  return isOpen ? (
    <Collapsible
      open={isCollapsed}
      onOpenChange={setIsCollapsed}
      className="w-full"
    >
      <CollapsibleTrigger
        className="[&[data-state=open]>div>div>svg]:rotate-180 mb-1"
        asChild
      >
        <Button
          variant={isSubmenuActive ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start h-10 pl-2",
            (active || isSubmenuActive) && "text-blue-600 dark:text-blue-500 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30"
          )}
        >
          <div className="w-full items-center flex justify-between">
            <div className="flex items-center">
              <span className="mr-4">
                <Icon size={28} className={cn(
                  (active || isSubmenuActive) ? "text-blue-600 dark:text-blue-500" : "text-gray-700 dark:text-gray-300"
                )} />
              </span>
              <p
                className={cn(
                  "max-w-[150px] truncate text-gray-800 dark:text-gray-200",
                  isOpen
                    ? "translate-x-0 opacity-100"
                    : "-translate-x-96 opacity-0",
                  (active || isSubmenuActive) && "font-medium text-blue-600 dark:text-blue-500"
                )}
              >
                {label}
              </p>
            </div>
            <div
              className={cn(
                "whitespace-nowrap",
                isOpen
                  ? "translate-x-0 opacity-100"
                  : "-translate-x-96 opacity-0"
              )}
            >
              <ChevronDown
                size={18}
                className={cn(
                  "transition-transform duration-200",
                  (active || isSubmenuActive) && "text-blue-600 dark:text-blue-500"
                )}
              />
            </div>
          </div>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        {submenus.map(({ href, label, active }, index) => {
          const isActive = (active === undefined && pathname === href) || active;
          
          return (
            <div className="relative" key={index}>
              {isActive && (
                <div className="absolute left-2 top-0 w-1 h-10 bg-blue-600 rounded-r-md" />
              )}
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start h-10 mb-1 pl-4",
                  isActive && "text-blue-600 dark:text-blue-500 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                )}
                asChild
              >
                <Link to={href}>
                  <span className="mr-4 ml-2">
                    <Dot size={30} className={cn(
                      isActive ? "text-blue-600 dark:text-blue-500" : "text-gray-700 dark:text-gray-300"
                    )} />
                  </span>
                  <p
                    className={cn(
                      "max-w-[170px] truncate text-gray-800 dark:text-gray-200",
                      isOpen
                        ? "translate-x-0 opacity-100"
                        : "-translate-x-96 opacity-0",
                      isActive && "font-medium text-blue-600 dark:text-blue-500"
                    )}
                  >
                    {label}
                  </p>
                </Link>
              </Button>
            </div>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  ) : (
    <DropdownMenu>
      <TooltipProvider disableHoverableContent>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant={isSubmenuActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start h-10 mb-1 pl-2",
                  (active || isSubmenuActive) && "text-blue-600 dark:text-blue-500 bg-blue-50 dark:bg-blue-900/20"
                )}
              >
                <div className="w-full items-center flex justify-between">
                  <div className="flex items-center">
                    <span className={cn(isOpen === false ? "" : "mr-4")}>
                      <Icon size={28} className={cn(
                        (active || isSubmenuActive) ? "text-blue-600 dark:text-blue-500" : "text-gray-700 dark:text-gray-300"
                      )} />
                    </span>
                    <p
                      className={cn(
                        "max-w-[200px] truncate text-gray-800 dark:text-gray-200",
                        isOpen === false ? "opacity-0" : "opacity-100",
                        (active || isSubmenuActive) && "font-medium text-blue-600 dark:text-blue-500"
                      )}
                    >
                      {label}
                    </p>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right" align="start" alignOffset={2}>
            {label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenuContent side="right" sideOffset={25} align="start">
        <DropdownMenuLabel className="max-w-[190px] truncate">
          {label}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {submenus.map(({ href, label, active }, index) => {
          const isActive = (active === undefined && pathname === href) || active;
          
          return (
            <DropdownMenuItem key={index} asChild>
              <Link
                className={cn(
                  "cursor-pointer flex items-center",
                  isActive && "bg-secondary text-blue-600 dark:text-blue-500"
                )}
                to={href}
              >
                <Dot size={18} className={isActive ? "text-blue-600 dark:text-blue-500" : ""} />
                <p className="max-w-[180px] truncate">{label}</p>
              </Link>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuArrow className="fill-border" />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
