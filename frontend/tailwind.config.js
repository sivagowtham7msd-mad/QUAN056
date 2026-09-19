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
        dark: {
          900: '#07090E',
          800: '#0B0F17',
          700: '#111827',
          600: '#1E293B',
          500: '#334155',
        },
        quantum: {
          cyan: '#06B6D4',
          blue: '#3B82F6',
          purple: '#8B5CF6',
          glow: 'rgba(6, 182, 212, 0.35)',
        },
        traffic: {
          green: '#10B981',
          yellow: '#F59E0B',
          red: '#EF4444',
          amber: '#F97316',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'quantum-glow': '0 0 25px -5px rgba(6, 182, 212, 0.3)',
        'emergency-glow': '0 0 30px -3px rgba(239, 68, 68, 0.45)',
        'green-glow': '0 0 25px -3px rgba(16, 185, 129, 0.35)',
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      }
    },
  },
  plugins: [],
}
