"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  /** Use "onDark" for hosts that are always a dark-branded background (e.g. the admin sidebar), regardless of the active theme. */
  variant?: "default" | "onDark";
}

export default function ThemeToggle({ className, variant = "default" }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className={cn("h-11 w-11 sm:h-9 sm:w-9 rounded-full", className)}
        aria-hidden
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-full transition-colors",
        variant === "onDark"
          ? "text-gray-300 hover:bg-white/10 hover:text-white"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white",
        className
      )}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
