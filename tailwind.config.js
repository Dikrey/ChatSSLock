/** @type {import('tailwindcss').Config} */
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        glass: 'rgba(255, 255, 255, 0.05)',
        'glass-border': 'rgba(255, 255, 255, 0.1)',
        'glass-glow': 'rgba(99, 102, 241, 0.3)',
        neum: {
          light: 'rgba(255, 255, 255, 0.1)',
          dark: 'rgba(0, 0, 0, 0.3)',
        },
        gradient: {
          'chat-send': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          'chat-recv': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        }
      },
      boxShadow: {
        'neum-light': '8px 8px 16px rgba(0,0,0,0.3), -8px -8px 16px rgba(255,255,255,0.05)',
        'neum-hover': '4px 4px 8px rgba(0,0,0,0.4), -4px -4px 8px rgba(255,255,255,0.03)',
        glow: '0 0 20px rgba(99, 102, 241, 0.4)',
        'glass-glow': '0 0 30px rgba(255,255,255,0.1)',
      },
      backdropBlur: {
        xs: '4px',
      },
      animation: {
        'shimmer': 'shimmer 1.5s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'bounce-subtle': 'bounce 2s infinite ease-in-out',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      }
    },
  },
  plugins: [],
}

