import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { resetPassword } from '../services/api'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const nav = useNavigate()

  const [form, setForm] = useState({
    nueva_password: '',
    confirm: '',
    token: searchParams.get('token') || ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (searchParams.get('token')) {
      setForm((prev) => ({ ...prev, token: searchParams.get('token') }))
    }
  }, [searchParams])

  const handleChange = (e) => {
    const { name, value } = e.target
    if ((name === 'nueva_password' || name === 'confirm') && /\s/.test(value)) {
      return // Bloquea los espacios físicamente al escribir
    }
    setForm({ ...form, [name]: value })
  }

  const submit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!form.token) {
      setError('Se requiere el token de seguridad. Verifique el enlace de su correo.')
      return
    }

    if (!form.nueva_password || form.nueva_password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    if (/\s/.test(form.nueva_password)) {
      setError('La contraseña no puede contener espacios.')
      return
    }

    if (!/[A-Z]/.test(form.nueva_password)) {
      setError('La contraseña debe contener al menos una letra mayúscula.')
      return
    }

    if (!/[a-z]/.test(form.nueva_password)) {
      setError('La contraseña debe contener al menos una letra minúscula.')
      return
    }

    if (!/\d/.test(form.nueva_password)) {
      setError('La contraseña debe contener al menos un número.')
      return
    }

    if (!/[^a-zA-Z0-9]/.test(form.nueva_password)) {
      setError('La contraseña debe contener al menos un carácter especial.')
      return
    }

    if (form.nueva_password.toLowerCase().includes('usuario')) {
      setError("La contraseña no puede contener la palabra 'usuario'.")
      return
    }

    if (form.nueva_password !== form.confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    try {
      await resetPassword({ token: form.token, nueva_password: form.nueva_password })
      setSuccess(true)
      setTimeout(() => nav('/login'), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al restablecer la contraseña. Es posible que el token haya expirado.')
    } finally {
      setLoading(false)
    }
  }

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

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: '8px'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F4F8F6', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      <div style={{ maxWidth: '960px', width: '100%', background: '#fff', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)', display: 'flex', overflow: 'hidden' }}>

        {/* Panel Izquierdo */}
        <div style={{ flex: 1, background: 'linear-gradient(135deg, #0F766E 0%, #094E48 100%)', color: '#fff', padding: '60px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '500px' }}>
          <div><h1 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 40px 0' }}>UNL-Cloud-Connect</h1></div>
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 24px 0', lineHeight: '1.4' }}>Crear nueva contraseña</h2>
            <p style={{ fontSize: '15px', lineHeight: '1.7', margin: '0', opacity: '0.95' }}>Ingresa tu nueva contraseña para recuperar el acceso a tu cuenta. Asegúrate de guardarla en un lugar seguro.</p>
          </div>
          <div style={{ fontSize: '13px', fontWeight: '600', opacity: '0.8', borderTop: '1px solid rgba(255, 255, 255, 0.2)', paddingTop: '20px' }}>Proyecto de Fin de Ciclo</div>
        </div>

        {/* Panel Derecho Formulario */}
        <div style={{ flex: 1, padding: '60px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0', color: '#1a1a1a' }}>Restablecer clave</h2>
          <p style={{ fontSize: '14px', color: '#62726B', margin: '0 0 32px 0' }}>Establece una contraseña fuerte y segura.</p>

          {error && (
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#166534', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
              Contraseña actualizada con éxito. Redirigiendo al inicio de sesión...
            </div>
          )}

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* El token se maneja internamente, no se muestra al usuario */}

            {/* Nueva Contraseña */}
            <div>
              <label style={labelStyle}>Nueva Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? "text" : "password"} name="nueva_password" value={form.nueva_password} onChange={handleChange} placeholder="••••••••" style={{ ...inputStyle, paddingRight: '40px' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#62726B', display: 'flex', alignItems: 'center', padding: 0 }}>
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirmar Contraseña */}
            <div>
              <label style={labelStyle}>Confirmar Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input type={showConfirm ? "text" : "password"} name="confirm" value={form.confirm} onChange={handleChange} placeholder="••••••••" style={{ ...inputStyle, paddingRight: '40px' }} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#62726B', display: 'flex', alignItems: 'center', padding: 0 }}>
                  {showConfirm ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading || success} style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: 'none', background: '#094E48', color: '#fff', fontSize: '15px', fontWeight: '600', cursor: (loading || success) ? 'not-allowed' : 'pointer', opacity: (loading || success) ? 0.7 : 1 }}>
              {loading ? 'Actualizando...' : 'Actualizar contraseña →'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', margin: '28px 0', gap: '12px' }}>
            <div style={{ flex: 1, height: '1px', background: '#DBE3E0' }} />
          </div>

          <div style={{ textAlign: 'center', fontSize: '14px', color: '#62726B' }}>
            <Link to="/login" style={{ color: '#0F766E', fontWeight: '600', textDecoration: 'none' }}>Cancelar y volver al login</Link>
          </div>

        </div>
      </div>
    </div>
  )
}
