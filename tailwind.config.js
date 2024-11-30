/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        'gray-750': 'rgb(40, 44, 52)',
      },
      backgroundColor: {
        'gray-750': 'rgb(40, 44, 52)',
      }
    }
  },
  plugins: []
}