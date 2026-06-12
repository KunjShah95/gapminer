import { Sun, Moon } from "lucide-react";
import { useThemeStore } from "@/stores/themeStore";
import { cn } from "@/lib/utils";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant/15 text-outline hover:text-primary transition-colors"
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      <Sun
        size={16}
        className={cn(
          "absolute transition-all duration-300",
          theme === "dark" ? "scale-0 opacity-0" : "scale-100 opacity-100",
        )}
      />
      <Moon
        size={16}
        className={cn(
          "absolute transition-all duration-300",
          theme === "light" ? "scale-0 opacity-0" : "scale-100 opacity-100",
        )}
      />
    </button>
  );
}
