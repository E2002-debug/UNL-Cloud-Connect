import axios from 'axios';
import { Platform } from 'react-native';

// --- CONFIGURACIÓN DE ENDPOINT ---
// Reemplaza esta URL con la dirección IP pública o dominio de tu servidor en la nube
// Ejemplo: 'http://3.12.45.150:8000/api' o 'https://tu-dominio.com/api'
// Para la versión en producción, apuntamos al API Gateway protegido con HTTPS
const CLOUD_BACKEND_URL = 'https://unl-cloud-connect.me/api';

const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:8000/api';
  }
  // Si corres en emulador de Android local, 10.0.2.2 redirige al localhost de la PC
  if (__DEV__ && Platform.OS === 'android') {
    // return 'http://10.0.2.2:8000/api';
  }
  return CLOUD_BACKEND_URL;
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
    w = { temp: 18.5, humidity: 62, description: 'Estación fuera de línea', icon: 'clear-day', feelsLike: 18, windSpeed: 10, rainChance: 0, uvIndex: 0 };
  }

  try {
    const res = await api.get('/clima/actual');
    const data = res.data;
    const fechaDato = new Date(data.fecha_captura + 'Z');
    const ahora = new Date();
    const diferenciaMinutos = (ahora - fechaDato) / (1000 * 60);
    if (diferenciaMinutos <= 5) {
      return {
        ...w,
        temperatura: data.temperatura,
        humedad: data.humedad,
        fuente: 'ESP32',
        alerta: data.alerta || false,
        detalles_alerta: data.alerta ? '¡Alerta local!' : w.description,
      };
    }
    console.warn(`[CLIMA] Dato IoT antiguo (${Math.round(diferenciaMinutos)} min). Usando fallback...`);
  } catch (error) {
    console.log('[CLIMA] Sensor local no disponible, usando fallback...');
  }
  
  return {
    ...w,
    temperatura: w.temp,
    humedad: w.humidity,
    fuente: 'API',
    alerta: false,
    detalles_alerta: w.description,
  };
};

export const uploadImage = async (idEvento, fileUri) => {
  const formData = new FormData();
  formData.append('imagen', {
    uri: fileUri,
    name: `photo_${Date.now()}.jpg`,
    type: 'image/jpeg'
  });

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

export default api;
