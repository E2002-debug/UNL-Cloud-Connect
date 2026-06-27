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

// Interceptor global de respuestas: traduce errores técnicos a mensajes claros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const detailFromServer = error?.response?.data?.detail

    // Si el servidor ya envió un mensaje claro, lo usamos directamente
    if (detailFromServer && typeof detailFromServer === 'string') {
      return Promise.reject(new Error(detailFromServer))
    }

    // Traducción de códigos HTTP a mensajes amigables
    const mensajes = {
      400: 'Los datos enviados no son válidos. Por favor revisa la información.',
      401: 'Sesión expirada o no autorizado. Por favor inicia sesión nuevamente.',
      403: 'No tienes permiso para realizar esta acción.',
      404: 'El recurso solicitado no existe.',
      408: 'La solicitud tardó demasiado. Verifica tu conexión a internet.',
      409: 'Ya existe un registro con esos datos.',
      422: 'Hay un error en los datos enviados. Por favor revisa los campos.',
      429: 'Demasiados intentos. Por favor espera unos minutos antes de intentar de nuevo.',
      500: 'Error interno del servidor. Por favor intenta más tarde.',
      502: 'El servicio no está disponible en este momento. Por favor intenta en unos segundos.',
      503: 'El servicio está en mantenimiento. Por favor intenta más tarde.',
      504: 'El servidor tardó demasiado en responder. Por favor intenta de nuevo.',
    }

    const mensaje = mensajes[status] || 'Ocurrió un error inesperado. Por favor intenta de nuevo.'
    return Promise.reject(new Error(mensaje))
  }
)

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
export const getAuditoria = () => api.get('/auditoria/')

export default api