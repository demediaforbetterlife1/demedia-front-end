/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Eye-comfortable dark mode - warm slate with reduced blue light
        "super-dark": "#0a0e13",
        "panel-dark": "#151b23",
        "dark-accent": "#1e2730",

        // Eye-comfortable light mode - cream/warm tones
        "super-light": "#faf8f5",
        "panel-light": "#f5f2ed",
        "light-accent": "#ebe7df",

        // Premium gold theme
        gold: "#ffd700",
        "gold-glow": "rgba(255,215,0,0.12)",
        "gold-dark": "#b8860b",
        "gold-light": "#ffed4e",
        "gold-shimmer": "rgba(255,237,78,0.15)",

        // Accent colors for better contrast
        "accent-blue": "#60a5fa",
        "accent-purple": "#a78bfa",
        "accent-cyan": "#22d3ee",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-radial-at-t":
          "radial-gradient(ellipse at top, var(--tw-gradient-stops))",
        "gradient-radial-at-b":
          "radial-gradient(ellipse at bottom, var(--tw-gradient-stops))",
        "gradient-radial-at-l":
          "radial-gradient(ellipse at left, var(--tw-gradient-stops))",
        "gradient-radial-at-r":
          "radial-gradient(ellipse at right, var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      animation: {
        shimmer: "shimmer 1.8s infinite",
        glow: "glow 2s ease-in-out infinite alternate",
        "pulse-slow": "pulse-slow 4s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        particle: "particle 8s linear infinite",
        "ray-sweep": "ray-sweep 8s linear infinite",
        "cloud-drift": "cloud-drift 12s ease-in-out infinite",
        "gradient-shift": "gradient-shift 3s ease-in-out infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        glow: {
          "0%": {
            textShadow: "0 0 10px currentColor, 0 0 20px currentColor",
            boxShadow: "0 0 5px rgba(255,215,0,0.3)",
          },
          "100%": {
            textShadow:
              "0 0 20px currentColor, 0 0 30px currentColor, 0 0 40px currentColor",
            boxShadow: "0 0 20px rgba(255,215,0,0.6)",
          },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "0.3", transform: "scale(1)" },
          "50%": { opacity: "0.6", transform: "scale(1.05)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        particle: {
          "0%": { transform: "translateY(100vh) rotate(0deg)", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": {
            transform: "translateY(-100px) rotate(360deg)",
            opacity: "0",
          },
        },
        "ray-sweep": {
          "0%": { transform: "translateX(-100%) rotate(45deg)" },
          "100%": { transform: "translateX(100vw) rotate(45deg)" },
        },
        "cloud-drift": {
          "0%, 100%": { transform: "translateX(-50px)", opacity: "0.3" },
          "50%": { transform: "translateX(50px)", opacity: "0.6" },
        },
        "gradient-shift": {
          "0%, 100%": {
            backgroundPosition: "0% 50%",
          },
          "50%": {
            backgroundPosition: "100% 50%",
          },
        },
      },
      backdropBlur: {
        xs: "2px",
        "3xl": "64px",
      },
      backdropSaturate: {
        200: "2",
      },
      boxShadow: {
        glow: "0 0 20px rgba(59, 130, 246, 0.5)",
        "glow-gold": "0 0 20px rgba(255, 215, 0, 0.5)",
        "glow-purple": "0 0 20px rgba(139, 92, 246, 0.5)",
        "inner-glow": "inset 0 0 20px rgba(59, 130, 246, 0.2)",
      },
      transitionProperty: {
        theme:
          "background-color, color, border-color, text-decoration-color, fill, stroke",
        glow: "box-shadow, transform",
        glass: "backdrop-filter, background",
      },
    },
  },
  plugins: [],
};
