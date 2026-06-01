import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../services/api'

export default function Register() {
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    clave: '',
    fecha_nacimiento: '',
    id_rol: '2' // Se predefine '2' (Participante) para evitar que rompa en base de datos
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const nav = useNavigate()

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!form.nombre || !form.apellido || !form.correo || !form.clave || !form.fecha_nacimiento) {
      setError('Por favor, completa todos los campos requeridos.')
      return
    }

    const cleanEmail = form.correo.trim().toLowerCase()
    if (!cleanEmail.endsWith('@unl.edu.ec')) {
      setError('El correo debe pertenecer al dominio @unl.edu.ec')
      return
    }

    setLoading(true)
    try {
      const payload = { ...form, correo: cleanEmail, id_rol: parseInt(form.id_rol, 10) || 2 }
      await register(payload)
      nav('/login')
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Error en el registro')
      setLoading(false)
    }
  }

  // Estilo base reutilizado para los inputs del formulario
  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    background: '#f4f7fa',
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none'
  }

  // Estilo base para las etiquetas/labels
  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: '8px'
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f4f7fa',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px'
    }}>
      {/* Card Principal - Doble Columna Uniforme */}
      <div style={{
        maxWidth: '960px',
        width: '100%',
        background: '#fff',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        overflow: 'hidden'
      }}>
        
        {/* Columna Izquierda - Panel Azul Coherente */}
        <div style={{
          flex: 1,
          background: 'linear-gradient(135deg, #1a56c9 0%, #103783 100%)',
          color: '#fff',
          padding: '60px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '550px'
        }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 40px 0' }}>UNL-Cloud-Connect</h1>
          </div>

          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 24px 0', lineHeight: '1.4' }}>
              Crea tu cuenta en el ecosistema
            </h2>
            <p style={{ fontSize: '15px', lineHeight: '1.7', margin: '0', opacity: '0.95' }}>
              Regístrate en nuestro prototipo académico para acceder a los módulos de monitoreo climático, control de eventos de la facultad y servicios distribuidos en la nube de la FEIRNNR.
            </p>
          </div>

          <div style={{
            fontSize: '13px',
            fontWeight: '600',
            opacity: '0.8',
            borderTop: '1px solid rgba(255, 255, 255, 0.2)',
            paddingTop: '20px'
          }}>
            Proyecto de Fin de Ciclo - Prototipo
          </div>
        </div>

        {/* Columna Derecha - Formulario Adaptado */}
        <div style={{
          flex: 1,
          padding: '40px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0', color: '#1a1a1a' }}>
            Registro de Usuario
          </h2>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 24px 0' }}>
            Regístrate utilizando tu dirección de correo institucional.
          </p>

          {error && (
            <div style={{
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              color: '#dc2626',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Fila: Nombre y Apellido */}
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Ej. Lisbeth"
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Apellido</label>
                <input
                  type="text"
                  name="apellido"
                  value={form.apellido}
                  onChange={handleChange}
                  placeholder="Ej. Cale"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Correo Institucional */}
            <div>
              <label style={labelStyle}>Correo Institucional</label>
              <input
                type="email"
                name="correo"
                value={form.correo}
                onChange={handleChange}
                placeholder="usuario@unl.edu.ec"
                style={inputStyle}
              />
            </div>

            {/* Contraseña */}
            <div>
              <label style={labelStyle}>Contraseña</label>
              <input
                type="password"
                name="clave"
                value={form.clave}
                onChange={handleChange}
                placeholder="••••••••"
                style={inputStyle}
              />
            </div>

            {/* Fila: Fecha Nacimiento y Rol */}
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Fecha de Nacimiento</label>
                <input
                  type="date"
                  name="fecha_nacimiento"
                  value={form.fecha_nacimiento}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Rol del Sistema</label>
                <select
                  name="id_rol"
                  value={form.id_rol}
                  onChange={handleChange}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="2">Participante</option>
                  <option value="1">Administrador</option>
                </select>
              </div>
            </div>

            {/* Botón Guardar / Enviar */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '8px',
                border: 'none',
                background: '#103783',
                color: '#fff',
                fontSize: '15px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '10px',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Creando cuenta...' : (
                <>
                  Crear cuenta
                  <span style={{ fontSize: '18px' }}>→</span>
                </>
              )}
            </button>
          </form>

          {/* Separador e Intercambio a Login */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', gap: '12px' }}>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
          </div>

          <div style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login" style={{ color: '#1a56c9', fontWeight: '600', textDecoration: 'none' }}>
              Inicia sesión aquí
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}