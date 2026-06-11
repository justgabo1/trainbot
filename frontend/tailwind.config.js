/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        purple: {
          DEFAULT: '#534AB7',
          light: '#EEEDFE',
          dark: '#3C3489',
        },
        teal: {
          DEFAULT: '#1D9E75',
          light: '#E1F5EE',
          dark: '#085041',
        },
        coral: {
          DEFAULT: '#993C1D',
          light: '#FAECE7',
        },
        amber: {
          DEFAULT: '#BA7517',
          light: '#FAEEDA',
        },
      },
    },
  },
  plugins: [],
}
