/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#FFEB8A',
          DEFAULT: '#D4AF37', // Metallic Gold
          dark: '#996515', // Golden Brown
        },
        secondary: {
          light: '#2A2A2A',
          DEFAULT: '#121212', // Deep Black
          dark: '#0A0A0A',
        },
        gold: {
          50: '#FFF9E5',
          100: '#FFF0B3',
          200: '#FFE166',
          300: '#FFD11A',
          400: '#E6B800',
          500: '#D4AF37', // Base Gold
          600: '#B38F2D',
          700: '#8C6F23',
          800: '#66511A',
          900: '#403210',
        },
        accent: '#00C853', // Profit Green
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #D4AF37 0%, #FFD700 50%, #B8860B 100%)',
        'dark-gradient': 'linear-gradient(180deg, #1A1A1A 0%, #0A0A0A 100%)',
      },
      boxShadow: {
        'gold-glow': '0 0 15px rgba(212, 175, 55, 0.3)',
      }
    },
  },
  plugins: [],
}
