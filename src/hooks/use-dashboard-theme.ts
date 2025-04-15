import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { produce } from "immer";

type ThemeMode = "light" | "dark";

type DashboardThemeStore = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
};

export const useDashboardTheme = create(
  persist<DashboardThemeStore>(
    (set) => ({
      theme: "light", // Default theme for dashboard is light
      setTheme: (theme: ThemeMode) => {
        set({ theme });
      }
    }),
    {
      name: "dashboard-theme",
      storage: createJSONStorage(() => localStorage)
    }
  )
); 