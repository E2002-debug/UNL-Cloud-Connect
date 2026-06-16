import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { listarSensores, crearSensor, actualizarSensor, eliminarSensor } from '../../../services/climaService'
import { listarUbicaciones } from '../../../services/ubicacionService'

const IconAdd = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
const IconThermostat = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path></svg>
const IconHumidity = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>
const IconBattery = ({ level }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={level <= 20 ? '#ef4444' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="6" width="18" height="12" rx="2" ry="2"></rect>
    <line x1="23" y1="11" x2="23" y2="13"></line>
  </svg>
)
const IconRouter = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="14" width="20" height="8" rx="2"></rect><path d="M6 14v-4M10 14v-4M14 14v-4M18 14v-4M12 2v4"></path></svg>
const IconCpu = () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0F766E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="15" x2="23" y2="15"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="15" x2="4" y2="15"></line></svg>
const IconEdit = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
const IconDelete = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
const IconClose = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>

const inputStyle = { width: '100%', padding: '10px 12px', background: 'var(--bg-app)', border: '1px solid #DBE3E0', borderRadius: '6px', fontSize: '13px', color: 'var(--text-main)', outline: 'none', boxSizing: 'border-box' }
const labelStyle = { display: 'block', fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.5px', textTransform: 'uppercase' }

export default function Sensors() {
  const [sensores, setSensores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState(null)
  const [formData, setFormData] = useState({ nombre: '', topico_mqtt: '' })
  const [ubicacionesMap, setUbicacionesMap] = useState({})

  const cargarSensores = async () => {
    setLoading(true)
    setError('')
    try {
      const [sensoresData, ubicacionesData] = await Promise.all([
        listarSensores(),
        listarUbicaciones()
      ])
      setSensores(sensoresData)
      const map = {}
      ubicacionesData.forEach(ubi => { map[ubi.id_ubicacion] = ubi.nombre_lugar })
      setUbicacionesMap(map)
    } catch (err) {
      setError('No se pudieron cargar los sensores.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarSensores() }, [])

  const openCreate = () => {
    setEditando(null)
    setFormData({ nombre: '', topico_mqtt: '' })
    setModalOpen(true)
  }

  const openEdit = (s) => {
    setEditando(s)
    setFormData({ nombre: s.nombre, topico_mqtt: s.topico_mqtt })
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        nombre: formData.nombre,
        topico_mqtt: formData.topico_mqtt,
        tipo: 'DHT22',
      }

      if (editando) {
        await actualizarSensor(editando.id_sensor, payload)
        toast.success(`Sensor "${payload.nombre}" actualizado`)
      } else {
        await crearSensor(payload)
        toast.success(`Sensor "${payload.nombre}" creado`)
      }
      setModalOpen(false)
      cargarSensores()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al guardar sensor')
    }
  }

  const handleDelete = async (s) => {
    if (!window.confirm(`¿Desactivar sensor "${s.nombre}"?`)) return
    try {
      await eliminarSensor(s.id_sensor)
      toast.success(`Sensor "${s.nombre}" desactivado`)
      cargarSensores()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al eliminar sensor')
    }
  }

  const isOnline = (s) => s.estado === 'online'

  const getUbicacionLabel = (s) => {
    if (!s.id_ubicacion) return 'Sin ubicación'
    return ubicacionesMap[s.id_ubicacion] || `ID: ${s.id_ubicacion}`
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900', fontStyle: 'italic', color: 'var(--text-main)', textTransform: 'uppercase' }}>
            Monitoreo de Sensores
          </h2>
          <div style={{ fontSize: '10px', fontWeight: '800', color: '#0F766E', letterSpacing: '1px', marginTop: '4px' }}>
            TELEMETRÍA EN TIEMPO REAL Y ESTADO DE SALUD DE NODOS CAMPUS LOJA
          </div>
        </div>
        <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', border: 'none', borderRadius: '0px', fontSize: '11px', fontWeight: '700', color: 'white', background: '#0F766E', cursor: 'pointer' }}>
          <IconAdd /> AGREGAR NODO
        </button>
      </div>

      {loading ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid #DBE3E0', padding: '80px 24px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '600' }}>
          Cargando sensores...
        </div>
      ) : error ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid #DBE3E0', padding: '80px 24px', textAlign: 'center', color: '#ef4444', fontWeight: '600' }}>
          {error}
        </div>
      ) : sensores.length === 0 ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid #DBE3E0', padding: '80px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '24px' }}>
          <IconCpu />
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '900', fontStyle: 'italic', color: 'var(--text-main)', textTransform: 'uppercase' }}>
              No se encontraron nodos IoT activos
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto', lineHeight: '1.5' }}>
              La red central no registra tramas de telemetría entrantes en la base de datos de Loja. Presiona "Agregar Nodo" para aprovisionar hardware en el sistema.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          {sensores.map((s) => {
            const online = isOnline(s)
            return (
              <div key={s.id_sensor} style={{ background: 'var(--bg-card)', border: '1px solid #DBE3E0', borderTop: `4px solid ${online ? '#10b981' : '#ef4444'}`, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '9px', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>IDENTIFICADOR NODO</div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: 'var(--text-main)', fontStyle: 'italic' }}>{s.nombre}</h3>
                  </div>
                  <span style={{ padding: '4px 8px', fontSize: '10px', fontWeight: '700', border: '1px solid #DBE3E0', background: online ? '#e6f4ea' : '#fce8e6', color: online ? '#0F766E' : '#ef4444' }}>
                    {s.estado.toUpperCase()}
                  </span>
                </div>

                <div style={{ fontSize: '11px', fontWeight: '700', color: s.id_ubicacion ? '#0F766E' : '#ef4444' }}>
                  {s.id_ubicacion ? `Ubicación: ${getUbicacionLabel(s)}` : 'Sin ubicación asignada'}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ background: 'var(--bg-app)', border: '1px solid #DBE3E0', padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', marginBottom: '4px', fontSize: '10px', fontWeight: '700' }}>
                      <IconThermostat /> TEMP
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: online ? '#0F766E' : 'var(--text-muted)' }}>--°C</div>
                  </div>
                  <div style={{ background: 'var(--bg-app)', border: '1px solid #DBE3E0', padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', marginBottom: '4px', fontSize: '10px', fontWeight: '700' }}>
                      <IconHumidity /> HUMEDAD
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: online ? '#0F766E' : 'var(--text-muted)' }}>--%</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', borderTop: '1px solid #DBE3E0', borderBottom: '1px solid #DBE3E0', padding: '10px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', color: 'var(--text-main)' }}>
                    <IconBattery level={s.bateria || 0} /> {s.bateria != null ? `${s.bateria}%` : 'N/A'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', color: '#0F766E', fontSize: '10px' }}>
                    <IconRouter /> {s.tipo}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>
                  <span>Tópico: {s.topico_mqtt}</span>
                  {s.ultima_conexion && (
                    <span>Última conexión: {new Date(s.ultima_conexion).toLocaleString()}</span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => openEdit(s)} style={{ flex: 1, padding: '8px', border: '1px solid #cbd5e1', background: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <IconEdit /> EDITAR
                  </button>
                  <button onClick={() => handleDelete(s)} style={{ flex: 1, padding: '8px', border: '1px solid #fca5a5', background: '#fee2e2', color: '#ef4444', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <IconDelete /> DESACTIVAR
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: 'var(--text-inverse)', width: '100%', maxWidth: '480px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ background: 'var(--bg-app)', padding: '16px 24px', borderBottom: '1px solid #DBE3E0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>
                {editando ? 'EDITAR NODO SENSOR' : 'REGISTRAR NUEVO NODO'}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><IconClose /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Nombre del Nodo</label>
                <input required type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Ej: Sensor Lab 304" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Tópico MQTT</label>
                <input required type="text" value={formData.topico_mqtt} onChange={e => setFormData({...formData, topico_mqtt: e.target.value})} placeholder="unl/clima/sensor_01" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Tipo de Sensor</label>
                <div style={{ padding: '10px 12px', background: 'var(--bg-app)', border: '1px solid #DBE3E0', borderRadius: '6px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '700' }}>
                  DHT22
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                <button type="button" onClick={() => setModalOpen(false)} style={{ padding: '10px 20px', background: 'var(--bg-app)', border: '1px solid #DBE3E0', borderRadius: '6px', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', cursor: 'pointer' }}>CANCELAR</button>
                <button type="submit" style={{ padding: '10px 24px', background: '#0F766E', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '700', color: 'white', cursor: 'pointer' }}>
                  {editando ? 'GUARDAR CAMBIOS' : 'CREAR NODO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid #DBE3E0', padding: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: '800', color: '#0F766E', letterSpacing: '1px', marginBottom: '8px' }}>ESTADO DE MALLA DE SENSORES</div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900', fontStyle: 'italic', color: 'var(--text-main)', marginBottom: '12px' }}>RED CENTRAL CAMPUS</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: 'var(--text-muted)', maxWidth: '480px', lineHeight: '1.5' }}>
              Estabilidad general del ecosistema de tramas centralizadas fijado en un entorno distribuido de Loja.
            </p>
            <div style={{ display: 'flex', gap: '16px', fontSize: '11px', fontWeight: '700' }}>
              <span style={{ color: '#0F766E' }}>● {sensores.filter(s => isOnline(s)).length} NODOS ONLINE</span>
              <span style={{ color: 'var(--text-muted)' }}>● {sensores.filter(s => !isOnline(s)).length} NODOS OFFLINE</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '60px', background: 'var(--bg-app)', padding: '12px', border: '1px solid #DBE3E0' }}>
            {sensores.slice(0, 7).map((s, i) => (
              <div key={i} style={{ width: '8px', background: isOnline(s) ? '#0F766E' : '#DBE3E0', height: `${isOnline(s) ? 60 + Math.random() * 40 : 10}%` }}></div>
            ))}
          </div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid #DBE3E0', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '9px', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '4px' }}>MANTENIMIENTO</div>
            <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {sensores.length === 0 ? 'INFRAESTRUCTURA VACÍA' : `${sensores.length} SENSORES REGISTRADOS`}
            </div>
            <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
              {sensores.length === 0
                ? 'El panel está listo para recibir información de la pasarela local o peticiones HTTP POST desde tus microcontroladores.'
                : `Hay ${sensores.length} sensores registrados en el sistema. ${sensores.filter(s => isOnline(s)).length} en línea.`}
            </p>
          </div>
          <button style={{ width: '100%', padding: '8px', background: 'var(--bg-app)', border: '1px solid #DBE3E0', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', marginTop: '12px' }} disabled>
            {sensores.filter(s => s.estado === 'offline').length > 0 ? `${sensores.filter(s => s.estado === 'offline').length} ALERTAS` : 'SIN ALERTAS'}
          </button>
        </div>
      </div>
    </div>
  )
}
