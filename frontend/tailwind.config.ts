import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14181F",
        paper: "#F4F5F7",
        line: "#DDE1E6",
        slate: "#5B6472",
        match: "#0F7B6C",
        matchSoft: "#E4F3EF",
        gap: "#C1502E",
        gapSoft: "#FBEAE3",
        good: "#1F8A5A",
        warn: "#B7841E",
        bad: "#C1502E",
      },
      fontFamily: {
        display: ["'Fraunces'", "Georgia", "serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
