import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../services/api'

export default function Register() {
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    clave: '',
    fecha_nacimiento: '',
    id_rol: '2' 
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const nav = useNavigate()

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
    borderError: '#fca5a5',
    bgSuccess: '#e6f4ea',     // Fondo verde menta suave para éxito
    textSuccess: '#065f46',
    borderSuccess: '#a7f3d0'
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (!form.nombre || !form.apellido || !form.correo || !form.clave || !form.fecha_nacimiento) {
      setError('Por favor, completa todos los campos requeridos.')
      return
    }

    const cleanEmail = form.correo.trim().toLowerCase()
    if (!cleanEmail.endsWith('@unl.edu.ec')) {
      setError('El correo debe pertenecer al dominio @unl.edu.ec')
      return
    }

    setLoading(true)
    try {
      const payload = { ...form, correo: cleanEmail, id_rol: parseInt(form.id_rol, 10) || 2 }
      
      const response = await register(payload)
      const mensajeExito = response?.mensaje || '¡Registro exitoso! Redirigiendo...'
      setSuccessMessage(mensajeExito)
      
      setTimeout(() => {
        nav('/login')
      }, 3000)

    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Error en el registro')
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    border: `1px solid ${colors.border}`,
    background: colors.bgInput,
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none',
    color: colors.textMain,
    transition: 'all 0.2s'
  }

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: colors.textMain,
    marginBottom: '8px'
  }

  // Manejadores dinámicos para inputs compartidos
  const handleFocus = (e) => {
    e.target.style.borderColor = colors.accentPrimary
    e.target.style.background = '#ffffff'
  }

  const handleBlur = (e) => {
    e.target.style.borderColor = colors.border
    e.target.style.background = colors.bgInput
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.bgMain,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      fontFamily: "'Segoe UI', system-ui, sans-serif"
    }}>
      <div style={{
        maxWidth: '960px',
        width: '100%',
        background: colors.bgCard,
        borderRadius: '24px',
        boxShadow: '0 15px 35px rgba(16, 185, 129, 0.05)',
        display: 'flex',
        overflow: 'hidden',
        border: `1px solid ${colors.border}`
      }}>
        
        {/* Columna Izquierda - Panel Verde con Degradado Botánico */}
        <div style={{
          flex: 1,
          background: colors.bgGradient,
          color: '#e6f4ea',
          padding: '60px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '550px'
        }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 40px 0', color: '#ffffff' }}>
              UNL-Cloud-<span style={{ color: '#5effcb' }}>Connect</span>
            </h1>
          </div>
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 24px 0', lineHeight: '1.4', color: '#ffffff' }}>
              Crea tu cuenta en el ecosistema
            </h2>
            <p style={{ fontSize: '15px', lineHeight: '1.7', margin: '0', color: '#a7f3d0', opacity: '0.95' }}>
              Regístrate en nuestro prototipo académico para acceder a los módulos de monitoreo climático, control de eventos de la facultad y servicios distribuidos en la nube de la FEIRNNR.
            </p>
          </div>
          <div style={{
            fontSize: '13px',
            fontWeight: '600',
            color: '#a7f3d0',
            opacity: '0.8',
            borderTop: '1px solid rgba(255, 255, 255, 0.15)',
            paddingTop: '20px',
            letterSpacing: '0.5px'
          }}>
            Proyecto de Fin de Ciclo - Prototipo
          </div>
        </div>

        {/* Columna Derecha - Formulario */}
        <div style={{
          flex: 1,
          padding: '40px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0', color: colors.textMain }}>
            Registro de Usuario
          </h2>
          <p style={{ fontSize: '14px', color: colors.textMuted, margin: '0 0 24px 0' }}>
            Regístrate utilizando tu dirección de correo institucional.
          </p>

          {/* Alerta de Error (Rojo) */}
          {error && (
            <div style={{
              background: colors.bgError,
              border: `1px solid ${colors.borderError}`,
              color: colors.textError,
              padding: '12px 16px',
              borderRadius: '10px',
              marginBottom: '20px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              {error}
            </div>
          )}

          {/* Alerta de Éxito Sintonizada (Menta Suave) */}
          {successMessage && (
            <div style={{
              background: colors.bgSuccess,
              border: `1px solid ${colors.borderSuccess}`,
              color: colors.textSuccess,
              padding: '12px 16px',
              borderRadius: '10px',
              marginBottom: '20px',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              {successMessage}
            </div>
          )}

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Ej. Lisbeth"
                  style={inputStyle}
                  disabled={loading}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Apellido</label>
                <input
                  type="text"
                  name="apellido"
                  value={form.apellido}
                  onChange={handleChange}
                  placeholder="Ej. Cale"
                  style={inputStyle}
                  disabled={loading}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Correo Institucional</label>
              <input
                type="email"
                name="correo"
                value={form.correo}
                onChange={handleChange}
                placeholder="usuario@unl.edu.ec"
                style={inputStyle}
                disabled={loading}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>

            <div>
              <label style={labelStyle}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="clave"
                  value={form.clave}
                  onChange={handleChange}
                  placeholder="••••••••"
                  style={{ ...inputStyle, paddingRight: '40px' }}
                  disabled={loading}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
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

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Fecha de Nacimiento</label>
                <input
                  type="date"
                  name="fecha_nacimiento"
                  value={form.fecha_nacimiento}
                  onChange={handleChange}
                  style={inputStyle}
                  disabled={loading}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Rol del Sistema</label>
                <select
                  name="id_rol"
                  value={form.id_rol}
                  onChange={handleChange}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  disabled={loading}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                >
                  <option value="2">Participante</option>
                  <option value="1">Administrador</option>
                </select>
              </div>
            </div>

            {/* Botón Principal Esmeralda */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '10px',
                border: 'none',
                background: colors.accentPrimary,
                color: '#fff',
                fontSize: '15px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '10px',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
              }}
              onMouseOver={(e) => { if(!loading) e.target.style.background = colors.accentHover }}
              onMouseOut={(e) => { if(!loading) e.target.style.background = colors.accentPrimary }}
            >
              {loading ? 'Procesando...' : (
                <>
                  Crear cuenta
                  <span style={{ fontSize: '18px' }}>→</span>
                </>
              )}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', gap: '12px' }}>
            <div style={{ flex: 1, height: '1px', background: colors.border }} />
          </div>

          {/* Enlace de redirección al Login */}
          <div style={{ textAlign: 'center', fontSize: '14px', color: colors.textMuted }}>
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login" style={{ color: colors.accentPrimary, fontWeight: '600', textDecoration: 'none' }}>
              Inicia sesión aquí
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}