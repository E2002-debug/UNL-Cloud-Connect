import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App'
import './index.css'

// Se obtiene la credencial de forma segura desde las variables de entorno de Vite
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

const rootEl = document.getElementById('root')
if (!rootEl) {
  // Evitar crash silencioso si el elemento no existe
  // Esto facilita debugging en entornos fuera del navegador o tests
  // eslint-disable-next-line no-console
  console.error('Root element #root no encontrado. Imposible renderizar la app.')
} else {
  const root = createRoot(rootEl)
  const app = (
    <React.StrictMode>
      {GOOGLE_CLIENT_ID ? (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </GoogleOAuthProvider>
      ) : (
        <BrowserRouter>
          <App />
        </BrowserRouter>
      )}
    </React.StrictMode>
  )
  root.render(app)
}