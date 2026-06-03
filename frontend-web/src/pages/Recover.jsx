import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { sendRecovery } from '../services/api'

export default function Recover() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const [error, setError] = useState(null)

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

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setMsg(null)

    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail) {
      setError('Por favor, ingresa tu correo institucional.')
      return
    }

    if (!cleanEmail.endsWith('@unl.edu.ec')) {
      setError('El correo debe pertenecer al dominio @unl.edu.ec')
      return
    }

    setLoading(true)
    try {
      await sendRecovery({ email: cleanEmail })
      setMsg('Correo enviado exitosamente. Revisa tu bandeja de entrada o carpeta de spam.')
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al procesar la solicitud de recuperación.')
    } finally {
      setLoading(false)
    }
  }

  return (
<<<<<<< HEAD
    <div style={{ minHeight: '100vh', background: '#F4F8F6', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      <div style={{ maxWidth: '960px', width: '100%', background: '#fff', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)', display: 'flex', overflow: 'hidden' }}>
        
        {/* Panel Izquierdo */}
        <div style={{ flex: 1, background: 'linear-gradient(135deg, #0F766E 0%, #094E48 100%)', color: '#fff', padding: '60px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '500px' }}>
          <div><h1 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 40px 0' }}>UNL-Cloud-Connect</h1></div>
=======
    <div style={{ minHeight: '100vh', background: colors.bgMain, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ maxWidth: '960px', width: '100%', background: colors.bgCard, borderRadius: '24px', boxShadow: '0 15px 35px rgba(16, 185, 129, 0.05)', display: 'flex', overflow: 'hidden', border: `1px solid ${colors.border}` }}>
        
        {/* Panel Izquierdo - Adaptado con degradado botánico */}
        <div style={{ flex: 1, background: colors.bgGradient, color: '#e6f4ea', padding: '60px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '500px' }}>
>>>>>>> origin/feature/programador_5
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 40px 0', color: '#ffffff' }}>
              UNL-Cloud-<span style={{ color: '#5effcb' }}>Connect</span>
            </h1>
          </div>
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 24px 0', lineHeight: '1.4', color: '#ffffff' }}>Recupera tu acceso</h2>
            <p style={{ fontSize: '15px', lineHeight: '1.7', margin: '0', color: '#a7f3d0', opacity: '0.95' }}>Ingresa tu correo institucional y te enviaremos las instrucciones necesarias para restablecer tu contraseña de forma segura.</p>
          </div>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#a7f3d0', opacity: '0.8', borderTop: '1px solid rgba(255, 255, 255, 0.15)', paddingTop: '20px', letterSpacing: '0.5px' }}>Proyecto de Fin de Ciclo</div>
        </div>

        {/* Panel Derecho Formulario */}
        <div style={{ flex: 1, padding: '60px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
<<<<<<< HEAD
          <h2 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0', color: '#1a1a1a' }}>Recuperar contraseña</h2>
          <p style={{ fontSize: '14px', color: '#62726B', margin: '0 0 32px 0' }}>Enviaremos un enlace a tu correo institucional.</p>
=======
          <h2 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0', color: colors.textMain }}>Recuperar contraseña</h2>
          <p style={{ fontSize: '14px', color: colors.textMuted, margin: '0 0 32px 0' }}>Enviaremos un enlace a tu correo institucional.</p>
>>>>>>> origin/feature/programador_5

          {error && (
            <div style={{ background: colors.bgError, border: `1px solid ${colors.borderError}`, color: colors.textError, padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', fontSize: '14px', fontWeight: '500' }}>
              {error}
            </div>
          )}

          {msg && (
            <div style={{ background: colors.bgSuccess, border: `1px solid ${colors.borderSuccess}`, color: colors.textSuccess, padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', fontSize: '14px', fontWeight: '600' }}>
              {msg}
            </div>
          )}

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
<<<<<<< HEAD
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '8px' }}>Correo Institucional</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@unl.edu.ec" style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #DBE3E0', background: '#F4F8F6', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
            </div>

            <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: 'none', background: '#094E48', color: '#fff', fontSize: '15px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
=======
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textMain, marginBottom: '8px' }}>Correo Institucional</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="usuario@unl.edu.ec" 
                style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: `1px solid ${colors.border}`, background: colors.bgInput, fontSize: '14px', boxSizing: 'border-box', outline: 'none', color: colors.textMain, transition: 'all 0.2s' }} 
                onFocus={(e) => { e.target.style.borderColor = colors.accentPrimary; e.target.style.background = '#ffffff' }}
                onBlur={(e) => { e.target.style.borderColor = colors.border; e.target.style.background = colors.bgInput }}
              />
            </div>

            {/* Botón Principal Esmeralda */}
            <button 
              type="submit" 
              disabled={loading} 
              style={{ width: '100%', padding: '14px 16px', borderRadius: '10px', border: 'none', background: colors.accentPrimary, color: '#fff', fontSize: '15px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}
              onMouseOver={(e) => { if(!loading) e.target.style.background = colors.accentHover }}
              onMouseOut={(e) => { if(!loading) e.target.style.background = colors.accentPrimary }}
            >
>>>>>>> origin/feature/programador_5
              {loading ? 'Enviando...' : 'Enviar enlace de recuperación →'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', margin: '28px 0', gap: '12px' }}>
<<<<<<< HEAD
            <div style={{ flex: 1, height: '1px', background: '#DBE3E0' }} />
          </div>

          <div style={{ textAlign: 'center', fontSize: '14px', color: '#62726B' }}>
            ¿Recordaste tu contraseña? <Link to="/login" style={{ color: '#0F766E', fontWeight: '600', textDecoration: 'none' }}>Vuelve al inicio de sesión</Link>
=======
            <div style={{ flex: 1, height: '1px', background: colors.border }} />
          </div>

          {/* Retorno al Login */}
          <div style={{ textAlign: 'center', fontSize: '14px', color: colors.textMuted }}>
            ¿Recordaste tu contraseña?{' '}
            <Link 
              to="/login" 
              style={{ color: colors.accentPrimary, fontWeight: '600', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseOver={(e) => e.target.style.color = colors.accentHover}
              onMouseOut={(e) => e.target.style.color = colors.accentPrimary}
            >
              Vuelve al inicio de sesión
            </Link>
>>>>>>> origin/feature/programador_5
          </div>
        </div>

      </div>
    </div>
  )
}