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
        shell: "rgb(var(--color-shell) / <alpha-value>)",
        "shell-elevated": "rgb(var(--color-shell-elevated) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        "surface-soft": "rgb(var(--color-surface-soft) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",
        copy: "rgb(var(--color-copy) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
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
        card: "0 24px 60px rgba(12, 17, 24, 0.18)"
      }
    }
  },
  plugins: []
};

export default config;
