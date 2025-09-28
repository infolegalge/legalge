"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Mode = "light" | "dark" | "system";

export default function ThemeToggle() {
  const [mode, setMode] = useState<Mode>(() => {
    try {
      const fromCookie = (typeof document !== "undefined" && document.cookie.match(/(?:^|; )theme=([^;]+)/)?.[1]) || "";
      return ((fromCookie || localStorage.getItem("theme") || "system") as Mode);
    } catch {
      return "system";
    }
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = (m: Mode) => {
      const prefersDark = mq.matches;
      const enableDark = m === "dark" || (m === "system" && prefersDark);
      root.classList.toggle("dark", enableDark);
      root.style.colorScheme = enableDark ? "dark" : "light";
    };
    apply(mode);
    const listener = () => {
      if (mode === "system") apply("system");
    };
    mq.addEventListener?.("change", listener);
    setMounted(true);
    return () => mq.removeEventListener?.("change", listener);
  }, [mode]);

  useEffect(() => {
    try {
      localStorage.setItem("theme", mode);
      document.cookie = `theme=${mode};path=/;max-age=31536000;samesite=lax`;
    } catch {}
  }, [mode]);

  return (
    <div className="ml-2 inline-flex items-center gap-1 rounded-full border p-1">
      <button
        aria-label="Light mode"
        className={`rounded-full p-1 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${mounted && mode === "light" ? "bg-muted" : ""}`}
        onClick={() => setMode("light")}
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        aria-label="Dark mode"
        className={`rounded-full p-1 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${mounted && mode === "dark" ? "bg-muted" : ""}`}
        onClick={() => setMode("dark")}
      >
        <Moon className="h-4 w-4" />
      </button>
      <button
        aria-label="System"
        className={`rounded-full px-2 py-1 text-xs transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${mounted && mode === "system" ? "bg-muted" : ""}`}
        onClick={() => setMode("system")}
      >
        Sys
      </button>
    </div>
  );
}


