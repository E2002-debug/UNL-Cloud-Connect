
/**
 * @author Isabel Morocho
 * @date 10/06/2026
 * @version 0.1
 * @description Implementación del componente EventModal para el registro de eventos académicos,
 * selección de ubicaciones existentes y creación de nuevas ubicaciones georreferenciadas
 * mediante integración con los servicios del backend.
 *
 * @history
 * 10/06/2026 v0.1 - Isabel Morocho (Rol: Frontend)
 * Desarrollo inicial de la interfaz de gestión de eventos y ubicaciones.
 */

import React, { useState, useEffect } from "react";
import { getUbicaciones } from "./eventService"; 
import axios from "axios";
// Importamos los componentes del mapa interactivo
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
// Corrección para que los iconos de Leaflet se carguen correctamente en React
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const IconCalendar = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const IconMap = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>;
const IconPlus = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const IconBack = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>;

export default function EventModal({ open, onClose, onSave }) {
  const [vistaActiva, setVistaActiva] = useState("evento");
  const [ubicaciones, setUbicaciones] = useState([]);
  
  // Estado del Evento
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    fecha_hora_inicio: "",
    fecha_hora_final: "",
    id_ubicacion: "",
  });

  // Estado de la Ubicación con coordenadas inicializadas en Loja, Ecuador (Campus UNL)
  const [nuevaUbicacion, setNuevaUbicacion] = useState({
    nombre_lugar: "",
    direccion_alfa_numerica: "",
    latitud: -4.0325, 
    longitud: -79.2028
  });

  const adminHeaders = { "x-user-id": "1", "x-user-role": "1" };

  // Componente interno para capturar el click en el mapa
  function SelectorMapa() {
    useMapEvents({
      click(e) {
        setNuevaUbicacion(prev => ({
          ...prev,
          latitud: parseFloat(e.latlng.lat.toFixed(6)),
          longitud: parseFloat(e.latlng.lng.toFixed(6))
        }));
      },
    });
    return nuevaUbicacion.latitud ? (
      <Marker position={[nuevaUbicacion.latitud, nuevaUbicacion.longitud]} />
    ) : null;
  }

  const cargarUbicaciones = async () => {
    try {
      const data = await getUbicaciones();
      setUbicaciones(data);
      if (data.length > 0 && !formData.id_ubicacion) {
        setFormData(prev => ({ ...prev, id_ubicacion: data[0].id_ubicacion }));
      }
    } catch (error) {
      console.error("Error al cargar ubicaciones:", error);
    }
  };

  useEffect(() => {
    if (open) {
      cargarUbicaciones();
      setVistaActiva("evento");
    }
  }, [open]);

  if (!open) return null;

  const handleSubmitEvent = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        fecha_hora_inicio: new Date(formData.fecha_hora_inicio).toISOString(),
        fecha_hora_final: new Date(formData.fecha_hora_final).toISOString(),
        id_ubicacion: Number(formData.id_ubicacion)
      };
      await onSave(payload);
      setFormData({ nombre: "", descripcion: "", fecha_hora_inicio: "", fecha_hora_final: "", id_ubicacion: ubicaciones[0]?.id_ubicacion || "" });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmitUbicacion = async (e) => {
    e.preventDefault();
    try {
      const payloadUbicacion = {
        nombre_lugar: nuevaUbicacion.nombre_lugar,
        direccion_alfa_numerica: nuevaUbicacion.direccion_alfa_numerica || null,
        latitud: nuevaUbicacion.latitud,
        longitud: nuevaUbicacion.longitud
      };

      const response = await axios.post("http://localhost:8000/eventos/ubicaciones/", payloadUbicacion, { headers: adminHeaders });
      const actualizado = await getUbicaciones();
      setUbicaciones(actualizado);

      setFormData(prev => ({ ...prev, id_ubicacion: response.data.id_ubicacion }));
      setNuevaUbicacion({ nombre_lugar: "", direccion_alfa_numerica: "", latitud: -4.0325, longitud: -79.2028 });
      setVistaActiva("evento");
    } catch (error) {
      console.error(error);
      alert("Error al registrar ubicación.");
    }
  };

  const labelStyle = { display: "block", fontSize: "10px", fontWeight: "800", color: "var(--text-muted)", marginBottom: "6px", letterSpacing: "0.5px", textTransform: "uppercase" };
  const inputStyle = { width: "100%", padding: "10px 12px", background: "var(--bg-app)", border: "1px solid #DBE3E0", borderRadius: "6px", fontSize: "13px", color: "var(--text-main)", outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
      <div style={{ background: "var(--bg-card)", width: "100%", maxWidth: "550px", borderRadius: "12px", overflow: "hidden", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)" }}>
        
        {/* CABECERA */}
        <div style={{ background: "var(--bg-app)", padding: "20px 24px", borderBottom: "1px solid #DBE3E0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0F766E", letterSpacing: "-0.5px" }}>
              {vistaActiva === "evento" ? "REGISTRAR NUEVO EVENTO" : "GEORREFERENCIAR NUEVO ESPACIO FÍSICO"}
            </h3>
            <p style={{ margin: "2px 0 0 0", fontSize: "10px", fontWeight: "600", color: "var(--text-muted)" }}>
              {vistaActiva === "evento" ? "Completa la información académica" : "Haz clic en el mapa para capturar coordenadas climáticas"}
            </p>
          </div>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--text-muted)" }}>&times;</button>
        </div>

        {/* VISTA 1: EVENTO */}
        {vistaActiva === "evento" && (
          <form onSubmit={handleSubmitEvent} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={labelStyle}>Nombre del Evento</label>
              <input required type="text" placeholder="Ej: Seminario de IoT UNL" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Descripción</label>
              <textarea required rows="2" placeholder="Describe la actividad..." value={formData.descripcion} onChange={(e) => setFormData({...formData, descripcion: e.target.value})} style={{ ...inputStyle, resize: "none" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={labelStyle}><IconCalendar /> Inicio</label>
                <input required type="datetime-local" value={formData.fecha_hora_inicio} onChange={(e) => setFormData({...formData, fecha_hora_inicio: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}><IconCalendar /> Fin</label>
                <input required type="datetime-local" value={formData.fecha_hora_final} onChange={(e) => setFormData({...formData, fecha_hora_final: e.target.value})} style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={labelStyle}><IconMap /> Ubicación Registrada</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <select value={formData.id_ubicacion} onChange={(e) => setFormData({...formData, id_ubicacion: e.target.value})} style={{ ...inputStyle, flex: 1 }} required>
                  {ubicaciones.map((loc) => <option key={loc.id_ubicacion} value={loc.id_ubicacion}>{loc.nombre_lugar}</option>)}
                </select>
                <button type="button" onClick={() => setVistaActiva("ubicacion")} style={{ background: "#0F766E", border: "none", color: "white", width: "38px", height: "38px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <IconPlus />
                </button>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid #f1f5f9", paddingTop: "20px" }}>
              <button type="button" onClick={onClose} style={{ background: "transparent", border: "1px solid #DBE3E0", color: "var(--text-muted)", padding: "10px 20px", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>CANCELAR</button>
              <button type="submit" style={{ background: "#0F766E", border: "none", color: "white", padding: "10px 24px", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>GUARDAR EVENTO</button>
            </div>
          </form>
        )}

        {/* VISTA 2: UBICACIÓN + MAPA INTERACTIVO */}
        {vistaActiva === "ubicacion" && (
          <form onSubmit={handleSubmitUbicacion} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={labelStyle}>Nombre del Lugar</label>
                <input required type="text" placeholder="Ej: Laboratorio de Telecom" value={nuevaUbicacion.nombre_lugar} onChange={(e) => setNuevaUbicacion({...nuevaUbicacion, nombre_lugar: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Especificación (Opcional)</label>
                <input type="text" placeholder="Ej: Bloque 4, Aula 2" value={nuevaUbicacion.direccion_alfa_numerica} onChange={(e) => setNuevaUbicacion({...nuevaUbicacion, direccion_alfa_numerica: e.target.value})} style={inputStyle} />
              </div>
            </div>

            {/* CONTENEDOR DEL MAPA INTERACTIVO */}
            <div>
              <label style={labelStyle}>Parte exacta en el mapa (Haz clic para marcar el nodo IoT)</label>
              <div style={{ height: "200px", width: "100%", borderRadius: "8px", overflow: "hidden", border: "1px solid #DBE3E0", zIndex: 10 }}>
                <MapContainer center={[-4.0325, -79.2028]} zoom={16} style={{ height: "100%", width: "100%" }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <SelectorMapa />
                </MapContainer>
              </div>
            </div>

            {/* MUESTRA DE COORDENADAS CAPTURADAS AUTOMÁTICAMENTE */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "var(--bg-app)", padding: "12px", borderRadius: "6px", border: "1px solid #DBE3E0" }}>
              <div>
                <span style={{ fontSize: "9px", fontWeight: "800", color: "var(--text-muted)" }}>LATITUD DETECTADA</span>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#0F766E" }}>{nuevaUbicacion.latitud}</div>
              </div>
              <div>
                <span style={{ fontSize: "9px", fontWeight: "800", color: "var(--text-muted)" }}>LONGITUD DETECTADA</span>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#0F766E" }}>{nuevaUbicacion.longitud}</div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
              <button type="button" onClick={() => setVistaActiva("evento")} style={{ background: "transparent", border: "1px solid #cbd5e1", color: "var(--text-main)", padding: "10px 16px", borderRadius: "8px", fontSize: "11px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                <IconBack /> VOLVER
              </button>
              <button type="submit" style={{ background: "#0F766E", border: "none", color: "white", padding: "10px 24px", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
                VINCULAR NODO CLIMA
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}