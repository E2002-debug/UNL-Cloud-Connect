/**
 * @author Isabel Morocho
 * @date 10/06/2026
 * @version 0.1
 * @description Desarrollo de la interfaz principal para la administración de
 * eventos académicos, incluyendo visualización de métricas, búsqueda,
 * listado de eventos y gestión de creación y eliminación mediante integración
 * con los servicios del backend.
 *
 * @history
 * 10/06/2026 v0.1 - Isabel Morocho (Rol: Frontend)
 * Implementación inicial del módulo de gestión de eventos académicos.
 */
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import EventTable from "./EventTable";
import EventModal from "./EventModal";
import { getEventos, createEvento, updateEvento, deleteEvento, deleteFisicoEvento, uploadImage } from "./eventService";

// Iconos SVG integrados para no depender de librerías externas
const IconPlus = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const IconSearch = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const IconFilter = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>;

const IconClock = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
const IconCalendar = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const IconCheckCircle = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
const IconXCircle = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>;

export default function Events() {
  const [eventos, setEventos] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [tabActivo, setTabActivo] = useState("EN_PROGRESO");
  const [confirmAction, setConfirmAction] = useState({ isOpen: false, type: '', id: null, message: '', title: '' });

  const cargarEventos = async () => {
    try {
      const data = await getEventos();
      setEventos(data);
    } catch (error) {
      console.error("Error al cargar eventos:", error);
      toast.error("Error al cargar eventos");
    }
  };

  useEffect(() => {
    cargarEventos();
  }, []);

  const openCreate = () => {
    setEditando(null);
    setOpenModal(true);
  };

  const openEdit = (evento) => {
    setEditando(evento);
    setOpenModal(true);
  };

  const guardarEvento = async (data, imagenFile) => {
    let evento;
    try {
      if (editando) {
        await updateEvento(editando.id_evento, data);
        evento = editando;
      } else {
        evento = await createEvento(data);
      }
    } catch (error) {
      console.error("Error al guardar evento:", error);
      toast.error("Error al guardar el evento");
      throw error;
    }

    if (imagenFile) {
      try {
        await uploadImage(evento.id_evento, imagenFile);
        toast.success("Imagen subida correctamente");
      } catch (uploadErr) {
        console.error("Error al subir imagen:", uploadErr);
        const status = uploadErr.response?.status;
        const detail = uploadErr.response?.data?.detail || uploadErr.message;
        toast.error(`El evento se guardó, pero la imagen no pudo subirse (${status}): ${detail}`);
      }
    }

    setOpenModal(false);
    setEditando(null);
    cargarEventos();
    toast.success("Evento guardado correctamente");
  };

  const eliminarEvento = (id) => {
    setConfirmAction({
      isOpen: true,
      type: 'CANCELAR',
      id: id,
      title: 'Cancelar evento',
      message: '¿Está seguro de que desea cancelar este evento académico?'
    });
  };

  const eliminarFisicamente = (id) => {
    setConfirmAction({
      isOpen: true,
      type: 'ELIMINAR_FISICO',
      id: id,
      title: '¡ATENCIÓN! Eliminar permanentemente',
      message: '¿Está seguro de que desea ELIMINAR permanentemente este evento? Esta acción no se puede deshacer.'
    });
  };

  const executeConfirm = async () => {
    const { type, id } = confirmAction;
    setConfirmAction({ isOpen: false, type: '', id: null, message: '', title: '' });

    if (type === 'CANCELAR') {
      try {
        await deleteEvento(id);
        cargarEventos();
        toast.success("Evento cancelado correctamente");
      } catch (error) {
        console.error("Error al cancelar evento:", error);
        toast.error("Error al cancelar el evento");
      }
    } else if (type === 'ELIMINAR_FISICO') {
      try {
        await deleteFisicoEvento(id);
        cargarEventos();
        toast.success("Evento eliminado de forma permanente");
      } catch (error) {
        console.error("Error al eliminar evento físicamente:", error);
        toast.error("Error al eliminar el evento");
      }
    }
  };

  const eventosSeguros = Array.isArray(eventos) ? eventos : [];
  const eventosFiltrados = eventosSeguros.filter((e) =>
    e.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const eventosPorTab = tabActivo === "TODOS"
    ? eventosFiltrados
    : eventosFiltrados.filter((e) => e.estado === tabActivo);

  const tabs = [
    { key: "EN_PROGRESO", label: "EN PROGRESO", color: "#10b981" },
    { key: "PROGRAMADO", label: "PROGRAMADOS", color: "#2563eb" },
    { key: "FINALIZADO", label: "FINALIZADOS", color: "#475569" },
    { key: "CANCELADO", label: "CANCELADOS", color: "#ef4444" },
  ];

  const enProgreso = eventosSeguros.filter((e) => e.estado === "EN_PROGRESO").length;
  const programados = eventosSeguros.filter((e) => e.estado === "PROGRAMADO").length;
  const finalizados = eventosSeguros.filter((e) => e.estado === "FINALIZADO").length;
  const cancelados = eventosSeguros.filter((e) => e.estado === "CANCELADO").length;

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "24px", boxSizing: "border-box" }}>
      
      {/* HEADER DE LA SECCIÓN */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", gap: "16px" }}>
        <div style={{ textAlign: "left" }}>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#0F766E", letterSpacing: "-0.5px" }}>EVENTOS ACADÉMICOS UNL</h1>
          <p style={{ margin: "4px 0 0 0", fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
            Administración, monitoreo y asignación de espacios integrados a la red de sensores IoT.
          </p>
        </div>
        <button 
          onClick={openCreate}
          style={{
            background: "#0F766E", color: "white", padding: "10px 20px", borderRadius: "8px",
            border: "none", fontWeight: "700", fontSize: "12px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 2px 4px rgba(15,118,110,0.2)",
            whiteSpace: "nowrap"
          }}
        >
          <IconPlus /> CREAR NUEVO EVENTO
        </button>
      </div>

      {/* TARJETAS METRICAS POR ESTADO */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", width: "100%" }}>
        
        {/* EN PROGRESO */}
        <div style={{ background: "var(--bg-card)", borderRadius: "12px", padding: "20px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#ecfdf5", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IconClock />
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: "800", color: "var(--text-main)", letterSpacing: "0.5px" }}>EN PROGRESO</div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#10b981", margin: "2px 0" }}>{enProgreso}</div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Eventos activos ahora</div>
          </div>
        </div>

        {/* PROGRAMADOS */}
        <div style={{ background: "var(--bg-card)", borderRadius: "12px", padding: "20px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#eff6ff", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IconCalendar />
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: "800", color: "var(--text-main)", letterSpacing: "0.5px" }}>PROGRAMADOS</div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#3b82f6", margin: "2px 0" }}>{programados}</div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Eventos próximos</div>
          </div>
        </div>

        {/* FINALIZADOS */}
        <div style={{ background: "var(--bg-card)", borderRadius: "12px", padding: "20px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#f5f3ff", color: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IconCheckCircle />
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: "800", color: "var(--text-main)", letterSpacing: "0.5px" }}>FINALIZADOS</div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#8b5cf6", margin: "2px 0" }}>{finalizados}</div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Eventos completados</div>
          </div>
        </div>

        {/* CANCELADOS */}
        <div style={{ background: "var(--bg-card)", borderRadius: "12px", padding: "20px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#fef2f2", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IconXCircle />
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: "800", color: "var(--text-main)", letterSpacing: "0.5px" }}>CANCELADOS</div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#ef4444", margin: "2px 0" }}>{cancelados}</div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Eventos cancelados</div>
          </div>
        </div>
      </div>

      {/* CONTENEDOR DE LA TABLA */}
      <div style={{ background: "var(--bg-card)", borderRadius: "12px", overflow: "hidden", width: "100%", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
        
        {/* TABS POR ESTADO */}
        <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #f1f5f9", padding: "16px 24px 0 24px" }}>
          {tabs.map((tab) => {
            const isActive = tabActivo === tab.key;
            const tabColor = tab.key === "CANCELADO" ? "#ef4444" : "#64748b";
            return (
              <button
                key={tab.key}
                onClick={() => setTabActivo(tab.key)}
                style={{
                  background: isActive ? "#10b981" : "transparent",
                  color: isActive ? "white" : tabColor,
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "8px 8px 0 0",
                  fontSize: "11px",
                  fontWeight: "800",
                  cursor: "pointer",
                  letterSpacing: "0.5px",
                  transition: "all 0.2s",
                  marginBottom: isActive ? "0" : "0",
                }}
              >
                {tab.label} ({tab.key === "EN_PROGRESO" ? enProgreso : tab.key === "PROGRAMADO" ? programados : tab.key === "FINALIZADO" ? finalizados : cancelados})
              </button>
            )
          })}
        </div>

        {/* BUSCADOR Y FILTROS */}
        <div style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9", background: "var(--bg-card)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
              <IconSearch />
            </span>
            <input 
              type="text"
              placeholder="Buscar evento por nombre, ubicación o detalles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%", padding: "10px 12px 10px 36px", background: "var(--bg-app)",
                border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "13px",
                color: "var(--text-main)", outline: "none", boxSizing: "border-box"
              }}
            />
          </div>
          
          <button style={{ 
            display: "flex", alignItems: "center", gap: "8px", background: "transparent", 
            border: "1px solid #10b981", color: "#10b981", padding: "8px 16px", borderRadius: "6px", 
            fontSize: "12px", fontWeight: "700", cursor: "pointer" 
          }}>
            <IconFilter /> FILTROS <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
        </div>

        {/* COMPONENTE TABLA */}
        <EventTable eventos={eventosPorTab} onEdit={openEdit} onDelete={eliminarEvento} onDeleteFisico={eliminarFisicamente} />
      </div>

      <EventModal open={openModal} onClose={() => { setOpenModal(false); setEditando(null); }} onSave={guardarEvento} editando={editando} />
      
      {/* MODAL DE CONFIRMACIÓN CUSTOM */}
      {confirmAction.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '400px', maxWidth: '90%', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 16px 0', color: confirmAction.type === 'ELIMINAR_FISICO' ? '#ef4444' : '#0F766E', fontSize: '18px', fontWeight: '800' }}>
              {confirmAction.title}
            </h3>
            <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>
              {confirmAction.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setConfirmAction({ isOpen: false, type: '', id: null, message: '', title: '' })} 
                style={{ padding: '8px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}
              >
                Cerrar
              </button>
              <button 
                onClick={executeConfirm} 
                style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}
              >
                Confirmar Acción
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}