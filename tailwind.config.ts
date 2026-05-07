import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["Fraunces", "ui-serif", "Georgia", "serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        paper: "#FAFAF7",
        paper2: "#F3F2EC",
        ink: "#1F1F1F",
        ink2: "#3A3A38",
        ink3: "#6B6B68",
        ink4: "#9B9B96",
        rule: "#E6E4DC",
        rule2: "#EFEDE6",
        night: "#191917",
        night2: "#222220",
        night3: "#2C2C29",
        mist: "#E9E7DF",
        teal: "#5C8C8A",
        tealDk: "#43706E",
        tealLt: "#EAF0EF",
        tealLt2: "#D7E2E1",
        tealNight: "#3D5C5A",
      },
      borderRadius: {
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
      },
    },
  },
  plugins: [],
};

export default config;
