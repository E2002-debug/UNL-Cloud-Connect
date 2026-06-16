import axios from 'axios'

// Usar la URL base desde variables de entorno, con fallback a Kong gateway
// IMPORTANTE: Incluir /api en la ruta porque Kong enruta desde /api/*
const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true  // Incluir cookies y credenciales en las peticiones
})

// Interceptor para inyectar el token JWT en todas las peticiones
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

// Endpoints de Autenticación
export const login = (payload) => api.post('/auth/login', payload)
export const loginGoogle = (payload) => api.post('/auth/login-google', payload)
export const register = (payload) => api.post('/auth/registro', payload)
export const googleRegister = (payload) => api.post('/auth/google-register', payload)
export const registroHibrido = (payload) => api.post('/auth/registro-hibrido', payload)
export const sendRecovery = (payload) => api.post('/auth/solicitar-recuperacion', payload)
export const resetPassword = (payload) => api.post('/auth/restablecer-clave', payload)
export const verificarCuenta = (token) => api.post(`/auth/verificar-cuenta?token=${encodeURIComponent(token)}`)
export const reenviarVerificacion = (payload) => api.post('/auth/reenviar-verificacion', payload)

// Endpoints de Gestión de Usuarios (Requieren Rol Administrador)
export const getUsers = () => api.get('/usuarios/')
export const updateUser = (id, payload) => api.put(`/usuarios/${id}`, payload)
export const deleteUser = (id) => api.delete(`/usuarios/${id}`)

export const updateMe = (payload) => api.put('/usuarios/me', payload)

export default api