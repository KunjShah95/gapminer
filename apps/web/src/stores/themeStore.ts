import { create } from "zustand";

type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("gapminer-theme") as Theme | null;
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export const useThemeStore = create<ThemeState>((set) => {
  const initial = getInitialTheme();
  applyTheme(initial);

  return {
    theme: initial,
    setTheme: (theme) => {
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
  };
});
