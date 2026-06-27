import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getEventoPorId, getImagenesEvento, uploadImage, obtenerNombresUsuarios, reportarImagen } from "../components/dashboard/events/eventService";
import ImageReactions from "../components/dashboard/events/ImageReactions";

const IconArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);

const IconCamera = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
  </svg>
);

function timeAgo(dateStr) {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return "hace unos segundos";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  if (diff < 2592000) return `hace ${Math.floor(diff / 86400)} d`;
  return d.toLocaleDateString();
}

export default function EventoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [evento, setEvento] = useState(null);
  const [imagenes, setImagenes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [imagenFile, setImagenFile] = useState(null);
  const [nombres, setNombres] = useState({});
  const [reportModal, setReportModal] = useState({ open: false, id_imagen: null });
  const [reportMotivo, setReportMotivo] = useState("");
  const [reportando, setReportando] = useState(false);
  const fileInputRef = useRef(null);

  const estaAutenticado = () => !!localStorage.getItem("access_token");

  useEffect(() => {
    const cargar = async () => {
      try {
        const eventoData = await getEventoPorId(id);
        setEvento(eventoData);
        const imagenesData = await getImagenesEvento(id);
        setImagenes(imagenesData);
        const ids = [...new Set(imagenesData.map((i) => i.id_usuario))];
        if (ids.length > 0) {
          const usuarios = await obtenerNombresUsuarios(ids);
          const mapa = {};
          usuarios.forEach((u) => { mapa[u.id_usuario] = u; });
          setNombres(mapa);
        }
      } catch {
        toast.error("Error al cargar el evento");
        navigate("/");
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [id, navigate]);

  const cargarImagenes = async () => {
    try {
      const data = await getImagenesEvento(id);
      setImagenes(data);
      const ids = [...new Set(data.map((i) => i.id_usuario))];
      if (ids.length > 0) {
        const usuarios = await obtenerNombresUsuarios(ids);
        const mapa = { ...nombres };
        usuarios.forEach((u) => { mapa[u.id_usuario] = u; });
        setNombres(mapa);
      }
    } catch {
      toast.error("Error al cargar imágenes");
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Solo se permiten formatos JPG, PNG y WEBP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no debe superar los 5MB.");
      return;
    }
    setImagenFile(file);
    setImagenPreview(URL.createObjectURL(file));
  };

  const limpiar = () => {
    if (imagenPreview) URL.revokeObjectURL(imagenPreview);
    setImagenFile(null);
    setImagenPreview(null);
  };

  const abrirReporte = (id_imagen) => {
    setReportModal({ open: true, id_imagen });
    setReportMotivo("");
  };

  const cerrarReporte = () => {
    setReportModal({ open: false, id_imagen: null });
    setReportMotivo("");
  };

  const handleReportar = async () => {
    if (!reportMotivo.trim()) {
      toast.error("Por favor escribe un motivo para el reporte.");
      return;
    }
    setReportando(true);
    try {
      await reportarImagen(reportModal.id_imagen, reportMotivo.trim());
      toast.success("Reporte enviado. Un administrador lo revisará.");
      cerrarReporte();
    } catch (err) {
      const detail = err.response?.data?.detail || err.message;
      toast.error(`Error al reportar: ${detail}`);
    } finally {
      setReportando(false);
    }
  };

  const handlePublicar = async () => {
    if (!imagenFile) return;
    setSubiendo(true);
    try {
      await uploadImage(id, imagenFile);
      toast.success("Publicado correctamente");
      limpiar();
      await cargarImagenes();
    } catch (err) {
      const detail = err.response?.data?.detail || err.message;
      toast.error(`Error al publicar: ${detail}`);
    } finally {
      setSubiendo(false);
    }
  };

  const estadoColor = evento ? {
    EN_PROGRESO: { bg: "#d1fae5", color: "#065f46" },
    PROGRAMADO: { bg: "#dbeafe", color: "#1e40af" },
    FINALIZADO: { bg: "#e2e8f0", color: "#475569" },
    CANCELADO: { bg: "#fef2f2", color: "#991b1b" },
  }[evento.estado] || { bg: "#f1f5f9", color: "#334155" } : {};

  if (cargando) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f8f6", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
        <p style={{ color: "#62726b", fontWeight: "600", fontSize: "14px" }}>Cargando...</p>
      </div>
    );
  }

  if (!evento) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f8f6", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
        <p style={{ color: "#62726b", fontWeight: "600", fontSize: "14px" }}>Evento no encontrado</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* NAVBAR */}
      <header style={{
        background: "#fff", padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center",
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)", position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button type="button" onClick={() => navigate("/")} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#0F766E", display: "flex", padding: "6px", borderRadius: "50%" }}
            onMouseOver={(e) => e.currentTarget.style.background = "#f0fdfa"}
            onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
          >
            <IconArrowLeft />
          </button>
          <div style={{ fontSize: "18px", fontWeight: "800", color: "#0F766E" }}>
            UNL-Cloud-<span style={{ color: "#10b981" }}>Connect</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {estaAutenticado() ? (
            <button type="button" onClick={() => navigate("/dashboard")} style={{
              background: "#10b981", color: "white", border: "none", padding: "6px 14px",
              borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer",
            }}>
              DASHBOARD
            </button>
          ) : (
            <>
              <button type="button" onClick={() => navigate("/login")} style={{
                background: "transparent", color: "#10b981", border: "2px solid #10b981",
                padding: "5px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", cursor: "pointer",
              }}>
                INICIAR SESIÓN
              </button>
              <button type="button" onClick={() => navigate("/register")} style={{
                background: "#10b981", color: "white", border: "none", padding: "6px 14px",
                borderRadius: "6px", fontSize: "11px", fontWeight: "700", cursor: "pointer",
              }}>
                REGISTRARSE
              </button>
            </>
          )}
        </div>
      </header>

      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "16px" }}>
        {/* INFO DEL EVENTO */}
        <div style={{ background: "white", borderRadius: "8px", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: "16px" }}>
          {evento.imagen_url && (
            <div style={{ width: "100%", height: "200px", overflow: "hidden", background: "#e2e8f0" }}>
              <img src={evento.imagen_url} alt={evento.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}
          <div style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "#0F766E" }}>{evento.nombre}</h1>
              {evento.estado && (
                <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "9px", fontWeight: "800", letterSpacing: "0.5px", ...estadoColor }}>
                  {evento.estado.replace("_", " ")}
                </span>
              )}
            </div>
            <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#64748b", lineHeight: 1.5 }}>{evento.descripcion}</p>
            <div style={{ fontSize: "11px", color: "#94a3b8", display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <span>📍 {evento.ubicacion?.nombre_lugar || `Zona #${evento.id_ubicacion}`}</span>
              <span>📅 {new Date(evento.fecha_hora_inicio).toLocaleDateString()} {new Date(evento.fecha_hora_inicio).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {new Date(evento.fecha_hora_final).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          </div>
        </div>

        {/* CAJA DE PUBLICACIÓN */}
        {estaAutenticado() ? (
          <div style={{ background: "white", borderRadius: "8px", padding: "16px", marginBottom: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <div style={{
                width: "40px", height: "40px", borderRadius: "50%", background: "#10b981",
                display: "flex", alignItems: "center", justifyContent: "center", color: "white",
                fontWeight: "800", fontSize: "16px", flexShrink: 0,
              }}>
                {localStorage.getItem("nombre")?.[0] || "U"}
              </div>
              <div style={{ flex: 1 }}>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileSelect} style={{ display: "none" }} />
                {!imagenPreview ? (
                  <button type="button" onClick={() => fileInputRef.current?.click()} style={{
                    width: "100%", padding: "10px 16px", background: "#f8fafc", border: "1px dashed #cbd5e1",
                    borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600",
                    color: "#94a3b8", textAlign: "left",
                  }}
                    onMouseOver={(e) => { e.currentTarget.style.background = "#f1f5f9" }}
                    onMouseOut={(e) => { e.currentTarget.style.background = "#f8fafc" }}
                  >
                    <IconCamera /> Subir una foto (JPG/PNG/WEBP, máx 5MB)
                  </button>
                ) : (
                  <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
                    <div style={{ position: "relative" }}>
                      <img src={imagenPreview} alt="Preview" style={{ width: "100%", maxHeight: "300px", objectFit: "contain", background: "#f8fafc", display: "block" }} />
                      <button type="button" onClick={limpiar} style={{
                        position: "absolute", top: "6px", right: "6px", background: "rgba(0,0,0,0.6)", color: "white",
                        border: "none", borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer",
                        fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 0,
                      }}>✕</button>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", padding: "8px 12px", background: "#fafafa", borderTop: "1px solid #e2e8f0" }}>
                      <button type="button" onClick={limpiar} style={{
                        background: "transparent", color: "#475569", border: "1px solid #dbe3e0", padding: "6px 16px",
                        borderRadius: "6px", fontSize: "11px", fontWeight: "700", cursor: "pointer",
                      }}>
                        Cancelar
                      </button>
                      <button type="button" onClick={handlePublicar} disabled={subiendo} style={{
                        background: "#0F766E", color: "white", border: "none", padding: "6px 20px",
                        borderRadius: "6px", fontSize: "11px", fontWeight: "700", cursor: subiendo ? "wait" : "pointer",
                      }}>
                        {subiendo ? "PUBLICANDO..." : "PUBLICAR"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ background: "white", borderRadius: "8px", padding: "16px", marginBottom: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8", fontWeight: "600" }}>
              <a href="/login" style={{ color: "#0F766E", fontWeight: "700" }}>Inicia sesión</a> para publicar fotos y reaccionar
            </p>
          </div>
        )}

        {/* FEED DE POSTS */}
        {imagenes.length === 0 ? (
          <div style={{ background: "white", borderRadius: "8px", padding: "40px 20px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <IconCamera />
            <p style={{ margin: "10px 0 0", fontSize: "14px", fontWeight: "600", color: "#94a3b8" }}>No hay publicaciones aún</p>
            {estaAutenticado() && <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#94a3b8" }}>Sé el primero en compartir una foto</p>}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {imagenes.map((img) => {
              const user = nombres[img.id_usuario];
              return (
                <div key={img.id_imagen} style={{ background: "white", borderRadius: "8px", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                  {/* HEADER DEL POST: Avatar + Nombre + Fecha */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px" }}>
                    <div style={{
                      width: "36px", height: "36px", borderRadius: "50%",
                      background: user ? "#10b981" : "#e2e8f0",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "white", fontWeight: "800", fontSize: "14px", flexShrink: 0,
                    }}>
                      {user ? `${user.nombre[0]}${user.apellido[0]}` : "?"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "700", fontSize: "13px", color: "#1e293b" }}>
                        {user ? `${user.nombre} ${user.apellido}` : `Usuario #${img.id_usuario}`}
                      </div>
                      <div style={{ fontSize: "11px", color: "#94a3b8" }}>{timeAgo(img.fecha_subida)}</div>
                    </div>
                  </div>

                  {/* IMAGEN */}
                  <a href={img.url} target="_blank" rel="noopener noreferrer" style={{ display: "block" }}>
                    <img src={img.url} alt="Foto" style={{ width: "100%", maxHeight: "500px", objectFit: "contain", background: "#f8fafc", display: "block" }} />
                  </a>

                  {/* FOOTER: Reacciones + Reportar */}
                  <div style={{ padding: "8px 16px 12px", borderTop: "1px solid #f1f5f9" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <ImageReactions idImagen={img.id_imagen} />
                      {estaAutenticado() && (
                        <button
                          type="button"
                          onClick={() => abrirReporte(img.id_imagen)}
                          style={{
                            background: "transparent",
                            border: "1px solid #DBE3E0",
                            borderRadius: "4px",
                            padding: "3px 8px",
                            fontSize: "12px",
                            cursor: "pointer",
                            color: img.reportada ? "#f59e0b" : "#94a3b8",
                            opacity: img.reportada ? 1 : 0.6,
                            transition: "all 0.2s",
                          }}
                          title={img.reportada ? "Ya reportada" : "Reportar imagen"}
                          disabled={img.reportada}
                          onMouseOver={(e) => { if (!img.reportada) e.currentTarget.style.opacity = "1" }}
                          onMouseOut={(e) => { if (!img.reportada) e.currentTarget.style.opacity = "0.6" }}
                        >
                          🚩
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL DE REPORTE */}
      {reportModal.open && (
        <div
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(15, 23, 42, 0.6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 999, fontFamily: "'Segoe UI', system-ui, sans-serif",
          }}
          onClick={cerrarReporte}
        >
          <div
            style={{
              background: "white", borderRadius: "12px", width: "100%",
              maxWidth: "420px", overflow: "hidden", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#1e293b" }}>🚩 Reportar imagen</h3>
              <button onClick={cerrarReporte} style={{ background: "transparent", border: "none", fontSize: "20px", cursor: "pointer", color: "#94a3b8", padding: "4px" }}>✕</button>
            </div>
            <div style={{ padding: "20px 24px" }}>
              <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "#64748b", fontWeight: "500" }}>
                ¿Por qué consideras que esta imagen debería ser revisada?
              </p>
              <textarea
                value={reportMotivo}
                onChange={(e) => setReportMotivo(e.target.value)}
                placeholder="Ej: La imagen no pertenece al contexto del evento, contiene contenido inapropiado..."
                maxLength={500}
                rows={4}
                style={{
                  width: "100%", padding: "12px", borderRadius: "8px",
                  border: "1px solid #dbe3e0", fontSize: "13px",
                  fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
                  outline: "none",
                }}
              />
              <div style={{ fontSize: "11px", color: "#94a3b8", textAlign: "right", marginTop: "4px" }}>{reportMotivo.length}/500</div>
            </div>
            <div style={{ padding: "16px 24px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button
                onClick={cerrarReporte}
                style={{
                  padding: "10px 16px", background: "#f8fafc", border: "1px solid #dbe3e0",
                  borderRadius: "6px", fontSize: "13px", fontWeight: "600",
                  color: "#64748b", cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleReportar}
                disabled={reportando}
                style={{
                  padding: "10px 20px", background: "#ef4444", border: "none",
                  borderRadius: "6px", fontSize: "13px", fontWeight: "700",
                  color: "white", cursor: reportando ? "wait" : "pointer",
                  opacity: reportando ? 0.7 : 1,
                }}
              >
                {reportando ? "ENVIANDO..." : "REPORTAR"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
