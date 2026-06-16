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
import { getEventos, createEvento, updateEvento, deleteEvento, uploadImage } from "./eventService";

// Iconos SVG integrados para no depender de librerías externas
const IconPlus = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const IconSearch = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;

export default function Events() {
  const [eventos, setEventos] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [tabActivo, setTabActivo] = useState("EN_PROGRESO");

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

  const eliminarEvento = async (id) => {
    if (!window.confirm("¿Está seguro de que desea cancelar este evento académico?")) return;
    try {
      await deleteEvento(id);
      cargarEventos();
      toast.success("Evento cancelado correctamente");
    } catch (error) {
      console.error("Error al cancelar evento:", error);
      toast.error("Error al cancelar el evento");
    }
  };

  const eventosFiltrados = eventos.filter((e) =>
    e.nombre.toLowerCase().includes(searchTerm.toLowerCase())
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

  const enProgreso = eventos.filter((e) => e.estado === "EN_PROGRESO").length;
  const programados = eventos.filter((e) => e.estado === "PROGRAMADO").length;
  const finalizados = eventos.filter((e) => e.estado === "FINALIZADO").length;
  const cancelados = eventos.filter((e) => e.estado === "CANCELADO").length;

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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", width: "100%" }}>
        <div style={{ background: "var(--bg-card)", padding: "12px 16px", border: "1px solid #DBE3E0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "10px", fontWeight: "800", color: "var(--text-muted)", letterSpacing: "0.5px" }}>EN PROGRESO</span>
          <span style={{ fontSize: "18px", fontWeight: "900", color: "#10b981" }}>{enProgreso}</span>
        </div>
        <div style={{ background: "var(--bg-card)", padding: "12px 16px", border: "1px solid #DBE3E0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "10px", fontWeight: "800", color: "var(--text-muted)", letterSpacing: "0.5px" }}>PROGRAMADOS</span>
          <span style={{ fontSize: "18px", fontWeight: "900", color: "#2563eb" }}>{programados}</span>
        </div>
        <div style={{ background: "var(--bg-card)", padding: "12px 16px", border: "1px solid #DBE3E0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "10px", fontWeight: "800", color: "var(--text-muted)", letterSpacing: "0.5px" }}>FINALIZADOS</span>
          <span style={{ fontSize: "18px", fontWeight: "900", color: "#475569" }}>{finalizados}</span>
        </div>
        <div style={{ background: "var(--bg-card)", padding: "12px 16px", border: "1px solid #DBE3E0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "10px", fontWeight: "800", color: "var(--text-muted)", letterSpacing: "0.5px" }}>CANCELADOS</span>
          <span style={{ fontSize: "18px", fontWeight: "900", color: "#ef4444" }}>{cancelados}</span>
        </div>
      </div>

      {/* TABS POR ESTADO */}
      <div style={{ display: "flex", gap: "4px", borderBottom: "2px solid #e2e8f0" }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setTabActivo(tab.key)}
            style={{
              background: tabActivo === tab.key ? tab.color : "transparent",
              color: tabActivo === tab.key ? "white" : tab.color,
              border: "none",
              padding: "10px 20px",
              borderRadius: "8px 8px 0 0",
              fontSize: "11px",
              fontWeight: "800",
              cursor: "pointer",
              letterSpacing: "0.5px",
              transition: "all 0.2s",
            }}
          >
            {tab.label} ({tab.key === "EN_PROGRESO" ? enProgreso : tab.key === "PROGRAMADO" ? programados : tab.key === "FINALIZADO" ? finalizados : cancelados})
          </button>
        ))}
      </div>

      {/* CONTENEDOR DE LA TABLA */}
      <div style={{ background: "var(--bg-card)", border: "1px solid #DBE3E0", borderRadius: "0px", overflow: "hidden", width: "100%" }}>
        
        {/* BUSCADOR */}
        <div style={{ padding: "16px", borderBottom: "1px solid #DBE3E0", background: "var(--bg-card)", display: "flex", justifyContent: "flex-start" }}>
          <div style={{ position: "relative", width: "300px" }}>
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
              <IconSearch />
            </span>
            <input 
              type="text"
              placeholder="Buscar evento por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%", padding: "8px 12px 8px 36px", background: "var(--bg-app)",
                border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px",
                color: "var(--text-main)", outline: "none", boxSizing: "border-box"
              }}
            />
          </div>
        </div>

        {/* COMPONENTE TABLA */}
        <EventTable eventos={eventosPorTab} onEdit={openEdit} onDelete={eliminarEvento} />
      </div>

      <EventModal open={openModal} onClose={() => { setOpenModal(false); setEditando(null); }} onSave={guardarEvento} editando={editando} />
    </div>
  );
}