/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#fffdf8',
        soft: '#f7efe5',
        ink: '#10213a',
        muted: '#697383',
        line: '#eadfd2',
        flame: '#f04a18',
        'flame-deep': '#a71914',
        sky: '#34a9d6',
        leaf: '#78a95a',
        gold: '#d7a330',
        good: '#27956a',
        watch: '#c69621',
        danger: '#c73535',
      },
      fontFamily: {
        serif: ['Cinzel', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 24px 70px rgba(16, 33, 58, 0.12)',
      },
      borderRadius: {
        card: '24px',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseDot: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(39,149,106,0.4)' },
          '50%': { boxShadow: '0 0 0 10px rgba(39,149,106,0)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.6s ease forwards',
        pulseDot: 'pulseDot 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
