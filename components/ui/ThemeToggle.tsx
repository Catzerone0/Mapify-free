"use client";

import { useTheme } from "@/lib/hooks/useTheme";
import { Moon, Sun, Monitor } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const getThemeIcon = () => {
    switch (theme) {
      case "dark":
        return <Sun className="h-4 w-4" />;
      case "light":
        return <Moon className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getNextTheme = () => {
    switch (theme) {
      case "system":
        return "light";
      case "light":
        return "dark";
      case "dark":
        return "system";
      default:
        return "light";
    }
  };

  return (
    <button
      onClick={() => setTheme(getNextTheme() as "light" | "dark" | "system")}
      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
      aria-label="Toggle theme"
      title={`Current: ${theme}. Click to change.`}
    >
      {getThemeIcon()}
      <span className="ml-2 text-xs hidden sm:inline">
        {theme.charAt(0).toUpperCase() + theme.slice(1)}
      </span>
    </button>
  );
}