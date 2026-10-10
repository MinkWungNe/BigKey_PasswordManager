// ============================================================================
// File: useTheme.ts
// Description: Custom React hook managing application visual theme (Dark / Light)
//              with local storage persistence and system preference detection.
// ============================================================================

import { useEffect, useState } from "react";

export type ThemeMode = "dark" | "light" | "system";

const THEME_STORAGE_KEY = "bigkey_theme_preference";

// ----------------------------------------------------------------------------
// 1. useTheme
// - Coordinates dark, light, and system mode classes on document root and syncs state.
//
// Args:
//   - None.
//
// Return:
//   - { theme: ThemeMode; setTheme: (theme: ThemeMode) => void; toggleTheme: () => void }
// ----------------------------------------------------------------------------
export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    // Step 1. Check local storage preference
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "dark" || saved === "light" || saved === "system") {
      return saved as ThemeMode;
    }
    return "system";
  });

  useEffect(() => {
    // Step 2. Resolve effective theme based on system preference
    const applyTheme = () => {
      const root = document.documentElement;
      let effectiveTheme: "dark" | "light" = "dark";

      if (theme === "system") {
        const isSystemLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
        effectiveTheme = isSystemLight ? "light" : "dark";
      } else {
        effectiveTheme = theme;
      }

      if (effectiveTheme === "light") {
        root.classList.add("light");
        root.classList.remove("dark");
      } else {
        root.classList.add("dark");
        root.classList.remove("light");
      }
    };

    applyTheme();
    localStorage.setItem(THEME_STORAGE_KEY, theme);

    // Step 3. Listen to system preference changes when system mode is selected
    if (theme === "system" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
      const handler = () => applyTheme();
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [theme]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => {
      if (prev === "dark") return "light";
      if (prev === "light") return "system";
      return "dark";
    });
  };

  return {
    theme,
    setTheme,
    toggleTheme,
  };
}
