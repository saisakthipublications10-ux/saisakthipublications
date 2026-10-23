import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#102C46",
          deep: "#0A1F33",
          blue: "#315D7A",
          gold: "#F3B64B",
          goldsoft: "#FDF3DD",
          bg: "#F6F8FA",
          card: "#FFFFFF",
          text: "#172B3A",
          muted: "#64748B",
          border: "#DCE4EA",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-fraunces)", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,44,70,.05), 0 8px 24px -8px rgba(16,44,70,.10)",
        lift: "0 2px 4px rgba(16,44,70,.06), 0 24px 48px -16px rgba(16,44,70,.25)",
        clip: "0 1px 1px rgba(0,0,0,.08), 0 18px 40px -14px rgba(0,0,0,.45)",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: { "fade-up": "fadeUp .7s cubic-bezier(.2,.7,.2,1) both" },
    },
  },
  plugins: [],
};
export default config;