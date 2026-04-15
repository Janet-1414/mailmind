import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Midnight Slate — Light mode ───────────────────────────────────────
        "ms-bg":        "#F4F6F9",
        "ms-surface":   "#FFFFFF",
        "ms-primary":   "#1E3A5F",
        "ms-primary-light": "#2a4f7f",
        "ms-accent":    "#3B82F6",
        "ms-accent-light": "#60a5fa",
        "ms-muted":     "#64748B",
        "ms-border":    "#E2E8F0",
        "ms-border-dark": "#CBD5E1",

        // ── Midnight Slate — Dark mode ────────────────────────────────────────
        "ms-dark-bg":      "#0F172A",
        "ms-dark-surface": "#1E293B",
        "ms-dark-primary": "#38BDF8",
        "ms-dark-accent":  "#818CF8",
        "ms-dark-muted":   "#94A3B8",
        "ms-dark-border":  "#334155",
      },
      fontFamily: {
        serif: ["Playfair Display", "Georgia", "serif"],
        sans:  ["DM Sans", "system-ui", "sans-serif"],
        mono:  ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        soft:   "0 1px 3px rgba(30,58,95,0.08), 0 1px 2px rgba(30,58,95,0.06)",
        card:   "0 4px 6px rgba(30,58,95,0.07), 0 2px 4px rgba(30,58,95,0.05)",
        strong: "0 10px 15px rgba(30,58,95,0.1), 0 4px 6px rgba(30,58,95,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
