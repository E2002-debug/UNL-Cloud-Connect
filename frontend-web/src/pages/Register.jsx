import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { register, reenviarVerificacion } from '../services/api'

// Clave pública de reCAPTCHA v2 (se carga desde variables de entorno de Vite)
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || ''

export default function Register() {
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    clave: '',
    fecha_nacimiento: '',
    id_rol: '2' // Se predefine '2' (Participante) para evitar que rompa en base de datos
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [registroExitoso, setRegistroExitoso] = useState(false)
  const [correoRegistrado, setCorreoRegistrado] = useState('')
  const [reenviando, setReenviando] = useState(false)
  const [recaptchaToken, setRecaptchaToken] = useState('')
  const recaptchaRef = useRef(null)
  const nav = useNavigate()

  // Cargar script de reCAPTCHA dinámicamente
  useEffect(() => {
    if (RECAPTCHA_SITE_KEY && !window.grecaptcha) {
      const script = document.createElement('script')
      script.src = 'https://www.google.com/recaptcha/api.js'
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }
  }, [])

  // Callback global para reCAPTCHA
  useEffect(() => {
    window.onRecaptchaSuccess = (token) => setRecaptchaToken(token)
    window.onRecaptchaExpired = () => setRecaptchaToken('')
    return () => {
      delete window.onRecaptchaSuccess
      delete window.onRecaptchaExpired
    }
  }, [])

  // Validación: no permitir números en nombre y apellido, ni espacios en la clave
  const handleChange = (e) => {
    const { name, value } = e.target
    if ((name === 'nombre' || name === 'apellido') && /\d/.test(value)) {
      return // Ignora la entrada si contiene números
    }
    if (name === 'clave' && /\s/.test(value)) {
      return // Bloquea espacios físicamente al escribir
    }
    if (name === 'correo') {
      setForm({ ...form, [name]: value.toLowerCase() })
      return
    }
    setForm({ ...form, [name]: value })
  }

  // Función para validar la fortaleza de la contraseña
  const getPasswordStrength = (password) => {
    if (!password) return { level: 0, text: '', color: '#DBE3E0' }
    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[a-z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[^a-zA-Z0-9]/.test(password)) score++
    if (score <= 2) return { level: score, text: 'Débil', color: '#ef4444' }
    if (score <= 4) return { level: score, text: 'Aceptable', color: '#f59e0b' }
    return { level: 5, text: 'Fuerte', color: '#10b981' }
  }

  const passwordStrength = getPasswordStrength(form.clave)

  // Reenviar correo de verificación
  const handleReenviar = async () => {
    setReenviando(true)
    try {
      await reenviarVerificacion({ email: correoRegistrado })
      toast.success('Correo de verificación reenviado')
    } catch (err) {
      toast.error('No se pudo reenviar el correo de verificación')
    }
    setTimeout(() => setReenviando(false), 3000)
  }

  const submit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!form.nombre || !form.apellido || !form.correo || !form.clave || !form.fecha_nacimiento) {
      const msg = 'Por favor, completa todos los campos requeridos.'
      setError(msg)
      toast.error(msg)
      return
    }

    // Validación: no permitir números en nombre y apellido
    if (/\d/.test(form.nombre) || /\d/.test(form.apellido)) {
      const msg = 'El nombre y apellido no pueden contener números.'
      setError(msg)
      toast.error(msg)
      return
    }

    // Validación: edad entre 17 y 60 años
    const fechaNac = new Date(form.fecha_nacimiento)
    const hoy = new Date()
    let edad = hoy.getFullYear() - fechaNac.getFullYear()
    const mesDiff = hoy.getMonth() - fechaNac.getMonth()
    if (mesDiff < 0 || (mesDiff === 0 && hoy.getDate() < fechaNac.getDate())) {
      edad--
    }
    if (edad < 17 || edad > 60) {
      const msg = 'Debes tener entre 17 y 60 años para crear una cuenta.'
      setError(msg)
      toast.error(msg)
      return
    }

    // Validación: contraseña segura
    if (form.clave.length < 8 || form.clave.length > 12) {
      const msg = 'La contraseña debe tener entre 8 y 12 caracteres.'
      setError(msg)
      toast.error(msg)
      return
    }
    if (/\s/.test(form.clave)) {
      const msg = 'La contraseña no puede contener espacios.'
      setError(msg)
      toast.error(msg)
      return
    }
    if (!/[A-Z]/.test(form.clave)) {
      const msg = 'La contraseña debe contener al menos una letra mayúscula.'
      setError(msg)
      toast.error(msg)
      return
    }
    if (!/[a-z]/.test(form.clave)) {
      const msg = 'La contraseña debe contener al menos una letra minúscula.'
      setError(msg)
      toast.error(msg)
      return
    }
    if (!/\d/.test(form.clave)) {
      const msg = 'La contraseña debe contener al menos un número.'
      setError(msg)
      toast.error(msg)
      return
    }
    if (!/[^a-zA-Z0-9]/.test(form.clave)) {
      const msg = 'La contraseña debe contener al menos un carácter especial.'
      setError(msg)
      toast.error(msg)
      return
    }
    if (form.clave.toLowerCase().includes('usuario')) {
      const msg = "La contraseña no puede contener la palabra 'usuario'."
      setError(msg)
      toast.error(msg)
      return
    }

    const cleanEmail = form.correo.trim().toLowerCase()
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

    // Validar reCAPTCHA si está configurado
    if (RECAPTCHA_SITE_KEY && !recaptchaToken) {
      const msg = 'Por favor, completa el captcha de seguridad.'
      setError(msg)
      toast.error(msg)
      return
    }

    setLoading(true)
    try {
      const payload = { ...form, correo: cleanEmail, id_rol: parseInt(form.id_rol, 10) || 2 }
      await register(payload)

      // Ocultar parcialmente el correo para mostrar
      const partes = cleanEmail.split('@')
      const oculto = partes[0].substring(0, 2) + '***@' + partes[1]
      setCorreoRegistrado(oculto)
      setRegistroExitoso(true)
      toast.success('Cuenta por verificar. Revisa tu bandeja de entrada.', { duration: 8000 })
    } catch (err) {
      let msg = err.response?.data?.detail || err.message || 'Error en el registro'
      if (Array.isArray(msg)) {
        msg = msg.map(e => e.msg || e.detail || JSON.stringify(e)).join(', ')
      }
      if (typeof msg === 'object' && msg !== null) {
        msg = JSON.stringify(msg)
      }
      setError(msg)
      toast.error(msg)
      setLoading(false)
      // Reset reCAPTCHA
      if (window.grecaptcha) {
        window.grecaptcha.reset()
        setRecaptchaToken('')
      }
    }
  }

  // Estilo base reutilizado para los inputs del formulario
  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #DBE3E0',
    background: '#F4F8F6',
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none'
  }

  // Estilo base para las etiquetas/labels
  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: '8px'
  }

  // ============ PANTALLA DE VERIFICACIÓN PENDIENTE ============
  if (registroExitoso) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#F4F8F6',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px'
      }}>
        <div style={{
          maxWidth: '480px',
          width: '100%',
          background: '#fff',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
          padding: '60px 40px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '80px', height: '80px',
            background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px auto',
            border: '3px solid #f59e0b'
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 12px 0' }}>
            Debes verificar tu correo electrónico antes de iniciar sesión.
          </h2>

          <p style={{ fontSize: '14px', color: '#62726B', lineHeight: '1.6', margin: '0 0 8px 0' }}>
            Revisa tu bandeja de entrada en <strong style={{ color: '#92400e' }}>{correoRegistrado}</strong>
          </p>

          <p style={{ fontSize: '13px', color: '#62726B', marginBottom: '32px' }}>
            Haz clic en el enlace de verificación que te enviamos para activar tu cuenta.
          </p>

          <button
            onClick={handleReenviar}
            disabled={reenviando}
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: '8px',
              border: '2px solid #f59e0b',
              background: reenviando ? '#fef3c7' : '#fff',
              color: '#92400e',
              fontSize: '15px',
              fontWeight: '600',
              cursor: reenviando ? 'not-allowed' : 'pointer',
              marginBottom: '16px',
              transition: 'all 0.2s'
            }}
          >
            {reenviando ? '✓ Correo reenviado' : 'Reenviar email de verificación'}
          </button>

          <div style={{ fontSize: '14px', color: '#62726B' }}>
            <Link to="/login" style={{ color: '#0F766E', fontWeight: '600', textDecoration: 'none' }}>
              ← Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ============ FORMULARIO DE REGISTRO ============
  return (
    <div style={{
      minHeight: '100vh',
      background: '#F4F8F6',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px'
    }}>
      <style>{`
        .auth-container { flex-direction: row; }
        .auth-left { padding: 60px 40px; min-height: 550px; }
        .auth-right { padding: 40px 40px; }
        .input-row { flex-direction: row; }
        @media (max-width: 768px) {
          .auth-container { flex-direction: column; }
          .auth-left { padding: 40px 20px; min-height: auto; text-align: center; }
          .auth-left h1 { font-size: 20px !important; margin-bottom: 20px !important; }
          .auth-left h2 { font-size: 22px !important; }
          .auth-right { padding: 40px 20px; }
          .back-link { top: 12px !important; left: 20px !important; }
          .input-row { flex-direction: column; gap: 16px !important; }
        }
      `}</style>
      {/* Card Principal - Doble Columna Uniforme */}
      <div className="auth-container" style={{
        maxWidth: '960px',
        width: '100%',
        background: '#fff',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        overflow: 'hidden'
      }}>

        {/* Columna Izquierda - Panel Azul Coherente */}
        <div className="auth-left" style={{
          flex: 1,
          background: 'linear-gradient(135deg, #0F766E 0%, #094E48 100%)',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 40px 0' }}>UNL-Cloud-Connect</h1>
          </div>

          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 24px 0', lineHeight: '1.4' }}>
              Crea tu cuenta en el ecosistema
            </h2>
            <p style={{ fontSize: '15px', lineHeight: '1.7', margin: '0', opacity: '0.95' }}>
              Regístrate en nuestro prototipo académico para acceder a los módulos de monitoreo climático, control de eventos de la facultad y servicios distribuidos en la nube de la FEIRNNR.
            </p>
          </div>

          <div style={{
            fontSize: '13px',
            fontWeight: '600',
            opacity: '0.8',
            borderTop: '1px solid rgba(255, 255, 255, 0.2)',
            paddingTop: '20px',
            marginTop: '20px'
          }}>
            Proyecto de Fin de Ciclo - Prototipo
          </div>
        </div>

        {/* Columna Derecha - Formulario Adaptado */}
        <div className="auth-right" style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative'
        }}>
          <Link className="back-link" to="/login" style={{ position: 'absolute', top: '24px', left: '40px', color: '#62726B', textDecoration: 'none', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
            ← Volver a Iniciar Sesión
          </Link>
          <h2 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0', color: '#1a1a1a' }}>
            Registro de Usuario
          </h2>
          <p style={{ fontSize: '14px', color: '#62726B', margin: '0 0 24px 0' }}>
            Regístrate utilizando tu dirección de correo institucional.
          </p>

          {error && (
            <div style={{
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              color: '#dc2626',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Fila: Nombre y Apellido */}
            <div className="input-row" style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Ej. Lisbeth"
                  style={inputStyle}
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
                />
              </div>
            </div>

            {/* Correo Institucional */}
            <div>
              <label style={labelStyle}>Correo Institucional</label>
              <input
                type="email"
                name="correo"
                value={form.correo}
                onChange={handleChange}
                placeholder="usuario.apellido@unl.edu.ec"
                style={inputStyle}
              />
            </div>

            {/* Contraseña */}
            <div>
              <label style={labelStyle}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="clave"
                  value={form.clave}
                  onChange={handleChange}
                  placeholder="••••••••"
                  maxLength={12}
                  style={{ ...inputStyle, paddingRight: '40px' }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#62726B', display: 'flex', alignItems: 'center', padding: 0 }}>
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  )}
                </button>
              </div>
              {/* Indicador de fortaleza de contraseña */}
              {form.clave && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i <= passwordStrength.level ? passwordStrength.color : '#DBE3E0', transition: 'background 0.3s' }} />
                    ))}
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: passwordStrength.color }}>{passwordStrength.text}</span>
                </div>
              )}
              <p style={{ fontSize: '11px', color: '#62726B', margin: '6px 0 0 0' }}>
                Entre 8 y 12 caracteres, mayúscula, minúscula, número y especial. Sin espacios.
              </p>
            </div>

            {/* Fecha Nacimiento */}
            <div>
              <label style={labelStyle}>Fecha de Nacimiento</label>
              <input
                type="date"
                name="fecha_nacimiento"
                value={form.fecha_nacimiento}
                onChange={handleChange}
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                style={inputStyle}
              />
              <p style={{ fontSize: '11px', color: '#62726B', margin: '4px 0 0 0' }}>Debes tener entre 17 y 60 años.</p>
            </div>

            {/* reCAPTCHA */}
            {RECAPTCHA_SITE_KEY && (
              <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
                <div
                  className="g-recaptcha"
                  data-sitekey={RECAPTCHA_SITE_KEY}
                  data-callback="onRecaptchaSuccess"
                  data-expired-callback="onRecaptchaExpired"
                  ref={recaptchaRef}
                ></div>
              </div>
            )}

            {/* Botón Guardar / Enviar */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '8px',
                border: 'none',
                background: '#094E48',
                color: '#fff',
                fontSize: '15px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '10px',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Creando cuenta...' : (
                <>
                  Crear cuenta
                  <span style={{ fontSize: '18px' }}>→</span>
                </>
              )}
            </button>
          </form>

          {/* Separador e Intercambio a Login */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', gap: '12px' }}>
            <div style={{ flex: 1, height: '1px', background: '#DBE3E0' }} />
          </div>

          <div style={{ textAlign: 'center', fontSize: '14px', color: '#62726B' }}>
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login" style={{ color: '#0F766E', fontWeight: '600', textDecoration: 'none' }}>
              Inicia sesión aquí
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}