//Autor:Isabel Morocho
//Fecha:08/07/2026
//Version 1.1:
//Version 1.2: Agregación para reportar imagen en mobile
import axios from 'axios';
import { Platform } from 'react-native';

// --- CONFIGURACIÓN DE ENDPOINT ---
// Reemplaza esta URL con la dirección IP pública o dominio de tu servidor en la nube
// Ejemplo: 'http://3.12.45.150:8000/api' o 'https://tu-dominio.com/api'
// Para la versión en producción, apuntamos al API Gateway protegido con HTTPS
const CLOUD_BACKEND_URL = 'https://unl-cloud-connect.me/api';
const LOCAL_BACKEND_URL = 'http://localhost:8000/api';

const getBaseUrl = () => {
  const url = process.env.EXPO_PUBLIC_API_URL || (__DEV__ ? (Platform.OS === 'android' ? 'http://10.0.2.2:8000/api' : LOCAL_BACKEND_URL) : CLOUD_BACKEND_URL);
  console.log("🌐 [API] Conectando a:", url);
  return url;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  }
});

// Configure Kong gateway headers globally after login
export const setAuthHeaders = (idUsuario, idRol, token) => {
  api.defaults.headers.common['x-user-id'] = String(idUsuario);
  api.defaults.headers.common['x-user-role'] = String(idRol);
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// --- AUTH ENDPOINTS ---
export const login = async (payload) => {
  const res = await api.post('/auth/login', payload);
  return res.data;
};

export const loginGoogle = async (payload) => {
  const res = await api.post('/auth/login-google', payload);
  return res.data;
};

export const register = async (payload) => {
  const res = await api.post('/auth/registro', payload);
  return res.data;
};

export const googleRegister = async (payload) => {
  const res = await api.post('/auth/google-register', payload);
  return res.data;
};

export const registroHibrido = async (payload) => {
  const res = await api.post('/auth/registro-hibrido', payload);
  return res.data;
};

export const sendRecovery = async (payload) => {
  // Map 'correo' to 'email' as expected by the backend EmailRequest schema
  const res = await api.post('/auth/solicitar-recuperacion', {
    email: payload.correo || payload.email
  });
  return res.data;
};

export const resetPassword = async (payload) => {
  // Map 'clave' to 'nueva_password' as expected by the backend ResetPasswordRequest schema
  const res = await api.post('/auth/restablecer-clave', {
    token: payload.token,
    nueva_password: payload.clave || payload.nueva_password
  });
  return res.data;
};

// --- EVENTS & CLIMATE ENDPOINTS ---
export const getEventos = async (skip = 0, limit = 10) => {
  const res = await api.get(`/eventos/activos?skip=${skip}&limit=${limit}`);
  return res.data;
};

export const getClimaActual = async () => {
  let w = null;
  try {
    const { getLojaWeather } = await import('./weatherService');
    w = await getLojaWeather();
  } catch (e) {
    w = { temp: undefined, humidity: undefined, description: 'Estación fuera de línea', icon: 'clear-day', feelsLike: undefined, windSpeed: undefined, rainChance: undefined, uvIndex: undefined };
  }

  try {
    const res = await api.get('/clima/actual');
    const data = res.data;
    const fechaDato = new Date(data.fecha_captura + 'Z');
    const ahora = new Date();
    const diferenciaMinutos = (ahora - fechaDato) / (1000 * 60);
    
    // Si la ESP32 está activa (datos frescos menores a 5 min), usar sus datos:
    if (diferenciaMinutos <= 5) {
      return {
        ...w,
        temperatura: data.temperatura,
        humedad: data.humedad,
        fuente: 'ESP32',
        alerta: data.alerta || false,
        detalles_alerta: data.alerta ? '¡Alerta local!' : (w?.description || 'Normal'),
      };
    }
    console.warn(`[CLIMA] Dato IoT antiguo (${Math.round(diferenciaMinutos)} min). Usando fallback de Visual Crossing...`);
  } catch (error) {
    console.log('[CLIMA] Sensor ESP32 local no disponible, usando fallback...');
  }

  // Si la ESP32 falló o está apagada, usamos los datos de la API que "dan la cara"
  return {
    ...w,
    temperatura: w?.temp,
    humedad: w?.humidity,
    fuente: 'API VisualCrossing',
    alerta: false,
    detalles_alerta: w?.description || 'Sin datos de respaldo',
  };
};

// export const uploadImage = async (idEvento, fileUri) => {
//   const formData = new FormData();
//   formData.append('imagen', {
//     uri: fileUri,
//     name: `photo_${Date.now()}.jpg`,
//     type: 'image/jpeg'
//   });

//   const res = await api.post(`/eventos/${idEvento}/imagenes/`, formData, {
//     headers: {
//       'Content-Type': 'multipart/form-data'
//     }
//   });
//   return res.data;
// };

export const uploadImage = async (idEvento, fileUri) => {
  const formData = new FormData();

  if (Platform.OS === 'web') {
    // En web, fileUri es un blob: URL — hay que convertirlo a un File real
    const response = await fetch(fileUri);
    const blob = await response.blob();
    const file = new File([blob], `photo_${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' });
    formData.append('imagen', file);
  } else {
    // En iOS/Android nativo, este formato sí funciona
    formData.append('imagen', {
      uri: fileUri,
      name: `photo_${Date.now()}.jpg`,
      type: 'image/jpeg'
    });
  }

  const res = await api.post(`/eventos/${idEvento}/imagenes/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return res.data;
};

export const reaccionarAImagen = async (idImagen, tipoReaccion) => {
  const res = await api.post(`/eventos/imagenes/${idImagen}/reaccion`, { tipo: tipoReaccion });
  return res.data;
};

export const obtenerReaccionesImagen = async (idImagen) => {
  const res = await api.get(`/eventos/imagenes/${idImagen}/reacciones`);
  return res.data;
};


export const reportarImagen = async (idImagen, motivoReporte) => {
  const res = await api.post(`/eventos/imagenes/${idImagen}/reportar`, { motivo_reporte: motivoReporte });
  return res.data;
};

export const eliminarImagen = async (idImagen) => {
  const res = await api.delete(`/eventos/imagenes/${idImagen}`);
  return res.data;
};

// --- NOTIFICACIONES ENDPOINTS ---
export const getAlertas = async () => {
  const res = await api.get('/notificaciones/historial');
  return res.data;
};

export const marcarAlertaLeida = async (id_notificacion) => {
  const res = await api.put(`/notificaciones/historial/${id_notificacion}/leer`);
  return res.data;
};

export default api;
