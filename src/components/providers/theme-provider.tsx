"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes";

/**
 * Main theme provider that enforces dark theme for the landing page
 * Used as the root theme provider in the application
 */
export function ThemeProvider({ children }: Omit<ThemeProviderProps, "attribute" | "defaultTheme" | "forcedTheme" | "enableSystem">) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      forcedTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
