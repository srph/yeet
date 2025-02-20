import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-dm-sans)"],
        playfair: ["var(--font-playfair)"],
      },
    },
  },
  plugins: [],
};

export default config;
