/**
 * @author Isabel Morocho
 * @date 10/06/2026
 * @version 0.1
 * @description Consumo de APIs de eventos y ubicaciones.
 *
 * @history
 * 10/06/2026 v0.1 - Isabel Morocho (Rol: Frontend)
 */

import axios from "axios";

const API_URL = "http://localhost:8000/eventos";

const adminHeaders = {
  "x-user-id": "1",
  "x-user-role": "1",
};

// 1. Obtener todos los eventos activos
export const getEventos = async () => {
  const response = await axios.get(`${API_URL}/activos`);
  return response.data;
};

// 2. Crear un nuevo evento académico
export const createEvento = async (data) => {
  const response = await axios.post(
    `${API_URL}/`,
    data,
    { headers: adminHeaders }
  );
  return response.data;
};

// 3. Eliminar/Cancelar un evento por su ID
export const deleteEvento = async (id) => {
  const response = await axios.delete(
    `${API_URL}/${id}`,
    { headers: adminHeaders }
  );
  return response.data;
};

// 4. NUEVA FUNCIÓN: Obtener catálogo de ubicaciones reales de la base de datos
export const getUbicaciones = async () => {
  const response = await axios.get("http://localhost:8000/eventos/ubicaciones/");
  return response.data;

};

export const getClimaActual = async () => {
  const response = await axios.get("http://localhost:8000/clima/actual");
  return response.data;
};