import api from './api'

const getAdminHeaders = () => ({
  'x-user-id': localStorage.getItem('id_usuario') || '1',
  'x-user-role': localStorage.getItem('id_rol') || '1',
})

export const listarSensores = async () => {
  const response = await api.get('/clima/sensores')
  return response.data
}

export const obtenerSensor = async (id) => {
  const response = await api.get(`/clima/sensores/${id}`)
  return response.data
}

export const obtenerUltimaLectura = async (id) => {
  const response = await api.get(`/clima/sensores/${id}/ultima-lectura`)
  return response.data
}

export const crearSensor = async (data) => {
  const response = await api.post('/clima/sensores/', data, {
    headers: { ...getAdminHeaders() },
  })
  return response.data
}

export const actualizarSensor = async (id, data) => {
  const response = await api.put(`/clima/sensores/${id}`, data, {
    headers: { ...getAdminHeaders() },
  })
  return response.data
}

export const eliminarSensor = async (id) => {
  const response = await api.delete(`/clima/sensores/${id}`, {
    headers: { ...getAdminHeaders() },
  })
  return response.data
}
