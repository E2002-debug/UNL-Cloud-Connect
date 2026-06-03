import React, { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
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
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate() // <-- Hook para la navegación de regreso

  // VARIABLES DE PALETA CROMÁTICA (Verde Esmeralda & Menta)
  const colors = {
    bgMain: '#f4f8f6',
    bgCard: '#ffffff',
    textMain: '#1e2925',
    textMuted: '#62726b',
    border: '#dbe3e0',
    accentPrimary: '#10b981', // Verde Esmeralda Base
    accentHover: '#059669',
    accentMint: '#0f766e',    // Verde profundo institucional
    mintBright: '#10b981',    // Menta vibrante
    bgGradient: 'linear-gradient(135deg, #0f766e 0%, #064e3b 100%)', // Degradado del panel izquierdo
    bgInput: '#eff4f2',
    bgError: '#fef2f2',
    textError: '#991b1b',
    borderError: '#fca5a5'
  }

  useEffect(() => {
    if (searchParams.get('logout')) {
      setError(null)
      setEmail('')
      setPassword('')
      setLoading(false)
    }
  }, [searchParams])

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

    localStorage.setItem('access_token', String(tokenFinal))
    localStorage.setItem('id_rol', String(userRole))
    localStorage.setItem('nombre', String(nombre))
    localStorage.setItem('apellido', String(apellido))
    localStorage.setItem('correo', String(correo))

    window.location.replace('/dashboard')
  }

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
    <div style={{ minHeight: '100vh', background: colors.bgMain, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ maxWidth: '960px', width: '100%', background: colors.bgCard, borderRadius: '24px', boxShadow: '0 15px 35px rgba(16, 185, 129, 0.05)', display: 'flex', overflow: 'hidden', border: `1px solid ${colors.border}` }}>
        
        {/* Panel Izquierdo - Adaptado con degradado botánico */}
        <div style={{ flex: 1, background: colors.bgGradient, color: '#e6f4ea', padding: '60px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '500px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 40px 0', color: '#ffffff' }}>
              UNL-Cloud-<span style={{ color: '#5effcb' }}>Connect</span>
            </h1>
          </div>
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 24px 0', lineHeight: '1.4', color: '#ffffff' }}>¡Entérate de los nuevos eventos en la facultad!</h2>
            <p style={{ fontSize: '15px', lineHeight: '1.7', margin: '0', color: '#a7f3d0', opacity: '0.95' }}>Consulte la agenda de la FEIRNNR y las variables climáticas en tiempo real.</p>
          </div>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#a7f3d0', opacity: '0.8', borderTop: '1px solid rgba(255, 255, 255, 0.15)', paddingTop: '20px', letterSpacing: '0.5px' }}>Proyecto de Fin de Ciclo</div>
        </div>

        {/* Panel Derecho Formulario */}
        <div style={{ flex: 1, padding: '40px 40px 60px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
          
          {/* BOTÓN DE REGRESAR AL HOME */}
          <div style={{ marginBottom: '20px', alignSelf: 'flex-start' }}>
            <button 
              onClick={() => navigate('/')} 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'transparent',
                border: 'none',
                color: colors.textMuted,
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                padding: '6px 12px',
                borderRadius: '8px',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => { e.target.style.color = colors.accentPrimary; e.target.style.background = '#effaf5' }}
              onMouseOut={(e) => { e.target.style.color = colors.textMuted; e.target.style.background = 'transparent' }}
            >
              ← Volver al Inicio
            </button>
          </div>

          <h2 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0', color: colors.textMain }}>Bienvenido de nuevo</h2>
          <p style={{ fontSize: '14px', color: colors.textMuted, margin: '0 0 32px 0' }}>Introduzca sus credenciales universitarias.</p>

          {error && (
            <div style={{ background: colors.bgError, border: `1px solid ${colors.borderError}`, color: colors.textError, padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', fontSize: '14px', fontWeight: '500' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textMain, marginBottom: '8px' }}>Correo Institucional</label>
              <input 
                type="text" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="usuario@unl.edu.ec" 
                style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: `1px solid ${colors.border}`, background: colors.bgInput, fontSize: '14px', boxSizing: 'border-box', outline: 'none', color: colors.textMain, transition: 'all 0.2s' }} 
                onFocus={(e) => { e.target.style.borderColor = colors.accentPrimary; e.target.style.background = '#ffffff' }}
                onBlur={(e) => { e.target.style.borderColor = colors.border; e.target.style.background = colors.bgInput }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textMain, marginBottom: '8px' }}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  style={{ width: '100%', padding: '12px 40px 12px 16px', borderRadius: '10px', border: `1px solid ${colors.border}`, background: colors.bgInput, fontSize: '14px', boxSizing: 'border-box', outline: 'none', color: colors.textMain, transition: 'all 0.2s' }} 
                  onFocus={(e) => { e.target.style.borderColor = colors.accentPrimary; e.target.style.background = '#ffffff' }}
                  onBlur={(e) => { e.target.style.borderColor = colors.border; e.target.style.background = colors.bgInput }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted, display: 'flex', alignItems: 'center', padding: 0 }}>
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Enlace Recuperar Contraseña - Sintonizado */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-8px' }}>
              <Link to="/recover" style={{ fontSize: '13px', color: colors.accentPrimary, textDecoration: 'none', fontWeight: '600' }}>¿Olvidaste tu contraseña?</Link>
            </div>

            {/* Botón Principal Esmeralda */}
            <button 
              type="submit" 
              disabled={loading} 
              style={{ width: '100%', padding: '14px 16px', borderRadius: '10px', border: 'none', background: colors.accentPrimary, color: '#fff', fontSize: '15px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}
              onMouseOver={(e) => { if(!loading) e.target.style.background = colors.accentHover }}
              onMouseOut={(e) => { if(!loading) e.target.style.background = colors.accentPrimary }}
            >
              {loading ? 'Cargando...' : 'Iniciar sesión →'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', margin: '28px 0', gap: '12px' }}>
            <div style={{ flex: 1, height: '1px', background: colors.border }}><span style={{ display: 'none' }}></span></div>
            <span style={{ color: colors.textMuted, fontSize: '14px' }}>o</span>
            <div style={{ flex: 1, height: '1px', background: colors.border }}><span style={{ display: 'none' }}></span></div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <GoogleLogin 
              onSuccess={handleGoogleSuccess} 
              onError={() => setError('Error de inicialización de Google')} 
              useOneTap={false} 
              auto_select={false} 
            />
          </div>

          {/* Enlace de Registro - Sintonizado */}
          <div style={{ textAlign: 'center', fontSize: '14px', color: colors.textMuted }}>
            ¿No tienes cuenta? <Link to="/register" style={{ color: colors.accentPrimary, fontWeight: '600', textDecoration: 'none' }}>Crear cuenta aquí</Link>
          </div>
        </div>

      </div>
    </div>
  )
}