/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    fontFamily: {
      sans: ['Open Sans', 'sans-serif'],
    },
    extend: {
      colors: {
        'stak-black': '#202020',
        'stak-dark-gray': '#333333',
        'stak-light-gray': '#9d9d9d',
        'stak-blue': '#4285f4',
        'stak-yellow': '#d2bf64',
        'stak-orange': '#df9920',
        'stak-dark-green': '#569092',
        'stak-dark-green-hover': '#437677',
        'stak-white': '#fff',
        'stak-main-bg': '#eee',
      },
      width: {
        'sidelinks-tile-width': '250px',
        'costcode-sidlinks-tile-width': '300px',
      },
      boxShadow: {
        'tile-shadow': '0 12px 32px rgba(0, 0, 0, 0.2)',
      },
      fontSize: {
        'side-links': '1.375rem',
      },
      scale: {
        150: '1.5',
        125: '1.25',
      },
      transitionProperty: {
        scale: 'scale',
      },
    },
  },
  variants: {
    extend: {
      scale: ['hover', 'focus'],
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
