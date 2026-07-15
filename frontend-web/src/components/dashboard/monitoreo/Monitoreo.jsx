import React, { useState, useEffect } from 'react'
import { getAuditoria } from '../../../services/api'
import toast from 'react-hot-toast'

const IconActivity = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>

export default function Monitoreo() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await getAuditoria()
      setLogs(res.data)
    } catch (err) {
      toast.error('No se pudieron cargar los registros de auditoría')
    } finally {
      setLoading(false)
    }
  }

  const getBadgeStyle = (accion) => {
    switch (accion) {
      case 'LOGIN_EXITOSO': return { background: '#10b981', color: 'white' }
      case 'LOGIN_FALLIDO': return { background: '#ef4444', color: 'white' }
      case 'CAMBIO_ROL': return { background: '#8b5cf6', color: 'white' }
      case 'CREACION_USUARIO': return { background: '#3b82f6', color: 'white' }
      case 'ELIMINACION_USUARIO': return { background: '#475569', color: 'white' }
      case 'ACTUALIZACION_PERFIL': return { background: '#f59e0b', color: 'white' }
      case 'CAMBIO_CLAVE': return { background: '#ec4899', color: 'white' }
      default: return { background: '#dbeafe', color: '#1e40af' }
    }
  }

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid #DBE3E0', padding: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <IconActivity />
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: 'var(--text-main)' }}>MONITOREO DE DATOS Y AUDITORÍA</h2>
          </div>
          <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
            REGISTRO DE INICIOS DE SESIÓN Y CAMBIOS DE CLAVE
          </div>
        </div>
        <button 
          onClick={fetchLogs}
          style={{ padding: '8px 16px', background: 'var(--text-main)', color: 'var(--text-inverse)', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
        >
          ACTUALIZAR
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #DBE3E0', background: 'var(--bg-app)' }}>
              <th style={{ padding: '12px', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '1px' }}>FECHA Y HORA</th>
              <th style={{ padding: '12px', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '1px' }}>CORREO</th>
              <th style={{ padding: '12px', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '1px' }}>ACCIÓN</th>
              <th style={{ padding: '12px', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '1px' }}>IP ORIGEN</th>
              <th style={{ padding: '12px', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '1px' }}>DETALLES</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ padding: '32px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
                  Cargando registros...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '32px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
                  No hay registros de auditoría disponibles
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id_log} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                  <td style={{ padding: '16px 12px', fontSize: '11px', color: 'var(--text-main)', fontWeight: '600' }}>
                    {new Date(log.fecha_hora + (log.fecha_hora.endsWith('Z') ? '' : 'Z')).toLocaleString()}
                  </td>
                  <td style={{ padding: '16px 12px', fontSize: '11px', color: 'var(--text-main)', fontWeight: '600' }}>
                    {log.correo || '-'}
                  </td>
                  <td style={{ padding: '16px 12px' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      fontSize: '10px', 
                      fontWeight: '700', 
                      borderRadius: '4px',
                      ...getBadgeStyle(log.accion)
                    }}>
                      {log.accion}
                    </span>
                  </td>
                  <td style={{ padding: '16px 12px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {log.ip_origen || '-'}
                  </td>
                  <td style={{ padding: '16px 12px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>
                    {log.detalles || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
