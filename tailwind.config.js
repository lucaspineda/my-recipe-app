/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Channels live in globals.css so a page can re-theme shared components (see .landing)
        "primary": "rgb(var(--color-primary) / <alpha-value>)",
        "secondary": "rgb(var(--color-secondary) / <alpha-value>)",
        "tertiary": "rgb(var(--color-tertiary) / <alpha-value>)",
        "basil": {
          DEFAULT: "#187a3e",
          dark: "#136332",
        },
      },
      boxShadow: {
        // Single elevation for product previews on the landing page
        lift: "0 1px 2px rgb(24 24 27 / 0.04), 0 2px 6px rgb(24 24 27 / 0.04), 0 28px 56px -24px rgb(24 24 27 / 0.2)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        rise: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
        rise: 'rise 0.8s cubic-bezier(0.2, 0.7, 0.2, 1) 0.3s both',
      },
    },
  },
  plugins: [],
};
