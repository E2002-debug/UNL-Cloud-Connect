
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
import toast from "react-hot-toast";
import { getUbicaciones } from "./eventService"; 
import api from "../../../services/api";
// Importamos los componentes del mapa interactivo
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
// Corrección para que los iconos de Leaflet se carguen correctamente en React
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const campusBounds = [
  [-4.032672, -79.201141],
  [-4.029761, -79.198834],
]

const IconCalendar = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const IconClock = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
const IconMap = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>;
const IconPlus = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const IconBack = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>;
const IconImage = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>;

function toDatetimeLocal(dateStr) {
  const d = new Date(dateStr);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EventModal({ open, onClose, onSave, editando }) {
  const [vistaActiva, setVistaActiva] = useState("evento");
  const [ubicaciones, setUbicaciones] = useState([]);
  
  // Estado del Evento
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    fecha_inicio: "",
    hora_inicio: "",
    fecha_fin: "",
    hora_fin: "",
    id_ubicacion: "",
    estado: "",
  });

  // Estado de la Ubicación con coordenadas inicializadas en Loja, Ecuador (Campus UNL)
  const [nuevaUbicacion, setNuevaUbicacion] = useState({
    nombre_lugar: "",
    direccion_alfa_numerica: "",
    latitud: -4.0325, 
    longitud: -79.2028
  });

  const [seleccionArchivo, setSeleccionArchivo] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [editandoUbicacion, setEditandoUbicacion] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [errores, setErrores] = useState({});

  const fileInputRef = React.useRef(null);

  const adminHeaders = {
    "x-user-id": localStorage.getItem("id_usuario") || "1",
    "x-user-role": localStorage.getItem("id_rol") || "1",
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast.error("Solo se permiten formatos JPG y PNG.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no debe superar los 5MB.");
      return;
    }

    setSeleccionArchivo(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const limpiarArchivo = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSeleccionArchivo(null);
    setPreviewUrl(null);
  };

  const limpiarError = (campo) => {
    setErrores(prev => {
      const copy = { ...prev };
      delete copy[campo];
      return copy;
    });
  };

  const extraerErrorBackend = (error) => {
    if (error.response?.data) {
      const data = error.response.data;
      if (data.detail) {
        if (typeof data.detail === 'string') return data.detail;
        if (Array.isArray(data.detail)) return data.detail.map(e => e.msg || e.detail || JSON.stringify(e)).join(', ');
      }
    }
    return error.message || "Error desconocido";
  };

  const validarFormulario = () => {
    const nuevosErrores = {};
    const nombre = formData.nombre.trim();
    const descripcion = formData.descripcion.trim();

    if (nombre.length < 5 || nombre.length > 150) {
      nuevosErrores.nombre = "El nombre debe tener entre 5 y 150 caracteres.";
    }

    if (descripcion.length < 10 || descripcion.length > 500) {
      nuevosErrores.descripcion = "La descripción debe tener entre 10 y 500 caracteres.";
    }

    if (!formData.fecha_inicio || !formData.hora_inicio) {
      nuevosErrores.fecha_inicio = "Selecciona fecha y hora de inicio.";
    }

    if (!formData.fecha_fin || !formData.hora_fin) {
      nuevosErrores.fecha_fin = "Selecciona fecha y hora de finalización.";
    }

    if (formData.fecha_inicio && formData.hora_inicio && formData.fecha_fin && formData.hora_fin) {
      const inicio = new Date(`${formData.fecha_inicio}T${formData.hora_inicio}`);
      const fin = new Date(`${formData.fecha_fin}T${formData.hora_fin}`);
      if (fin <= inicio) {
        nuevosErrores.fecha_fin = "La fecha de finalización debe ser posterior a la fecha de inicio.";
      }
    }

    if (!formData.id_ubicacion) {
      nuevosErrores.id_ubicacion = "Selecciona una ubicación para el evento.";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

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
      setErrores({});
      cargarUbicaciones();
      setVistaActiva("evento");
      if (editando) {
        const inicioLocal = toDatetimeLocal(editando.fecha_hora_inicio);
        const finLocal = toDatetimeLocal(editando.fecha_hora_final);
        setFormData({
          nombre: editando.nombre || "",
          descripcion: editando.descripcion || "",
          fecha_inicio: inicioLocal.split('T')[0],
          hora_inicio: inicioLocal.split('T')[1],
          fecha_fin: finLocal.split('T')[0],
          hora_fin: finLocal.split('T')[1],
          id_ubicacion: editando.id_ubicacion?.toString() || editando.ubicacion?.id_ubicacion?.toString() || "",
          estado: editando.estado || "",
        });
      } else {
        setFormData({ nombre: "", descripcion: "", fecha_inicio: "", hora_inicio: "", fecha_fin: "", hora_fin: "", id_ubicacion: "", estado: "" });
      }
      limpiarArchivo();
    }
  }, [open, editando]);

  if (!open) return null;

  const handleSubmitEvent = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;
    setSubiendo(true);
    try {
      const payload = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        fecha_hora_inicio: new Date(`${formData.fecha_inicio}T${formData.hora_inicio}`).toISOString(),
        fecha_hora_final: new Date(`${formData.fecha_fin}T${formData.hora_fin}`).toISOString(),
        id_ubicacion: Number(formData.id_ubicacion)
      };
      if (formData.estado) {
        payload.estado = formData.estado;
      }
      await onSave(payload, seleccionArchivo);
      setFormData({ nombre: "", descripcion: "", fecha_inicio: "", hora_inicio: "", fecha_fin: "", hora_fin: "", id_ubicacion: "", estado: "" });
      setErrores({});
      limpiarArchivo();
    } catch (error) {
      console.error(error);
      const msg = extraerErrorBackend(error);
      setErrores(prev => ({ ...prev, general: msg }));
    } finally {
      setSubiendo(false);
    }
  };

  const handleOpenUbicacion = async () => {
    if (editando && formData.id_ubicacion) {
      try {
        const res = await api.get(`/eventos/ubicaciones/${formData.id_ubicacion}`);
        setNuevaUbicacion({
          nombre_lugar: res.data.nombre_lugar || "",
          direccion_alfa_numerica: res.data.direccion_alfa_numerica || "",
          latitud: res.data.latitud,
          longitud: res.data.longitud
        });
        setEditandoUbicacion(res.data);
      } catch {
        toast.error("Error al cargar ubicación.");
        setEditandoUbicacion(null);
      }
    } else {
      setNuevaUbicacion({ nombre_lugar: "", direccion_alfa_numerica: "", latitud: -4.0325, longitud: -79.2028 });
      setEditandoUbicacion(null);
    }
    setVistaActiva("ubicacion");
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

      let response;
      if (editandoUbicacion) {
        response = await api.put(`/eventos/ubicaciones/${editandoUbicacion.id_ubicacion}`, payloadUbicacion, { headers: adminHeaders });
        toast.success("Ubicación actualizada correctamente");
      } else {
        response = await api.post("/eventos/ubicaciones/", payloadUbicacion, { headers: adminHeaders });
        toast.success("Ubicación creada correctamente");
      }

      const actualizado = await getUbicaciones();
      setUbicaciones(actualizado);

      setFormData(prev => ({ ...prev, id_ubicacion: response.data.id_ubicacion }));
      setNuevaUbicacion({ nombre_lugar: "", direccion_alfa_numerica: "", latitud: -4.0325, longitud: -79.2028 });
      setEditandoUbicacion(null);
      setVistaActiva("evento");
    } catch (error) {
      console.error(error);
      toast.error("Error al registrar ubicación.");
    }
  };

  const labelStyle = { display: "block", fontSize: "10px", fontWeight: "800", color: "var(--text-muted)", marginBottom: "6px", letterSpacing: "0.5px", textTransform: "uppercase" };
  const inputStyle = { width: "100%", padding: "10px 12px", background: "var(--bg-app)", border: "1px solid #DBE3E0", borderRadius: "6px", fontSize: "13px", color: "var(--text-main)", outline: "none", boxSizing: "border-box" };
  const inputErrorStyle = { ...inputStyle, border: "1px solid #ef4444" };
  const errorTextStyle = { fontSize: "10px", fontWeight: "700", color: "#ef4444", marginTop: "4px", marginBottom: 0 };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
      <div style={{ background: "var(--bg-card)", width: "100%", maxWidth: "550px", borderRadius: "12px", overflow: "hidden", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)" }}>
        
        {/* CABECERA */}
        <div style={{ background: "var(--bg-app)", padding: "20px 24px", borderBottom: "1px solid #DBE3E0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0F766E", letterSpacing: "-0.5px" }}>
              {vistaActiva === "evento"
                ? (editando ? "EDITAR EVENTO" : "REGISTRAR NUEVO EVENTO")
                : (editandoUbicacion ? "EDITAR UBICACIÓN" : "GEORREFERENCIAR NUEVO ESPACIO FÍSICO")}
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
            {errores.general && (
              <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#dc2626", padding: "10px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: "600" }}>
                {errores.general}
              </div>
            )}
            <div>
              <label style={labelStyle}>Nombre del Evento</label>
              <input type="text" placeholder="Ej: Seminario de IoT UNL" value={formData.nombre} onChange={(e) => { setFormData({...formData, nombre: e.target.value}); limpiarError("nombre"); }} style={errores.nombre ? inputErrorStyle : inputStyle} />
              {errores.nombre && <p style={errorTextStyle}>{errores.nombre}</p>}
            </div>
            <div>
              <label style={labelStyle}>Descripción</label>
              <textarea rows="2" placeholder="Describe la actividad..." value={formData.descripcion} onChange={(e) => { setFormData({...formData, descripcion: e.target.value}); limpiarError("descripcion"); }} style={{ ...(errores.descripcion ? inputErrorStyle : inputStyle), resize: "none" }} />
              {errores.descripcion && <p style={errorTextStyle}>{errores.descripcion}</p>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={labelStyle}><IconCalendar /> Fecha de Inicio</label>
                <input type="date" value={formData.fecha_inicio} onChange={(e) => { setFormData({...formData, fecha_inicio: e.target.value}); limpiarError("fecha_inicio"); }} style={errores.fecha_inicio ? inputErrorStyle : inputStyle} />
              </div>
              <div>
                <label style={labelStyle}><IconClock /> Hora de Inicio</label>
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <select value={formData.hora_inicio?.split(':')[0] || ""} onChange={(e) => { const val = e.target.value + ":" + (formData.hora_inicio?.split(':')[1] || "00"); setFormData({...formData, hora_inicio: val}); limpiarError("fecha_inicio"); }} style={{ ...(errores.fecha_inicio ? inputErrorStyle : inputStyle), width: "50%" }}>
                    <option value="" disabled>HH</option>
                    {Array.from({length: 24}, (_, i) => {
  const v = String(i).padStart(2, '0');
  const h12 = i === 0 ? 12 : i > 12 ? i - 12 : i;
  const ampm = i < 12 ? 'AM' : 'PM';
  return <option key={i} value={v}>{String(h12).padStart(2, '0')} {ampm}</option>;
})}
                  </select>
                  <span style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-muted)", lineHeight: "38px" }}>:</span>
                  <select value={formData.hora_inicio?.split(':')[1] || ""} onChange={(e) => { const val = (formData.hora_inicio?.split(':')[0] || "00") + ":" + e.target.value; setFormData({...formData, hora_inicio: val}); limpiarError("fecha_inicio"); }} style={{ ...(errores.fecha_inicio ? inputErrorStyle : inputStyle), width: "50%" }}>
                    <option value="" disabled>MM</option>
                    {["00", "15", "30", "45"].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                {errores.fecha_inicio && <p style={errorTextStyle}>{errores.fecha_inicio}</p>}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={labelStyle}><IconCalendar /> Fecha de Fin</label>
                <input type="date" value={formData.fecha_fin} onChange={(e) => { setFormData({...formData, fecha_fin: e.target.value}); limpiarError("fecha_fin"); }} style={errores.fecha_fin ? inputErrorStyle : inputStyle} />
              </div>
              <div>
                <label style={labelStyle}><IconClock /> Hora de Fin</label>
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <select value={formData.hora_fin?.split(':')[0] || ""} onChange={(e) => { const val = e.target.value + ":" + (formData.hora_fin?.split(':')[1] || "00"); setFormData({...formData, hora_fin: val}); limpiarError("fecha_fin"); }} style={{ ...(errores.fecha_fin ? inputErrorStyle : inputStyle), width: "50%" }}>
                    <option value="" disabled>HH</option>
                    {Array.from({length: 24}, (_, i) => {
  const v = String(i).padStart(2, '0');
  const h12 = i === 0 ? 12 : i > 12 ? i - 12 : i;
  const ampm = i < 12 ? 'AM' : 'PM';
  return <option key={i} value={v}>{String(h12).padStart(2, '0')} {ampm}</option>;
})}
                  </select>
                  <span style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-muted)", lineHeight: "38px" }}>:</span>
                  <select value={formData.hora_fin?.split(':')[1] || ""} onChange={(e) => { const val = (formData.hora_fin?.split(':')[0] || "00") + ":" + e.target.value; setFormData({...formData, hora_fin: val}); limpiarError("fecha_fin"); }} style={{ ...(errores.fecha_fin ? inputErrorStyle : inputStyle), width: "50%" }}>
                    <option value="" disabled>MM</option>
                    {["00", "15", "30", "45"].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                {errores.fecha_fin && <p style={errorTextStyle}>{errores.fecha_fin}</p>}
              </div>
            </div>
            <div>
              <label style={labelStyle}><IconMap /> Ubicación Registrada</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <select value={formData.id_ubicacion} onChange={(e) => { setFormData({...formData, id_ubicacion: e.target.value}); limpiarError("id_ubicacion"); }} style={{ ...(errores.id_ubicacion ? inputErrorStyle : inputStyle), flex: 1 }}>
                  <option value="">Selecciona una ubicación...</option>
                  {ubicaciones.map((loc) => <option key={loc.id_ubicacion} value={loc.id_ubicacion}>{loc.nombre_lugar}</option>)}
                </select>
                <button type="button" onClick={handleOpenUbicacion} style={{ background: "#0F766E", border: "none", color: "white", width: "38px", height: "38px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <IconPlus />
                </button>
              </div>
              {errores.id_ubicacion && <p style={errorTextStyle}>{errores.id_ubicacion}</p>}
            </div>
            {editando && (
              <div>
                <label style={labelStyle}>Estado del Evento</label>
                <select value={formData.estado} onChange={(e) => setFormData({...formData, estado: e.target.value})} style={inputStyle}>
                  <option value="PROGRAMADO">PROGRAMADO</option>
                  <option value="EN_PROGRESO">EN PROGRESO</option>
                  <option value="FINALIZADO">FINALIZADO</option>
                </select>
              </div>
            )}
            <div>
              <label style={labelStyle}><IconImage /> Imagen del Evento (opcional)</label>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" onChange={handleFileSelect} style={{ display: "none" }} />
              {!previewUrl ? (
                <button type="button" onClick={() => fileInputRef.current?.click()} style={{ background: "var(--bg-app)", border: "1px dashed #cbd5e1", borderRadius: "6px", padding: "12px", width: "100%", cursor: "pointer", color: "var(--text-muted)", fontSize: "11px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  <IconImage /> SELECCIONAR IMAGEN (JPG/PNG, máximo 5MB)
                </button>
              ) : (
                <div style={{ position: "relative", display: "inline-block" }}>
                  <img src={previewUrl} alt="Vista previa" style={{ height: "80px", borderRadius: "6px", objectFit: "cover", border: "1px solid #DBE3E0" }} />
                  <button type="button" onClick={limpiarArchivo} style={{ position: "absolute", top: "-6px", right: "-6px", background: "#ef4444", border: "none", color: "white", width: "20px", height: "20px", borderRadius: "50%", fontSize: "11px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>&times;</button>
                </div>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid #f1f5f9", paddingTop: "20px" }}>
              <button type="button" onClick={onClose} disabled={subiendo} style={{ background: "transparent", border: "1px solid #DBE3E0", color: "var(--text-muted)", padding: "10px 20px", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: subiendo ? "not-allowed" : "pointer", opacity: subiendo ? 0.5 : 1 }}>CANCELAR</button>
              <button type="submit" disabled={subiendo} style={{ background: "#0F766E", border: "none", color: "white", padding: "10px 24px", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: subiendo ? "wait" : "pointer", opacity: subiendo ? 0.7 : 1, display: "flex", alignItems: "center", gap: "6px" }}>
                {subiendo ? "SUBENDO IMAGEN..." : (editando ? "ACTUALIZAR EVENTO" : "GUARDAR EVENTO")}
              </button>
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
                <MapContainer center={[-4.0312, -79.2000]} zoom={17} style={{ height: "100%", width: "100%" }} maxBounds={campusBounds} maxBoundsViscosity={1.0} minZoom={15}>
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
              <button type="button" onClick={() => { setEditandoUbicacion(null); setVistaActiva("evento"); }} style={{ background: "transparent", border: "1px solid #cbd5e1", color: "var(--text-main)", padding: "10px 16px", borderRadius: "8px", fontSize: "11px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                <IconBack /> VOLVER
              </button>
              <button type="submit" style={{ background: "#0F766E", border: "none", color: "white", padding: "10px 24px", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
                {editandoUbicacion ? "ACTUALIZAR UBICACIÓN" : "CREAR UBICACIÓN"}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}