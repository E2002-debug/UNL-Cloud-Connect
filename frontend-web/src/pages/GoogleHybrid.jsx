import React, {useState, useEffect} from 'react'
import AuthLayout from '../components/AuthLayout'
import Input from '../components/Input'
import Button from '../components/Button'
import { googleRegister, registroHibrido } from '../services/api'
import { useNavigate, useLocation } from 'react-router-dom'

export default function GoogleHybrid({mode='google-register'}){
  const nav = useNavigate()
  const [form,setForm] = useState({nombre:'', apellido:'', correo:'', clave:'', fecha_nacimiento:'', id_rol:''})
  const [readOnly, setReadOnly] = useState(false)

  useEffect(()=>{
    // Simulate receiving google data from OAuth redirect query params
    const params = new URLSearchParams(window.location.search)
    const gname = params.get('nombre') || ''
    const gap = params.get('apellido') || ''
    const gemail = params.get('correo') || ''
    if(gemail){
      setForm(f=>({...f, nombre:gname, apellido:gap, correo:gemail}))
      setReadOnly(true)
    }
  },[])

  const handleChange = (e) => setForm({...form, [e.target.name]: e.target.value})

  const submit = async (e) =>{
    e.preventDefault()
    try{
      if(mode==='google-register') await googleRegister(form)
      else await registroHibrido(form)
      nav('/login')
    }catch(err){ console.error(err) }
  }

  return (
    <AuthLayout title={mode==='google-register' ? 'Registro con Google' : 'Registro híbrido'}>
      <form onSubmit={submit} className="space-y-4">
        <Input label="Nombre" name="nombre" value={form.nombre} onChange={handleChange} readOnly={readOnly} />
        <Input label="Apellido" name="apellido" value={form.apellido} onChange={handleChange} readOnly={readOnly} />
        <Input label="Correo" name="correo" value={form.correo} onChange={handleChange} readOnly={readOnly} />
        <Input label="Clave" type="password" name="clave" value={form.clave} onChange={handleChange} />
        <Input label="Fecha de nacimiento" type="date" name="fecha_nacimiento" value={form.fecha_nacimiento} onChange={handleChange} />
        <Input label="id_rol" name="id_rol" value={form.id_rol} onChange={handleChange} />

        <div className="flex justify-end">
          <Button type="submit">Completar registro</Button>
        </div>
      </form>
    </AuthLayout>
  )
}
