import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#11161f",
        mist: "#f4f1eb",
        coral: "#ff6a3d",
        moss: "#64896b",
        gold: "#e8b44b",
        slate: "#63748a",
        "app-bg": "rgb(var(--color-app-bg) / <alpha-value>)",
        "bg-soft": "rgb(var(--color-bg-soft) / <alpha-value>)",
        shell: "rgb(var(--color-shell) / <alpha-value>)",
        "shell-elevated": "rgb(var(--color-shell-elevated) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        "surface-soft": "rgb(var(--color-surface-soft) / <alpha-value>)",
        "surface-strong": "rgb(var(--color-surface-strong) / <alpha-value>)",
        "surface-dark": "rgb(var(--color-surface-dark) / <alpha-value>)",
        "surface-dark-elevated": "rgb(var(--color-surface-dark-elevated) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",
        "border-soft": "rgb(var(--color-border-soft) / <alpha-value>)",
        "text-primary": "rgb(var(--color-text-primary) / <alpha-value>)",
        "text-secondary": "rgb(var(--color-text-secondary) / <alpha-value>)",
        "text-inverse": "rgb(var(--color-text-inverse) / <alpha-value>)",
        copy: "rgb(var(--color-copy) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        primary: "rgb(var(--color-primary) / <alpha-value>)",
        "primary-hover": "rgb(var(--color-primary-hover) / <alpha-value>)",
        secondary: "rgb(var(--color-secondary) / <alpha-value>)",
        "focus-ring": "rgb(var(--color-focus-ring) / <alpha-value>)",
        "goal-green": "rgb(var(--color-goal-green) / <alpha-value>)",
        "goal-blue": "rgb(var(--color-goal-blue) / <alpha-value>)",
        "goal-coral": "rgb(var(--color-goal-coral) / <alpha-value>)",
        "goal-orange": "rgb(var(--color-goal-orange) / <alpha-value>)",
        "goal-purple": "rgb(var(--color-goal-purple) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        "accent-contrast": "rgb(var(--color-accent-contrast) / <alpha-value>)",
        success: "rgb(var(--color-success) / <alpha-value>)",
        warning: "rgb(var(--color-warning) / <alpha-value>)",
        hero: "rgb(var(--color-hero) / <alpha-value>)"
      },
      fontFamily: {
        display: ["Georgia", "serif"],
        body: ["Verdana", "Geneva", "sans-serif"]
      },
      boxShadow: {
        card: "var(--shadow-soft)",
        soft: "var(--shadow-soft)",
        premium: "var(--shadow-premium)"
      }
    }
  },
  plugins: []
};

export default config;
