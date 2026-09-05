export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#f3f7f3',
        brand: {
          50: '#e8f5e9',
          100: '#c8e6c9',
          200: '#a5d6a7',
          400: '#66bb6a',
          500: '#4caf50',
          600: '#43a047',
          700: '#2e7d32',
          800: '#1b5e20'
        }
      },
      fontSize: {
        xs: ['0.875rem', { lineHeight: '1.25rem' }],
        sm: ['1rem', { lineHeight: '1.5rem' }],
        base: ['1.125rem', { lineHeight: '1.65rem' }],
        lg: ['1.25rem', { lineHeight: '1.8rem' }],
        xl: ['1.375rem', { lineHeight: '1.9rem' }],
        '2xl': ['1.625rem', { lineHeight: '2.1rem' }]
      },
      fontWeight: {
        normal: '600',
        medium: '700',
        semibold: '800',
        bold: '900'
      }
    }
  },
  plugins: []
}
