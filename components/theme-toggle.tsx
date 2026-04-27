"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  isThemePreference,
  resolveAppliedTheme,
  themeStorageKey,
  type AppliedTheme,
  type ThemePreference
} from "@/lib/theme";

const themeOptions: ThemePreference[] = ["system", "light", "dark"];

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
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

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

  function selectTheme(nextPreference: ThemePreference) {
    setPreference(nextPreference);
    setAppliedTheme(applyTheme(nextPreference));
  }

  function focusThemeOption(nextPreference: ThemePreference) {
    const nextIndex = themeOptions.indexOf(nextPreference);
    optionRefs.current[nextIndex]?.focus();
  }

  return (
    <div className="w-full space-y-2 sm:w-auto">
      <div
        role="radiogroup"
        aria-label="Theme"
        className="grid w-full grid-cols-3 gap-2 rounded-[20px] border border-border/80 bg-surface-soft/90 p-2 sm:w-auto"
      >
        {themeOptions.map((option, index) => {
          const active = preference === option;

          return (
            <button
              key={option}
              ref={(node) => {
                optionRefs.current[index] = node;
              }}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              onClick={() => {
                selectTheme(option);
              }}
              onKeyDown={(event) => {
                const currentIndex = themeOptions.indexOf(preference);
                const lastIndex = themeOptions.length - 1;
                let nextIndex = currentIndex;

                if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                  nextIndex = currentIndex === lastIndex ? 0 : currentIndex + 1;
                } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                  nextIndex = currentIndex === 0 ? lastIndex : currentIndex - 1;
                } else if (event.key === "Home") {
                  nextIndex = 0;
                } else if (event.key === "End") {
                  nextIndex = lastIndex;
                } else {
                  return;
                }

                event.preventDefault();
                const nextPreference = themeOptions[nextIndex];
                selectTheme(nextPreference);
                focusThemeOption(nextPreference);
              }}
              className={`rounded-full px-3 py-2 text-sm font-semibold capitalize transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary ${
                active
                  ? "bg-hero text-white shadow-sm"
                  : "border border-border/70 bg-surface text-copy hover:border-secondary"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
      <p className="text-xs leading-5 text-muted sm:text-right">
        Active theme: <span className="font-semibold text-copy">{label}</span>
      </p>
    </div>
  );
}
