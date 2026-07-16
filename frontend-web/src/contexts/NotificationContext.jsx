import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    let idUsuario = null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      idUsuario = payload.id_usuario;
    } catch (e) {
      return;
    }

    // Usar la URL pública en producción, o localhost en desarrollo
    const wsUrl = import.meta.env.VITE_WS_URL || 'wss://unl-cloud-connect.me/api/notificaciones';
    
    // Conectar WebSocket
    const ws = new WebSocket(`${wsUrl}/ws/${idUsuario}`);

    ws.onmessage = (event) => {
      if (event.data === 'pong') return;
      try {
        const data = JSON.parse(event.data);
        setNotificaciones(prev => [data, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Mostrar Toast nativo de la web
        toast(data.titulo + "\\n" + data.mensaje, {
          icon: data.tipo === 'ALERTA' ? '🔴' : data.tipo === 'CLIMA' ? '☁️' : '🔔',
        });
      } catch (e) {
        console.error("Error parseando notificación WS", e);
      }
    };

    // Ping para mantener conexión
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send("ping");
      }
    }, 30000);

    return () => {
      clearInterval(pingInterval);
      ws.close();
    };
  }, []);

  const markAsRead = async (id_notificacion) => {
    // Aquí podrías hacer la petición al backend para marcar como leída
    // await api.put(`/notificaciones/historial/${id_notificacion}/leer`);
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return (
    <NotificationContext.Provider value={{ notificaciones, unreadCount, markAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};
