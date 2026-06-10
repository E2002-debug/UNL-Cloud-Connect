const BASE = 'http://localhost:8000'

export const post = async (path, body) => {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  return res.json()
}

export const login = (payload) => post('/auth/login', payload)
export const loginGoogle = (payload) => post('/auth/login-google', payload)
export const register = (payload) => post('/auth/registro', payload)
export const googleRegister = (payload) => post('/auth/google-register', payload)
export const registroHibrido = (payload) => post('/auth/registro-hibrido', payload)
export const sendRecovery = (payload) => post('/auth/recover', payload)
export const resetPassword = (payload) => post('/auth/reset-password', payload)
