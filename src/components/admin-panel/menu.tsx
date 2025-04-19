"use client";

import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { getMenuList } from "@/lib/menu-list";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CollapseMenuButton } from "@/components/admin-panel/collapse-menu-button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from "@/components/ui/tooltip";
import { useAuth } from "@/lib/auth-context";

interface MenuProps {
  isOpen: boolean | undefined;
}

export function Menu({ isOpen }: MenuProps) {
  const pathname = useLocation().pathname;
  const { user } = useAuth();
  
  const menuList = getMenuList(pathname, user?.role);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <ScrollArea className="[&>div>div[style]]:!block">
      <motion.nav 
        variants={container}
        initial="hidden"
        animate="show"
        className="mt-8 h-full w-full"
      >
        <ul className="flex flex-col min-h-[calc(100vh-48px-36px-16px-32px)] lg:min-h-[calc(100vh-32px-40px-32px)] items-start space-y-1 px-2">
          {menuList.map(({ menus }, groupIndex) => (
            <motion.li
              variants={item}
              className="w-full"
              key={groupIndex}
            >
              {menus.map(
                ({ href, label, icon: Icon, active, submenus }, index) => {
                  const isActive = (active === undefined && pathname.startsWith(href)) || active;
                  
                  return !submenus || submenus.length === 0 ? (
                    <motion.div 
                      variants={item}
                      className="w-full relative" 
                      key={index}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-0 w-1 h-10 bg-blue-600 rounded-r-md" />
                      )}
                      <TooltipProvider disableHoverableContent>
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger asChild>
                            <Button
                              variant={isActive ? "secondary" : "ghost"}
                              className={cn(
                                "w-full justify-start h-10 mb-1",
                                isActive && "text-blue-600 dark:text-blue-500 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                              )}
                              asChild
                            >
                              <Link to={href} className="pl-2">
                                <span
                                  className={cn(isOpen === false ? "" : "mr-4")}
                                >
                                  <Icon size={28} className={cn(
                                    isActive ? "text-blue-600 dark:text-blue-500" : "text-gray-700 dark:text-gray-300"
                                  )} />
                                </span>
                                <p
                                  className={cn(
                                    "max-w-[200px] truncate text-gray-800 dark:text-gray-200",
                                    isOpen === false
                                      ? "-translate-x-96 opacity-0"
                                      : "translate-x-0 opacity-100",
                                    isActive && "font-medium text-blue-600 dark:text-blue-500"
                                  )}
                                >
                                  {label}
                                </p>
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          {isOpen === false && (
                            <TooltipContent side="right">
                              {label}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </motion.div>
                  ) : (
                    <motion.div 
                      variants={item}
                      className="w-full relative" 
                      key={index}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-0 w-1 h-10 bg-blue-600 rounded-r-md" />
                      )}
                      <CollapseMenuButton
                        icon={Icon}
                        label={label}
                        active={isActive ? true : false}
                        submenus={submenus}
                        isOpen={isOpen}
                      />
                    </motion.div>
                  );
                }
              )}
            </motion.li>
          ))}
        </ul>
      </motion.nav>
    </ScrollArea>
  );
}
