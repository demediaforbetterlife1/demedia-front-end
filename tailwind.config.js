/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'super-dark': '#030409',
        'panel-dark': '#0b0f14',
        'super-light': '#f8fafc',
        'gold': '#ffd700',
        'gold-glow': 'rgba(255,215,0,0.12)',
        'gold-dark': '#b8860b',
        'gold-light': '#ffed4e',
      },
      animation: {
        'shimmer': 'shimmer 1.8s infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(255,215,0,0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(255,215,0,0.6)' },
        },
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
}
