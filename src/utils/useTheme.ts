import { useState, useEffect, useCallback } from "react";

export type ThemePreference = "system" | "light" | "dark";

function resolveIsDark(preference: ThemePreference): boolean {
  if (preference === "dark") return true;
  if (preference === "light") return false;
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  return false;
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemePreference>(() => {
    if (typeof window === "undefined") return "system";
    try {
      const saved = localStorage.getItem("theme") as ThemePreference | null;
      if (saved === "light" || saved === "dark" || saved === "system") {
        return saved;
      }
    } catch {}
    return "system";
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => {
    const initialPref: ThemePreference = (() => {
      if (typeof window === "undefined") return "system";
      try {
        const saved = localStorage.getItem("theme") as ThemePreference | null;
        if (saved === "light" || saved === "dark" || saved === "system") return saved;
      } catch {}
      return "system";
    })();
    return resolveIsDark(initialPref) ? "dark" : "light";
  });

  const applyThemeToDOM = useCallback((active: "light" | "dark") => {
    setResolvedTheme(active);
    if (typeof document !== "undefined") {
      if (active === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, []);

  useEffect(() => {
    const isDark = resolveIsDark(theme);
    const active = isDark ? "dark" : "light";
    applyThemeToDOM(active);

    if (typeof window === "undefined" || !window.matchMedia) return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      if (theme === "system") {
        const next = mediaQuery.matches ? "dark" : "light";
        applyThemeToDOM(next);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, applyThemeToDOM]);

  const setTheme = (newTheme: ThemePreference) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem("theme", newTheme);
    } catch {}
    const isDark = resolveIsDark(newTheme);
    applyThemeToDOM(isDark ? "dark" : "light");
  };

  const toggleTheme = () => {
    // Quick toggle between light and dark
    const next = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  return { theme, resolvedTheme, setTheme, toggleTheme };
}
