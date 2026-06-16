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

/**
 * Componente de protección de ruta por Rol (Permite Admin '1' y Usuario '2')
 */
const GuardedRoute = ({ element: Element }) => {
  const token = localStorage.getItem('access_token')
  const idRol = localStorage.getItem('id_rol')

  // 1. Si no hay token, directo al login
  if (!token) {
    return <Navigate to="/login" replace />
  }

  // 2. CORRECCIÓN: Permitir la entrada si es Admin (1) O si es Usuario Autorizado (2)
  if (String(idRol) !== '1' && String(idRol) !== '2' && String(idRol) !== '3') {
    localStorage.clear() // Solo limpia si es un rol totalmente desconocido
    return <Navigate to="/login?logout=true" replace />
  }

  // 3. Si cumple con los roles permitidos, pasa al Dashboard
  return <Element />
}

export default function App() {
  const token = localStorage.getItem('access_token')
  const idRol = localStorage.getItem('id_rol')

  // El usuario puede ir al dashboard desde la raíz si tiene token y rol válido
  const isUserValid = token && (String(idRol) === '1' || String(idRol) === '2' || String(idRol) === '3')

  return (
    <>
    <Routes>
      {/* Ruta raíz: Redirige al Dashboard si está validado, o muestra el Home (Landing Page) si no */}
      <Route
        path="/"
        element={isUserValid ? <Navigate to="/dashboard" replace /> : <Home />}
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

      {/* Redirección por si escriben cualquier otra ruta inexistente */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <Toaster position="top-right" reverseOrder={false} />
    </>
  )
}