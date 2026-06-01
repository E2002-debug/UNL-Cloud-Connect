import React, {useState} from 'react'
import AuthLayout from '../components/AuthLayout'
import Input from '../components/Input'
import Button from '../components/Button'
import { sendRecovery } from '../services/api'
import { useNavigate } from 'react-router-dom'

export default function Recover(){
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState(null)
  const nav = useNavigate()

  const submit = async (e) =>{
    e.preventDefault()
    try{
      await sendRecovery({correo: email})
      setMsg('Correo enviado. Revisa tu bandeja.')
    }catch(err){ setMsg('Error al enviar correo') }
  }

  return (
    <AuthLayout title="Recuperar contraseña">
      <form onSubmit={submit} className="space-y-4">
        <Input label="Correo institucional" name="correo" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="usuario@unl.edu.ar" />
        {msg && <div className="text-sm text-slate-700">{msg}</div>}
        <div className="flex justify-end">
          <Button type="submit">Enviar enlace</Button>
        </div>
      </form>
    </AuthLayout>
  )
}
