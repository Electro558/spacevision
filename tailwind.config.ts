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
        brand: {
          DEFAULT: "#3b82f6",
          hover: "#2563eb",
          light: "#dbeafe",
          muted: "#3b82f610",
        },
        surface: {
          DEFAULT: "#1b1f27",
          light: "#242830",
          lighter: "#2c313b",
          dark: "#14171e",
          border: "#333a47",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
