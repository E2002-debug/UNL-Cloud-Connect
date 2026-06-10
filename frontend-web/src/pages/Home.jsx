import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()

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

      {/* 4. Pie de Página (Footer) */}
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