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
        slate: "#63748a"
      },
      fontFamily: {
        display: ["Georgia", "serif"],
        body: ["Verdana", "Geneva", "sans-serif"]
      },
      boxShadow: {
        card: "0 22px 60px rgba(17, 22, 31, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
