module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#FFFFFF',
          muted: '#F9FAFB'
        },
        slate: {
          900: '#0F172A'
        },
        primary: {
          DEFAULT: '#2563EB'
        }
      },
      borderRadius: {
        lg: '12px'
      },
      boxShadow: {
        subtle: '0 6px 18px rgba(15,23,42,0.06)'
      }
    }
  },
  plugins: []
}
