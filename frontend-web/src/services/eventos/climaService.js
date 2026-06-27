import api from '../api'

export const getClimaActual = () => api.get('/clima/actual')

export const getSensores = () => api.get('/clima/sensores')

export const createSensor = (data) => api.post('/clima/sensores', data)

export const updateSensor = (id, data) => api.put(`/clima/sensores/${id}`, data)

export const deleteSensor = (id) => api.delete(`/clima/sensores/${id}`)
