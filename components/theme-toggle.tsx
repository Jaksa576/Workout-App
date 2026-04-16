"use client";

import { useEffect, useMemo, useState } from "react";
import {
  isThemePreference,
  resolveAppliedTheme,
  themeStorageKey,
  type AppliedTheme,
  type ThemePreference
} from "@/lib/theme";

function applyTheme(preference: ThemePreference) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const appliedTheme = resolveAppliedTheme(preference, prefersDark);

  root.dataset.themePreference = preference;
  root.dataset.theme = appliedTheme;
  root.style.colorScheme = appliedTheme;

  if (preference === "system") {
    window.localStorage.removeItem(themeStorageKey);
  } else {
    window.localStorage.setItem(themeStorageKey, preference);
  }

  return appliedTheme;
}

export function ThemeToggle() {
  const [preference, setPreference] = useState<ThemePreference>("system");
  const [appliedTheme, setAppliedTheme] = useState<AppliedTheme>("light");

  useEffect(() => {
    const storedValue = window.localStorage.getItem(themeStorageKey);
    const nextPreference = isThemePreference(storedValue) ? storedValue : "system";

    setPreference(nextPreference);
    setAppliedTheme(applyTheme(nextPreference));
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemThemeChange = () => {
      if (preference !== "system") {
        return;
      }

      setAppliedTheme(applyTheme("system"));
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, [preference]);

  const label = useMemo(() => {
    if (preference === "system") {
      return `System (${appliedTheme})`;
    }

    return preference === "dark" ? "Dark" : "Light";
  }, [appliedTheme, preference]);

  return (
    <label className="flex items-center gap-2 rounded-full border border-border/80 bg-surface/80 px-3 py-2 text-sm text-muted">
      <span className="sr-only">Theme</span>
      <span aria-hidden="true" className="text-xs font-semibold uppercase tracking-[0.16em]">
        Theme
      </span>
      <select
        aria-label="Theme"
        value={preference}
        onChange={(event) => {
          const nextPreference = event.target.value as ThemePreference;
          setPreference(nextPreference);
          setAppliedTheme(applyTheme(nextPreference));
        }}
        className="bg-transparent text-sm font-semibold text-copy outline-none"
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
      <span className="hidden text-xs text-muted sm:inline">{label}</span>
    </label>
  );
}
