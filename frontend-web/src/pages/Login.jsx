import React, { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import toast from 'react-hot-toast'
import { login as apiLogin, loginGoogle as apiLoginGoogle, reenviarVerificacion } from '../services/api'

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
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [verificacionPendiente, setVerificacionPendiente] = useState(false)
  const [reenviando, setReenviando] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // Redirigir si el usuario ya está autenticado (evita acceso manual a /login)
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const idRol = localStorage.getItem('id_rol')
    if (token && (String(idRol) === '1' || String(idRol) === '2') && !searchParams.get('logout')) {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate, searchParams])

  useEffect(() => {
    if (searchParams.get('logout')) {
      setError(null)
      setEmail('')
      setPassword('')
      setLoading(false)
      toast.success('Sesión cerrada correctamente')
    }
  }, [searchParams])

  // Procesador unificado de almacenamiento y redirección forzada
  const handleLoginSuccess = (data) => {
    const tokenFinal = data.access_token || data.token || data.token_acceso
    const idUsuario = data.id_usuario || data.user?.id_usuario || data.usuario?.id_usuario || ''
    const userRole = data.id_rol || data.user?.id_rol || data.usuario?.id_rol || '2'
    const nombre = data.nombre || data.user?.nombre || data.usuario?.nombre || ''
    const apellido = data.apellido || data.user?.apellido || data.usuario?.apellido || ''
    const correo = data.correo || data.user?.correo || data.usuario?.correo || email.trim().toLowerCase()

    if (!tokenFinal) {
      const msg = 'El servidor no retornó un token válido.'
      setError(msg)
      toast.error(msg)
      setLoading(false)
      return
    }

    // Persistencia síncrona inmediata en el cliente
    localStorage.setItem('access_token', String(tokenFinal))
    localStorage.setItem('id_usuario', String(idUsuario))
    localStorage.setItem('id_rol', String(userRole))
    localStorage.setItem('nombre', String(nombre))
    localStorage.setItem('apellido', String(apellido))
    localStorage.setItem('correo', String(correo))

    toast.success(`Bienvenido de nuevo, ${nombre}`)

    // Forzar el cambio de ciclo de vida del DOM e ir al Dashboard de raíz
    setTimeout(() => {
        window.location.replace('/dashboard')
    }, 500)
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
      const status = err.response?.status
      if (status === 403) {
        setVerificacionPendiente(true)
      }
      const msg = 'Error en autenticación Google: ' + extractErrorMessage(err)
      setError(msg)
      toast.error(msg)
      setLoading(false)
    }
  }

  // Login Tradicional por Formulario
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    const cleanEmail = email.trim().toLowerCase()

    if (!cleanEmail || !password) {
      const msg = 'Por favor, complete todos los campos.'
      setError(msg)
      toast.error(msg)
      return
    }

    if (!cleanEmail.endsWith('@unl.edu.ec')) {
      const msg = 'El correo debe pertenecer al dominio @unl.edu.ec'
      setError(msg)
      toast.error(msg)
      return
    }

    if (!/^[a-zA-Z0-9_.-]+\.[a-zA-Z0-9_.-]+@unl\.edu\.ec$/.test(cleanEmail)) {
      const msg = 'El correo institucional debe tener el formato nombre.apellido@unl.edu.ec'
      setError(msg)
      toast.error(msg)
      return
    }

    setLoading(true)
    try {
      const response = await apiLogin({ username: cleanEmail, password })
      const data = response.data || response
      handleLoginSuccess(data)
    } catch (err) {
      const status = err.response?.status
      if (status === 403) {
        setVerificacionPendiente(true)
      }
      const msg = extractErrorMessage(err)
      if (status === 401 || status === 404) {
          toast.error("Contraseña incorrecta o el usuario no existe.")
      } else {
          toast.error(msg)
      }
      setError(msg)
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F4F8F6', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      <style>{`
        .auth-container { flex-direction: row; }
        .auth-left { padding: 60px 40px; min-height: 500px; }
        .auth-right { padding: 60px 40px; }
        @media (max-width: 768px) {
          .auth-container { flex-direction: column; }
          .auth-left { padding: 40px 20px; min-height: auto; text-align: center; }
          .auth-left h1 { font-size: 20px !important; margin-bottom: 20px !important; }
          .auth-left h2 { font-size: 22px !important; }
          .auth-right { padding: 40px 20px; }
          .back-link { top: 12px !important; left: 20px !important; }
        }
      `}</style>
      <div className="auth-container" style={{ maxWidth: '960px', width: '100%', background: '#fff', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)', display: 'flex', overflow: 'hidden' }}>

        {/* Panel Izquierdo */}
        <div className="auth-left" style={{ flex: 1, background: 'linear-gradient(135deg, #0F766E 0%, #094E48 100%)', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div><h1 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 40px 0' }}>UNL-Cloud-Connect</h1></div>
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 24px 0', lineHeight: '1.4' }}>¡Entérate de los nuevos eventos en la facultad!</h2>
            <p style={{ fontSize: '15px', lineHeight: '1.7', margin: '0', opacity: '0.95' }}>Consulte la agenda de la FEIRNNR y las variables climáticas en tiempo real.</p>
          </div>
          <div style={{ fontSize: '13px', fontWeight: '600', opacity: '0.8', borderTop: '1px solid rgba(255, 255, 255, 0.2)', paddingTop: '20px', marginTop: '20px' }}>Proyecto de Fin de Ciclo</div>
        </div>

        {/* Panel Derecho Formulario */}
        <div className="auth-right" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
          <Link className="back-link" to="/" style={{ position: 'absolute', top: '24px', left: '40px', color: '#62726B', textDecoration: 'none', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
            ← Volver al inicio
          </Link>
          <h2 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0', color: '#1a1a1a' }}>Bienvenido de nuevo</h2>
          <p style={{ fontSize: '14px', color: '#62726B', margin: '0 0 32px 0' }}>Introduzca sus credenciales universitarias.</p>

          {error && (
            <div style={{ background: verificacionPendiente ? '#fef3c7' : '#fee2e2', border: `1px solid ${verificacionPendiente ? '#fde68a' : '#fca5a5'}`, color: verificacionPendiente ? '#92400e' : '#dc2626', padding: '16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
              <p style={{ margin: '0 0 8px 0' }}>{error}</p>
              {verificacionPendiente && (
                <button
                  onClick={async () => {
                    setReenviando(true)
                    try {
                      await reenviarVerificacion({ email: email.trim().toLowerCase() })
                    } catch (e) { /* silencioso */ }
                    setTimeout(() => setReenviando(false), 3000)
                  }}
                  disabled={reenviando}
                  style={{
                    display: 'block', width: '100%', padding: '10px',
                    border: '2px solid #f59e0b', borderRadius: '6px',
                    background: reenviando ? '#fef3c7' : '#fff',
                    color: '#92400e', fontWeight: '600', fontSize: '13px',
                    cursor: reenviando ? 'not-allowed' : 'pointer', marginTop: '8px'
                  }}
                >
                  {reenviando ? '✓ Correo de verificación reenviado' : 'Reenviar email de verificación'}
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '8px' }}>Correo Institucional</label>
              <input type="text" value={email} onChange={(e) => setEmail(e.target.value.toLowerCase())} placeholder="usuario.apellido@unl.edu.ec" style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #DBE3E0', background: '#F4F8F6', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '8px' }}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={{ width: '100%', padding: '12px 40px 12px 16px', borderRadius: '8px', border: '1px solid #DBE3E0', background: '#F4F8F6', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#62726B', display: 'flex', alignItems: 'center', padding: 0 }}>
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  )}
                </button>
              </div>
            </div>

            {/* ENLACE RECUPERADO: ¿Olvidaste tu contraseña? */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-8px' }}>
              <Link to="/recover" style={{ fontSize: '13px', color: '#0F766E', textDecoration: 'none', fontWeight: '500' }}>¿Olvidaste tu contraseña?</Link>
            </div>

            <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: 'none', background: '#094E48', color: '#fff', fontSize: '15px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Cargando...' : 'Iniciar sesión →'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', margin: '28px 0', gap: '12px' }}>
            <div style={{ flex: 1, height: '1px', background: '#DBE3E0' }} /><span style={{ color: '#62726B', fontSize: '14px' }}>o</span><div style={{ flex: 1, height: '1px', background: '#DBE3E0' }} />
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
          <div style={{ textAlign: 'center', fontSize: '14px', color: '#62726B' }}>
            ¿No tienes cuenta? <Link to="/register" style={{ color: '#0F766E', fontWeight: '600', textDecoration: 'none' }}>Crear cuenta aquí</Link>
          </div>
        </div>

      </div>
    </div>
  )
}