/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        fire: { dark: "#0a0a0a", card: "#111118", border: "#1f1f2a", accent: "#ff3300" }
      },
      fontFamily: { orbitron: ["Orbitron", "sans-serif"], inter: ["Inter", "sans-serif"] },
      animation: { glow: "glow 2s ease-in-out infinite", float: "float 3s ease-in-out infinite" },
      keyframes: {
        glow: { "0%,100%": { textShadow: "0 0 10px #ff3300, 0 0 20px #ff3300" }, "50%": { textShadow: "0 0 20px #ff3300, 0 0 30px #ff6600" } },
        float: { "0%,100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-10px)" } }
      }
    }
  },
  plugins: []
};
