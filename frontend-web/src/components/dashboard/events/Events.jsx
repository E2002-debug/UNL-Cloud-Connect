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
import EventTable from "./EventTable";
import EventModal from "./EventModal";
import { getEventos, createEvento, deleteEvento } from "./eventService";

// Iconos SVG integrados para no depender de librerías externas
const IconPlus = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const IconSearch = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;

export default function Events() {
  const [eventos, setEventos] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const cargarEventos = async () => {
    try {
      const data = await getEventos();
      setEventos(data);
    } catch (error) {
      console.error("Error al cargar eventos:", error);
    }
  };

  useEffect(() => {
    cargarEventos();
  }, []);

  const guardarEvento = async (data) => {
    try {
      await createEvento(data);
      setOpenModal(false);
      cargarEventos();
    } catch (error) {
      console.error("Error al guardar evento:", error);
    }
  };

  const eliminarEvento = async (id) => {
    if (!window.confirm("¿Está seguro de que desea cancelar este evento académico?")) return;
    try {
      await deleteEvento(id);
      cargarEventos();
    } catch (error) {
      console.error("Error al cancelar evento:", error);
    }
  };

  const eventosFiltrados = eventos.filter((e) =>
    e.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const enProgreso = eventos.filter((e) => e.estado === "EN_PROGRESO").length;
  const programados = eventos.filter((e) => e.estado === "PROGRAMADO").length;
  const totalEventos = eventos.length;

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
          onClick={() => setOpenModal(true)}
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

      {/* TARJETAS METRICAS (PROPORCIONALES EN FILA HORIZONTAL) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px", width: "100%" }}>
        <div style={{ background: "var(--bg-card)", padding: "24px", border: "1px solid #DBE3E0", textAlign: "left" }}>
          <span style={{ fontSize: "10px", fontWeight: "800", color: "var(--text-muted)", letterSpacing: "0.5px" }}>EVENTOS ACTIVOS</span>
          <div style={{ fontSize: "32px", fontWeight: "900", color: "#0F766E", margin: "8px 0" }}>{enProgreso}</div>
          <span style={{ fontSize: "10px", color: "#10b981", fontWeight: "700" }}>● En curso en este momento</span>
        </div>

        <div style={{ background: "var(--bg-card)", padding: "24px", border: "1px solid #DBE3E0", textAlign: "left" }}>
          <span style={{ fontSize: "10px", fontWeight: "800", color: "var(--text-muted)", letterSpacing: "0.5px" }}>EVENTOS PROGRAMADOS</span>
          <div style={{ fontSize: "32px", fontWeight: "900", color: "#0F766E", margin: "8px 0" }}>{programados}</div>
          <span style={{ fontSize: "10px", color: "#2563eb", fontWeight: "700" }}>En el calendario del campus</span>
        </div>

        <div style={{ background: "var(--bg-card)", padding: "24px", border: "1px solid #DBE3E0", textAlign: "left" }}>
          <span style={{ fontSize: "10px", fontWeight: "800", color: "var(--text-muted)", letterSpacing: "0.5px" }}>TOTAL REGISTRADOS</span>
          <div style={{ fontSize: "32px", fontWeight: "900", color: "#0F766E", margin: "8px 0" }}>{totalEventos}</div>
          <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "700" }}>Historial acumulado</span>
        </div>

        <div style={{ background: "var(--bg-card)", padding: "24px", border: "1px solid #DBE3E0", textAlign: "left" }}>
          <span style={{ fontSize: "10px", fontWeight: "800", color: "var(--text-muted)", letterSpacing: "0.5px" }}>ESTADO DE TELEMETRÍA</span>
          <div style={{ fontSize: "32px", fontWeight: "900", color: "#0F766E", margin: "8px 0" }}>100%</div>
          <span style={{ fontSize: "10px", color: "#10b981", fontWeight: "700" }}>● Cloud Gateway Activo</span>
        </div>
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
        <EventTable eventos={eventosFiltrados} onDelete={eliminarEvento} />
      </div>

      <EventModal open={openModal} onClose={() => setOpenModal(false)} onSave={guardarEvento} />
    </div>
  );
}