"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes";

/**
 * Main theme provider for the entire application.
 * Allows switching between dark/light using next-themes.
 */
export function ThemeProvider({
  children,
}: Omit<ThemeProviderProps, "attribute" | "defaultTheme" | "forcedTheme" | "enableSystem">) {
  return (
    <NextThemesProvider
      /** 
       * 'class' means next-themes will add either `class="light"` or `class="dark"` to <html>.
       * We do NOT set forcedTheme here, so the user can freely switch.
       */
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
