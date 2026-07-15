import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { getUsers, updateUser, deleteUser, register, updateMe, getAuditoria } from '../services/api'
import { listarSensores, obtenerClimaActual } from '../services/climaService'
import { listarUbicaciones } from '../services/ubicacionService'
import { getEventos, getUbicaciones } from '../components/dashboard/events/eventService'
import toast from 'react-hot-toast'

import Events from '../components/dashboard/events/Events'
import Sensors from '../components/dashboard/sensors/Sensors'
import Ubicacion from '../components/dashboard/ubicacion/Ubicacion'
import Monitoreo from '../components/dashboard/monitoreo/Monitoreo'
import ModerationPanel from '../components/dashboard/moderation/ModerationPanel'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { CloudSun } from 'lucide-react'

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
const IconMap = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
const IconFlag = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
const IconLock = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const getTokenPayload = () => {
    const token = localStorage.getItem('access_token')
    if (!token) return null
    try {
      return JSON.parse(atob(token.split('.')[1]))
    } catch(e) { return null }
  }
  
  const tokenPayload = getTokenPayload()
  const initialIdRol = tokenPayload ? String(tokenPayload.id_rol) : null
  const currentUserId = tokenPayload ? (tokenPayload.id_usuario || tokenPayload.sub) : null
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'claro')
  const [activeTab, setActiveTab] = useState(initialIdRol === '3' ? 'Usuarios' : 'Dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [readNotifIds, setReadNotifIds] = useState(() => {
    const saved = localStorage.getItem(`read_notifications_${currentUserId || 'guest'}`)
    return saved ? JSON.parse(saved) : []
  })
  
  const knownEventIds = useRef(new Set());
  const initialLoadDone = useRef(false);
  
  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem(`read_notifications_${currentUserId}`, JSON.stringify(readNotifIds))
    }
  }, [readNotifIds, currentUserId])
  const navigate = useNavigate()

  const unreadCount = notifications.filter(n => !readNotifIds.includes(n.id)).length
  
  const markAllAsRead = (e) => {
    e.stopPropagation()
    const allIds = notifications.map(n => n.id)
    const newReadIds = [...new Set([...readNotifIds, ...allIds])]
    setReadNotifIds(newReadIds)
  }

  // Gestión de Usuarios State
  const [usuarios, setUsuarios] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Notifications State
  const addNotification = (type, title, message) => {
    toast.custom((t) => (
      <div
        style={{
          background: type === 'success' ? 'rgba(16, 185, 129, 0.95)' : type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(15, 118, 110, 0.95)',
          backdropFilter: 'blur(10px)',
          color: 'white',
          padding: '16px 20px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          opacity: t.visible ? 1 : 0,
          transform: t.visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.9)',
          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          maxWidth: '350px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        <div style={{
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          {type === 'success' && <IconCheck />}
          {type === 'error' && <IconError />}
          {type === 'info' && <IconInfo />}
        </div>
        <div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{title}</h4>
          <p style={{ margin: 0, fontSize: '12px', fontWeight: '500', opacity: 0.9, lineHeight: '1.4' }}>{message}</p>
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          style={{ background: 'transparent', border: 'none', color: 'white', opacity: 0.7, cursor: 'pointer', marginLeft: 'auto', padding: '4px' }}
        >
          ✕
        </button>
      </div>
    ), { duration: 4000, position: 'bottom-right' })
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

  // Perfil State
  const [profileEditMode, setProfileEditMode] = useState(false)
  const [profileData, setProfileData] = useState({ nombre: '', apellido: '', clave: '' })
  const [profileSaving, setProfileSaving] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: '', payload: null, message: '' })

  // Configuración State
  const handleSaveConfig = () => {
    toast.success('Configuración guardada exitosamente')
  }

  const exportEventsToPDF = () => {
    const doc = new jsPDF();
    doc.text('Reporte de Eventos UNL-CLOUD-CONNECT', 14, 15);
    const tableData = eventos.map(e => [
      e.id_evento, e.nombre, e.estado, new Date(e.fecha_hora_inicio).toLocaleDateString()
    ]);
    doc.autoTable({
      head: [['ID', 'Nombre', 'Estado', 'Fecha']],
      body: tableData,
      startY: 25,
    });
    doc.save('reporte_eventos.pdf');
    addNotification('success', 'PDF EXPORTADO', 'El reporte de eventos ha sido generado.');
  };

  const exportUsersToPDF = () => {
    const doc = new jsPDF();
    doc.text('Reporte de Usuarios UNL-CLOUD-CONNECT', 14, 15);
    const tableData = usuarios.map(u => [
      u.id_usuario, `${u.nombre} ${u.apellido}`, u.correo, u.id_rol === 1 ? 'Admin' : u.id_rol === 3 ? 'Superadmin' : 'Participante'
    ]);
    doc.autoTable({
      head: [['ID', 'Nombre', 'Correo', 'Rol']],
      body: tableData,
      startY: 25,
    });
    doc.save('reporte_usuarios.pdf');
    addNotification('success', 'PDF EXPORTADO', 'El reporte de usuarios ha sido generado.');
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  // Weather API State
  const [weatherData, setWeatherData] = useState(null)
  const [loadingWeather, setLoadingWeather] = useState(false)
  const [weatherError, setWeatherError] = useState('')

  // Dashboard real data state
  const [eventos, setEventos] = useState([])
  const [sensores, setSensores] = useState([])
  const [ubicacionesDB, setUbicacionesDB] = useState([])
  const [loadingDashboard, setLoadingDashboard] = useState(false)

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)
    if (seconds < 60) return 'Hace un momento'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`
    const days = Math.floor(hours / 24)
    return `Hace ${days} día${days > 1 ? 's' : ''}`
  }

  const fetchDashboardData = async () => {
    setLoadingDashboard(true)
    try {
      let evts = []
      let sens = []
      let ubi = []
      
      try { evts = await getEventos(); setEventos(evts); } catch (e) { console.error('Error eventos:', e); }
      try { sens = await listarSensores(); setSensores(sens); } catch (e) { console.error('Error sensores:', e); }
      try { ubi = await getUbicaciones(); setUbicacionesDB(ubi); } catch (e) { console.error('Error ubicaciones:', e); }

      let loginAudits = []
      if (initialIdRol === '1' || initialIdRol === '3') {
        try {
          const auditRes = await getAuditoria()
          if (auditRes && auditRes.data) {
            loginAudits = auditRes.data
              .filter(audit => {
                const accion = audit.accion.toLowerCase();
                const isLogin = accion.includes('sesión') || accion.includes('sesion') || accion.includes('login') || accion.includes('ingreso');
                return isLogin && String(audit.id_usuario) === String(currentUserId);
              })
              .map((audit, index) => ({
                id: audit.id_log || `audit-${index}`,
                type: 'success',
                iconType: 'web',
                title: 'Inicio Exitoso',
                message: `Has iniciado sesión correctamente.`,
                time: timeAgo(audit.fecha_hora + 'Z'),
                timestamp: new Date(audit.fecha_hora + 'Z').getTime()
              }))
          }
        } catch (err) {
          console.error("Error al cargar auditoría para notificaciones:", err)
        }
      }

      const now = new Date().getTime();
      const ONE_DAY = 24 * 60 * 60 * 1000;
      
      let newEventsForNotification = [];
      
      evts.forEach(evt => {
        if (!initialLoadDone.current) {
          knownEventIds.current.add(evt.id_evento);
        } else {
          if (!knownEventIds.current.has(evt.id_evento)) {
            knownEventIds.current.add(evt.id_evento);
            const evtTime = new Date(evt.fecha_hora_inicio).getTime();
            if (evtTime > now - ONE_DAY) {
              newEventsForNotification.push(evt);
            }
          }
        }
      });
      
      initialLoadDone.current = true;
      
      const newEventNotifications = newEventsForNotification.map(evt => ({
          id: `evt-${evt.id_evento}`,
          type: 'info',
          iconType: 'web',
          title: 'Evento Registrado',
          message: `Se ha creado un nuevo evento: ${evt.nombre}`,
          time: timeAgo(evt.fecha_hora_inicio),
          timestamp: new Date(evt.fecha_hora_inicio).getTime()
      }));
      
      if (!initialLoadDone.current || newEventNotifications.length > 0) {
        setNotifications(prev => {
          const combined = [...prev, ...newEventNotifications]
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
            .slice(0, 50); // Keep up to 50
          return combined;
        });
      }
      
      // On initial load, just set the login audits
      if (loginAudits.length > 0 && notifications.length === 0) {
        setNotifications(loginAudits);
      }
      
    } catch (err) {
      console.error('Error al cargar datos del dashboard:', err)
    } finally {
      setLoadingDashboard(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'Dashboard') {
      fetchDashboardData()
    }
  }, [activeTab])

  useEffect(() => {
    const fetchWeather = async () => {
      setLoadingWeather(true)
      setWeatherError('')

      try {
        // 1. Intentar obtener datos físicos del ESP32 local primero (IoT Priorizado)
        const localData = await obtenerClimaActual()
        if (localData && localData.temperatura !== undefined) {
          // Verificar qué tan antiguo es el dato
          const fechaDato = new Date(localData.fecha_captura + 'Z') // Asegurar que lo lea como UTC
          const ahora = new Date()
          const diferenciaMinutos = (ahora - fechaDato) / (1000 * 60)

          // Solo usamos el sensor si el dato es de hace menos de 1 minuto (para pruebas)
          if (diferenciaMinutos <= 1) {
            setWeatherData({
              currentConditions: {
                temp: localData.temperatura,
                humidity: localData.humedad,
                conditions: 's-activo',
                feelslike: localData.temperatura,
                windspeed: 0
              },
              source: 'esp32'
            })
            setLoadingWeather(false)
            return // Si tiene éxito y es reciente, no llama a la API externa
          }
          // Si es muy viejo (el sensor se desconectó o desactivó), ignoramos y pasamos a la API
          console.warn(`Dato IoT muy antiguo (${Math.round(diferenciaMinutos)} min). Pasando a API externa...`)
        }
      } catch (error) {
        console.log("Sensor local no disponible, cambiando a API externa de respaldo...")
      }

      // 2. Fallback Automático a la API de VisualCrossing
      const apiKey = import.meta.env.VITE_WEATHER_API_KEY
      if (!apiKey) {
        setWeatherError('No se ha configurado la clave de API del clima.')
        setLoadingWeather(false)
        return
      }

      fetch(`https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/Loja,Ecuador?unitGroup=metric&lang=es&key=${apiKey}&contentType=json`)
        .then(res => {
          if (!res.ok) throw new Error('Error al obtener los datos del clima.')
          return res.json()
        })
        .then(data => {
          setWeatherData(data)
          setLoadingWeather(false)
        })
        .catch(err => {
          setWeatherError(err.message)
          setLoadingWeather(false)
        })
    }

    fetchWeather()
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      navigate('/login')
      return
    }

    let payload = {}
    try {
      payload = JSON.parse(atob(token.split('.')[1]))
    } catch (e) {
      console.error("Token inválido")
    }

    const nombre = payload.nombre || 'Usuario'
    const apellido = payload.apellido || ''
    const correo = payload.sub || ''
    const id_rol = payload.id_rol

    setUser({
      nombre: nombre,
      apellido: apellido,
      correo: correo,
      id_rol: String(id_rol)
    })

    setProfileData({
      nombre: nombre,
      apellido: apellido,
      clave: ''
    })

    if (String(id_rol) === '1' || String(id_rol) === '3') {
      fetchUsuarios()
      fetchDashboardData()
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
    localStorage.removeItem('access_token')
    localStorage.removeItem('nombre')
    localStorage.removeItem('apellido')
    window.location.href = '/login?logout=true'
  }

  const handleDeleteUser = (id) => {
    setConfirmDialog({
      isOpen: true,
      type: 'DELETE',
      payload: id,
      message: '¿Estás seguro de que deseas eliminar este usuario de forma permanente?'
    })
  }

  const handleToggleRole = (u) => {
    const roleCycle = { 1: 2, 2: 3, 3: 1 }
    const newRole = roleCycle[u.id_rol] || 2
    const roleName = newRole === 1 ? 'Administrador' : newRole === 2 ? 'Participante' : 'Superadmin'
    setConfirmDialog({
      isOpen: true,
      type: 'ROLE',
      payload: { user: u, newRole, roleName },
      message: `¿Cambiar rol de ${u.nombre} a ${roleName}?`
    })
  }

  const executeConfirmAction = async () => {
    if (confirmDialog.type === 'DELETE') {
      const id = confirmDialog.payload
      try {
        await deleteUser(id)
        setUsuarios(usuarios.filter(u => u.id_usuario !== id))
        addNotification('success', 'USUARIO ELIMINADO', `Se ha borrado el usuario #${id} correctamente.`)
      } catch (err) {
        addNotification('error', 'ERROR AL ELIMINAR', err.response?.data?.detail || err.message)
      }
    } else if (confirmDialog.type === 'ROLE') {
      const { user, newRole, roleName } = confirmDialog.payload
      try {
        const res = await updateUser(user.id_usuario, { id_rol: newRole })
        setUsuarios(usuarios.map(u => u.id_usuario === user.id_usuario ? res.data : u))
        addNotification('info', 'ROL ACTUALIZADO', `Ahora ${user.nombre} es ${roleName}.`)
      } catch (err) {
        addNotification('error', 'ERROR AL ACTUALIZAR', err.response?.data?.detail || err.message)
      }
    }
    setConfirmDialog({ isOpen: false, type: '', payload: null, message: '' })
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

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setProfileSaving(true)
    try {
      const payload = { nombre: profileData.nombre, apellido: profileData.apellido }
      if (profileData.clave) {
        payload.clave = profileData.clave
      }
      const res = await updateMe(payload)

      // Update local storage and state
      localStorage.setItem('nombre', res.data.nombre)
      localStorage.setItem('apellido', res.data.apellido)
      setUser(prev => ({ ...prev, nombre: res.data.nombre, apellido: res.data.apellido }))

      addNotification('success', 'PERFIL ACTUALIZADO', 'Tus datos han sido guardados correctamente.')
      setProfileEditMode(false)
      setProfileData(prev => ({ ...prev, clave: '' }))
    } catch (err) {
      addNotification('error', 'ERROR', err.response?.data?.detail || 'No se pudo actualizar el perfil.')
    } finally {
      setProfileSaving(false)
    }
  }

  if (!user) return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Cargando...</div>

  const isAdmin = user.id_rol === '1'
  const isSuperAdmin = user.id_rol === '3'

  // Opciones del menú lateral
  const menuItems = isAdmin ? [
    { id: 'Dashboard', icon: <IconDashboard />, label: 'PANEL PRINCIPAL' },
    { id: 'Eventos', icon: <IconEvents />, label: 'EVENTOS UNL' },
    { id: 'Ubicacion', icon: <IconMap />, label: 'UBICACIÓN' },
    { id: 'Moderacion', icon: <IconFlag />, label: 'MODERACIÓN' },
    { id: 'Perfil', icon: <IconUsers />, label: 'MI PERFIL' },
  ] : isSuperAdmin ? [
    { id: 'Usuarios', icon: <IconUsers />, label: 'GESTIÓN DE USUARIOS', badge: usuarios.length },
    { id: 'Sensores', icon: <IconSensors />, label: 'SENSOR IOT', labelRight: 'ESTABLE' },
    { id: 'Monitoreo', icon: <IconActivity />, label: 'MONITOREO DE DATOS' },
    { id: 'Ubicacion', icon: <IconMap />, label: 'UBICACIÓN' },
    { id: 'Configuracion', icon: <IconSettings />, label: 'CONFIGURACIÓN' },
  ] : [
    { id: 'Dashboard', icon: <IconDashboard />, label: 'PANEL PRINCIPAL', badge: 'PIONERO' },
    { id: 'Eventos', icon: <IconEvents />, label: 'MIS EVENTOS' },
    { id: 'Clima', icon: <IconSettings />, label: 'MÉTRICAS CLIMA' },
    { id: 'Perfil', icon: <IconUsers />, label: 'MI PERFIL' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-app)', fontFamily: "'Inter', sans-serif" }}>

      {/* SIDEBAR OVERLAY FOR MOBILE */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'sidebar-open' : ''}`} onClick={() => setSidebarOpen(false)}></div>

      {/* SIDEBAR IZQUIERDO */}
      <aside className={sidebarOpen ? 'sidebar-open' : ''} style={{ width: '280px', minWidth: '280px', maxWidth: '280px', background: 'var(--bg-card)', borderRight: '1px solid #DBE3E0', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, alignSelf: 'flex-start', overflow: 'hidden', boxSizing: 'border-box' }}>

        {/* LOGO AREA */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', background: 'transparent' }}>
            <img src="/img/logo.png" alt="UNL Cloud Connect" style={{ height: '100%', width: 'auto', objectFit: 'contain' }} />
          </div>
          <div>
            <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '1px' }}>{isAdmin ? 'CONSOLE ADMIN' : isSuperAdmin ? 'CONSOLE SUPER ADMIN' : 'CONSOLE PARTICIPANTE'}</span>
          </div>
        </div>

        {/* USER PROFILE */}
        <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #0F766E, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-inverse)', fontSize: '20px', fontWeight: '700' }}>
              {user.nombre.charAt(0)}
            </div>
            <div style={{ position: 'absolute', bottom: '0', right: '0', width: '12px', height: '12px', background: '#10b981', border: '2px solid #fff', borderRadius: '50%' }}></div>
          </div>
          <div>
            <h2 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', textTransform: 'uppercase' }}>{user.nombre} {user.apellido}</h2>
            <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>{isAdmin ? 'ADMINISTRADOR' : isSuperAdmin ? 'SUPER ADMIN' : 'PARTICIPANTE UNL'}</span>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav style={{ padding: '24px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          {menuItems.map(item => (
            <a
              key={item.id}
              href="#"
              onClick={(e) => {
                e.preventDefault()
                setActiveTab(item.id)
                setSidebarOpen(false)
              }}
              style={{
                width: '100%', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px', marginBottom: '8px',
                background: activeTab === item.id ? '#0F766E' : 'transparent',
                color: activeTab === item.id ? 'white' : 'var(--text-muted)',
                border: 'none', 
                borderRadius: '10px', 
                boxShadow: activeTab === item.id ? '0 4px 10px rgba(15, 118, 110, 0.3)' : 'none',
                cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.2s ease', 
                fontWeight: activeTab === item.id ? '800' : '600', 
                fontSize: '13px', textDecoration: 'none',
                letterSpacing: activeTab === item.id ? '0.5px' : '0'
              }}
            >
              <div style={{ color: activeTab === item.id ? 'white' : 'var(--text-muted)', display: 'flex' }}>
                {item.icon}
              </div>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                {item.label}
              </span>

              {item.badge > 0 && (
                <span style={{ 
                  background: activeTab === item.id ? 'rgba(255, 255, 255, 0.25)' : 'var(--border)', 
                  color: activeTab === item.id ? 'white' : 'var(--text-muted)', 
                  padding: '4px 10px', 
                  borderRadius: '12px', 
                  fontSize: '12px',
                  fontWeight: '800'
                }}>
                  {item.badge}
                </span>
              )}
              {item.labelRight && (
                <span style={{ fontSize: '8px', fontWeight: '800', color: '#10b981', border: '1px solid #10b981', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {item.labelRight}
                </span>
              )}
            </a>
          ))}

          {/* CERRAR SESIÓN */}
          <div style={{ marginTop: 'auto', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
            <button
              onClick={handleLogout}
              style={{
                width: '100%', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: '16px',
                padding: '12px 16px', border: 'none', borderRadius: '8px',
                background: 'transparent', color: '#ef4444', fontWeight: '600',
                fontSize: '13px', cursor: 'pointer', textAlign: 'left'
              }}
              onMouseOver={(e) => e.target.style.background = '#fee2e2'}
              onMouseOut={(e) => e.target.style.background = 'transparent'}
            >
              <IconLogOut /> CERRAR SESIÓN
            </button>
          </div>
        </nav>

        {/* THEME / CONSOLE TOGGLE (Participant only) */}
        {!isAdmin && (
          <div style={{ padding: '24px', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '8px' }}>PERSONALIZACIÓN DE TEMA</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button onClick={() => setTheme('claro')} style={{ padding: '8px', background: theme === 'claro' ? 'var(--primary-light)' : 'transparent', border: theme === 'claro' ? '1px solid var(--primary)' : '1px solid var(--border)', color: theme === 'claro' ? 'var(--primary)' : 'var(--text-muted)', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>☼ CLARO</button>
                <button onClick={() => setTheme('oscuro')} style={{ padding: '8px', background: theme === 'oscuro' ? 'var(--bg-app)' : 'transparent', border: theme === 'oscuro' ? '1px solid var(--border)' : '1px solid var(--border)', color: theme === 'oscuro' ? 'var(--text-main)' : 'var(--text-muted)', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>☾ OSCURO</button>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* TOP HEADER BAR */}
        <header style={{ height: '80px', background: 'var(--bg-card)', borderBottom: '1px solid #DBE3E0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', display: 'none' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <div style={{ background: '#dbeafe', color: '#0F766E', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', letterSpacing: '1px' }}>
              PANEL PRINCIPAL
            </div>
            <div className="hide-on-mobile" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
              <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></div>
              RED CENTRAL UNL INTEGRADA
            </div>
          </div>

          <div className="hide-on-mobile" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            
            {/* Clima Block */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ color: 'var(--text-muted)' }}>
                <CloudSun size={28} strokeWidth={2.5} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)', lineHeight: '1' }}>
                  {loadingWeather ? '...' : weatherError ? '--°C' : weatherData ? `${weatherData.currentConditions?.temp}°C` : '12.4°C'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Loja, Ecuador</span>
                  <span style={{ background: '#10b981', color: 'white', fontSize: '9px', fontWeight: '700', padding: '2px 6px', borderRadius: '12px' }}>
                    {loadingWeather ? '...' : weatherError ? 'Sin datos' : weatherData ? weatherData.currentConditions?.conditions?.split(',')[0] : 'Lluvia'}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ width: '1px', height: '32px', background: 'var(--border)' }}></div>

            {/* Server Status Block */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px', letterSpacing: '0.5px' }}>ESTADO SERVIDOR</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-main)' }}>SINCRONIZADO</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ background: '#ecfdf5', borderRadius: '50%', padding: '2px' }}><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
            </div>

            <div style={{ width: '1px', height: '32px', background: 'var(--border)' }}></div>

            {/* User & Notifications */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
              <div 
                style={{ position: 'relative', cursor: 'pointer', color: 'var(--text-muted)' }}
                onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                {unreadCount > 0 && (
                  <div style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#10b981', color: 'white', fontSize: '10px', fontWeight: '800', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg-card)' }}>
                    {unreadCount}
                  </div>
                )}
              </div>
              
              {showNotificationsDropdown && (
                <div style={{ position: 'absolute', top: '100%', right: '50px', marginTop: '16px', width: '320px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', zIndex: 1000, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: 'var(--text-main)' }}>Notificaciones</h3>
                    {unreadCount > 0 && (
                      <span onClick={markAllAsRead} style={{ fontSize: '11px', fontWeight: '700', color: '#10b981', cursor: 'pointer' }}>Marcar como leídas</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '350px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                        No tienes notificaciones
                      </div>
                    ) : notifications.filter(n => !readNotifIds.includes(n.id)).length === 0 ? (
                      <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                        No tienes notificaciones nuevas
                      </div>
                    ) : notifications.filter(n => !readNotifIds.includes(n.id)).map(notif => {
                      const isRead = false // siempre false porque ya filtramos las leídas
                      return (
                      <div key={notif.id} style={{ 
                        padding: '16px 20px', 
                        borderBottom: '1px solid var(--border)', 
                        display: 'flex', 
                        gap: '12px', 
                        alignItems: 'flex-start', 
                        cursor: 'pointer', 
                        background: isRead ? 'transparent' : 'var(--bg-app)',
                        transition: 'background 0.2s' 
                      }} 
                      onMouseOver={e => e.currentTarget.style.background = 'var(--bg-app)'} 
                      onMouseOut={e => e.currentTarget.style.background = isRead ? 'transparent' : 'var(--bg-app)'}>
                        <div style={{ 
                          width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                          background: notif.type === 'success' ? '#ecfdf5' : notif.type === 'info' ? '#eff6ff' : '#fef2f2', 
                          color: notif.type === 'success' ? '#10b981' : notif.type === 'info' ? '#3b82f6' : '#ef4444', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {notif.iconType === 'mobile' ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                          ) : notif.type === 'success' ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          ) : notif.type === 'info' ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                          )}
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: isRead ? '600' : '800', color: 'var(--text-main)', marginBottom: '4px' }}>{notif.title}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>{notif.message}</div>
                          <div style={{ fontSize: '10px', fontWeight: '600', color: notif.type === 'success' ? '#10b981' : notif.type === 'info' ? '#3b82f6' : '#ef4444', marginTop: '6px' }}>{notif.time}</div>
                        </div>
                        {!isRead && (
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', alignSelf: 'center', marginLeft: 'auto' }}></div>
                        )}
                      </div>
                    )})}
                  </div>
                  <div style={{ padding: '12px', background: 'var(--bg-app)', textAlign: 'center', borderTop: '1px solid var(--border)', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', cursor: 'pointer' }}>
                    Ver todas las notificaciones
                  </div>
                </div>
              )}

              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }}>
                {user?.nombre?.charAt(0) || 'M'}
              </div>
            </div>
          </div>
        </header>

        {/* SCROLLABLE CONTENT */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px', width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>

          {/* VISTA DE EVENTOS: Aquí se inyecta tu componente sin asfixiar el espacio */}
          {activeTab === 'Eventos' && (
            <div style={{ width: '100%' }}>
              <Events />
            </div>
          )}

          {/* VISTA DE SENSORES IOT */}
          {activeTab === 'Sensores' && (
            <div style={{ width: '100%' }}>
              <Sensors />
            </div>
          )}

          {/* VISTA DE MONITOREO DE DATOS */}
          {activeTab === 'Monitoreo' && (
            <div style={{ width: '100%' }}>
              <Monitoreo />
            </div>
          )}

          {/* KPI CARDS Y GRAFICOS (ADMIN DASHBOARD) */}
          {isAdmin && activeTab === 'Dashboard' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '16px' }}>
                <button onClick={exportEventsToPDF} style={{ padding: '8px 16px', backgroundColor: '#0F766E', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Exportar Eventos PDF</button>
                <button onClick={exportUsersToPDF} style={{ padding: '8px 16px', backgroundColor: '#0F766E', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Exportar Usuarios PDF</button>
              </div>
              {/* KPI CARDS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: 'var(--bg-card)', padding: '16px 20px', border: '1px solid #DBE3E0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>EVENTOS TOTALES</span>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#0F766E', marginTop: '4px' }}>{loadingDashboard ? '...' : eventos.length}</div>
                  </div>
                  <IconEvents />
                </div>
                <div style={{ background: 'var(--bg-card)', padding: '16px 20px', border: '1px solid #DBE3E0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>EN PROGRESO</span>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#10b981', marginTop: '4px' }}>{loadingDashboard ? '...' : (Array.isArray(eventos) ? eventos : []).filter(e => e.estado === 'EN_PROGRESO').length}</div>
                  </div>
                  <IconActivity />
                </div>
                <div style={{ background: 'var(--bg-card)', padding: '16px 20px', border: '1px solid #DBE3E0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>SENSORES</span>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#0F766E', marginTop: '4px' }}>{loadingDashboard ? '...' : sensores.length}</div>
                  </div>
                  <IconSensors />
                </div>
                <div style={{ background: 'var(--bg-card)', padding: '16px 20px', border: '1px solid #DBE3E0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>USUARIOS</span>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#0F766E', marginTop: '4px' }}>{loadingDashboard ? '...' : usuarios.length}</div>
                  </div>
                  <IconUsers />
                </div>
              </div>

              {/* GRÁFICOS Y SISTEMA */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
                {/* BARRAS DE FRECUENCIA CLIMÁTICA */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid #DBE3E0', padding: '32px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', fontStyle: 'italic', color: 'var(--text-main)' }}>FRECUENCIA CLIMÁTICA UNL</h3>
                      <div style={{ fontSize: '10px', fontWeight: '800', color: '#0F766E', letterSpacing: '1px' }}>TELEMETRÍA DE RED MESH DE SENSORS</div>
                    </div>
                    <div style={{ display: 'flex', border: '1px solid #DBE3E0' }}>
                      <button style={{ padding: '6px 16px', background: 'var(--text-main)', color: 'var(--text-inverse)', fontSize: '10px', fontWeight: '700', border: 'none', cursor: 'pointer' }}>DÍA</button>
                      <button style={{ padding: '6px 16px', background: 'var(--text-inverse)', color: 'var(--text-muted)', fontSize: '10px', fontWeight: '700', border: 'none', cursor: 'pointer' }}>SEMANA</button>
                    </div>
                  </div>
                  <div style={{ height: '240px', paddingBottom: '20px' }}>
                    {weatherData?.days ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={weatherData.days.slice(0, 15)}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis dataKey="datetime" tickFormatter={(val) => val.substring(5)} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                          <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                          <Line type="monotone" dataKey="temp" stroke="#0F766E" strokeWidth={3} dot={{ r: 4, fill: '#0F766E', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#9CA3AF', fontSize: '12px' }}>Cargando datos climáticos...</div>
                    )}
                  </div>
                </div>

                {/* ACTIVIDAD DEL SISTEMA */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid #DBE3E0', padding: '32px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <IconClock />
                      <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: 'var(--text-main)' }}>ACTIVIDAD DEL SISTEMA</h3>
                    </div>
                    <div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>SINCRONIZACIÓN EN TIEMPO REAL</div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                    {eventos.length === 0 && (
                      <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>No hay eventos registrados</div>
                    )}
                    {eventos.slice(-5).reverse().map((evt, i) => {
                      const tiempoRel = (() => {
                        const diff = Date.now() - new Date(evt.fecha_hora_inicio).getTime();
                        const mins = Math.floor(diff / 60000);
                        if (mins < 60) return `HACE ${mins} MIN`;
                        const hrs = Math.floor(mins / 60);
                        if (hrs < 24) return `HACE ${hrs} HORA${hrs > 1 ? 'S' : ''}`;
                        return `${new Date(evt.fecha_hora_inicio).toLocaleDateString()}`;
                      })();
                      const estados = { EN_PROGRESO: '● EN CURSO', PROGRAMADO: '● PROGRAMADO', FINALIZADO: '● FINALIZADO', CANCELADO: '● CANCELADO' };
                      return (
                        <div key={evt.id_evento || i}>
                          <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '2px' }}>{evt.nombre}</div>
                          <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>{tiempoRel} <span style={{ color: '#0F766E' }}>• {estados[evt.estado] || evt.estado}</span></div>
                        </div>
                      );
                    })}
                  </div>

                  <button style={{ width: '100%', marginTop: '24px', padding: '12px', background: 'var(--bg-app)', border: '1px solid #DBE3E0', fontSize: '10px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '1px', cursor: 'pointer' }}>
                    VERIFICAR SERVIDORES IOT
                  </button>
                </div>
              </div>

              {/* MAPA Y SERVIDORES */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                {/* TOPOLOGÍA DE SENSORS */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid #DBE3E0', padding: '32px' }}>
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: 'var(--text-main)' }}>TOPOLOGÍA DE SENSORS UNL (MAPA CONCEPTUAL)</h3>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500', marginTop: '4px' }}>Representación gráfica del campus de Loja y la central de recepción de tramas atmosféricas.</div>
                  </div>
                  <div style={{ background: 'var(--border-light)', height: '120px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 20px', border: '1px solid #DBE3E0', flexWrap: 'wrap' }}>
                    {ubicacionesDB.length === 0 && (
                      <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)' }}>No hay ubicaciones registradas</span>
                    )}
                    {ubicacionesDB.slice(0, 6).map((ubi, i) => (
                      <div key={ubi.id_ubicacion || i} style={{ padding: '6px 12px', background: 'var(--text-muted)', color: 'var(--text-inverse)', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                        <div style={{ width: 6, height: 6, background: '#10b981', borderRadius: '50%' }}></div>
                        {ubi.nombre_lugar}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '1px' }}>
                    <span>CONEXIÓN: CLÚSTER UNL LOJA</span>
                    <span style={{ color: '#0F766E', cursor: 'pointer' }}>[EXPANDIR MAPA]</span>
                  </div>
                </div>

                {/* METATRAMA DE SERVIDORES */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid #DBE3E0', padding: '32px' }}>
                  <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: 'var(--text-main)' }}>METATRAMA DE SERVIDORES</h3>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500', marginTop: '4px' }}>Espacio total de las imágenes y telemetría de estudiantes.</div>
                  </div>

                  <div style={{ marginBottom: '40px' }}>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '8px' }}>ALMACENAMIENTO DE RECURSOS</div>
                    <div style={{ width: '100%', height: '8px', background: 'var(--border)', display: 'flex' }}>
                      <div style={{ width: `${Math.min(eventos.length * 5, 85)}%`, background: 'var(--text-main)' }}></div>
                      <div style={{ width: `${Math.min(ubicacionesDB.length * 3, 15)}%`, background: '#0F766E' }}></div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #DBE3E0', paddingBottom: '16px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '1px' }}>LATENCIA BASE API:</span>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#0F766E' }}>24 ms</span>
                  </div>

                  <div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>{eventos.length} EVENTOS • {ubicacionesDB.length} UBICACIONES • {sensores.length} SENSORES</div>
                </div>
              </div>
            </>
          )}

          {/* PARTICIPANT DASHBOARD VIEW */}
          {!isAdmin && !isSuperAdmin && activeTab === 'Dashboard' && (
            <>
              {/* KPI CARDS PARTICIPANT */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
                <div style={{ background: 'var(--bg-card)', padding: '24px', border: '1px solid #DBE3E0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>MI IMPACTO RED</span>
                    <IconDashboard />
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: '800', color: '#0F766E', marginBottom: '16px' }}>8.4k</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)' }}>
                    <span>APORTES AL ECOSISTE...</span>
                    <span style={{ color: '#0F766E' }}>ACREDITADO</span>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: '24px', border: '1px solid #DBE3E0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>GALERIA DE FOTOS</span>
                    <IconEvents />
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: '800', color: '#0F766E', marginBottom: '16px' }}>142 fotos</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)' }}>
                    <span>SINTONIZADO AL CAMP...</span>
                    <span style={{ color: '#0F766E' }}>COMPLETADO</span>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: '24px', border: '1px solid #DBE3E0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>ESTADO DEL SENSOR</span>
                    <IconSensors />
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: '800', color: '#0F766E', marginBottom: '16px' }}>ONLINE</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)' }}>
                    <span style={{ textTransform: 'uppercase' }}>node-04-Luna</span>
                    <span style={{ color: '#0F766E' }}>4 ENVÍOS</span>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: '24px', border: '1px solid #DBE3E0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>IDENTIDAD UNL</span>
                    <IconUsers />
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: '800', color: '#0F766E', marginBottom: '16px' }}>Pionero</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)' }}>
                    <span>NIVEL/ROL VERIFICADO</span>
                    <span style={{ color: '#0F766E' }}>VALIDADO</span>
                  </div>
                </div>
              </div>

              {/* PARTICIPANT CONTENT (SENSORS + ACREDITADA) */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>

                {/* SENSORS DE EVENTOS ACTIVAS */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid #DBE3E0', padding: '32px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900', fontStyle: 'italic', color: 'var(--text-main)' }}>EVENTOS ACTIVAS</h3>
                    <div style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '50%' }}></div>
                  </div>
                  <div style={{ fontSize: '10px', fontWeight: '800', color: '#0F766E', letterSpacing: '1px', marginBottom: '24px' }}>PARTICIPANDO EN LA RED CENTRAL DE TRAMAS IOT - LOJA</div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #DBE3E0' }}>
                        <th style={{ padding: '12px', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '1px' }}>SENSOR / EVENTO</th>
                        <th style={{ padding: '12px', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '1px' }}>UBICACIÓN</th>
                        <th style={{ padding: '12px', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '1px' }}>CATEGORÍA</th>
                        <th style={{ padding: '12px', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '1px' }}>FECHA</th>
                        <th style={{ padding: '12px', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '1px', textAlign: 'right' }}>AFLUENCIA</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '16px 12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '32px', height: '32px', background: 'var(--text-main)' }}></div>
                          <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-main)', maxWidth: '180px' }}>FESTIVAL INTERNACIONAL DE ARTES VIVAS (FIAVL)</div>
                        </td>
                        <td style={{ padding: '16px 12px', fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>CENTRO HISTÓRICO...</td>
                        <td style={{ padding: '16px 12px' }}><span style={{ background: '#dbeafe', color: '#0F766E', padding: '4px 8px', fontSize: '10px', fontWeight: '700', border: '1px solid #bfdbfe' }}>FESTIVAL</span></td>
                        <td style={{ padding: '16px 12px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', fontFamily: 'monospace' }}>2026-11-15</td>
                        <td style={{ padding: '16px 12px', fontSize: '13px', color: '#0F766E', fontWeight: '800', textAlign: 'right' }}>1540</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '16px 12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '32px', height: '32px', background: 'var(--text-main)' }}></div>
                          <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-main)', maxWidth: '180px' }}>197 FERIA DE LOJA</div>
                        </td>
                        <td style={{ padding: '16px 12px', fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>COMPLEJO FERIAL ...</td>
                        <td style={{ padding: '16px 12px' }}><span style={{ background: '#dbeafe', color: '#0F766E', padding: '4px 8px', fontSize: '10px', fontWeight: '700', border: '1px solid #bfdbfe' }}>FAIR</span></td>
                        <td style={{ padding: '16px 12px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', fontFamily: 'monospace' }}>2026-09-01</td>
                        <td style={{ padding: '16px 12px', fontSize: '13px', color: '#0F766E', fontWeight: '800', textAlign: 'right' }}>3200</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* MI SENSOR UNL ACREDITADA */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid #DBE3E0', padding: '32px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <IconDashboard />
                      <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: 'var(--text-main)' }}>MI CREDENCIAL UNL ACREDITADA</h3>
                    </div>
                    <div style={{ fontSize: '9px', fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>CREDENCIALES DIGITALES DE INVESTIGADOR</div>
                  </div>

                  <div style={{ background: 'var(--bg-app)', border: '1px solid #DBE3E0', padding: '24px', flex: 1, position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%' }}></div>
                        <span style={{ fontSize: '10px', fontWeight: '800', color: '#0F766E', letterSpacing: '1px' }}>ENLACE ACTIVO</span>
                      </div>
                      <IconSettings />
                    </div>

                    <div style={{ fontSize: '24px', fontWeight: '900', fontStyle: 'italic', color: '#0F766E', marginBottom: '24px', textTransform: 'uppercase' }}>{user.nombre} {user.apellido}</div>

                    <div style={{ borderTop: '1px solid #DBE3E0', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                        <span style={{ color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.5px' }}>IDENTIFICADOR SENSOR</span>
                        <span style={{ color: '#0F766E', fontWeight: '700', fontFamily: 'monospace' }}>node-04-Luna</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                        <span style={{ color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.5px' }}>ROL EN LA RED</span>
                        <span style={{ color: 'var(--text-main)', fontWeight: '700', fontFamily: 'monospace' }}>Contribuyente de Sensor v4</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                        <span style={{ color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.5px' }}>MÉRITO ACADÉMICO</span>
                        <span style={{ color: '#f59e0b', fontWeight: '800', textTransform: 'uppercase' }}>Pionero</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                        <span style={{ color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.5px' }}>FIRMA DIGITAL</span>
                        <span style={{ color: '#10b981', fontWeight: '800', textTransform: 'uppercase' }}>VALIDADO</span>
                      </div>
                    </div>

                    <div style={{ marginTop: '32px', paddingTop: '16px', borderTop: '1px solid #DBE3E0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <IconSensors /> ESTACIÓN 98%
                      </div>
                      <div style={{ fontSize: '10px', fontWeight: '800', color: '#0F766E', letterSpacing: '0.5px' }}>UNL IOT SENSOR</div>
                    </div>
                  </div>
                </div>

              </div>
            </>
          )}

          {/* MAIN CONTENT AREA - CONDITIONAL RENDERING BASED ON TAB */}
          {activeTab === 'Usuarios' && (isAdmin || isSuperAdmin) && (
            <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid #DBE3E0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
              <div style={{ padding: '24px', borderBottom: '1px solid #DBE3E0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', fontStyle: 'italic' }}>DIRECTORIO DE USUARIOS UNL</h3>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: '#0F766E', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Control de Accesos y Privilegios</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={openCreateModal} style={{ padding: '8px 16px', background: '#0F766E', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--bg-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <IconAdd /> Agregar Usuario
                  </button>
                  <button onClick={() => { fetchUsuarios(); addNotification('info', 'ACTUALIZANDO DATOS', 'Obteniendo la lista más reciente de usuarios.'); }} style={{ padding: '8px 16px', background: 'var(--bg-app)', border: '1px solid #DBE3E0', borderRadius: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', cursor: 'pointer' }}>
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
                      <tr style={{ background: 'var(--bg-app)', borderBottom: '1px solid #DBE3E0' }}>
                        <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>USUARIO</th>
                        <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>CORREO INSTITUCIONAL</th>
                        <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>ROL ASIGNADO</th>
                        <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px', textAlign: 'right' }}>ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuarios.map((u, index) => (
                        <tr key={u.id_usuario} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'var(--bg-app)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '16px 24px' }}>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>{u.nombre} {u.apellido}</div>
                          </td>
                          <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>{u.correo}</td>
                          <td style={{ padding: '16px 24px' }}>
                            <span style={{
                              padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px',
                              background: u.id_rol === 1 ? '#fee2e2' : u.id_rol === 3 ? '#fef3c7' : '#e0e7ff',
                              color: u.id_rol === 1 ? '#ef4444' : u.id_rol === 3 ? '#d97706' : '#4338ca'
                            }}>
                              {u.id_rol === 1 ? 'ADMINISTRADOR' : u.id_rol === 3 ? 'SUPERADMIN' : 'PARTICIPANTE'}
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
                        <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron usuarios</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'Sensores' && (
            <div className="animate-fade-in">

            </div>
          )}

          {activeTab === 'Moderacion' && (
            <div>
              <ModerationPanel />
            </div>
          )}

          {activeTab === 'Perfil' && (
            <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 4px 0' }}>Mi Perfil</h2>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>Gestiona tu información personal y configuración de cuenta</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) minmax(400px, 2fr) minmax(250px, 1fr)', gap: '20px' }}>
                
                {/* COLUMNA IZQUIERDA */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ position: 'relative', marginBottom: '16px' }}>
                      <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#0F766E', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '40px', fontWeight: 'bold' }}>
                        {user.nombre.charAt(0)}
                      </div>
                      <div style={{ position: 'absolute', bottom: 0, right: 0, background: '#fff', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', cursor: 'pointer', color: '#0F766E' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                      </div>
                    </div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '700', color: 'var(--text-main)' }}>{user.nombre} {user.apellido}</h3>
                    <span style={{ fontSize: '12px', background: '#ecfdf5', color: '#059669', padding: '4px 12px', borderRadius: '16px', fontWeight: '600', marginBottom: '16px' }}>
                      {isAdmin ? 'Administrador' : isSuperAdmin ? 'Superadmin' : 'Participante'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#059669', fontWeight: '600' }}>
                      <IconCheck /> Cuenta verificada
                    </div>
                    
                    <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border)', width: '100%', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
                      <div style={{ background: 'var(--bg-app)', padding: '8px', borderRadius: '8px' }}><IconClock /></div>
                      <div style={{ fontSize: '12px' }}>
                        <div>Miembro desde</div>
                        <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>Marzo 2025</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* COLUMNA CENTRAL */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>Correo institucional</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ position: 'relative', width: '280px' }}>
                            <div style={{ position: 'absolute', left: '12px', top: '10px', color: '#9CA3AF' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg></div>
                            <input type="email" value={user.correo} disabled style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-muted)', fontSize: '13px', boxSizing: 'border-box' }} />
                          </div>
                          <span style={{ fontSize: '11px', color: '#059669', background: '#ecfdf5', padding: '4px 8px', borderRadius: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <IconCheck /> Verificado
                          </span>
                        </div>
                      </div>
                      {!profileEditMode && (
                        <button onClick={() => setProfileEditMode(true)} style={{ padding: '8px 16px', background: '#fff', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <IconEdit /> Editar Perfil
                        </button>
                      )}
                    </div>

                    <form onSubmit={handleProfileSubmit}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>Nombre</label>
                          <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '12px', top: '10px', color: '#9CA3AF' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>
                            <input type="text" value={profileEditMode ? profileData.nombre : user.nombre} onChange={e => setProfileData({ ...profileData, nombre: e.target.value })} disabled={!profileEditMode} required style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: profileEditMode ? '1px solid #0F766E' : '1px solid var(--border)', background: profileEditMode ? '#fff' : 'var(--bg-app)', color: 'var(--text-main)', fontSize: '13px', boxSizing: 'border-box' }} />
                          </div>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>Apellido</label>
                          <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '12px', top: '10px', color: '#9CA3AF' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>
                            <input type="text" value={profileEditMode ? profileData.apellido : user.apellido} onChange={e => setProfileData({ ...profileData, apellido: e.target.value })} disabled={!profileEditMode} required style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: profileEditMode ? '1px solid #0F766E' : '1px solid var(--border)', background: profileEditMode ? '#fff' : 'var(--bg-app)', color: 'var(--text-main)', fontSize: '13px', boxSizing: 'border-box' }} />
                          </div>
                        </div>
                        
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>Rol</label>
                          <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '12px', top: '10px', color: '#9CA3AF' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg></div>
                            <input type="text" value={isAdmin ? 'Administrador' : isSuperAdmin ? 'Superadmin' : 'Participante'} disabled style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-muted)', fontSize: '13px', boxSizing: 'border-box' }} />
                          </div>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>Departamento / Área</label>
                          <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '12px', top: '10px', color: '#9CA3AF' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></div>
                            <input type="text" value="Ingeniería en Computación" disabled style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-muted)', fontSize: '13px', boxSizing: 'border-box' }} />
                          </div>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>Teléfono</label>
                          <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '12px', top: '10px', color: '#9CA3AF' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg></div>
                            <input type="text" value="+593 96 123 4567" disabled style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-muted)', fontSize: '13px', boxSizing: 'border-box' }} />
                          </div>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>Ubicación</label>
                          <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '12px', top: '10px', color: '#9CA3AF' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>
                            <input type="text" value="Loja, Ecuador" disabled style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-muted)', fontSize: '13px', boxSizing: 'border-box' }} />
                          </div>
                        </div>
                      </div>

                      <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>Contraseña</label>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <div style={{ position: 'relative', flex: 1 }}>
                            <div style={{ position: 'absolute', left: '12px', top: '10px', color: '#9CA3AF' }}><IconLock /></div>
                            <input type="password" value={profileEditMode ? profileData.clave : '................'} onChange={e => setProfileData({ ...profileData, clave: e.target.value })} disabled={!profileEditMode} placeholder={profileEditMode ? 'Nueva contraseña' : ''} style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: profileEditMode ? '1px solid #0F766E' : '1px solid var(--border)', background: profileEditMode ? '#fff' : 'var(--bg-app)', color: 'var(--text-main)', fontSize: '13px', boxSizing: 'border-box' }} />
                          </div>
                          {!profileEditMode && (
                             <button type="button" onClick={() => setProfileEditMode(true)} style={{ padding: '0 16px', background: '#fff', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                               Cambiar contraseña
                             </button>
                          )}
                        </div>
                      </div>

                      {profileEditMode && (
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                          <button type="button" onClick={() => { setProfileEditMode(false); setProfileData({ nombre: user.nombre, apellido: user.apellido, clave: '' }) }} style={{ padding: '10px 24px', borderRadius: '6px', border: '1px solid var(--border)', background: '#fff', color: 'var(--text-main)', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                            Cancelar
                          </button>
                          <button type="submit" disabled={profileSaving} style={{ padding: '10px 24px', borderRadius: '6px', border: 'none', background: '#0F766E', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: profileSaving ? 'not-allowed' : 'pointer', opacity: profileSaving ? 0.8 : 1 }}>
                            {profileSaving ? 'Guardando...' : 'Guardar Cambios'}
                          </button>
                        </div>
                      )}
                    </form>
                  </div>

                  {/* Banner de seguridad inferior */}
                  <div style={{ background: '#ecfdf5', border: '1px solid #d1fae5', borderRadius: '12px', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', flexShrink: 0 }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>
                    </div>
                    <div style={{ zIndex: 1 }}>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '800', color: '#065f46' }}>Tu seguridad es nuestra prioridad</h4>
                      <p style={{ margin: 0, fontSize: '12px', color: '#047857', maxWidth: '400px', lineHeight: 1.5 }}>Trabajamos continuamente para proteger tu información y garantizar la integridad de la plataforma UNL Cloud Connect.</p>
                    </div>
                    <svg style={{ position: 'absolute', right: '-10px', bottom: '-20px', opacity: 0.1, color: '#059669' }} width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  </div>
                </div>

                {/* COLUMNA DERECHA */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <IconClock /> Última actividad
                      </h4>
                      <span style={{ fontSize: '12px', color: '#0F766E', fontWeight: '600', cursor: 'pointer' }}>Ver todo</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><IconCheck /></div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>Inicio de sesión exitoso</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Hoy, 09:21</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><IconEdit /></div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>Actualización de perfil</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Ayer, 16:45</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fff7ed', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><IconLock /></div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>Cambio de contraseña</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>12 Jun 2025, 11:32</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f3e8ff', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><IconActivity /></div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>Visualización de reportes</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>11 Jun 2025, 09:15</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <h4 style={{ margin: '0 0 24px 0', fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> Seguridad de la cuenta
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ color: '#059669' }}><IconCheck /></div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>Autenticación segura</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Protegida con contraseña</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ color: '#059669' }}><IconCheck /></div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>Última verificación</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Hoy, 09:21</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ color: '#059669' }}><IconCheck /></div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>Sesiones activas</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>1 sesión activa</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* MÓDULO CLIMA */}
          {activeTab === 'Clima' && (
            <div style={{ background: 'var(--bg-card)', padding: '40px', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                <div style={{ width: '48px', height: '48px', background: 'var(--primary-light)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                  <IconSettings />
                </div>
                <div>
                  <h2 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '800', color: 'var(--text-main)' }}>Métricas del Clima (Loja, EC)</h2>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Datos en tiempo real mediante Visual Crossing API</span>
                </div>
              </div>

              {loadingWeather ? (
                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '600' }}>Cargando datos climáticos...</div>
              ) : weatherError ? (
                <div style={{ padding: '40px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#ef4444', textAlign: 'center', fontWeight: '600' }}>
                  {weatherError}
                </div>
              ) : weatherData ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                  <div style={{ background: 'var(--bg-app)', padding: '32px 24px', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>Temperatura Actual</div>
                    <div style={{ fontSize: '42px', fontWeight: '800', color: 'var(--text-main)' }}>{weatherData.currentConditions?.temp}°C</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px', fontWeight: '600' }}>Sensación: {weatherData.currentConditions?.feelslike}°C</div>
                  </div>
                  <div style={{ background: 'var(--bg-app)', padding: '32px 24px', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>Condición</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--primary)', marginTop: '20px' }}>{weatherData.currentConditions?.conditions}</div>
                  </div>
                  <div style={{ background: 'var(--bg-app)', padding: '32px 24px', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>Humedad</div>
                    <div style={{ fontSize: '42px', fontWeight: '800', color: 'var(--text-main)' }}>{weatherData.currentConditions?.humidity}%</div>
                  </div>
                  <div style={{ background: 'var(--bg-app)', padding: '32px 24px', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>Viento</div>
                    <div style={{ fontSize: '42px', fontWeight: '800', color: 'var(--text-main)' }}>{weatherData.currentConditions?.windspeed} <span style={{ fontSize: '16px' }}>km/h</span></div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* MÓDULO DE CONFIGURACIÓN ADMIN */}
          {activeTab === 'Configuracion' && (isAdmin || isSuperAdmin) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ background: 'var(--bg-card)', padding: '40px', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '800', color: 'var(--text-main)' }}>Configuración Global del Sistema</h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                  {/* Tarjeta de Seguridad */}
                  <div style={{ padding: '24px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--bg-app)' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <IconSettings /> Seguridad y Acceso
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '600' }}>Registro de nuevos participantes</span>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                          <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }} />
                        </label>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '600' }}>Requerir verificación de correo</span>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                          <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }} />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Preferencias de la Interfaz */}
                  <div style={{ padding: '24px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--bg-app)' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <IconEvents /> Preferencias
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '600' }}>Modo de mantenimiento</span>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                          <input type="checkbox" style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }} />
                        </label>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '600' }}>Alertas de sensores por email</span>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                          <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }} />
                        </label>
                      </div>
                    </div>
                  </div>

                </div>

                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={handleSaveConfig} style={{ padding: '12px 24px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
                    Guardar Configuración
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VISTA DE UBICACIÓN */}
          {activeTab === 'Ubicacion' && (
            <Ubicacion userRole={user.id_rol} />
          )}

          {/* FOOTER */}
          <div style={{ marginTop: 'auto', paddingTop: '40px' }}>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', paddingBottom: '8px', textAlign: 'center', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
              © {new Date().getFullYear()} Universidad Nacional de Loja — Ingeniería en Computación.
            </div>
          </div>

        </div>
      </main>

      {/* MODAL CRUD (Flotante) */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: 'var(--text-inverse)', width: '100%', maxWidth: '400px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>

            <div style={{ background: 'var(--bg-app)', padding: '16px 24px', borderBottom: '1px solid #DBE3E0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>
                {modalMode === 'create' ? 'Agregar Nuevo Usuario' : 'Editar Usuario'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
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
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>Nombre</label>
                    <input required type="text" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>Apellido</label>
                    <input required type="text" value={formData.apellido} onChange={e => setFormData({ ...formData, apellido: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }} />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>Correo Institucional</label>
                  <input
                    required
                    type="email"
                    disabled={modalMode === 'edit'}
                    value={formData.correo}
                    onChange={e => setFormData({ ...formData, correo: e.target.value })}
                    placeholder="usuario@unl.edu.ec"
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', background: modalMode === 'edit' ? 'var(--border-light)' : 'var(--text-inverse)' }}
                  />
                </div>

                {modalMode === 'create' && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>Contraseña</label>
                    <input required minLength={8} maxLength={12} type="password" value={formData.clave} onChange={e => setFormData({ ...formData, clave: e.target.value })} placeholder="Entre 8 y 12 caracteres" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }} />
                  </div>
                )}

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>Rol Asignado</label>
                  <select value={formData.id_rol} onChange={e => setFormData({ ...formData, id_rol: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', background: 'var(--text-inverse)' }}>
                    <option value={2}>Participante (Estándar)</option>
                    <option value={1}>Administrador (Control Total)</option>
                    <option value={3}>Superadmin (Acceso Total)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 16px', background: 'var(--bg-app)', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    Cancelar
                  </button>
                  <button type="submit" disabled={modalSaving} style={{ padding: '10px 16px', background: '#0F766E', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--text-inverse)', cursor: modalSaving ? 'not-allowed' : 'pointer', opacity: modalSaving ? 0.7 : 1 }}>
                    {modalSaving ? 'Guardando...' : 'Guardar Usuario'}
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* CONFIRM DIALOG */}
      {confirmDialog.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--text-inverse)', width: '100%', maxWidth: '400px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            <div style={{ background: 'var(--bg-app)', padding: '16px 24px', borderBottom: '1px solid #DBE3E0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>Confirmar Acción</h3>
            </div>
            <div style={{ padding: '24px' }}>
              <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: 'var(--text-muted)' }}>{confirmDialog.message}</p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button onClick={() => setConfirmDialog({ isOpen: false, type: '', payload: null, message: '' })} style={{ padding: '10px 16px', background: 'var(--bg-app)', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button onClick={executeConfirmAction} style={{ padding: '10px 16px', background: confirmDialog.type === 'DELETE' ? '#ef4444' : '#0F766E', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--text-inverse)', cursor: 'pointer' }}>
                  Aceptar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}