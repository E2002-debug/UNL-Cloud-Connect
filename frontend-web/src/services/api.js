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

export const login = (payload) => api.post('/auth/login', payload)
export const loginGoogle = (payload) => api.post('/auth/login-google', payload)
export const register = (payload) => api.post('/auth/registro', payload)
export const googleRegister = (payload) => api.post('/auth/google-register', payload)
export const registroHibrido = (payload) => api.post('/auth/registro-hibrido', payload)
export const sendRecovery = (payload) => api.post('/auth/recover', payload)
export const resetPassword = (payload) => api.post('/auth/reset-password', payload)

export default api

