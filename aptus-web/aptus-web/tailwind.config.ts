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
        aptus: {
          primary: "var(--aptus-color-primary)",
          "primary-hover": "var(--aptus-color-primary-hover)",
          green: "var(--aptus-color-green)",
          "green-hover": "var(--aptus-color-green-hover)",
          accent: "var(--aptus-color-accent)",
          amber: "var(--aptus-color-amber)",
          purple: "var(--aptus-color-purple)",
          muted: "var(--aptus-color-surface-muted)",
          section: "var(--aptus-color-surface-muted)",
          surface: "var(--aptus-color-surface)",
          border: "var(--aptus-color-border)",
          "text-muted": "var(--aptus-color-text-muted)",
          "text-subtle": "var(--aptus-color-text-subtle)",
          brand: "var(--aptus-color-accent-brand)",
        },
      },
      fontFamily: {
        poppins: ["var(--aptus-font-sans)"],
        inter: ["var(--aptus-font-inter)"],
        manrope: ["var(--aptus-font-manrope)"],
      },
      fontSize: {
        "aptus-xs": ["var(--aptus-font-size-xs)", { lineHeight: "var(--aptus-line-height-normal)" }],
        "aptus-sm": ["var(--aptus-font-size-sm)", { lineHeight: "var(--aptus-line-height-normal)" }],
        "aptus-base": ["var(--aptus-font-size-base)", { lineHeight: "var(--aptus-line-height-relaxed)" }],
        "aptus-lg": ["var(--aptus-font-size-lg)", { lineHeight: "var(--aptus-line-height-relaxed)" }],
        "aptus-xl": ["var(--aptus-font-size-xl)", { lineHeight: "var(--aptus-line-height-snug)" }],
        "aptus-2xl": ["var(--aptus-font-size-2xl)", { lineHeight: "var(--aptus-line-height-tight)" }],
        "aptus-3xl": ["var(--aptus-font-size-3xl)", { lineHeight: "var(--aptus-line-height-tight)" }],
        "aptus-4xl": ["var(--aptus-font-size-4xl)", { lineHeight: "var(--aptus-line-height-tight)" }],
        "aptus-5xl": ["var(--aptus-font-size-5xl)", { lineHeight: "var(--aptus-line-height-tight)" }],
      },
      spacing: {
        section: "var(--aptus-section-padding-y)",
        "section-lg": "var(--aptus-section-padding-y-lg)",
      },
      maxWidth: {
        content: "var(--aptus-content-max)",
        narrow: "var(--aptus-content-narrow)",
        wide: "var(--aptus-content-wide)",
      },
      borderRadius: {
        aptus: "var(--aptus-radius-md)",
        "aptus-lg": "var(--aptus-radius-lg)",
        pill: "var(--aptus-radius-pill)",
      },
      boxShadow: {
        aptus: "var(--aptus-shadow-md)",
        "aptus-lg": "var(--aptus-shadow-lg)",
        "aptus-primary": "var(--aptus-shadow-primary)",
      },
      transitionDuration: {
        aptus: "var(--aptus-transition-base)",
      },
      keyframes: {
        "grid-drift": {
          "0%": { transform: "translate(0, 0)" },
          "100%": { transform: "translate(48px, 48px)" },
        },
      },
      animation: {
        "grid-drift": "grid-drift 20s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
