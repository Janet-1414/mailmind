/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        olive:  { DEFAULT: "#41431B", light: "#5a5d24", dark: "#2d2f12" },
        sage:   { DEFAULT: "#AEB784", light: "#c4cd9e", dark: "#8f9665" },
        sand:   { DEFAULT: "#E3DBBB", light: "#ede8ce", dark: "#c9c09a" },
        cream:  { DEFAULT: "#F8F3E1", light: "#fdf9f0", dark: "#ede5c8" },
      },
      fontFamily: {
        display: ["Playfair Display", "Georgia", "serif"],
        body:    ["DM Sans", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 16px 0 rgba(65,67,27,0.08)",
        "card-hover": "0 6px 28px 0 rgba(65,67,27,0.14)",
      },
      borderRadius: { xl2: "1.25rem" },
      animation: {
        "fade-in":   "fadeIn 0.3s ease",
        "slide-up":  "slideUp 0.35s ease",
        "pulse-dot": "pulseDot 1.2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn:   { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:  { from: { opacity: 0, transform: "translateY(12px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        pulseDot: { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.3 } },
      },
    },
  },
  plugins: [],
};
