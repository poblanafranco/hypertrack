/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        dark: "#150c24",
        darker: "#0a0612",
        card: "#1c1030",
        primary: "#ff2ec4",
        accent: "#b026ff",
        danger: "#ff2b4e",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ['"Monoton"', "cursive"],
      },
      boxShadow: {
        "neon-pink": "0 0 8px rgba(255,46,196,0.6), 0 0 24px rgba(255,46,196,0.35)",
        "neon-purple": "0 0 8px rgba(176,38,255,0.6), 0 0 24px rgba(176,38,255,0.35)",
      },
    },
  },
  plugins: [],
};
