import React from 'react'
import { useNavigate } from 'react-router-dom'

const IconDashboard = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
const IconUsers = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
const IconEvents = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
const IconSensors = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>
const IconSettings = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
const IconLogOut = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>

export default function AppSidebar() {
  const navigate = useNavigate()

  const nombre = localStorage.getItem('nombre') || 'Usuario'
  const apellido = localStorage.getItem('apellido') || ''
  const id_rol = String(localStorage.getItem('id_rol') || '2')
  const isAdmin = id_rol === '1'

  const menuItems = isAdmin ? [
    { id: 'Dashboard', icon: <IconDashboard />, label: 'DASHBOARD' },
    { id: 'Usuarios', icon: <IconUsers />, label: 'GESTIÓN DE USUARIOS', badge: 0 },
    { id: 'Eventos', icon: <IconEvents />, label: 'EVENTOS UNL', badge: 0, path: '/events' },
    { id: 'Sensores', icon: <IconSensors />, label: 'SENSORES IOT', labelRight: 'ESTABLE' },
    { id: 'Configuracion', icon: <IconSettings />, label: 'CONFIGURACIÓN' },
    { id: 'Perfil', icon: <IconUsers />, label: 'MI PERFIL' },
  ] : [
    { id: 'Dashboard', icon: <IconDashboard />, label: 'MI DASHBOARD', badge: 'PIONERO' },
    { id: 'Eventos', icon: <IconEvents />, label: 'MIS EVENTOS', badge: 0, path: '/events' },
    { id: 'Sensores', icon: <IconSensors />, label: 'SENSOR IOT', labelRight: 'VIRTUAL' },
    { id: 'Clima', icon: <IconSettings />, label: 'MÉTRICAS CLIMA' },
    { id: 'Perfil', icon: <IconUsers />, label: 'MI PERFIL' },
  ]

  const handleLogout = () => {
    localStorage.clear()
    window.location.href = '/login?logout=true'
  }

  return (
    <aside style={{ width: '280px', background: 'var(--bg-card)', borderRight: '1px solid #DBE3E0', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ width: '40px', height: '40px', background: '#0F766E', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>UNL-CLOUD-CONNECT</h1>
          <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '1px' }}>{isAdmin ? 'CONSOLE ADMIN' : 'CONSOLE PARTICIPANTE'}</span>
        </div>
      </div>

      <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #0F766E, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-inverse)', fontSize: '20px', fontWeight: '700' }}>
            {nombre.charAt(0)}
          </div>
          <div style={{ position: 'absolute', bottom: '0', right: '0', width: '12px', height: '12px', background: '#10b981', border: '2px solid #fff', borderRadius: '50%' }}></div>
        </div>
        <div>
          <h2 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', textTransform: 'uppercase' }}>{nombre} {apellido}</h2>
          <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>{isAdmin ? 'ADMINISTRADOR' : 'PARTICIPANTE UNL'}</span>
        </div>
      </div>

      <nav style={{ padding: '24px 16px', flex: 1 }}>
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => item.path ? navigate(item.path) : null}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px', marginBottom: '8px', background: 'transparent', color: 'var(--text-muted)', border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease', fontWeight: '600', fontSize: '13px' }}
          >
            <div style={{ color: 'var(--text-muted)' }}>{item.icon}</div>
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge > 0 && (
              <span style={{ background: 'var(--border)', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px' }}>{item.badge}</span>
            )}
          </button>
        ))}
      </nav>

      <div style={{ padding: '24px', borderTop: '1px solid #f1f5f9', background: 'var(--bg-app)' }}>
        <button
          onClick={handleLogout}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: 'transparent', border: '1px solid #fca5a5', borderRadius: '8px', color: '#ef4444', fontWeight: '600', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseOver={(e) => e.target.style.background = '#fee2e2'}
          onMouseOut={(e) => e.target.style.background = 'transparent'}
        >
          <IconLogOut /> CERRAR SESIÓN
        </button>
      </div>
    </aside>
  )
}
