import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          900: "#0A1E4D",
          800: "#14245F",
          700: "#1F2E5C",
          500: "#5B6480",
          400: "#8089A3",
          300: "#B0B6C8",
          200: "#D6DAE5",
          100: "#ECEEF4",
          50:  "#F5F6FA",
        },
        paper: "#F7F8FB",
        amber: {
          DEFAULT: "#FFC72C",
          dark: "#C99100",
          soft: "#FFF1B8",
        },
        ember: "#F47B20",
        earth: "#051438",
        verified: {
          DEFAULT: "#1F7A4C",
          soft: "#D6EBDD",
        },
        pending: {
          DEFAULT: "#B45309",
          soft: "#FDE6CD",
        },
        reject: {
          DEFAULT: "#9B1C1C",
          soft: "#FBDCD2",
        },
      },
      fontFamily: {
        display: ["Bricolage Grotesque", "sans-serif"],
        body: ["Geist", "Inter", "sans-serif"],
        mono: ["Geist Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
