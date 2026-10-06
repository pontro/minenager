import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg-main)",
        surface: "var(--bg-surface)",
        card: "var(--bg-card)",
        theme: {
          primary: "var(--accent-primary)",
          primaryHover: "var(--accent-primary-hover)",
          secondary: "var(--accent-secondary)",
          muted: "var(--text-muted)",
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "sans-serif"],
        mono: ["var(--font-mono)", "Geist Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
