/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      gridTemplateColumns: {
        auto: "repeat(auto-fill, minmax(200px, 1fr))",
      },

      animation: {
        marquee: "marquee 18s linear infinite",
        "marquee-safe": "marquee-safe 16s linear infinite alternate",
      },

      keyframes: {
        marquee: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(-100%)" },
        },
        "marquee-safe": {
          "0%": {
            transform: "translateX(20px)",
          },
          "100%": {
            transform: "translateX(calc(100vw - 100% - 20px))",
          },
        },
      },

      colors: {
        primary: "#283cf4ff",
      },
    },
  },
  plugins: [],
};
