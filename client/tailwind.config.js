/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: "#b3824b"
      },
      fontFamily: {
        "heading": "var(--durhack-font)"
      }
    }
  },
  plugins: [require("@tailwindcss/forms"), require('tailwindcss-bg-patterns')],
};
