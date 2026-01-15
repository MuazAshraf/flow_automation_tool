/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Modern Black, White & Parrot Green theme
        'primary': '#56CC38',           // Parrot green - main accent
        'primary-dark': '#45a82e',      // Darker green for hover
        'primary-light': '#6fd954',     // Lighter green

        'dark-bg': '#000000',           // Pure black background
        'dark-surface': '#0a0a0a',      // Slightly lighter black for cards
        'dark-border': '#1a1a1a',       // Dark gray border
        'dark-input': '#0f0f0f',        // Input background
        'dark-hover': '#141414',        // Hover state

        'accent-teal': '#56CC38',       // Using green as main accent
        'accent-green': '#56CC38',      // Parrot green
        'accent-yellow': '#56CC38',     // Replaced with green
        'accent-red': '#ff4757',        // Keep red for errors/danger
        'accent-orange': '#56CC38',     // Replaced with green

        'text-primary': '#ffffff',      // Pure white text
        'text-secondary': '#e0e0e0',    // Light gray
        'text-muted': '#666666',        // Muted gray
      },
    },
  },
  plugins: [],
}
