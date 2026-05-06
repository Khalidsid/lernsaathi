import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        app: "var(--app-bg)",
        surface: "var(--surface)",
        "surface-strong": "var(--surface-strong)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        accent: "var(--accent)",
        "accent-soft": "var(--accent-soft)",
        sage: "var(--sage)",
        border: "var(--border-soft)",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
      },
      borderRadius: {
        shell: "28px",
      },
    },
  },
  plugins: [],
};

export default config;
