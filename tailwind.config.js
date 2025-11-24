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
        // Eye-comfortable dark mode - warm slate with reduced blue light
        'super-dark': '#0a0e13',
        'panel-dark': '#151b23',
        'dark-accent': '#1e2730',

        // Eye-comfortable light mode - cream/warm tones
        'super-light': '#faf8f5',
        'panel-light': '#f5f2ed',
        'light-accent': '#ebe7df',

        // Premium gold theme
        'gold': '#ffd700',
        'gold-glow': 'rgba(255,215,0,0.12)',
        'gold-dark': '#b8860b',
        'gold-light': '#ffed4e',
        'gold-shimmer': 'rgba(255,237,78,0.15)',

        // Accent colors for better contrast
        'accent-blue': '#60a5fa',
        'accent-purple': '#a78bfa',
        'accent-cyan': '#22d3ee',
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
