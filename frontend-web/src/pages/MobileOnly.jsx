import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function MobileOnly() {
  const navigate = useNavigate()
  const nombre = localStorage.getItem('nombre') || 'Usuario'
  const apellido = localStorage.getItem('apellido') || ''

  const handleLogout = () => {
    localStorage.clear()
    window.location.href = '/'
  }

  const isAuthenticated = !!localStorage.getItem('access_token')

  if (!isAuthenticated) {
    navigate('/', { replace: true })
    return null
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F766E 0%, #094E48 50%, #064E3B 100%)',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      color: 'white',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
        borderRadius: '20px',
        padding: '48px 40px',
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
        border: '1px solid rgba(255,255,255,0.15)',
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          background: 'rgba(255,255,255,0.15)',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: '36px',
        }}>
          📱
        </div>

        <h1 style={{
          margin: '0 0 8px',
          fontSize: '24px',
          fontWeight: '800',
          letterSpacing: '-0.5px',
        }}>
          Acceso Exclusivo
        </h1>

        <p style={{
          margin: '0 0 4px',
          fontSize: '14px',
          opacity: 0.85,
          fontWeight: '600',
          lineHeight: 1.6,
        }}>
          Hola, <strong>{nombre} {apellido}</strong>. Esta plataforma web está diseñada exclusivamente para administradores del sistema.
        </p>

        <p style={{
          margin: '0 0 32px',
          fontSize: '14px',
          opacity: 0.7,
          fontWeight: '500',
          lineHeight: 1.6,
        }}>
          Como participante, debes utilizar la <strong>aplicación móvil UNL-Cloud-Connect</strong> para acceder a todas las funcionalidades: visualizar eventos, subir fotos, reaccionar y más.
        </p>

        <div style={{
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '32px',
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', opacity: 0.85 }}>
            Descarga la app móvil desde el repositorio oficial o solicita el archivo APK al administrador del sistema.
          </p>
        </div>

        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '14px',
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: '10px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.2s',
            letterSpacing: '0.5px',
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
        >
          CERRAR SESIÓN
        </button>
      </div>

      <p style={{
        marginTop: '32px',
        fontSize: '12px',
        opacity: 0.5,
        fontWeight: '600',
        letterSpacing: '0.5px',
      }}>
        Universidad Nacional de Loja — UNL-Cloud-Connect
      </p>
    </div>
  )
}
