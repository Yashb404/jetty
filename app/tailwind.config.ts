import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        mono: {
          black: "#000000",
          white: "#ffffff",
        },
      },
      fontFamily: {
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
        space: ['var(--font-space-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
