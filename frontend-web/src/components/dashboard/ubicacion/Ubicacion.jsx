import React, { useState, useEffect, useCallback } from 'react'
import { listarUbicaciones, crearUbicacion, actualizarUbicacion, eliminarUbicacion } from '../../../services/ubicacionService'

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
  latitud: '',
  longitud: '',
}

export default function Ubicacion({ userRole }) {
  const isSuperAdmin = userRole === '3'

  const [ubicaciones, setUbicaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [direcciones, setDirecciones] = useState({})

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

  const handleOpenCreate = () => {
    setForm(initialForm)
    setModalMode('create')
    setModalError('')
    setModalOpen(true)
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
        await crearUbicacion(payload)
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
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.5px' }}>DIRECCIÓN ALFANUMÉRICA</label>
            <input name="direccion_alfa_numerica" value={form.direccion_alfa_numerica} onChange={handleChange} placeholder="Ej: Calle 10 y Av. Universitaria" style={{ width: '100%', padding: '10px 12px', border: '1px solid #DBE3E0', borderRadius: '6px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.5px' }}>LATITUD *</label>
              <input name="latitud" value={form.latitud} onChange={handleChange} required type="number" step="any" placeholder="-4.032" style={{ width: '100%', padding: '10px 12px', border: '1px solid #DBE3E0', borderRadius: '6px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.5px' }}>LONGITUD *</label>
              <input name="longitud" value={form.longitud} onChange={handleChange} required type="number" step="any" placeholder="-79.204" style={{ width: '100%', padding: '10px 12px', border: '1px solid #DBE3E0', borderRadius: '6px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
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
        <div style={{ background: 'var(--bg-card)', border: '1px solid #DBE3E0', padding: '80px 24px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '600' }}>
          Cargando ubicaciones...
        </div>
      ) : error ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid #DBE3E0', padding: '80px 24px', textAlign: 'center', color: '#ef4444', fontWeight: '600' }}>
          {error}
        </div>
      ) : ubicaciones.length === 0 ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid #DBE3E0', padding: '80px 24px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '600' }}>
          No hay ubicaciones registradas.
        </div>
      ) : (
        <div style={{ background: 'var(--bg-card)', border: '1px solid #DBE3E0', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-app)', borderBottom: '1px solid #DBE3E0' }}>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>LUGAR</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>DIRECCIÓN</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>UBICACIÓN</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>CALLES</th>
                  {isSuperAdmin && (
                    <>
                      <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>ROL</th>
                      <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>ESTADO</th>
                      <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px', textAlign: 'center' }}>ACCIONES</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {ubicaciones.map((loc) => {
                  const dir = direcciones[loc.id_ubicacion]
                  return (
                    <tr
                      key={loc.id_ubicacion}
                      style={{ borderBottom: '1px solid #f1f5f9' }}
                      onMouseOver={e => e.currentTarget.style.background = 'var(--bg-app)'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '16px 24px', fontWeight: '700', color: 'var(--text-main)' }}>
                        {loc.nombre_lugar}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>
                        {loc.direccion_alfa_numerica || '—'}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>
                        {dir?.display || '—'}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>
                        {dir?.road || '—'}
                      </td>
                      {isSuperAdmin && (
                        <>
                          <td style={{ padding: '16px 24px' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '4px 10px',
                              fontSize: '10px',
                              fontWeight: '700',
                              borderRadius: '999px',
                              background: loc.id_rol_creador === 3 ? '#ede9fe' : '#dbeafe',
                              color: loc.id_rol_creador === 3 ? '#5b21b6' : '#1d4ed8',
                            }}>
                              {loc.id_rol_creador === 3 ? 'SUPER ADMIN' : 'ADMIN'}
                            </span>
                          </td>
                          <td style={{ padding: '16px 24px' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '4px 10px',
                              fontSize: '10px',
                              fontWeight: '700',
                              borderRadius: '999px',
                              background: loc.activo ? '#d1fae5' : '#fee2e2',
                              color: loc.activo ? '#065f46' : '#991b1b',
                            }}>
                              {loc.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td style={{ padding: '16px 24px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <button
                            onClick={() => handleOpenEdit(loc)}
                            style={{ padding: '6px 14px', border: '1px solid #DBE3E0', borderRadius: '4px', background: 'white', fontSize: '11px', fontWeight: '600', cursor: 'pointer', color: '#0F766E', marginRight: '8px' }}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(loc)}
                            style={{ padding: '6px 14px', border: '1px solid #fca5a5', borderRadius: '4px', background: '#fef2f2', fontSize: '11px', fontWeight: '600', cursor: 'pointer', color: '#ef4444' }}
                          >
                            Eliminar
                          </button>
                          </td>
                        </>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && renderModal()}
      {deleteConfirm && renderDeleteConfirm()}
      {renderToast()}
    </div>
  )
}
