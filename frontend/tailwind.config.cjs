/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./*.html", "./src/**/*.tsx"],
  theme: {
    extend: {
      fontFamily: {
        Manrope: ["Manrope", "sans-serif"],
      },
      colors: {
        "mid-gray": {
          50: "#B8B9C2",
          100: "#ADAEB9",
          200: "#9798A6",
          300: "#818393",
          400: "#6D6E7F",
          500: "#5A5B69",
          600: "#40414B",
          700: "#26272D",
          800: "#0C0C0E",
          900: "#000000",
        },
        "ebony-clay": {
          50: "#f6f6f9",
          100: "#ececf2",
          200: "#d4d5e3",
          300: "#aeb1cb",
          400: "#8287ae",
          500: "#626795",
          600: "#4e527b",
          700: "#404264",
          800: "#373855",
          900: "#2e2f43",
        },
      },
    },
  },
  plugins: [],
};
