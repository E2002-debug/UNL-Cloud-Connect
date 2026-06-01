import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Obtener datos del usuario desde localStorage
    const nombre = localStorage.getItem('nombre')
    const apellido = localStorage.getItem('apellido')
    const correo = localStorage.getItem('correo')
    const id_rol = localStorage.getItem('id_rol')
    const token = localStorage.getItem('access_token')

    // Si no hay token, redirigir al login
    if (!token) {
      navigate('/login')
      return
    }

    // Mapear id_rol a nombre de rol
    const rolMap = {
      '1': 'Administrador',
      '2': 'Participante',
      1: 'Administrador',
      2: 'Participante'
    }

    setUser({
      nombre: nombre || 'Usuario',
      apellido: apellido || '',
      correo: correo || 'No disponible',
      rol: rolMap[id_rol] || 'Usuario',
      id_rol
    })
  }, [navigate])

  const handleLogout = () => {
    // Limpiar completamente la sesión
    localStorage.removeItem('access_token')
    localStorage.removeItem('id_rol')
    localStorage.removeItem('nombre')
    localStorage.removeItem('apellido')
    localStorage.removeItem('correo')
    // Forzar recarga completa para resetear todos los componentes y el estado de Google Sign-In
    window.location.href = '/login?logout=true'
  }

  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f4f7fa'
      }}>
        <p style={{ fontSize: 18, color: '#666' }}>Cargando...</p>
      </div>
    )
  }

  const roleColor = user.id_rol === '1' || user.id_rol === 1 ? '#EF4444' : '#3B82F6'
  const roleIcon = user.id_rol === '1' || user.id_rol === 1 ? '👑' : '👤'

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      {/* Header */}
      <div style={{
        width: '100%',
        maxWidth: '800px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '40px'
      }}>
        <h1 style={{
          color: '#fff',
          margin: 0,
          fontSize: 32,
          fontWeight: '700'
        }}>
          UNL Cloud Connect
        </h1>
        <button
          onClick={handleLogout}
          style={{
            padding: '10px 24px',
            background: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: 14,
            fontWeight: '600',
            color: '#667eea',
            cursor: 'pointer',
            transition: 'transform 0.2s',
          }}
          onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
        >
          Cerrar Sesión
        </button>
      </div>

      {/* Tarjeta Principal */}
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '48px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        maxWidth: '600px',
        width: '100%'
      }}>
        {/* Avatar */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '32px'
        }}>
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 48,
            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)'
          }}>
            {roleIcon}
          </div>
        </div>

        {/* Bienvenida */}
        <h2 style={{
          textAlign: 'center',
          color: '#0F172A',
          fontSize: 28,
          fontWeight: '700',
          margin: '0 0 8px 0'
        }}>
          ¡Bienvenido, {user.nombre}!
        </h2>
        <p style={{
          textAlign: 'center',
          color: '#64748B',
          fontSize: 14,
          margin: '0 0 32px 0'
        }}>
          Has iniciado sesión correctamente
        </p>

        {/* Información del Usuario */}
        <div style={{
          background: '#F8FAFC',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '32px'
        }}>
          {/* Nombre Completo */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: 12,
              fontWeight: '600',
              color: '#64748B',
              marginBottom: '6px',
              textTransform: 'uppercase'
            }}>
              Nombre Completo
            </label>
            <p style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#0F172A',
              margin: 0
            }}>
              {user.nombre} {user.apellido}
            </p>
          </div>

          {/* Correo */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: 12,
              fontWeight: '600',
              color: '#64748B',
              marginBottom: '6px',
              textTransform: 'uppercase'
            }}>
              Correo Institucional
            </label>
            <p style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#0F172A',
              margin: 0,
              wordBreak: 'break-all'
            }}>
              {user.correo}
            </p>
          </div>

          {/* Rol */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 12,
              fontWeight: '600',
              color: '#64748B',
              marginBottom: '6px',
              textTransform: 'uppercase'
            }}>
              Rol en el Sistema
            </label>
            <div style={{
              display: 'inline-block',
              background: roleColor,
              color: '#fff',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: 14,
              fontWeight: '600'
            }}>
              {user.rol}
            </div>
          </div>
        </div>

        {/* Mensaje de Estatus */}
        <div style={{
          background: '#DBEAFE',
          border: '1px solid #BFDBFE',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <p style={{
            color: '#1E40AF',
            fontSize: 14,
            margin: 0,
            fontWeight: '500'
          }}>
            ✅ Sesión iniciada correctamente
          </p>
        </div>
      </div>

      {/* Footer */}
      <p style={{
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        marginTop: '40px'
      }}>
        © 2026 UNL Cloud Connect - Todos los derechos reservados
      </p>
    </div>
  )
}
