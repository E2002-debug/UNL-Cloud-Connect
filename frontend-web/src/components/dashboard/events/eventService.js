import api from "../../../services/api";

const getUserHeaders = () => {
  return {
    "x-user-id": localStorage.getItem("id_usuario") || "1",
    "x-user-role": localStorage.getItem("id_rol") || "1",
  };
};

export const getEventos = async () => {
  const response = await api.get("/eventos/activos");
  return response.data;
};

export const createEvento = async (data) => {
  const response = await api.post("/eventos/", data, {
    headers: { ...getUserHeaders() },
  });
  return response.data;
};

export const updateEvento = async (id, data) => {
  const response = await api.put(`/eventos/${id}`, data, {
    headers: { ...getUserHeaders() },
  });
  return response.data;
};

export const deleteEvento = async (id) => {
  const response = await api.delete(`/eventos/${id}`, {
    headers: { ...getUserHeaders() },
  });
  return response.data;
};

export const getUbicaciones = async () => {
  const response = await api.get("/eventos/ubicaciones/");
  return response.data;
};

export const getClimaActual = async () => {
  const response = await api.get("/clima/actual");
  return response.data;
};

export const uploadImage = async (id_evento, file) => {
  const formData = new FormData();
  formData.append("imagen", file);
  const response = await api.post(`/eventos/${id_evento}/imagenes/`, formData, {
    headers: {
      ...getUserHeaders(),
      "Content-Type": undefined,
    },
  });
  return response.data;
};
