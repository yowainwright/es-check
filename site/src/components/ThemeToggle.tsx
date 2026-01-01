import { useTheme } from "@/hooks/useTheme";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      aria-label="Toggle theme"
      onClick={toggle}
      className="btn btn-sm btn-ghost btn-square"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
