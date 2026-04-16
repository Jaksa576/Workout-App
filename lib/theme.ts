export type ThemePreference = "system" | "light" | "dark";
export type AppliedTheme = "light" | "dark";

export const themeStorageKey = "workout-app-theme";

export function isThemePreference(value: string | null): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

export function resolveAppliedTheme(
  preference: ThemePreference,
  prefersDark: boolean
): AppliedTheme {
  if (preference === "system") {
    return prefersDark ? "dark" : "light";
  }

  return preference;
}

export function getThemeBootstrapScript() {
  return `
    (() => {
      const storageKey = "${themeStorageKey}";
      const root = document.documentElement;
      const storedValue = window.localStorage.getItem(storageKey);
      const preference =
        storedValue === "system" || storedValue === "light" || storedValue === "dark"
          ? storedValue
          : "system";
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const appliedTheme = preference === "system" ? (prefersDark ? "dark" : "light") : preference;

      root.dataset.themePreference = preference;
      root.dataset.theme = appliedTheme;
      root.style.colorScheme = appliedTheme;
    })();
  `;
}
