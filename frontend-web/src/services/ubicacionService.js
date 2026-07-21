import api from './api';



export const listarUbicaciones = async () => {
  const res = await api.get('/eventos/ubicaciones/');
  return res.data;
};

export const crearUbicacion = async (data) => {
  const res = await api.post('/eventos/ubicaciones/', data);
  return res.data;
};

export const actualizarUbicacion = async (id, data) => {
  const res = await api.put(`/eventos/ubicaciones/${id}`, data);
  return res.data;
};

export const eliminarUbicacion = async (id) => {
  const res = await api.delete(`/eventos/ubicaciones/${id}`);
  return res.data;
};

export const listarSensoresSinUbicacion = async () => {
  const res = await api.get('/clima/sensores');
  const todos = res.data;
  return todos.filter((s) => !s.id_ubicacion);
};
