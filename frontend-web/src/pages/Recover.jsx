import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { sendRecovery } from '../services/api'

export default function Recover() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setMsg(null)

    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail) {
      const msj = 'Por favor, ingresa tu correo institucional.'
      setError(msj)
      toast.error(msj)
      return
    }

    if (!cleanEmail.endsWith('@unl.edu.ec')) {
      const msj = 'El correo debe pertenecer al dominio @unl.edu.ec'
      setError(msj)
      toast.error(msj)
      return
    }

    setLoading(true)
    try {
      await sendRecovery({ email: cleanEmail })
      const msj = 'Correo enviado exitosamente. Revisa tu bandeja de entrada o carpeta de spam.'
      setMsg(msj)
      toast.success(msj)
    } catch (err) {
      const msj = err.response?.data?.detail || 'Error al procesar la solicitud de recuperación.'
      setError(msj)
      toast.error(msj)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F4F8F6', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      <div style={{ maxWidth: '960px', width: '100%', background: '#fff', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)', display: 'flex', overflow: 'hidden' }}>

        {/* Panel Izquierdo */}
        <div style={{ flex: 1, background: 'linear-gradient(135deg, #0F766E 0%, #094E48 100%)', color: '#fff', padding: '60px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '500px' }}>
          <div><h1 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 40px 0' }}>UNL-Cloud-Connect</h1></div>
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 24px 0', lineHeight: '1.4' }}>Recupera tu acceso</h2>
            <p style={{ fontSize: '15px', lineHeight: '1.7', margin: '0', opacity: '0.95' }}>Ingresa tu correo institucional y te enviaremos las instrucciones necesarias para restablecer tu contraseña de forma segura.</p>
          </div>
          <div style={{ fontSize: '13px', fontWeight: '600', opacity: '0.8', borderTop: '1px solid rgba(255, 255, 255, 0.2)', paddingTop: '20px' }}>Proyecto de Fin de Ciclo</div>
        </div>

        {/* Panel Derecho Formulario */}
        <div style={{ flex: 1, padding: '60px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0', color: '#1a1a1a' }}>Recuperar contraseña</h2>
          <p style={{ fontSize: '14px', color: '#62726B', margin: '0 0 32px 0' }}>Enviaremos un enlace a tu correo institucional.</p>

          {error && (
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          {msg && (
            <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#166534', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
              {msg}
            </div>
          )}

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '8px' }}>Correo Institucional</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@unl.edu.ec" style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #DBE3E0', background: '#F4F8F6', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
            </div>

            <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: 'none', background: '#094E48', color: '#fff', fontSize: '15px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Enviando...' : 'Enviar enlace de recuperación →'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', margin: '28px 0', gap: '12px' }}>
            <div style={{ flex: 1, height: '1px', background: '#DBE3E0' }} />
          </div>

          <div style={{ textAlign: 'center', fontSize: '14px', color: '#62726B' }}>
            ¿Recordaste tu contraseña? <Link to="/login" style={{ color: '#0F766E', fontWeight: '600', textDecoration: 'none' }}>Vuelve al inicio de sesión</Link>
          </div>
        </div>

      </div>
    </div>
  )
}
