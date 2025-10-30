/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        'gray-900': '#121212',
        'gray-800': '#1e1e1e',
        'gray-700': '#2d2d2d',
        'gray-600': '#444444',
        'gray-500': '#666666',
        'gray-400': '#999999',
        'gray-300': '#cccccc',
        'gray-200': '#e0e0e0',
        'gray-100': '#f5f5f5',
        'blue-500': '#3b82f6',
        'blue-600': '#2563eb',
        'green-500': '#22c55e',
        'red-500': '#ef4444',
        'yellow-500': '#eab308',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
