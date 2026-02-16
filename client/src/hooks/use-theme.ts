import { useEffect, useState, useCallback } from "react";

export type Theme = "light" | "dark" | "system";

interface UseThemeReturn {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export function useTheme(): UseThemeReturn {
  const [theme] = useState<Theme>("dark");
  const [resolvedTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const setTheme = useCallback(() => {}, []);
  const toggleTheme = useCallback(() => {}, []);

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
  };
}
