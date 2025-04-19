"use client";

import { Link, useLocation } from "react-router-dom";
import { LayoutGrid, LogOut, User, SwitchCamera } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export function UserNav() {
  const { user, logout, updateUserRole } = useAuth();
  const initials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() 
    : 'U';
  
  const toggleRole = () => {
    if (!user || !updateUserRole) return;
    const newRole = (user.role === "student") ? "teacher" : "student";
    updateUserRole(newRole);
    console.log("Switched role view to:", newRole);
  };
  
  return (
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="relative h-9 w-9 rounded-full bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src="" alt="Avatar" />
                  <AvatarFallback className="bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-200">{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">Your account</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.name || "User"}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email || "user@example.com"}
            </p>
            {user && (
              <p className="text-xs leading-none text-blue-600 dark:text-blue-400 pt-1">
                Current view: {user.role?.charAt(0).toUpperCase() + user.role?.slice(1) || 'Student'}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="hover:cursor-pointer" asChild>
            <Link to="/dashboard" className="flex items-center">
              <LayoutGrid className="w-4 h-4 mr-3 text-muted-foreground" />
              Dashboard
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="hover:cursor-pointer" asChild>
            <Link to="/account" className="flex items-center">
              <User className="w-4 h-4 mr-3 text-muted-foreground" />
              Account
            </Link>
          </DropdownMenuItem>
          {user && (
            <DropdownMenuItem className="hover:cursor-pointer" onClick={toggleRole}>
               <SwitchCamera className="w-4 h-4 mr-3 text-muted-foreground" />
               Switch to {user.role === "student" ? "Teacher" : "Student"} View
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="hover:cursor-pointer" onClick={logout}>
          <LogOut className="w-4 h-4 mr-3 text-muted-foreground" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
