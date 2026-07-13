import React, { useState, useEffect, useCallback } from 'react'
import { listarUbicaciones, crearUbicacion, actualizarUbicacion, eliminarUbicacion, listarSensoresSinUbicacion } from '../../../services/ubicacionService'
import { actualizarSensor } from '../../../services/climaService'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const nominatimCache = {}

async function reverseGeocode(lat, lng) {
  const key = `${parseFloat(lat).toFixed(5)},${parseFloat(lng).toFixed(5)}`
  if (nominatimCache[key]) return nominatimCache[key]
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      { headers: { 'Accept-Language': 'es' } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const addr = data?.address || {}
    const result = {
      road: addr.road || addr.pedestrian || addr.cycleway || '',
      display: [addr.suburb, addr.city, addr.town, addr.county]
        .filter(Boolean)
        .slice(0, 2)
        .join(', '),
    }
    nominatimCache[key] = result
    return result
  } catch {
    return null
  }
}

const initialForm = {
  nombre_lugar: '',
  direccion_alfa_numerica: '',
  latitud: -4.032,
  longitud: -79.204,
}

function MapEvents({ setForm }) {
  useMapEvents({
    click(e) {
      setForm(prev => ({
        ...prev,
        latitud: e.latlng.lat,
        longitud: e.latlng.lng
      }))
    }
  })
  return null
}

export default function Ubicacion({ userRole }) {
  const isSuperAdmin = userRole === '3'

  const [ubicaciones, setUbicaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [direcciones, setDirecciones] = useState({})
  const [sensoresDisponibles, setSensoresDisponibles] = useState([])

  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [modalError, setModalError] = useState('')

  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const cargarUbicaciones = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await listarUbicaciones()
      setUbicaciones(data)
      const results = {}
      for (const loc of data) {
        const key = `${parseFloat(loc.latitud).toFixed(5)},${parseFloat(loc.longitud).toFixed(5)}`
        const cached = nominatimCache[key]
        if (cached) {
          results[loc.id_ubicacion] = cached
        } else {
          const r = await reverseGeocode(loc.latitud, loc.longitud)
          if (r) results[loc.id_ubicacion] = r
          if (data.length > 5) await new Promise(r => setTimeout(r, 150))
        }
      }
      setDirecciones(results)
    } catch {
      setError('No se pudieron cargar las ubicaciones.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarUbicaciones()
  }, [cargarUbicaciones])

  const handleOpenCreate = async () => {
    setForm({ ...initialForm, id_sensor: '' })
    setModalMode('create')
    setModalError('')
    setModalOpen(true)
    try {
      const sens = await listarSensoresSinUbicacion()
      setSensoresDisponibles(sens)
    } catch {
      // Ignorar errores al cargar sensores
    }
  }

  const handleOpenEdit = (loc) => {
    setForm({
      nombre_lugar: loc.nombre_lugar || '',
      direccion_alfa_numerica: loc.direccion_alfa_numerica || '',
      latitud: String(loc.latitud ?? ''),
      longitud: String(loc.longitud ?? ''),
    })
    setModalMode('edit')
    setModalError('')
    setModalOpen(true)
    window.__editUbicacionId = loc.id_ubicacion
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setForm(initialForm)
    setModalError('')
    window.__editUbicacionId = null
  }

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setModalError('')
    try {
      const payload = {
        nombre_lugar: form.nombre_lugar,
        direccion_alfa_numerica: form.direccion_alfa_numerica,
        latitud: parseFloat(form.latitud),
        longitud: parseFloat(form.longitud),
      }
      if (modalMode === 'create') {
        const nuevaUbicacion = await crearUbicacion(payload)
        
        // Si seleccionó un sensor, lo actualizamos con el ID de esta nueva ubicación
        if (form.id_sensor) {
          try {
            await actualizarSensor(form.id_sensor, { id_ubicacion: nuevaUbicacion.id_ubicacion })
          } catch (err) {
            console.warn("No se pudo asociar el sensor a la ubicación:", err)
          }
        }
        
        showToast('Ubicación creada exitosamente')
      } else {
        await actualizarUbicacion(window.__editUbicacionId, payload)
        showToast('Ubicación actualizada exitosamente')
      }
      handleCloseModal()
      await cargarUbicaciones()
    } catch (err) {
      setModalError(err?.response?.data?.detail || 'Error al guardar la ubicación.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    setDeleting(true)
    try {
      await eliminarUbicacion(id)
      showToast('Ubicación eliminada exitosamente')
      setDeleteConfirm(null)
      await cargarUbicaciones()
    } catch (err) {
      showToast(err?.response?.data?.detail || 'Error al eliminar la ubicación.', 'error')
      setDeleteConfirm(null)
    } finally {
      setDeleting(false)
    }
  }

  const renderModal = () => (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
      <div style={{ background: 'var(--text-inverse)', width: '100%', maxWidth: '480px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ background: 'var(--bg-app)', padding: '16px 24px', borderBottom: '1px solid #DBE3E0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>
            {modalMode === 'create' ? 'Nueva Ubicación' : 'Editar Ubicación'}
          </h3>
          <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {modalError && (
            <div style={{ background: '#fee2e2', color: '#ef4444', padding: '10px', borderRadius: '6px', fontSize: '12px', marginBottom: '16px' }}>
              {modalError}
            </div>
          )}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.5px' }}>NOMBRE DEL LUGAR *</label>
            <input name="nombre_lugar" value={form.nombre_lugar} onChange={handleChange} required placeholder="Ej: Parque Central" style={{ width: '100%', padding: '10px 12px', border: '1px solid #DBE3E0', borderRadius: '6px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          {modalMode === 'create' && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.5px' }}>VINCULAR SENSOR IOT (OPCIONAL)</label>
            <select name="id_sensor" value={form.id_sensor || ''} onChange={handleChange} style={{ width: '100%', padding: '10px 12px', border: '1px solid #DBE3E0', borderRadius: '6px', fontSize: '13px', outline: 'none', background: 'white' }}>
              <option value="">-- No vincular ninguno --</option>
              {sensoresDisponibles.map(s => (
                <option key={s.id_sensor} value={s.id_sensor}>{s.nombre} ({s.topico_mqtt})</option>
              ))}
            </select>
          </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.5px' }}>LATITUD *</label>
              <input name="latitud" value={form.latitud} onChange={handleChange} required type="number" step="any" placeholder="-4.032" style={{ width: '100%', padding: '10px 12px', border: '1px solid #DBE3E0', borderRadius: '6px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.5px' }}>LONGITUD *</label>
              <input name="longitud" value={form.longitud} onChange={handleChange} required type="number" step="any" placeholder="-79.204" style={{ width: '100%', padding: '10px 12px', border: '1px solid #DBE3E0', borderRadius: '6px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ height: '180px', width: '100%', marginBottom: '16px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #DBE3E0' }}>
            <MapContainer 
              center={[form.latitud || -4.03115, form.longitud || -79.20016]} 
              zoom={18} 
              minZoom={17}
              maxZoom={19}
              maxBounds={[
                [-4.0330, -79.2020], // Suroeste (Muy ajustado al edificio de la foto)
                [-4.0290, -79.1980]  // Noreste
              ]}
              maxBoundsViscosity={1.0}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapEvents setForm={setForm} />
              {form.latitud && form.longitud && (
                <Marker position={[form.latitud, form.longitud]} />
              )}
            </MapContainer>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '4px' }}>Haz clic en el mapa para ubicar el punto exacto (Zona restringida a la Facultad)</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" onClick={handleCloseModal} style={{ padding: '10px 20px', border: '1px solid #DBE3E0', borderRadius: '6px', background: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer', color: 'var(--text-muted)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={submitting} style={{ padding: '10px 20px', border: 'none', borderRadius: '6px', background: '#0F766E', color: 'white', fontSize: '13px', fontWeight: '700', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1 }}>
              {submitting ? 'Guardando...' : modalMode === 'create' ? 'Crear' : 'Actualizar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  const renderDeleteConfirm = () => (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
      <div style={{ background: 'var(--text-inverse)', width: '100%', maxWidth: '400px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ background: 'var(--bg-app)', padding: '16px 24px', borderBottom: '1px solid #DBE3E0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>Confirmar Eliminación</h3>
        </div>
        <div style={{ padding: '24px' }}>
          <p style={{ margin: '0 0 8px', fontSize: '14px', color: 'var(--text-main)' }}>
            ¿Estás seguro de eliminar la ubicación <strong>{deleteConfirm.nombre_lugar}</strong>?
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Esta acción no se puede deshacer.</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button onClick={() => setDeleteConfirm(null)} style={{ padding: '10px 20px', border: '1px solid #DBE3E0', borderRadius: '6px', background: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer', color: 'var(--text-muted)' }}>
              Cancelar
            </button>
            <button onClick={() => handleDelete(deleteConfirm.id_ubicacion)} disabled={deleting} style={{ padding: '10px 20px', border: 'none', borderRadius: '6px', background: '#ef4444', color: 'white', fontSize: '13px', fontWeight: '700', cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.6 : 1 }}>
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderToast = () => {
    if (!toast) return null
    return (
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: toast.type === 'error' ? '#ef4444' : '#0F766E', color: 'white', padding: '12px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000, animation: 'fadeIn 0.2s ease' }}>
        {toast.message}
      </div>
    )
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900', fontStyle: 'italic', color: 'var(--text-main)', textTransform: 'uppercase' }}>
            Ubicaciones
          </h2>
          <div style={{ fontSize: '10px', fontWeight: '800', color: '#0F766E', letterSpacing: '1px', marginTop: '4px' }}>
            ESPACIOS FÍSICOS DEL CAMPUS UNL
          </div>
        </div>
        {isSuperAdmin && (
          <button onClick={handleOpenCreate} style={{ padding: '10px 20px', background: '#0F766E', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
            + NUEVA UBICACIÓN
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid #DBE3E0', padding: '80px 24px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '600', borderRadius: '12px' }}>
          Cargando ubicaciones...
        </div>
      ) : error ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid #DBE3E0', padding: '80px 24px', textAlign: 'center', color: '#ef4444', fontWeight: '600', borderRadius: '12px' }}>
          {error}
        </div>
      ) : ubicaciones.length === 0 ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid #DBE3E0', padding: '80px 24px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '600', borderRadius: '12px' }}>
          No hay ubicaciones registradas.
        </div>
      ) : (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 3fr) 1fr 1fr 100px', background: 'var(--bg-app)', borderBottom: '1px solid var(--border)', padding: '16px 24px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> LUGAR
            </div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg> LATITUD
            </div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg> LONGITUD
            </div>
            <div></div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {ubicaciones.map((loc, i) => {
              const nameLower = loc.nombre_lugar.toLowerCase();
              let iconSvg = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>;
              let bgColor = '#f0fdf4';
              let iconColor = '#16a34a';

              if (nameLower.includes('lab') || nameLower.includes('computación')) {
                iconSvg = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 2v7.31"></path><path d="M14 9.3V1.99"></path><path d="M8.5 2h7"></path><path d="M14 9.3a6.5 6.5 0 1 1-4 0"></path><path d="M5.5 16.5h13"></path></svg>;
                bgColor = '#ecfeff'; iconColor = '#0891b2';
              } else if (nameLower.includes('cafe') || nameLower.includes('comedor')) {
                iconSvg = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>;
                bgColor = '#fef3c7'; iconColor = '#d97706';
              } else if (nameLower.includes('construcción') || nameLower.includes('taller')) {
                iconSvg = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>;
                bgColor = '#eff6ff'; iconColor = '#2563eb';
              } else if (nameLower.includes('admin') || nameLower.includes('oficina')) {
                iconSvg = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>;
                bgColor = '#f3e8ff'; iconColor = '#9333ea';
              }

              return (
                <div key={loc.id_ubicacion} style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 3fr) 1fr 1fr 100px', borderBottom: i === ubicaciones.length - 1 ? 'none' : '1px solid var(--border)', padding: '24px', alignItems: 'center', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'var(--bg-app)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ width: '80px', height: '60px', borderRadius: '8px', background: `linear-gradient(135deg, ${bgColor} 0%, white 100%)`, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor }}>
                      {iconSvg}
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>{loc.nombre_lugar}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{loc.direccion_alfa_numerica || 'Área del campus universitario'}</div>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500', fontFamily: 'monospace', textAlign: 'center' }}>
                    {loc.latitud ? Number(loc.latitud).toFixed(6) : '—'}
                  </div>
                  
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500', fontFamily: 'monospace', textAlign: 'center' }}>
                    {loc.longitud ? Number(loc.longitud).toFixed(6) : '—'}
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
                    {isSuperAdmin ? (
                      <>
                        <button onClick={() => handleOpenEdit(loc)} style={{ background: 'transparent', border: 'none', color: '#0F766E', cursor: 'pointer', padding: '6px' }} title="Editar">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button onClick={() => setDeleteConfirm(loc)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px' }} title="Eliminar">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      </>
                    ) : (
                      <button style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ marginTop: '24px', background: '#ecfdf5', border: '1px solid #d1fae5', borderRadius: '12px', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#059669', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#065f46', fontWeight: '500' }}>Las coordenadas se muestran en el sistema geodésico WGS84 (Grados Decimales).</div>
            <div style={{ fontSize: '11px', color: '#047857' }}>Última actualización: Hoy, {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
          </div>
        </div>
        <button onClick={cargarUbicaciones} style={{ padding: '8px 16px', background: 'white', border: '1px solid #10b981', color: '#059669', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/></svg> Actualizar
        </button>
      </div>

      {modalOpen && renderModal()}
      {deleteConfirm && renderDeleteConfirm()}
      {renderToast()}
    </div>
  )
}
