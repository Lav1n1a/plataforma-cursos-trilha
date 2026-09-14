import type { Config } from "tailwindcss"

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#DBE9EE", 100: "#C0D6DF", 200: "#A9C8D4", 300: "#7FAEC0",
          400: "#4A6FA5", 500: "#166088", 600: "#145779", 700: "#124B67",
          800: "#0F3F56", 900: "#0C3345", DEFAULT: "#166088",
        },
        success: {
          50: "#F0FDF4", 100: "#DCFCE7", 500: "#16A34A", 600: "#15803D",
          700: "#166534", DEFAULT: "#16A34A",
        },
        error: {
          50: "#FEF2F2", 100: "#FEE2E2", 500: "#DC2626", 600: "#B91C1C",
          700: "#991B1B", DEFAULT: "#DC2626",
        },
        neutral: {
          50: "#F8FAFC", 100: "#F1F5F9", 200: "#E2E8F0", 300: "#CBD5E1",
          400: "#94A3B8", 500: "#4F6D7A", 600: "#475569", 700: "#334155",
          800: "#1E293B", 900: "#0F172A", DEFAULT: "#4F6D7A",
        },
      },
      fontFamily: {
        sans: ["Geist Variable", "sans-serif"],
        heading: ["Geist Variable", "sans-serif"],
      },
    },
  },
} satisfies Config
