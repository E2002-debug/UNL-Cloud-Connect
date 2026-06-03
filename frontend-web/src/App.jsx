import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home' 
import Login from './pages/Login'
import Register from './pages/Register'
import GoogleHybrid from './pages/GoogleHybrid'
import Recover from './pages/Recover'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import VerificarCuenta from './pages/VerificarCuenta'

/**
 * Componente de protección estricta de ruta por Rol
 */
const GuardedRoute = ({ element: Element }) => {
  const token = localStorage.getItem('access_token')
  const idRol = localStorage.getItem('id_rol')

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (String(idRol) !== '1' && String(idRol) !== '2') {
    localStorage.clear() 
    return <Navigate to="/login?logout=true" replace />
  }

  return <Element />
}

export default function App() {
  return (
    <Routes>
      {/* 1. RUTA RAÍZ TOTALMENTE INDEPENDIENTE */}
      {/* Al no compartir Layouts ni contextos restrictivos, nada la puede desviar */}
      <Route path="/" element={<Home />} />
      
      {/* 2. RUTAS PÚBLICAS DE AUTENTICACIÓN */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/google-register" element={<GoogleHybrid mode="google-register" />} />
      <Route path="/registro-hibrido" element={<GoogleHybrid mode="registro-hibrido" />} />
      <Route path="/recover" element={<Recover />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verificar-cuenta" element={<VerificarCuenta />} />
      
      {/* 3. RUTA PRIVADA PROTEGIDA */}
      <Route 
        path="/dashboard" 
        element={<GuardedRoute element={Dashboard} />} 
      />
      
      {/* Cualquier otra ruta rota vuelve al Home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}