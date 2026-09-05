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
        xs: ['0.8125rem', { lineHeight: '1.15rem' }],
        sm: ['0.9375rem', { lineHeight: '1.35rem' }],
        base: ['1.0625rem', { lineHeight: '1.55rem' }],
        lg: ['1.1875rem', { lineHeight: '1.65rem' }],
        xl: ['1.3125rem', { lineHeight: '1.8rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }]
      },
      fontWeight: {
        normal: '500',
        medium: '600',
        semibold: '700',
        bold: '800'
      }
    }
  },
  plugins: []
}
