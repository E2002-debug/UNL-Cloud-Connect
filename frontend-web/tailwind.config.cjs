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
          muted: '#F4F8F6'
        },
        slate: {
          900: '#1E2925', // Texto Principal
          700: '#62726B', // Texto Secundario
          600: '#62726B',
          400: '#62726B',
          200: '#DBE3E0'  // Bordes
        },
        primary: {
          DEFAULT: '#0F766E', // Verde Menta Profundo
          action: '#10B981'   // Verde Esmeralda
        }
      },
      borderRadius: {
        lg: '12px'
      },
      boxShadow: {
        subtle: '0 6px 18px rgba(30,41,37,0.06)'
      }
    }
  },
  plugins: []
}
