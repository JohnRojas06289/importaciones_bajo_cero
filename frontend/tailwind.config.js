/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        // Colores principales del sistema
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        // Colores específicos para el POS
        pos: {
          bg: '#f8fafc',
          card: '#ffffff',
          border: '#e2e8f0',
          accent: '#3b82f6',
          text: {
            primary: '#1e293b',
            secondary: '#64748b',
            muted: '#94a3b8'
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      fontSize: {
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '1rem',
        'lg': '1.125rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
        // Tamaños específicos para tablet
        'tablet-sm': '1rem',
        'tablet-base': '1.125rem',
        'tablet-lg': '1.25rem',
        'tablet-xl': '1.5rem',
        'tablet-2xl': '1.875rem',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem',
      },
      maxWidth: {
        'xs': '20rem',
        'sm': '24rem',
        'md': '28rem',
        'lg': '32rem',
        'xl': '36rem',
        '2xl': '42rem',
        '3xl': '48rem',
        '4xl': '56rem',
        '5xl': '64rem',
        '6xl': '72rem',
        '7xl': '80rem',
        'tablet': '768px',
        'desktop': '1024px',
      },
      screens: {
        'tablet': '640px',
        'laptop': '1024px',
        'desktop': '1280px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-gentle': 'bounceGentle 0.6s ease-in-out',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan-line': 'scanLine 2s linear infinite',
        'success-check': 'successCheck 0.5s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        scanLine: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        successCheck: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.2)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'modal': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'scanner': '0 0 20px rgba(59, 130, 246, 0.3)',
      },
      borderRadius: {
        'card': '0.75rem',
        'button': '0.5rem',
      },
      gridTemplateColumns: {
        'pos': '1fr 400px',
        'inventory': 'repeat(auto-fit, minmax(280px, 1fr))',
        'products': 'repeat(auto-fill, minmax(200px, 1fr))',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
    require('@tailwindcss/typography'),
    // Plugin personalizado para utilidades del POS
    function({ addUtilities }) {
      const newUtilities = {
        '.scan-focus': {
          '@apply ring-4 ring-primary-500 ring-opacity-50 border-primary-500': {},
        },
        '.button-primary': {
          '@apply bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-button transition-colors duration-200': {},
        },
        '.button-secondary': {
          '@apply bg-secondary-100 hover:bg-secondary-200 text-secondary-700 font-medium py-2 px-4 rounded-button transition-colors duration-200': {},
        },
        '.button-success': {
          '@apply bg-success-600 hover:bg-success-700 text-white font-medium py-2 px-4 rounded-button transition-colors duration-200': {},
        },
        '.button-danger': {
          '@apply bg-danger-600 hover:bg-danger-700 text-white font-medium py-2 px-4 rounded-button transition-colors duration-200': {},
        },
        '.card': {
          '@apply bg-white rounded-card shadow-card border border-pos-border': {},
        },
        '.card-hover': {
          '@apply hover:shadow-card-hover transition-shadow duration-200': {},
        },
        '.input-field': {
          '@apply form-input w-full rounded-button border-secondary-300 focus:border-primary-500 focus:ring-primary-500': {},
        },
        '.tablet-friendly': {
          '@apply min-h-[44px] text-tablet-base': {},
        },
      }
      addUtilities(newUtilities)
    }
  ],
  // Configuración para dark mode (futuro)
  darkMode: 'class',
}