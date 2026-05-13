/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ember: {
          50: '#fff3ec',
          100: '#ffe4d3',
          200: '#ffc6a5',
          300: '#ffa16d',
          400: '#ff7132',
          500: '#ff4f0a',
          600: '#f03800',
          700: '#c72702',
          800: '#9e200a',
          900: '#7f1e0c',
          950: '#450b03',
        },
        background: '#09090b', // zinc-950
        surface: '#18181b', // zinc-900
        surfaceHighlight: '#27272a', // zinc-800
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
