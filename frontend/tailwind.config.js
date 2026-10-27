/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          blue: {
            50: "#f0f4f9",
            100: "#e1e9f2",
            500: "#0b57d0",
            600: "#0842a0",
            700: "#063078",
            800: "#042150",
            900: "#02122c",
          },
          gold: {
            500: "#c29b38",
            600: "#a37e2c",
          },
          slate: {
            50: "#f8fafc",
            100: "#f1f5f9",
            200: "#e2e8f0",
            300: "#cbd5e1",
            700: "#334155",
            800: "#1e293b",
            900: "#0f172a",
          }
        }
      }
    },
  },
  plugins: [],
}
