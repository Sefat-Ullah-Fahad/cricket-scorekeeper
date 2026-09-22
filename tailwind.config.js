/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cricket: {
          green: '#15803d',
          pitch: '#fef3c7',
        }
      }
    },
  },
  plugins: [],
};
