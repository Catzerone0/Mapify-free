import type { Config } from "tailwindcss";

const config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        notion: {
          light: {
            background: "#FFFFFF",
            secondary: "#F7F6F3",
            sidebar: "#F7F6F3",
            text: {
              primary: "#37352F",
              secondary: "#9A9591",
            },
            accent: "#0084FF",
            border: "#E5E3DF",
            hover: "#F0EDE9",
          },
          dark: {
            background: "#1C1C1C",
            secondary: "#2D2D2D",
            sidebar: "#2D2D2D",
            text: {
              primary: "#ECECEC",
              secondary: "#888888",
            },
            accent: "#3291FF",
            border: "#3A3A3A",
            hover: "#373737",
          },
        },
      },
      boxShadow: {
        "elevation-1": "0 2px 4px rgba(0,0,0,0.04)",
        "elevation-2": "0 4px 8px rgba(0,0,0,0.08)",
        "elevation-3": "0 8px 16px rgba(0,0,0,0.12)",
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;
