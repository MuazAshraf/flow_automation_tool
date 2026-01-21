/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Modern Blue & White theme
        'primary': '#2B5288',           // Deep blue - main accent
        'primary-dark': '#1E3D60',      // Darker blue for hover
        'primary-light': '#3A6BA8',     // Lighter blue

        'dark-bg': '#FFFFFF',           // White background
        'dark-surface': '#F5F5F5',      // Light gray for cards
        'dark-border': '#E0E0E0',       // Light border
        'dark-input': '#FFFFFF',        // White input background
        'dark-hover': '#EEEEEE',        // Hover state

        'accent-teal': '#2B5288',       // Using blue as main accent
        'accent-green': '#2B5288',      // Blue
        'accent-yellow': '#2B5288',     // Replaced with blue
        'accent-red': '#DC3545',        // Red for errors
        'accent-orange': '#2B5288',     // Replaced with blue

        'text-primary': '#1a1a1a',      // Dark text
        'text-secondary': '#333333',    // Slightly lighter dark
        'text-muted': '#666666',        // Muted gray
      },
    },
  },
  plugins: [],
}
