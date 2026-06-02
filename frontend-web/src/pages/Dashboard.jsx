import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUsers, updateUser, deleteUser, register } from '../services/api'

// --- Iconos SVG Básicos ---
const IconDashboard = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
const IconUsers = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
const IconEvents = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
const IconSensors = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>
const IconSettings = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
const IconLogOut = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
const IconDelete = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
const IconEdit = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
const IconAdd = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
const IconCheck = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
const IconError = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
const IconInfo = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
const IconActivity = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
const IconClock = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('Usuarios')
  const navigate = useNavigate()

  // Gestión de Usuarios State
  const [usuarios, setUsuarios] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Notifications State
  const [notifications, setNotifications] = useState([])

  const addNotification = (type, title, message) => {
    const id = Date.now() + Math.random()
    setNotifications(prev => [...prev, { id, type, title, message }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 5000)
  }

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create') // 'create' | 'edit'
  const [formData, setFormData] = useState({
    id_usuario: '',
    nombre: '',
    apellido: '',
    correo: '',
    clave: '',
    id_rol: 2
  })
  const [modalSaving, setModalSaving] = useState(false)
  const [modalError, setModalError] = useState('')

  useEffect(() => {
    const nombre = localStorage.getItem('nombre')
    const apellido = localStorage.getItem('apellido')
    const correo = localStorage.getItem('correo')
    const id_rol = localStorage.getItem('id_rol')
    const token = localStorage.getItem('access_token')

    if (!token) {
      navigate('/login')
      return
    }

    setUser({
      nombre: nombre || 'Usuario',
      apellido: apellido || '',
      correo: correo || '',
      id_rol: String(id_rol)
    })

    if (String(id_rol) === '1') {
      fetchUsuarios()
    }

    const timer = setTimeout(() => {
      addNotification('info', 'SISTEMA LISTO', `Bienvenido al panel, ${nombre}.`)
    }, 500)

    return () => clearTimeout(timer)
  }, [navigate])

  const fetchUsuarios = async () => {
    setLoadingUsers(true)
    setErrorMsg('')
    try {
      const res = await getUsers()
      setUsuarios(res.data)
    } catch (err) {
      setErrorMsg('No se pudieron cargar los usuarios. Verifica tus permisos.')
      addNotification('error', 'ERROR DE CONEXIÓN', 'No se pudieron sincronizar los usuarios.')
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    window.location.href = '/login?logout=true'
  }

  const handleDeleteUser = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este usuario de forma permanente?')) {
      try {
        await deleteUser(id)
        setUsuarios(usuarios.filter(u => u.id_usuario !== id))
        addNotification('success', 'USUARIO ELIMINADO', `Se ha borrado el usuario #${id} correctamente.`)
      } catch (err) {
        addNotification('error', 'ERROR AL ELIMINAR', err.response?.data?.detail || err.message)
      }
    }
  }

  const handleToggleRole = async (u) => {
    const newRole = u.id_rol === 1 ? 2 : 1
    const roleName = newRole === 1 ? 'Administrador' : 'Participante'
    if (window.confirm(`¿Cambiar rol de ${u.nombre} a ${roleName}?`)) {
      try {
        const res = await updateUser(u.id_usuario, { id_rol: newRole })
        setUsuarios(usuarios.map(user => user.id_usuario === u.id_usuario ? res.data : user))
        addNotification('info', 'ROL ACTUALIZADO', `Ahora ${u.nombre} es ${roleName}.`)
      } catch (err) {
        addNotification('error', 'ERROR AL ACTUALIZAR', err.response?.data?.detail || err.message)
      }
    }
  }

  // ---- Funciones del Modal CRUD ----
  const openCreateModal = () => {
    setModalMode('create')
    setFormData({ id_usuario: '', nombre: '', apellido: '', correo: '', clave: '', id_rol: 2 })
    setModalError('')
    setIsModalOpen(true)
  }

  const openEditModal = (u) => {
    setModalMode('edit')
    setFormData({
      id_usuario: u.id_usuario,
      nombre: u.nombre,
      apellido: u.apellido,
      correo: u.correo, // Solo lectura en edición
      clave: '', // No mostramos ni editamos la clave aquí por seguridad
      id_rol: u.id_rol
    })
    setModalError('')
    setIsModalOpen(true)
  }

  const handleModalSubmit = async (e) => {
    e.preventDefault()
    setModalSaving(true)
    setModalError('')
    try {
      if (modalMode === 'create') {
        const payload = {
          nombre: formData.nombre,
          apellido: formData.apellido,
          correo: formData.correo.trim().toLowerCase(),
          clave: formData.clave,
          id_rol: Number(formData.id_rol)
        }
        await register(payload) // Usamos el endpoint de registro existente
        await fetchUsuarios() // Recargamos lista completa
        addNotification('success', 'REGISTRO EXITOSO', `El usuario ${payload.nombre} fue creado correctamente.`)
      } else {
        const payload = {
          nombre: formData.nombre,
          apellido: formData.apellido,
          id_rol: Number(formData.id_rol)
        }
        const res = await updateUser(formData.id_usuario, payload)
        // Actualizar localmente la lista para no tener que recargar todo
        setUsuarios(usuarios.map(u => u.id_usuario === formData.id_usuario ? res.data : u))
        addNotification('info', 'ACTUALIZACIÓN EXITOSA', `Datos de ${payload.nombre} guardados.`)
      }
      setIsModalOpen(false)
    } catch (err) {
      let msg = err.response?.data?.detail || err.message
      if (typeof msg === 'object') msg = JSON.stringify(msg)
      setModalError('Error: ' + msg)
    } finally {
      setModalSaving(false)
    }
  }

  if (!user) return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Cargando...</div>

  const isAdmin = user.id_rol === '1'

  // Opciones del menú lateral
  const menuItems = isAdmin ? [
    { id: 'Dashboard', icon: <IconDashboard />, label: 'DASHBOARD' },
    { id: 'Usuarios', icon: <IconUsers />, label: 'GESTIÓN DE USUARIOS', badge: usuarios.length },
    { id: 'Eventos', icon: <IconEvents />, label: 'EVENTOS UNL', badge: 3 },
    { id: 'Sensores', icon: <IconSensors />, label: 'SENSORES IOT', labelRight: 'ESTABLE' },
    { id: 'Configuracion', icon: <IconSettings />, label: 'CONFIGURACIÓN' },
  ] : [
    { id: 'Dashboard', icon: <IconDashboard />, label: 'MI DASHBOARD', badge: 'PIONERO' },
    { id: 'Eventos', icon: <IconEvents />, label: 'MIS EVENTOS', badge: 2 },
    { id: 'Sensores', icon: <IconSensors />, label: 'SENSOR IOT', labelRight: 'VIRTUAL' },
    { id: 'Clima', icon: <IconSettings />, label: 'MÉTRICAS CLIMA' },
    { id: 'Perfil', icon: <IconUsers />, label: 'MI PERFIL' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>

      {/* NOTIFICACIONES TOAST */}
      <div style={{ position: 'fixed', right: '32px', bottom: '32px', display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 9999 }}>
        {notifications.map(n => (
          <div key={n.id} style={{
            background: '#ffffff',
            borderLeft: `4px solid ${n.type === 'success' ? '#10b981' : n.type === 'error' ? '#ef4444' : '#3b82f6'}`,
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
            borderRadius: '4px',
            padding: '16px 20px',
            width: '340px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            transition: 'all 0.3s'
          }}>
            <div style={{ color: n.type === 'success' ? '#10b981' : n.type === 'error' ? '#ef4444' : '#3b82f6', marginTop: '2px' }}>
              {n.type === 'success' ? <IconCheck /> : n.type === 'error' ? <IconError /> : <IconInfo />}
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: '800', letterSpacing: '0.5px', color: n.type === 'success' ? '#10b981' : n.type === 'error' ? '#ef4444' : '#3b82f6', textTransform: 'uppercase' }}>
                {n.title}
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#0f172a', fontWeight: '600' }}>{n.message}</p>
            </div>
            <button onClick={() => setNotifications(prev => prev.filter(nt => nt.id !== n.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '16px', lineHeight: 1 }}>&times;</button>
          </div>
        ))}
      </div>

      {/* SIDEBAR IZQUIERDO */}
      <aside style={{ width: '280px', background: '#ffffff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>

        {/* LOGO AREA */}
        <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ width: '40px', height: '40px', background: '#1e3a8a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.5px' }}>UNLCONNECT</h1>
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', letterSpacing: '1px' }}>{isAdmin ? 'CONSOLE ADMIN' : 'CONSOLE PARTICIPANTE'}</span>
          </div>
        </div>

        {/* USER PROFILE */}
        <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #1e40af, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '20px', fontWeight: '700' }}>
              {user.nombre.charAt(0)}
            </div>
            <div style={{ position: 'absolute', bottom: '0', right: '0', width: '12px', height: '12px', background: '#10b981', border: '2px solid #fff', borderRadius: '50%' }}></div>
          </div>
          <div>
            <h2 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: '700', color: '#0f172a', textTransform: 'uppercase' }}>{user.nombre} {user.apellido}</h2>
            <span style={{ fontSize: '10px', fontWeight: '600', color: '#64748b', letterSpacing: '0.5px' }}>{isAdmin ? 'ADMINISTRADOR' : 'PARTICIPANTE UNL'}</span>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav style={{ padding: '24px 16px', flex: 1 }}>
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px', marginBottom: '8px',
                background: activeTab === item.id ? '#1e40af' : 'transparent',
                color: activeTab === item.id ? '#ffffff' : '#475569',
                border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.2s ease', fontWeight: '600', fontSize: '13px'
              }}
            >
              <div style={{ color: activeTab === item.id ? '#ffffff' : '#64748b' }}>{item.icon}</div>
              <span style={{ flex: 1 }}>{item.label}</span>

              {item.badge > 0 && (
                <span style={{ background: activeTab === item.id ? 'rgba(255,255,255,0.2)' : '#e2e8f0', color: activeTab === item.id ? '#fff' : '#475569', padding: '2px 8px', borderRadius: '12px', fontSize: '11px' }}>
                  {item.badge}
                </span>
              )}
              {item.labelRight && (
                <span style={{ fontSize: '9px', fontWeight: '700', color: '#10b981', border: '1px solid #10b981', padding: '2px 6px', borderRadius: '4px' }}>
                  {item.labelRight}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* THEME / CONSOLE TOGGLE (Participant only) */}
        {!isAdmin && (
          <div style={{ padding: '24px', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', letterSpacing: '1px', marginBottom: '8px' }}>PERSONALIZACIÓN DE TEMA</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button style={{ padding: '8px', background: '#e0f2fe', border: '1px solid #0284c7', color: '#0284c7', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>☼ CLARO</button>
                <button style={{ padding: '8px', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>☾ OSCURO</button>
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM CONTROLS */}
        <div style={{ padding: '24px', borderTop: '1px solid #f1f5f9', background: '#f8fafc' }}>
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

      {/* CONTENIDO PRINCIPAL */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* TOP HEADER BAR */}
        <header style={{ height: '80px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: '#dbeafe', color: '#1e40af', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', letterSpacing: '1px' }}>
              DASHBOARD VIEW
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: '#475569', letterSpacing: '0.5px' }}>
              <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></div>
              RED CENTRAL UNL INTEGRADA
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>CLIMA UNL LOJA</div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>15.2°C <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '600' }}>estable</span></div>
            </div>
            <div style={{ width: '1px', height: '30px', background: '#e2e8f0' }}></div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>ESTADO SERVIDOR</div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>SINCRONIZADO</div>
            </div>
          </div>
        </header>

        {/* SCROLLABLE CONTENT */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>

          {/* KPI CARDS Y GRAFICOS (ADMIN DASHBOARD) */}
          {isAdmin && activeTab === 'Dashboard' && (
            <>
              {/* KPI CARDS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '24px' }}>
                <div style={{ background: '#ffffff', padding: '24px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', letterSpacing: '0.5px' }}>EVENTOS TOTALES</span>
                    <IconEvents />
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: '900', color: '#1e40af', marginBottom: '16px' }}>1286</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>
                    <span>Sincronizados en campus</span>
                    <span style={{ color: '#1e40af' }}>+12% este mes</span>
                  </div>
                </div>

                <div style={{ background: '#ffffff', padding: '24px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', letterSpacing: '0.5px' }}>EVENTOS ACTIVOS</span>
                    <IconActivity />
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: '900', color: '#1e40af', marginBottom: '16px' }}>42</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>
                    <span>Transmitiendo microdatos</span>
                    <span style={{ color: '#10b981' }}>En Tiempo Real</span>
                  </div>
                </div>

                <div style={{ background: '#ffffff', padding: '24px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', letterSpacing: '0.5px' }}>SENSORS EN LÍNEA</span>
                    <IconSensors />
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: '900', color: '#1e40af', marginBottom: '16px' }}>942</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>
                    <span>Nodos MESH activos</span>
                    <span style={{ color: '#1e40af' }}>98.2% Uptime</span>
                  </div>
                </div>

                <div style={{ background: '#ffffff', padding: '24px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', letterSpacing: '0.5px' }}>ESTUDIANTES UNL</span>
                    <IconUsers />
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: '900', color: '#1e40af', marginBottom: '16px' }}>{usuarios.length > 0 ? usuarios.length : '15,402'}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>
                    <span>Usuarios Registrados</span>
                    <span style={{ color: '#1e40af' }}>Acreditados</span>
                  </div>
                </div>
              </div>

              {/* GRÁFICOS Y SISTEMA */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
                {/* BARRAS DE FRECUENCIA CLIMÁTICA */}
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '32px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', fontStyle: 'italic', color: '#0f172a' }}>FRECUENCIA CLIMÁTICA UNL</h3>
                      <div style={{ fontSize: '10px', fontWeight: '800', color: '#1e40af', letterSpacing: '1px' }}>TELEMETRÍA DE RED MESH DE SENSORS</div>
                    </div>
                    <div style={{ display: 'flex', border: '1px solid #e2e8f0' }}>
                      <button style={{ padding: '6px 16px', background: '#0f172a', color: '#fff', fontSize: '10px', fontWeight: '700', border: 'none', cursor: 'pointer' }}>DÍA</button>
                      <button style={{ padding: '6px 16px', background: '#fff', color: '#475569', fontSize: '10px', fontWeight: '700', border: 'none', cursor: 'pointer' }}>SEMANA</button>
                    </div>
                  </div>
                  <div style={{ height: '240px', display: 'flex', alignItems: 'flex-end', gap: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '20px' }}>
                    {[50, 60, 70, 80, 90, 85, 80, 70, 75, 50, 40, 50, 55, 65, 85].map((val, i) => (
                      <div key={i} style={{ flex: 1, background: i === 14 ? '#0f172a' : i === 10 ? '#cbd5e1' : '#e2e8f0', height: `${val}%`, position: 'relative' }}>
                        <span style={{ position: 'absolute', bottom: '-20px', left: '50%', transform: 'translateX(-50%)', fontSize: '9px', fontWeight: '700', color: '#64748b' }}>
                          {6 + i}:00
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ACTIVIDAD DEL SISTEMA */}
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '32px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <IconClock />
                      <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: '#0f172a' }}>ACTIVIDAD DEL SISTEMA</h3>
                    </div>
                    <div style={{ fontSize: '9px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px' }}>SINCRONIZACIÓN EN TIEMPO REAL</div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: '800', color: '#0f172a', marginBottom: '2px' }}>TEMPERATURA ELEVADA EN LAB 304</div>
                      <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>HACE 2 MIN <span style={{ color: '#1e40af' }}>• NODO FF422</span></div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: '800', color: '#0f172a', marginBottom: '2px' }}>NUEVA CURADURÍA APPROVED</div>
                      <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>HACE 15 MIN <span style={{ color: '#1e40af' }}>• @elisa_s</span></div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: '800', color: '#0f172a', marginBottom: '2px' }}>PUSH DE FIRMWARE A GATEWAY-NORTH</div>
                      <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>HACE 1 HORA <span style={{ color: '#1e40af' }}>• System_v4</span></div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: '800', color: '#0f172a', marginBottom: '2px' }}>SEMINARIO IOT: 650 LOGINS</div>
                      <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>HACE 3 HORAS <span style={{ color: '#1e40af' }}>• Event_042</span></div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: '800', color: '#0f172a', marginBottom: '2px' }}>SENSOR 12B EN ESTADO STAND-BY</div>
                      <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>HACE 5 HORAS <span style={{ color: '#1e40af' }}>• Maintenance</span></div>
                    </div>
                  </div>

                  <button style={{ width: '100%', marginTop: '24px', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '10px', fontWeight: '800', color: '#0f172a', letterSpacing: '1px', cursor: 'pointer' }}>
                    VERIFICAR SERVIDORES IOT
                  </button>
                </div>
              </div>

              {/* MAPA Y SERVIDORES */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                {/* TOPOLOGÍA DE SENSORS */}
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '32px' }}>
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: '#0f172a' }}>TOPOLOGÍA DE SENSORS UNL (MAPA CONCEPTUAL)</h3>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500', marginTop: '4px' }}>Representación gráfica del campus de Loja y la central de recepción de tramas atmosféricas.</div>
                  </div>
                  <div style={{ background: '#f1f5f9', height: '120px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 20px', border: '1px solid #e2e8f0' }}>
                    <div style={{ padding: '6px 12px', background: '#64748b', color: '#fff', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}><div style={{ width: 6, height: 6, background: '#10b981', borderRadius: '50%' }}></div> Campus Físico (Central)</div>
                    <div style={{ padding: '6px 12px', background: '#64748b', color: '#fff', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}><div style={{ width: 6, height: 6, background: '#10b981', borderRadius: '50%' }}></div> SENSOR Norte 002</div>
                    <div style={{ padding: '6px 12px', background: '#64748b', color: '#fff', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}><div style={{ width: 6, height: 6, background: '#10b981', borderRadius: '50%' }}></div> Centro Ambiental</div>
                    <div style={{ padding: '6px 12px', background: '#64748b', color: '#fff', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}><div style={{ width: 6, height: 6, background: '#10b981', borderRadius: '50%' }}></div> Clínica Educativa</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontSize: '10px', fontWeight: '700', color: '#94a3b8', letterSpacing: '1px' }}>
                    <span>CONEXIÓN: CLÚSTER UNL LOJA</span>
                    <span style={{ color: '#1e40af', cursor: 'pointer' }}>[EXPANDIR MAPA]</span>
                  </div>
                </div>

                {/* METATRAMA DE SERVIDORES */}
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '32px' }}>
                  <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: '#0f172a' }}>METATRAMA DE SERVIDORES</h3>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500', marginTop: '4px' }}>Espacio total de las imágenes y telemetría de estudiantes.</div>
                  </div>

                  <div style={{ marginBottom: '40px' }}>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', letterSpacing: '1px', marginBottom: '8px' }}>ALMACENAMIENTO DE RECURSOS</div>
                    <div style={{ width: '100%', height: '8px', background: '#e2e8f0', display: 'flex' }}>
                      <div style={{ width: '70%', background: '#0f172a' }}></div>
                      <div style={{ width: '15%', background: '#1e40af' }}></div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', letterSpacing: '1px' }}>LATENCIA BASE API:</span>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#1e40af' }}>24 ms</span>
                  </div>

                  <div style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.5px' }}>REPOSITORIO EN LÍNEA CONFIRMADO</div>
                </div>
              </div>
            </>
          )}

          {/* PARTICIPANT DASHBOARD VIEW */}
          {!isAdmin && activeTab === 'Dashboard' && (
            <>
              {/* KPI CARDS PARTICIPANT */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
                <div style={{ background: '#ffffff', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px' }}>MI IMPACTO RED</span>
                    <IconDashboard />
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: '800', color: '#1e40af', marginBottom: '16px' }}>8.4k</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '600', color: '#94a3b8' }}>
                    <span>APORTES AL ECOSISTE...</span>
                    <span style={{ color: '#1e40af' }}>ACREDITADO</span>
                  </div>
                </div>

                <div style={{ background: '#ffffff', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px' }}>APORTES DE SENSOR</span>
                    <IconEvents />
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: '800', color: '#1e40af', marginBottom: '16px' }}>142 fotos</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '600', color: '#94a3b8' }}>
                    <span>SINTONIZADO AL CAMP...</span>
                    <span style={{ color: '#1e40af' }}>COMPLETADO</span>
                  </div>
                </div>

                <div style={{ background: '#ffffff', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px' }}>ESTADO DEL SENSOR</span>
                    <IconSensors />
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: '800', color: '#1e40af', marginBottom: '16px' }}>ONLINE</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '600', color: '#94a3b8' }}>
                    <span style={{ textTransform: 'uppercase' }}>node-04-Luna</span>
                    <span style={{ color: '#1e40af' }}>4 ENVÍOS</span>
                  </div>
                </div>

                <div style={{ background: '#ffffff', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px' }}>IDENTIDAD UNL</span>
                    <IconUsers />
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: '800', color: '#1e40af', marginBottom: '16px' }}>Pionero</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '600', color: '#94a3b8' }}>
                    <span>NIVEL/ROL VERIFICADO</span>
                    <span style={{ color: '#1e40af' }}>VALIDADO</span>
                  </div>
                </div>
              </div>

              {/* PARTICIPANT CONTENT (SENSORS + ACREDITADA) */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>

                {/* SENSORS DE EVENTOS ACTIVAS */}
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '32px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900', fontStyle: 'italic', color: '#0f172a' }}>SENSORS DE EVENTOS ACTIVAS</h3>
                    <div style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '50%' }}></div>
                  </div>
                  <div style={{ fontSize: '10px', fontWeight: '800', color: '#1e40af', letterSpacing: '1px', marginBottom: '24px' }}>PARTICIPANDO EN LA RED CENTRAL DE TRAMAS IOT - LOJA</div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '12px', fontSize: '10px', fontWeight: '700', color: '#94a3b8', letterSpacing: '1px' }}>SENSOR / EVENTO</th>
                        <th style={{ padding: '12px', fontSize: '10px', fontWeight: '700', color: '#94a3b8', letterSpacing: '1px' }}>UBICACIÓN</th>
                        <th style={{ padding: '12px', fontSize: '10px', fontWeight: '700', color: '#94a3b8', letterSpacing: '1px' }}>CATEGORÍA</th>
                        <th style={{ padding: '12px', fontSize: '10px', fontWeight: '700', color: '#94a3b8', letterSpacing: '1px' }}>FECHA</th>
                        <th style={{ padding: '12px', fontSize: '10px', fontWeight: '700', color: '#94a3b8', letterSpacing: '1px', textAlign: 'right' }}>AFLUENCIA</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '16px 12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '32px', height: '32px', background: '#0f172a' }}></div>
                          <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', maxWidth: '180px' }}>FESTIVAL INTERNACIONAL DE ARTES VIVAS (FIAVL)</div>
                        </td>
                        <td style={{ padding: '16px 12px', fontSize: '10px', color: '#94a3b8', fontWeight: '600' }}>CENTRO HISTÓRICO...</td>
                        <td style={{ padding: '16px 12px' }}><span style={{ background: '#dbeafe', color: '#1e40af', padding: '4px 8px', fontSize: '10px', fontWeight: '700', border: '1px solid #bfdbfe' }}>FESTIVAL</span></td>
                        <td style={{ padding: '16px 12px', fontSize: '11px', color: '#475569', fontWeight: '600', fontFamily: 'monospace' }}>2026-11-15</td>
                        <td style={{ padding: '16px 12px', fontSize: '13px', color: '#1e40af', fontWeight: '800', textAlign: 'right' }}>1540</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '16px 12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '32px', height: '32px', background: '#0f172a' }}></div>
                          <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', maxWidth: '180px' }}>197 FERIA DE LOJA</div>
                        </td>
                        <td style={{ padding: '16px 12px', fontSize: '10px', color: '#94a3b8', fontWeight: '600' }}>COMPLEJO FERIAL ...</td>
                        <td style={{ padding: '16px 12px' }}><span style={{ background: '#dbeafe', color: '#1e40af', padding: '4px 8px', fontSize: '10px', fontWeight: '700', border: '1px solid #bfdbfe' }}>FAIR</span></td>
                        <td style={{ padding: '16px 12px', fontSize: '11px', color: '#475569', fontWeight: '600', fontFamily: 'monospace' }}>2026-09-01</td>
                        <td style={{ padding: '16px 12px', fontSize: '13px', color: '#1e40af', fontWeight: '800', textAlign: 'right' }}>3200</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* MI SENSOR UNL ACREDITADA */}
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '32px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <IconDashboard />
                      <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: '#0f172a' }}>MI SENSOR UNL ACREDITADA</h3>
                    </div>
                    <div style={{ fontSize: '9px', fontWeight: '600', color: '#64748b', letterSpacing: '0.5px' }}>CREDENCIALES DIGITALES DE INVESTIGADOR</div>
                  </div>

                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '24px', flex: 1, position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%' }}></div>
                        <span style={{ fontSize: '10px', fontWeight: '800', color: '#1e40af', letterSpacing: '1px' }}>ENLACE ACTIVO</span>
                      </div>
                      <IconSettings />
                    </div>

                    <div style={{ fontSize: '24px', fontWeight: '900', fontStyle: 'italic', color: '#1e40af', marginBottom: '24px', textTransform: 'uppercase' }}>{user.nombre} {user.apellido}</div>

                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                        <span style={{ color: '#94a3b8', fontWeight: '700', letterSpacing: '0.5px' }}>IDENTIFICADOR SENSOR</span>
                        <span style={{ color: '#1e40af', fontWeight: '700', fontFamily: 'monospace' }}>node-04-Luna</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                        <span style={{ color: '#94a3b8', fontWeight: '700', letterSpacing: '0.5px' }}>ROL EN LA RED</span>
                        <span style={{ color: '#0f172a', fontWeight: '700', fontFamily: 'monospace' }}>Contribuyente de Sensor v4</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                        <span style={{ color: '#94a3b8', fontWeight: '700', letterSpacing: '0.5px' }}>MÉRITO ACADÉMICO</span>
                        <span style={{ color: '#f59e0b', fontWeight: '800', textTransform: 'uppercase' }}>Pionero</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                        <span style={{ color: '#94a3b8', fontWeight: '700', letterSpacing: '0.5px' }}>FIRMA DIGITAL</span>
                        <span style={{ color: '#10b981', fontWeight: '800', textTransform: 'uppercase' }}>VALIDADO</span>
                      </div>
                    </div>

                    <div style={{ marginTop: '32px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <IconSensors /> ESTACIÓN 98%
                      </div>
                      <div style={{ fontSize: '10px', fontWeight: '800', color: '#1e40af', letterSpacing: '0.5px' }}>UNL IOT SENSORS</div>
                    </div>
                  </div>
                </div>

              </div>
            </>
          )}

          {/* MAIN CONTENT AREA - CONDITIONAL RENDERING BASED ON TAB */}
          {activeTab === 'Usuarios' && isAdmin && (
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
              <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '800', color: '#0f172a', fontStyle: 'italic' }}>DIRECTORIO DE USUARIOS UNL</h3>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Control de Accesos y Privilegios</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={openCreateModal} style={{ padding: '8px 16px', background: '#1e40af', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <IconAdd /> Agregar Usuario
                  </button>
                  <button onClick={() => { fetchUsuarios(); addNotification('info', 'ACTUALIZANDO DATOS', 'Obteniendo la lista más reciente de usuarios.'); }} style={{ padding: '8px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}>
                    {loadingUsers ? '...' : 'Recargar'}
                  </button>
                </div>
              </div>

              {errorMsg ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>{errorMsg}</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px' }}>ID</th>
                        <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px' }}>USUARIO</th>
                        <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px' }}>CORREO INSTITUCIONAL</th>
                        <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px' }}>ROL ASIGNADO</th>
                        <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px', textAlign: 'right' }}>ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuarios.map((u) => (
                        <tr key={u.id_usuario} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#f8fafc'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>#{u.id_usuario}</td>
                          <td style={{ padding: '16px 24px' }}>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{u.nombre} {u.apellido}</div>
                          </td>
                          <td style={{ padding: '16px 24px', fontSize: '13px', color: '#475569', fontWeight: '500' }}>{u.correo}</td>
                          <td style={{ padding: '16px 24px' }}>
                            <span style={{
                              padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px',
                              background: u.id_rol === 1 ? '#fee2e2' : '#e0e7ff',
                              color: u.id_rol === 1 ? '#ef4444' : '#4338ca'
                            }}>
                              {u.id_rol === 1 ? 'ADMINISTRADOR' : 'PARTICIPANTE'}
                            </span>
                          </td>
                          <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => openEditModal(u)}
                                style={{ padding: '6px', background: '#e0f2fe', border: 'none', borderRadius: '4px', color: '#0284c7', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                title="Editar Usuario"
                              >
                                <IconEdit />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id_usuario)}
                                style={{ padding: '6px', background: '#fee2e2', border: 'none', borderRadius: '4px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                title="Eliminar Usuario"
                              >
                                <IconDelete />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {usuarios.length === 0 && !loadingUsers && (
                        <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No se encontraron usuarios</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* FALLBACK FOR OTHER TABS */}
          {((isAdmin && activeTab !== 'Usuarios') || (!isAdmin && activeTab !== 'Dashboard')) && (
            <div style={{ background: '#ffffff', padding: '60px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚧</div>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>Módulo en Construcción</h2>
              <p style={{ margin: 0, color: '#64748b' }}>La sección de {menuItems.find(i => i.id === activeTab)?.label || 'seleccionada'} estará disponible próximamente.</p>
            </div>
          )}

          {/* FOOTER */}
          <div style={{ marginTop: '40px', borderTop: '1px solid #e2e8f0', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '700', color: '#94a3b8', letterSpacing: '1px' }}>
            <div>CONSOLA CENTRALIZADA UNIVERSIDAD NACIONAL DE LOJA / HANDSHAKE 04.</div>
            <div>METODOLOGÍA: KANBAN + XP <span style={{ margin: '0 8px' }}>|</span> STACK: PY / RJS / IOT ESP32</div>
          </div>

        </div>
      </main>

      {/* MODAL CRUD (Flotante) */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '400px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>

            <div style={{ background: '#f8fafc', padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                {modalMode === 'create' ? 'Agregar Nuevo Usuario' : 'Editar Usuario'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>&times;</button>
            </div>

            <div style={{ padding: '24px' }}>
              {modalError && (
                <div style={{ background: '#fee2e2', color: '#ef4444', padding: '10px', borderRadius: '6px', fontSize: '12px', marginBottom: '16px' }}>
                  {modalError}
                </div>
              )}

              <form onSubmit={handleModalSubmit}>
                <div style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Nombre</label>
                    <input required type="text" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Apellido</label>
                    <input required type="text" value={formData.apellido} onChange={e => setFormData({ ...formData, apellido: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }} />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Correo Institucional</label>
                  <input
                    required
                    type="email"
                    disabled={modalMode === 'edit'}
                    value={formData.correo}
                    onChange={e => setFormData({ ...formData, correo: e.target.value })}
                    placeholder="usuario@unl.edu.ec"
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', background: modalMode === 'edit' ? '#f1f5f9' : '#fff' }}
                  />
                </div>

                {modalMode === 'create' && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Contraseña</label>
                    <input required minLength={8} type="password" value={formData.clave} onChange={e => setFormData({ ...formData, clave: e.target.value })} placeholder="Mínimo 8 caracteres" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }} />
                  </div>
                )}

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Rol Asignado</label>
                  <select value={formData.id_rol} onChange={e => setFormData({ ...formData, id_rol: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', background: '#fff' }}>
                    <option value={2}>Participante (Estándar)</option>
                    <option value={1}>Administrador (Control Total)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 16px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}>
                    Cancelar
                  </button>
                  <button type="submit" disabled={modalSaving} style={{ padding: '10px 16px', background: '#1e40af', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', color: '#fff', cursor: modalSaving ? 'not-allowed' : 'pointer', opacity: modalSaving ? 0.7 : 1 }}>
                    {modalSaving ? 'Guardando...' : 'Guardar Usuario'}
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
