import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { login as apiLogin, loginGoogle as apiLoginGoogle } from '../services/api'

const extractErrorMessage = (error) => {
  if (error.response?.data) {
    const data = error.response.data
    if (data.detail) {
      if (typeof data.detail === 'string') return data.detail
      if (Array.isArray(data.detail)) return data.detail.map(e => e.msg || e.detail || JSON.stringify(e)).join(', ')
      if (typeof data.detail === 'object') return JSON.stringify(data.detail)
    }
    if (Array.isArray(data)) return data.map(e => e.msg || e.message || JSON.stringify(e)).join(', ')
  }
  if (error.message) return error.message
  return 'Error desconocido'
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1045246456759-ukkf353m9h7plhu0t1j1e08lo1r7qdgp.apps.googleusercontent.com'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchParams] = useSearchParams()

  useEffect(() => {
    if (searchParams.get('logout')) {
      setError(null)
      setEmail('')
      setPassword('')
      setLoading(false)
    }
  }, [searchParams])

  // Procesador unificado de almacenamiento y redirección forzada
  const handleLoginSuccess = (data) => {
    const tokenFinal = data.access_token || data.token || data.token_acceso
    const userRole = data.id_rol || data.user?.id_rol || data.usuario?.id_rol || '2'
    const nombre = data.nombre || data.user?.nombre || data.usuario?.nombre || ''
    const apellido = data.apellido || data.user?.apellido || data.usuario?.apellido || ''
    const correo = data.correo || data.user?.correo || data.usuario?.correo || email.trim().toLowerCase()

    if (!tokenFinal) {
      setError('El servidor no retornó un token válido.')
      setLoading(false)
      return
    }

    // Persistencia síncrona inmediata en el cliente
    localStorage.setItem('access_token', String(tokenFinal))
    localStorage.setItem('id_rol', String(userRole))
    localStorage.setItem('nombre', String(nombre))
    localStorage.setItem('apellido', String(apellido))
    localStorage.setItem('correo', String(correo))

    // Forzar el cambio de ciclo de vida del DOM e ir al Dashboard de raíz
    window.location.replace('/dashboard')
  }

  // Login con Google
  const handleGoogleSuccess = async (credentialResponse) => {
    setError(null)
    setLoading(true)
    try {
      const token = credentialResponse.credential
      const response = await apiLoginGoogle({ google_token: token })
      const data = response.data || response
      handleLoginSuccess(data)
    } catch (err) {
      console.error('Google login error:', err)
      setError('Error en autenticación Google: ' + extractErrorMessage(err))
      setLoading(false)
    }
  }

  // Login Tradicional por Formulario
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    const cleanEmail = email.trim().toLowerCase()

    if (!cleanEmail || !password) {
      setError('Por favor, complete todos los campos.')
      return
    }

    if (!cleanEmail.endsWith('@unl.edu.ec')) {
      setError('El correo debe pertenecer al dominio @unl.edu.ec')
      return
    }

    setLoading(true)
    try {
      const response = await apiLogin({ username: cleanEmail, password })
      const data = response.data || response
      handleLoginSuccess(data)
    } catch (err) {
      console.error('Manual login error:', err)
      setError(extractErrorMessage(err))
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7fa', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      <div style={{ maxWidth: '960px', width: '100%', background: '#fff', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)', display: 'flex', overflow: 'hidden' }}>
        
        {/* Panel Izquierdo */}
        <div style={{ flex: 1, background: 'linear-gradient(135deg, #1a56c9 0%, #103783 100%)', color: '#fff', padding: '60px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '500px' }}>
          <div><h1 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 40px 0' }}>UNL-Cloud-Connect</h1></div>
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 24px 0', lineHeight: '1.4' }}>¡Entérate de los nuevos eventos en la facultad!</h2>
            <p style={{ fontSize: '15px', lineHeight: '1.7', margin: '0', opacity: '0.95' }}>Consulte la agenda de la FEIRNNR y las variables climáticas en tiempo real.</p>
          </div>
          <div style={{ fontSize: '13px', fontWeight: '600', opacity: '0.8', borderTop: '1px solid rgba(255, 255, 255, 0.2)', paddingTop: '20px' }}>Proyecto de Fin de Ciclo</div>
        </div>

        {/* Panel Derecho Formulario */}
        <div style={{ flex: 1, padding: '60px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0', color: '#1a1a1a' }}>Bienvenido de nuevo</h2>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 32px 0' }}>Introduzca sus credenciales universitarias.</p>

          {error && (
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '8px' }}>Correo Institucional</label>
              <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@unl.edu.ec" style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f4f7fa', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '8px' }}>Contraseña</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f4f7fa', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
            </div>

            {/* ENLACE RECUPERADO: ¿Olvidaste tu contraseña? */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-8px' }}>
              <Link to="/recover" style={{ fontSize: '13px', color: '#1a56c9', textDecoration: 'none', fontWeight: '500' }}>¿Olvidaste tu contraseña?</Link>
            </div>

            <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: 'none', background: '#103783', color: '#fff', fontSize: '15px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Cargando...' : 'Iniciar sesión →'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', margin: '28px 0', gap: '12px' }}>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} /><span style={{ color: '#9ca3af', fontSize: '14px' }}>o</span><div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <GoogleLogin 
              onSuccess={handleGoogleSuccess} 
              onError={() => setError('Error de inicialización de Google')} 
              useOneTap={false} 
              auto_select={false} 
            />
          </div>

          {/* ENLACE RECUPERADO: Crear cuenta aquí */}
          <div style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
            ¿No tienes cuenta? <Link to="/register" style={{ color: '#1a56c9', fontWeight: '600', textDecoration: 'none' }}>Crear cuenta aquí</Link>
          </div>
        </div>

      </div>
    </div>
  )
}