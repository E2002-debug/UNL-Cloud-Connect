import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function MaintenanceModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleServiceUnavailable = () => {
      setIsOpen(true);
    };

    window.addEventListener('service_unavailable', handleServiceUnavailable);
    return () => {
      window.removeEventListener('service_unavailable', handleServiceUnavailable);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
    }}>
      <div style={{
        backgroundColor: '#fff', padding: '40px', borderRadius: '24px',
        maxWidth: '480px', width: '90%', textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        <div style={{
          width: '80px', height: '80px', backgroundColor: '#FEF2F2',
          borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center',
          margin: '0 auto 24px auto'
        }}>
          <AlertTriangle size={40} color="#DC2626" />
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#111827', margin: '0 0 16px 0' }}>
          Sistema Fuera de Servicio
        </h2>
        <p style={{ fontSize: '16px', color: '#4B5563', lineHeight: '1.6', margin: '0 0 32px 0' }}>
          Parece que nuestros servidores están experimentando alto tráfico o están en mantenimiento programado. 
          Estamos trabajando para restablecer el servicio lo más pronto posible.
        </p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            backgroundColor: '#0F766E', color: '#fff', border: 'none', padding: '16px 32px',
            borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: 'pointer',
            width: '100%', transition: 'all 0.2s'
          }}
        >
          Reintentar conexión
        </button>
      </div>
    </div>
  );
}
