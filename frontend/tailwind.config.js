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
        charcoal: {
          950: '#090a0c', // deepest background
          900: '#0d0f12', // primary app background
          850: '#121418', // card/panel background
          800: '#171920', // elevated surfaces
          750: '#1d2029', // hover state
          700: '#262a36', // border standard
          600: '#343849', // subtle border / dividers
          500: '#484e63',
          400: '#757c96', // muted text
          300: '#9ea5bf', // secondary text
          200: '#c5cadc', // body text
          100: '#e5e8f4', // heading text
          50: '#f4f6fc',
        },
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1', // primary brand color
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          accent: '#8b5cf6',
          cyan: '#06b6d4',
          emerald: '#10b981',
          amber: '#f59e0b',
          rose: '#f43f5e',
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'Fira Sans',
          'Droid Sans',
          'Helvetica Neue',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'Cascadia Code',
          'Consolas',
          'Monaco',
          'Courier New',
          'monospace',
        ],
      },
      boxShadow: {
        'glow-brand': '0 0 20px -5px rgba(99, 102, 241, 0.25)',
        'glow-cyan': '0 0 20px -5px rgba(6, 182, 212, 0.25)',
        'glow-emerald': '0 0 20px -5px rgba(16, 185, 129, 0.25)',
        'subtle-panel': '0 1px 2px 0 rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s infinite linear',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};

