import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        lotus: {
          50: '#f0f7f4',
          100: '#dbece3',
          200: '#b8d9c9',
          300: '#8bbfa8',
          400: '#5fa085',
          500: '#3d8268',
          600: '#2d6853',
          700: '#255445',
          800: '#204438',
          900: '#1c3930',
          950: '#0e201a',
        },
        gold: {
          400: '#d4a853',
          500: '#c49a3c',
          600: '#a67c2e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Tahoma', 'sans-serif'],
        arabic: ['Tajawal', 'Segoe UI', 'Tahoma', 'sans-serif'],
      },
      boxShadow: {
        premium: '0 4px 24px -4px rgba(0, 0, 0, 0.08), 0 2px 8px -2px rgba(0, 0, 0, 0.04)',
        card: '0 1px 3px rgba(0, 0, 0, 0.06), 0 4px 16px rgba(0, 0, 0, 0.04)',
        elevated: '0 8px 32px -8px rgba(0, 0, 0, 0.12), 0 4px 16px -4px rgba(0, 0, 0, 0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
