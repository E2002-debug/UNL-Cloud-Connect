import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Sidebar from '../components/dashboard/Sidebar';
import Header from '../components/dashboard/Header';

export default function Configuracion() {
  const [prefs, setPrefs] = useState({
    alertas_clima: true,
    alertas_eventos: true,
    alertas_sistema: true
  });
  const [loading, setLoading] = useState(true);
  const [idUsuario, setIdUsuario] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const uid = payload.id_usuario;
        setIdUsuario(uid);
        
        api.get(`/notificaciones/preferencias/${uid}`).then(res => {
          if (res.data) setPrefs(res.data);
          setLoading(false);
        }).catch(() => setLoading(false));
      } catch (e) {
        setLoading(false);
      }
    }
  }, []);

  const handleToggle = async (key) => {
    const newValue = !prefs[key];
    setPrefs(prev => ({ ...prev, [key]: newValue }));
    
    try {
      await api.put(`/notificaciones/preferencias/${idUsuario}`, { [key]: newValue });
      toast.success("Preferencia actualizada");
    } catch (error) {
      toast.error("Error al actualizar preferencia");
      setPrefs(prev => ({ ...prev, [key]: !newValue })); // revert
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header title="Configuración de Notificaciones" />
        <div style={{ padding: '30px', maxWidth: '600px' }}>
          
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '24px', color: 'var(--text-main)' }}>Preferencias de Alertas</h2>
            
            {loading ? <p>Cargando...</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>Nuevos Eventos</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Recibe alertas cuando se creen o cancelen eventos académicos.</p>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={prefs.alertas_eventos} onChange={() => handleToggle('alertas_eventos')} />
                    <span className="slider round"></span>
                  </label>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>Alertas Climáticas (IoT)</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Notificaciones en tiempo real desde la red de sensores meteorológicos.</p>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={prefs.alertas_clima} onChange={() => handleToggle('alertas_clima')} />
                    <span className="slider round"></span>
                  </label>
                </div>
                
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
