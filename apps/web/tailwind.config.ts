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
          900: "var(--ink-900)",
          800: "var(--ink-800)",
          700: "var(--ink-700)",
          500: "var(--ink-500)",
          400: "var(--ink-400)",
          300: "var(--ink-300)",
          200: "var(--ink-200)",
          100: "var(--ink-100)",
          50:  "var(--ink-50)",
        },
        paper: "var(--paper)",
        amber: {
          DEFAULT: "var(--amber)",
          dark: "var(--amber-dark)",
          soft: "var(--amber-soft)",
        },
        ember: "var(--ember)",
        earth: "var(--earth)",
        verified: {
          DEFAULT: "var(--verified)",
          soft: "var(--verified-soft)",
        },
        pending: {
          DEFAULT: "var(--pending)",
          soft: "var(--pending-soft)",
        },
        reject: {
          DEFAULT: "var(--reject)",
          soft: "var(--reject-soft)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "Inter", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
