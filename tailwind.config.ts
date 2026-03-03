import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#06b6d4',
          dark: '#0891b2',
          light: '#67e8f9',
        },
        'app-black': '#0A0A0F',
        'background-dark': '#0f1921',
        'surface-dark': '#162530',
      },
      fontFamily: {
        display: ['var(--font-plus-jakarta)', 'Plus Jakarta Sans', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '1rem',
        xl: '1.5rem',
        full: '9999px',
      },
      animation: {
        'spin-slow': 'spinSlow 8s linear infinite',
        'pulse-glow': 'pulseGlow 2s infinite',
        'scale-bounce': 'scaleBounce 0.4s ease-out',
        'fade-in-up': 'fadeInUp 0.4s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        spinSlow: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(6, 182, 212, 0.7)' },
          '50%': { boxShadow: '0 0 0 8px rgba(6, 182, 212, 0)' },
        },
        scaleBounce: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.3)' },
          '100%': { transform: 'scale(1)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
