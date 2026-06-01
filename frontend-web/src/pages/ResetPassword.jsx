import React, {useState} from 'react'
import AuthLayout from '../components/AuthLayout'
import Input from '../components/Input'
import Button from '../components/Button'
import { resetPassword } from '../services/api'
import { useNavigate } from 'react-router-dom'

export default function ResetPassword(){
  const [form,setForm] = useState({clave:'', confirm:'', token: ''})
  const [error,setError] = useState(null)
  const nav = useNavigate()

  const handleChange = (e) => setForm({...form, [e.target.name]: e.target.value})

  const submit = async (e) =>{
    e.preventDefault(); setError(null)
    if(form.clave !== form.confirm){ setError('Las contraseñas no coinciden'); return }
    try{ await resetPassword({token: form.token, clave: form.clave}); nav('/login') }catch(err){ setError('Error al restablecer') }
  }

  return (
    <AuthLayout title="Cambiar contraseña">
      <form onSubmit={submit} className="space-y-4">
        <Input label="Nueva contraseña" type="password" name="clave" value={form.clave} onChange={handleChange} />
        <Input label="Confirmar contraseña" type="password" name="confirm" value={form.confirm} onChange={handleChange} />
        <Input label="Token" name="token" value={form.token} onChange={handleChange} placeholder="Código recibido en el correo" />
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="flex justify-end">
          <Button type="submit">Actualizar contraseña</Button>
        </div>
      </form>
    </AuthLayout>
  )
}
