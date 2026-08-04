/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        mac: {
          sidebarLight: "#F2F2F7",
          sidebarDark: "#1C1C1E",
          bgLight: "#FFFFFF",
          bgDark: "#2C2C2E",
          accent: "#007AFF",
        },
      },
    },
  },
  plugins: [],
};