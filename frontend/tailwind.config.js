/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        background: 'var(--bg-color)',
        surface: 'var(--surface-color)',
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        border: 'var(--border-color)',
        accent: 'var(--accent-color)',
        'accent-hover': 'var(--accent-hover)',
        danger: 'var(--danger-color)',
        success: 'var(--success-color)'
      }
    },
  },
  plugins: [],
}

