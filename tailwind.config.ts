import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#EEF4FF",
          100: "#D9E5FF",
          200: "#BCCDFF",
          300: "#8EABFF",
          400: "#597DFF",
          500: "#3354FF",
          600: "#1B30F5",
          700: "#1422E1",
          800: "#171FB6",
          900: "#19208F",
        },
        status: {
          ok: "#22C55E",
          warning: "#F59E0B",
          danger: "#EF4444",
          info: "#3B82F6",
        },
      },
      fontSize: {
        // Mobile-first: bigger defaults
        "body": ["1rem", "1.5rem"],       // 16px
        "body-lg": ["1.125rem", "1.75rem"], // 18px
        "h3": ["1.25rem", "1.75rem"],     // 20px
        "h2": ["1.5rem", "2rem"],         // 24px
        "h1": ["1.875rem", "2.25rem"],    // 30px
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};

export default config;
