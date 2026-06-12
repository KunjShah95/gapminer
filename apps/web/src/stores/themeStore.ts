import { create } from "zustand";

type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const stored = localStorage.getItem("gapminer-theme") as Theme | null;
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // localStorage unavailable (Safari private, iframe, etc.)
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

function initTheme() {
  const theme = getInitialTheme();
  applyTheme(theme);
  return theme;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: initTheme(),
  setTheme: (theme: Theme) => {
    localStorage.setItem("gapminer-theme", theme);
    applyTheme(theme);
    set({ theme });
  },
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === "light" ? "dark" : "light";
      localStorage.setItem("gapminer-theme", next);
      applyTheme(next);
      return { theme: next };
    }),
}));
