import api from '../api'

export const getEventos = async () => {
  const response = await api.get('/eventos/activos')
  return response.data
}

export const createEvento = async (data) => {
  const response = await api.post('/eventos/', data)
  return response.data
}

export const updateEvento = async (id, data) => {
  const response = await api.put(`/eventos/${id}`, data)
  return response.data
}

export const deleteEvento = async (id) => {
  const response = await api.delete(`/eventos/${id}`)
  return response.data
}

export const getUbicaciones = async () => {
  const response = await api.get('/eventos/ubicaciones/')
  return response.data
}

export const createUbicacion = async (data) => {
  const response = await api.post('/eventos/ubicaciones/', data)
  return response.data
}
