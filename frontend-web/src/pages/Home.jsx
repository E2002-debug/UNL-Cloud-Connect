import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getEventos } from '../components/dashboard/events/eventService'

export default function Home() {
  const navigate = useNavigate()
  const [eventos, setEventos] = useState([])

  useEffect(() => {
    getEventos().then(setEventos).catch(() => {})
  }, [])

  // 1. VARIABLES DE PALETA CROMÁTICA (Verde Esmeralda & Menta)
  const colors = {
    bgMain: '#f4f8f6',
    bgCard: '#ffffff',
    textMain: '#1e2925',
    textMuted: '#62726b',
    border: '#dbe3e0',
    accentPrimary: '#10b981', // Verde Esmeralda
    accentHover: '#059669',
    accentMint: '#0f766e',    // Verde profundo para textos institucionales
    mintBright: '#10b981',    // Menta vibrante
    bgHeroGrad: 'linear-gradient(135deg, #ffffff 0%, #eef6f3 100%)',
    bgFooter: '#064e3b'       // Verde bosque profundo para el cierre
  }

  // Estilo para el botón principal (Esmeralda)
  const buttonPrimaryStyle = {
    background: colors.accentPrimary,
    color: '#fff',
    border: 'none',
    padding: '14px 28px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
  }

  // Estilo para el botón secundario (Delineado)
  const buttonSecondaryStyle = {
    background: 'transparent',
    color: colors.accentPrimary,
    border: `2px solid ${colors.accentPrimary}`,
    padding: '12px 26px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  }

  // Tarjetas de características
  const cardStyle = {
    background: colors.bgCard,
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(16, 185, 129, 0.05)',
    flex: '1',
    minWidth: '250px',
    textAlign: 'center',
    border: `1px solid ${colors.border}`
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.bgMain, fontFamily: "'Segoe UI', system-ui, sans-serif", display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. Barra de Navegación Superior (Navbar) */}
      <header style={{
        background: '#fff',
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
        borderBottom: `1px solid ${colors.border}`
      }}>
        <div style={{ fontSize: '20px', fontWeight: '800', color: colors.accentMint }}>
          UNL-Cloud-<span style={{ color: colors.mintBright }}>Connect</span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            onClick={() => navigate('/login')} 
            style={{ ...buttonSecondaryStyle, padding: '8px 16px', fontSize: '14px' }}
            onMouseOver={(e) => { e.target.style.background = '#effaf5' }}
            onMouseOut={(e) => { e.target.style.background = 'transparent' }}
          >
            Iniciar Sesión
          </button>
          <button 
            onClick={() => navigate('/register')} 
            style={{ ...buttonPrimaryStyle, padding: '10px 20px', fontSize: '14px' }}
            onMouseOver={(e) => { e.target.style.background = colors.accentHover }}
            onMouseOut={(e) => { e.target.style.background = colors.accentPrimary }}
          >
            Registrarse
          </button>
        </div>
      </header>

      {/* 2. Sección Principal (Hero Section) */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        textAlign: 'center',
        background: colors.bgHeroGrad
      }}>
        <div style={{ maxWidth: '800px' }}>
          <span style={{
            background: '#e6f4ea',
            color: colors.accentMint,
            padding: '6px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '20px',
            display: 'inline-block',
            border: '1px solid #c2e7cd'
          }}>
            Prototipo Académico — FEIRNNR
          </span>
          
          <h1 style={{ fontSize: '48px', fontWeight: '800', color: colors.textMain, margin: '0 0 24px 0', lineHeight: '1.2' }}>
            Bienvenido al Ecosistema de Servicios Distribuidos de la UNL
          </h1>
          
          <p style={{ fontSize: '18px', color: colors.textMuted, lineHeight: '1.6', margin: '0 0 40px 0', maxWidth: '650px', marginLeft: 'auto', marginRight: 'auto' }}>
            Una plataforma centralizada en la nube local para el monitoreo climático, control IoT mediante estaciones ESP32 y gestión de eventos de nuestra facultad.
          </p>

          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
            <button 
              onClick={() => navigate('/register')} 
              style={buttonPrimaryStyle}
              onMouseOver={(e) => { e.target.style.background = colors.accentHover }}
              onMouseOut={(e) => { e.target.style.background = colors.accentPrimary }}
            >
              Comenzar Ahora →
            </button>
            <button 
              onClick={() => navigate('/login')} 
              style={buttonSecondaryStyle}
              onMouseOver={(e) => { e.target.style.background = '#effaf5' }}
              onMouseOut={(e) => { e.target.style.background = 'transparent' }}
            >
              Ingresar al Sistema
            </button>
          </div>
        </div>
      </main>

      {/* 3. Sección de Características Breves */}
      <section style={{ padding: '60px 40px', background: '#fff' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '30px' }}>
          
          <div style={cardStyle}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>柔️</div>
            <h3 style={{ color: colors.accentMint, margin: '0 0 10px 0', fontWeight: '700' }}>Telemetría IoT</h3>
            <p style={{ color: colors.textMuted, fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
              Captura y visualización en tiempo real de variables climáticas del entorno de la universidad.
            </p>
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>🔐</div>
            <h3 style={{ color: colors.accentMint, margin: '0 0 10px 0', fontWeight: '700' }}>Acceso Institucional</h3>
            <p style={{ color: colors.textMuted, fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
              Autenticación segura integrada con tu correo @unl.edu.ec y soporte para flujo híbrido de Google.
            </p>
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>☁️</div>
            <h3 style={{ color: colors.accentMint, margin: '0 0 10px 0', fontWeight: '700' }}>Arquitectura Cloud</h3>
            <p style={{ color: colors.textMuted, fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
              Estructura moderna basada en Microservicios, API Gateway (Kong) y almacenamiento masivo (MinIO).
            </p>
          </div>

        </div>
      </section>

      {/* 4. Eventos Públicos */}
      <section style={{ padding: "60px 40px", background: "#f4f8f6" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <h2 style={{ margin: "0 0 8px 0", fontSize: "28px", fontWeight: "800", color: "#0F766E", textAlign: "center" }}>
            EVENTOS ACADÉMICOS
          </h2>
          <p style={{ margin: "0 0 32px 0", fontSize: "14px", color: "#62726b", textAlign: "center" }}>
            Eventos que están ocurriendo ahora mismo en nuestra facultad
          </p>
          {(() => {
            const enProgreso = eventos.filter(e => e.estado === "EN_PROGRESO");
            if (enProgreso.length === 0) {
              return <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "13px", fontWeight: "600" }}>No hay eventos en curso en este momento</p>;
            }
            return (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
              {enProgreso.map((evento) => {
                const estado = evento.estado?.replace("_", " ") || "";
                const estadoEstilo = {
                  EN_PROGRESO: { bg: "#d1fae5", color: "#065f46" },
                  PROGRAMADO: { bg: "#dbeafe", color: "#1e40af" },
                  FINALIZADO: { bg: "#e2e8f0", color: "#475569" },
                  CANCELADO: { bg: "#fef2f2", color: "#991b1b" },
                }[evento.estado] || { bg: "#f1f5f9", color: "#334155" };
                return (
                  <div
                    key={evento.id_evento}
                    onClick={() => navigate(`/eventos/${evento.id_evento}`)}
                    style={{
                      background: "white", borderRadius: "12px", overflow: "hidden",
                      border: "1px solid #dbe3e0", cursor: "pointer",
                      transition: "all 0.2s", boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(16,185,129,0.12)"; e.currentTarget.style.transform = "translateY(-2px)" }}
                    onMouseOut={(e) => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)"; e.currentTarget.style.transform = "translateY(0)" }}
                  >
                    {evento.imagen_url ? (
                      <img src={evento.imagen_url} alt={evento.nombre} style={{ width: "100%", height: "160px", objectFit: "cover", display: "block" }} />
                    ) : (
                      <div style={{ width: "100%", height: "160px", background: "linear-gradient(135deg, #eef6f3, #d1e8e0)", display: "flex", alignItems: "center", justifyContent: "center", color: "#0F766E", fontWeight: "700", fontSize: "14px" }}>
                        UNL-Cloud-Connect
                      </div>
                    )}
                    <div style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0F766E", flex: 1 }}>{evento.nombre}</h3>
                        <span style={{ padding: "3px 8px", borderRadius: "4px", fontSize: "9px", fontWeight: "800", background: estadoEstilo.bg, color: estadoEstilo.color, letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
                          {estado}
                        </span>
                      </div>
                      <p style={{ margin: "0 0 10px 0", fontSize: "12px", color: "#62726b", lineHeight: "1.5", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {evento.descripcion}
                      </p>
                      <div style={{ fontSize: "11px", color: "#94a3b8", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                        <span>{evento.ubicacion?.nombre_lugar || `Zona #${evento.id_ubicacion}`}</span>
                        <span>{new Date(evento.fecha_hora_inicio).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            );
          })()}
        </div>
      </section>

      {/* 5. Pie de Página (Footer) */}
      <footer style={{
        background: colors.bgFooter,
        color: '#e6f4ea',
        textAlign: 'center',
        padding: '24px',
        fontSize: '14px',
        fontWeight: '500'
      }}>
        © {new Date().getFullYear()} Universidad Nacional de Loja — Ingeniería en Computación. Proyecto de Fin de Ciclo.
      </footer>

    </div>
  )
}