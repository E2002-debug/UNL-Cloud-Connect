import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { verificarCuenta } from '../services/api'

export default function VerificarCuenta() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('loading') // loading | success | error
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setMessage('No se encontró un token de verificación válido en el enlace.')
      return
    }

    const verificar = async () => {
      try {
        const res = await verificarCuenta(token)
        setStatus('success')
        setMessage(res.data?.mensaje || '¡Cuenta verificada exitosamente!')
      } catch (err) {
        setStatus('error')
        setMessage(err.response?.data?.detail || 'El enlace de verificación es inválido o ha expirado.')
      }
    }

    verificar()
  }, [searchParams])

  return (
    <div style={{ minHeight: '100vh', background: '#F4F8F6', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      <div style={{ maxWidth: '480px', width: '100%', background: '#fff', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)', padding: '60px 40px', textAlign: 'center' }}>

        {status === 'loading' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '24px' }}>⏳</div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 12px 0' }}>
              Verificando tu cuenta...
            </h2>
            <p style={{ fontSize: '14px', color: '#62726B' }}>
              Por favor espera un momento mientras confirmamos tu correo electrónico.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ width: '64px', height: '64px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 12px 0' }}>
              ¡Cuenta Verificada Exitosamente!
            </h2>
            <p style={{ fontSize: '14px', color: '#62726B', lineHeight: '1.6', marginBottom: '32px' }}>
              {message}
            </p>
            <Link to="/login" style={{
              display: 'inline-block', padding: '14px 32px', background: '#094E48', color: '#fff',
              borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '15px'
            }}>
              Iniciar sesión →
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ width: '64px', height: '64px', background: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 12px 0' }}>
              Verificación fallida
            </h2>
            <p style={{ fontSize: '14px', color: '#62726B', lineHeight: '1.6', marginBottom: '32px' }}>
              {message}
            </p>
            <Link to="/login" style={{
              display: 'inline-block', padding: '14px 32px', background: '#094E48', color: '#fff',
              borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '15px'
            }}>
              Ir al inicio de sesión
            </Link>
          </>
        )}

      </div>
    </div>
  )
}
