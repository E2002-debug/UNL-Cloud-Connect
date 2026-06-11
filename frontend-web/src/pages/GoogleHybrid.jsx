import React, { useState, useEffect } from 'react'
import AuthLayout from '../components/AuthLayout'
import Input from '../components/Input'
import Button from '../components/Button'
import { googleRegister, registroHibrido } from '../services/api'
import { useNavigate, useLocation } from 'react-router-dom'

export default function GoogleHybrid({ mode = 'google-register' }) {
  const nav = useNavigate()
  const [form, setForm] = useState({ nombre: '', apellido: '', correo: '', clave: '', fecha_nacimiento: '', id_rol: '2' })
  const [readOnly, setReadOnly] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Simulate receiving google data from OAuth redirect query params
    const params = new URLSearchParams(window.location.search)
    const gname = params.get('nombre') || ''
    const gap = params.get('apellido') || ''
    const gemail = params.get('correo') || ''
    if (gemail) {
      setForm(f => ({ ...f, nombre: gname, apellido: gap, correo: gemail }))
      setReadOnly(true)
    }
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'clave' && /\s/.test(value)) {
      return // Bloquea los espacios físicamente al escribir
    }
    setForm({ ...form, [name]: value })
  }

  const submit = async (e) => {
    e.preventDefault()
    setError(null)

    // Solo validamos la clave si estamos en registro-hibrido o si el usuario ingresó una
    if (form.clave) {
      if (form.clave.length < 8 || form.clave.length > 12) return setError('La contraseña debe tener entre 8 y 12 caracteres.')
      if (/\s/.test(form.clave)) return setError('La contraseña no puede contener espacios.')
      if (!/[A-Z]/.test(form.clave)) return setError('La contraseña debe contener al menos una letra mayúscula.')
      if (!/[a-z]/.test(form.clave)) return setError('La contraseña debe contener al menos una letra minúscula.')
      if (!/\d/.test(form.clave)) return setError('La contraseña debe contener al menos un número.')
      if (!/[^a-zA-Z0-9]/.test(form.clave)) return setError('La contraseña debe contener al menos un carácter especial.')
      if (form.clave.toLowerCase().includes('usuario')) return setError("La contraseña no puede contener la palabra 'usuario'.")
    }

    setLoading(true)
    try {
      if (mode === 'google-register') await googleRegister(form)
      else await registroHibrido(form)
      nav('/login')
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Ocurrió un error en el registro.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title={mode === 'google-register' ? 'Registro con Google' : 'Registro híbrido'}>
      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
          {error}
        </div>
      )}
      <form onSubmit={submit} className="space-y-4">
        <Input label="Nombre" name="nombre" value={form.nombre} onChange={handleChange} readOnly={readOnly} />
        <Input label="Apellido" name="apellido" value={form.apellido} onChange={handleChange} readOnly={readOnly} />
        <Input label="Correo" name="correo" value={form.correo} onChange={handleChange} readOnly={readOnly} />
        <Input label="Clave" type="password" name="clave" value={form.clave} onChange={handleChange} maxLength={12} />
        <Input label="Fecha de nacimiento" type="date" name="fecha_nacimiento" value={form.fecha_nacimiento} onChange={handleChange} />

        <div className="flex justify-end mt-4">
          <Button type="submit" disabled={loading}>
            {loading ? 'Cargando...' : 'Completar registro'}
          </Button>
        </div>
      </form>
    </AuthLayout>
  )
}
