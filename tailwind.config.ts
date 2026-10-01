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
        // Primary Colors
        primary: {
          500: "#3B82F6", // Blue 500
          600: "#2563EB", // Blue 600
          700: "#1D4ED8", // Blue 700
        },
        // Secondary Colors
        secondary: {
          500: "#8B5CF6", // Violet 500
          600: "#7C3AED", // Violet 600
          700: "#6D28D9", // Violet 700
        },
        // Accent Colors
        success: {
          500: "#10B981", // Green 500
          600: "#059669", // Green 600
          700: "#047857", // Green 700
        },
        warning: {
          500: "#F59E0B", // Amber 500
        },
        error: {
          500: "#EF4444", // Red 500
        },
        info: {
          500: "#3B82F6", // Blue 500
        },
        // Text Colors
        "primary-text": "#0F172A", // Slate 900
        "secondary-text": "#475569", // Slate 600
        "tertiary-text": "#64748B", // Slate 500
        // Background Colors
        "card-bg": "#FFFFFF",
        // Theme Colors: Lilac and Gold
        lilac: {
          50: "#FAF5FF",
          100: "#F3E8FF",
          200: "#E9D5FF",
          300: "#D8B4FE",
          400: "#C084FC",
          500: "#A855F7",
          600: "#9333EA",
          700: "#7E22CE",
          800: "#581C87",
          900: "#3B0764",
          DEFAULT: "#C5A3CD",
        },
        gold: {
          50: "#FFFDF0",
          100: "#FFFBE6",
          200: "#FFF4B8",
          300: "#FFE685",
          400: "#F5D061",
          500: "#D4AF37",
          600: "#B8860B",
          700: "#996515",
          800: "#7A5012",
          DEFAULT: "#D4AF37",
        },
        // The Sisters Olympics Tribes
        jael: {
          DEFAULT: "#DC2626", // Red
          light: "#EF4444",
          dark: "#991B1B",
        },
        abigail: {
          DEFAULT: "#16A34A", // Green
          light: "#22C55E",
          dark: "#166534",
        },
        esther: {
          DEFAULT: "#9333EA", // Purple
          light: "#A855F7",
          dark: "#6B21A8",
        },
        deborah: {
          DEFAULT: "#2563EB", // Blue
          light: "#3B82F6",
          dark: "#1E40AF",
        },
        priscilla: {
          DEFAULT: "#DB2777", // Pink
          light: "#EC4899",
          dark: "#9D174D",
        },
        // Legacy Game of Thrones House Colors
        stark: {
          DEFAULT: "#94A3B8",
          light: "#CBD5E1",
          dark: "#64748B",
        },
        baratheon: {
          DEFAULT: "#FBBF24",
          light: "#FCD34D",
          dark: "#F59E0B",
        },
        greyjoy: {
          DEFAULT: "#1E293B",
          light: "#334155",
          dark: "#0F172A",
        },
        lannister: {
          DEFAULT: "#DC2626",
          light: "#EF4444",
          dark: "#B91C1C",
        },
        targaryen: {
          DEFAULT: "#F43F5E",
          light: "#FB7185",
          dark: "#E11D48",
        },
      },
    },
  },
  plugins: [],
};
export default config;

