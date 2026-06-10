/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        wine: {
          50:  '#fdf2f4',
          100: '#fce7ea',
          200: '#f9d0d7',
          300: '#f4a8b5',
          400: '#ec7589',
          500: '#e04865',
          600: '#cc2847',
          700: '#ac1c39',
          800: '#911a35',
          900: '#7b1931',
          950: '#4a0a19',
        },
        burgundy: {
          DEFAULT: '#722F37',
          dark:    '#4A1C23',
          light:   '#9E4454',
        },
        gold: {
          DEFAULT: '#C4A35A',
          light:   '#E8D5A3',
          dark:    '#9A7A35',
        },
        cream: {
          DEFAULT: '#FAF6F0',
          dark:    '#F0EAE0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
