import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import GoogleHybrid from './pages/GoogleHybrid'
import Recover from './pages/Recover'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import VerificarCuenta from './pages/VerificarCuenta'
import EventoPage from './pages/EventoPage'
import MobileOnly from './pages/MobileOnly'

/**
 * Componente de protección de ruta por Rol (Solo Admin '1' y Superadmin '3')
 * Los participantes (rol 2) deben usar la aplicación móvil.
 */
const GuardedRoute = ({ element: Element }) => {
  const token = localStorage.getItem('access_token')
  let idRol = null
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      idRol = payload.id_rol
    } catch (e) {
      idRol = null
    }
  }

  // 1. Si no hay token, directo al login
  if (!token) {
    return <Navigate to="/login" replace />
  }

  // 2. Participantes (rol 2) no pueden acceder al dashboard web
  if (String(idRol) === '2') {
    return <Navigate to="/solo-app-movil" replace />
  }

  // 3. Solo Admin (1) y Superadmin (3) pueden pasar
  if (String(idRol) !== '1' && String(idRol) !== '3') {
    localStorage.clear()
    return <Navigate to="/login?logout=true" replace />
  }

  // 4. Si cumple con los roles permitidos, pasa al Dashboard
  return <Element />
}

export default function App() {
  const token = localStorage.getItem('access_token')
  let idRol = null
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      idRol = payload.id_rol
    } catch (e) {
      idRol = null
    }
  }

  // Admin (1) y Superadmin (3) van al dashboard; Participante (2) va a página móvil
  const isAdmin = token && (String(idRol) === '1' || String(idRol) === '3')
  const isParticipant = token && String(idRol) === '2'

  return (
    <>
    <Routes>
      {/* Ruta raíz: Admin/Superadmin al dashboard, Participante a app móvil, invitados al Home */}
      <Route
        path="/"
        element={isAdmin ? <Navigate to="/dashboard" replace /> : isParticipant ? <Navigate to="/solo-app-movil" replace /> : <Home />}
      />

      {/* Rutas Públicas de Autenticación */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/google-register" element={<GoogleHybrid mode="google-register" />} />
      <Route path="/registro-hibrido" element={<GoogleHybrid mode="registro-hibrido" />} />
      <Route path="/recover" element={<Recover />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verificar-cuenta" element={<VerificarCuenta />} />

      {/* Ruta Privada Protegida y Controlada por Rol */}
      <Route
        path="/dashboard"
        element={<GuardedRoute element={Dashboard} />}
      />

      {/* Ruta pública: Solo app móvil (para participantes) */}
      <Route path="/solo-app-movil" element={<MobileOnly />} />

      {/* Ruta pública de detalle de evento */}
      <Route path="/eventos/:id" element={<EventoPage />} />

      {/* Redirección por si escriben cualquier otra ruta inexistente */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <Toaster position="top-right" reverseOrder={false} />
    </>
  )
}