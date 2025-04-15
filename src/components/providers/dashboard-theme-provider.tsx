"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes";

/**
 * Dashboard-specific theme provider that enforces light theme
 * for the dashboard area of the application
 */
export function DashboardThemeProvider({ children }: Omit<ThemeProviderProps, "attribute" | "defaultTheme" | "forcedTheme" | "enableSystem">) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      forcedTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}