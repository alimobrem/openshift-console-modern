/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['Geist Mono', 'SF Mono', 'Fira Code', 'JetBrains Mono', 'monospace'],
      },
      colors: {
        slate: {
          850: '#1a202e',
        },
        pulse: {
          DEFAULT: '#2563eb',
          light: '#3b82f6',
          dark: '#1d4ed8',
          glow: 'rgba(37, 99, 235, 0.15)',
        },
      },
      keyframes: {
        'slide-in': {
          from: { transform: 'translateY(10px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(37, 99, 235, 0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(37, 99, 235, 0.4)' },
        },
      },
      animation: {
        'slide-in': 'slide-in 0.3s ease-out',
        'fade-up': 'fade-up 0.3s ease-out both',
        'scale-in': 'scale-in 0.2s ease-out both',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
      },
      boxShadow: {
        'modern-sm': 'var(--shadow-sm)',
        'modern-md': 'var(--shadow-md)',
        'modern-lg': 'var(--shadow-lg)',
      },
    },
  },
  plugins: [],
};
