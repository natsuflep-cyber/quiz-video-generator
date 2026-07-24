import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          950: "#0B0D12",
          900: "#12151C",
          800: "#1A1E28",
          700: "#252B38",
        },
        quiz: {
          yellow: "#FFDF00",
          blue: "#1E5FFF",
          red: "#FF3B3B",
          green: "#17C964",
          ink: "#0B0D12",
        },
        accent: {
          DEFAULT: "#7C5CFF",
          soft: "#9E86FF",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(124, 92, 255, 0.5)",
      },
      keyframes: {
        pulseSlow: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
      animation: {
        pulseSlow: "pulseSlow 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
