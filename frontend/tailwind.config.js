/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",                // Include index.html
      "./src/**/*.{js,ts,jsx,tsx}",  // Scan all JS/TS/JSX/TSX files in src/
    ],
    theme: {
      extend: {},  // Customize if needed
    },
    plugins: [],  // Add plugins if needed later
  };
