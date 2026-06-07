/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        ink: "#17211b",
        olive: "#63705b",
        copper: "#b76e3c",
        skyglass: "#dff1f7"
      }
    }
  },
  plugins: []
};
