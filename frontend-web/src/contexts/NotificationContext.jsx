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

    // Usar VITE_WS_URL, si no, inferir dinámicamente si es HTTPS o HTTP en producción
    const wsUrl = import.meta.env.VITE_WS_URL || (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host + '/api/notificaciones';
    
    let ws = null;
    let pingInterval = null;
    let reconnectTimeout = null;
    let isComponentMounted = true;

    const connectWebSocket = () => {
      ws = new WebSocket(`${wsUrl}/ws/${idUsuario}`);

      ws.onopen = () => {
        pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send("ping");
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        if (event.data === 'pong') return;
        try {
          const data = JSON.parse(event.data);
          setNotificaciones(prev => [data, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          toast((t) => (
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold' }}>{data.titulo}</h4>
              <p style={{ margin: 0, fontSize: '13px', opacity: 0.9 }}>{data.mensaje}</p>
            </div>
          ), {
            icon: data.tipo === 'ALERTA' ? '🔴' : data.tipo === 'CLIMA' ? '☁️' : '🔔',
            duration: 4000,
          });
        } catch (e) {
          console.error("Error parseando notificación WS", e);
        }
      };

      ws.onclose = () => {
        clearInterval(pingInterval);
        if (isComponentMounted) {
          // Intentar reconectar cada 5 segundos si Nginx o el contenedor matan la conexión
          reconnectTimeout = setTimeout(connectWebSocket, 5000);
        }
      };
      
      ws.onerror = () => {
        ws.close(); // Forzar onclose para que se reconecte
      };
    };

    connectWebSocket();

    return () => {
      isComponentMounted = false;
      clearInterval(pingInterval);
      clearTimeout(reconnectTimeout);
      if (ws) ws.close();
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
