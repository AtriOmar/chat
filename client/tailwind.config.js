/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      screens: {
        scr400: "400px",
        scr500: "500px",
        scr600: "600px",
        scr700: "700px",
        scr800: "800px",
        scr900: "900px",
        scr1000: "1000px",
        scr1100: "1100px",
        scr1200: "1200px",
        scr1250: "1250px",
      },
    },
  },
  plugins: [],
};
