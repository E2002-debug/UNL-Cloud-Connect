import React, { useState } from 'react';

// --- Iconos SVG Adaptados al Estilo de tu Ecosistema ---
const IconFilter = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>;
const IconAdd = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const IconThermostat = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path></svg>;
const IconHumidity = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>;
const IconBattery = ({ level }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={level === 0 ? '#ef4444' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="6" width="18" height="12" rx="2" ry="2"></rect>
    <line x1="23" y1="11" x2="23" y2="13"></line>
  </svg>
);
const IconRouter = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="14" width="20" height="8" rx="2"></rect><path d="M6 14v-4M10 14v-4M14 14v-4M18 14v-4M12 2v4"></path></svg>;
const IconWarning = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>;
const IconCpu = () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0F766E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="15" x2="23" y2="15"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="15" x2="4" y2="15"></line></svg>;

export default function Sensors() {
  // Inicializado totalmente vacío como corresponde en producción antes de conectar la API
  const [nodos] = useState([]);

  return (
    <div style={{ width: '100%' }}>
      
      {/* HEADER DE MÓDULO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900', fontStyle: 'italic', color: 'var(--text-main)', textTransform: 'uppercase' }}>
            Monitoreo de Sensores
          </h2>
          <div style={{ fontSize: '10px', fontWeight: '800', color: '#0F766E', letterSpacing: '1px', marginTop: '4px' }}>
            TELEMETRÍA EN TIEMPO REAL Y ESTADO DE SALUD DE NODOS CAMPUS LOJA
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
            border: '1px solid #DBE3E0', borderRadius: '0px', fontSize: '11px', fontWeight: '700',
            color: 'var(--text-main)', background: 'var(--bg-card)', cursor: 'pointer'
          }}>
            <IconFilter /> FILTRAR
          </button>
          <button style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
            border: 'none', borderRadius: '0px', fontSize: '11px', fontWeight: '700',
            color: 'white', background: '#0F766E', cursor: 'pointer'
          }}>
            <IconAdd /> AGREGAR NODO
          </button>
        </div>
      </div>

      {/* RENDERIZADO CONDICIONAL: SI NO HAY NODOS MUESTRA EL MENSAJE DE ESTADO VACÍO */}
      {nodos.length === 0 ? (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid #DBE3E0',
          padding: '80px 24px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          marginBottom: '24px'
        }}>
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
        /* GRID DE TARJETAS (SE ACTIVA CUANDO INTRODUZCAS DATOS REALES) */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          {nodos.map((nodo) => {
            const isOnline = nodo.estado === 'ACTIVO';
            return (
              <div 
                key={nodo.id}
                style={{
                  background: 'var(--bg-card)', 
                  border: '1px solid #DBE3E0', 
                  borderTop: `4px solid ${isOnline ? '#10b981' : '#ef4444'}`,
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '9px', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>IDENTIFICADOR NODO</div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: 'var(--text-main)', fontStyle: 'italic' }}>{nodo.id}</h3>
                  </div>
                  <span style={{
                    padding: '4px 8px', fontSize: '10px', fontWeight: '700', border: '1px solid #DBE3E0',
                    background: isOnline ? '#e6f4ea' : '#fce8e6', color: isOnline ? '#0F766E' : '#ef4444'
                  }}>
                    {nodo.estado}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ background: 'var(--bg-app)', border: '1px solid #DBE3E0', padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', marginBottom: '4px', fontSize: '10px', fontWeight: '700' }}>
                      <IconThermostat /> TEMP
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: isOnline ? '#0F766E' : 'var(--text-muted)' }}>{nodo.temp}</div>
                  </div>
                  <div style={{ background: 'var(--bg-app)', border: '1px solid #DBE3E0', padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', marginBottom: '4px', fontSize: '10px', fontWeight: '700' }}>
                      <IconHumidity /> HUMEDAD
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: isOnline ? '#0F766E' : 'var(--text-muted)' }}>{nodo.humedad}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', borderTop: '1px solid #DBE3E0', borderBottom: '1px solid #DBE3E0', padding: '10px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', color: 'var(--text-main)' }}>
                    <IconBattery level={nodo.bateria} /> {nodo.bateria}%
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', color: '#0F766E', fontSize: '10px' }}>
                    <IconRouter /> {nodo.tipo}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={{
                    flex: 1, padding: '8px', border: '1px solid #cbd5e1', background: 'var(--bg-app)',
                    color: 'var(--text-main)', fontSize: '11px', fontWeight: '700', cursor: 'pointer'
                  }}>
                    {isOnline ? 'REINICIAR' : '⚡ ACTIVAR'}
                  </button>
                  <button style={{
                    flex: 1, padding: '8px', border: '1px solid #cbd5e1', background: 'var(--bg-app)',
                    color: 'var(--text-main)', fontSize: '11px', fontWeight: '700', cursor: 'pointer'
                  }}>
                    VER LOGS
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SECCIÓN INFERIOR COMPLEMENTARIA INMUTABLE EN VERDE */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div style={{
          background: 'var(--bg-card)', border: '1px solid #DBE3E0', padding: '32px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: '800', color: '#0F766E', letterSpacing: '1px', marginBottom: '8px' }}>ESTADO DE MALLA DE SENSORES</div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900', fontStyle: 'italic', color: 'var(--text-main)', marginBottom: '12px' }}>RED CENTRAL CAMPUS</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: 'var(--text-muted)', maxWidth: '480px', lineHeight: '1.5' }}>
              Estabilidad general del ecosistema de tramas centralizadas fijado en un entorno distribuido de Loja.
            </p>
            <div style={{ display: 'flex', gap: '16px', fontSize: '11px', fontWeight: '700' }}>
              <span style={{ color: 'var(--text-muted)' }}>● 0 NODOS PROCESANDO</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '60px', background: 'var(--bg-app)', padding: '12px', border: '1px solid #DBE3E0' }}>
            {[10, 10, 10, 10, 10, 10, 10].map((h, i) => (
              <div key={i} style={{ width: '8px', background: '#DBE3E0', height: `${h}%` }}></div>
            ))}
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid #DBE3E0', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '9px', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '4px' }}>MANTENIMIENTO</div>
            <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <IconWarning /> INFRAESTRUCTURA VACÍA
            </div>
            <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
              El panel está listo para recibir información de la pasarela local o peticiones HTTP POST desde tus microcontroladores.
            </p>
          </div>
          <button style={{
            width: '100%', padding: '8px', background: 'var(--bg-app)', border: '1px solid #DBE3E0',
            color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', cursor: 'not-allowed', marginTop: '12px'
          }} disabled>
            SIN ALERTAS
          </button>
        </div>

      </div>

    </div>
  );
}