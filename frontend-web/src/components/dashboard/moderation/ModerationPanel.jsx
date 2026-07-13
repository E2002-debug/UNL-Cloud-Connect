import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { obtenerImagenesReportadas, eliminarImagenAdmin, descartarReporte, obtenerNombresUsuarios } from "../events/eventService";

export default function ModerationPanel() {
  const [imagenes, setImagenes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [nombres, setNombres] = useState({});
  const [confirm, setConfirm] = useState({ open: false, id_imagen: null, accion: null });

  const cargarReportadas = async () => {
    setCargando(true);
    try {
      const data = await obtenerImagenesReportadas();
      setImagenes(data);
      const ids = [...new Set(data.map((i) => i.id_usuario))];
      if (ids.length > 0) {
        const usuarios = await obtenerNombresUsuarios(ids);
        const mapa = {};
        usuarios.forEach((u) => { mapa[u.id_usuario] = u; });
        setNombres(mapa);
      }
    } catch {
      toast.error("Error al cargar imágenes reportadas");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarReportadas();
  }, []);

  const handleEliminar = async () => {
    try {
      await eliminarImagenAdmin(confirm.id_imagen);
      toast.success("Imagen eliminada permanentemente");
      setConfirm({ open: false, id_imagen: null, accion: null });
      await cargarReportadas();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error al eliminar imagen");
      setConfirm({ open: false, id_imagen: null, accion: null });
    }
  };

  const handleDescartar = async (id_imagen) => {
    try {
      await descartarReporte(id_imagen);
      toast.success("Reporte descartado. La imagen ya no está marcada.");
      await cargarReportadas();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error al descartar reporte");
    }
  };

  const abrirConfirmEliminar = (id_imagen) => {
    setConfirm({ open: true, id_imagen, accion: "eliminar" });
  };

  const confirmarTexto = confirm.accion === "eliminar"
    ? "¿Estás seguro de eliminar esta imagen permanentemente? Se borrará del servidor y la base de datos."
    : "";

  const IconFlag = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>;
  const IconFilter = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>;

  const th = {
    padding: "16px 20px",
    fontSize: "11px",
    fontWeight: "700",
    color: "var(--text-muted)",
    letterSpacing: "0.5px",
    textAlign: "left",
    whiteSpace: "nowrap",
  };

  const td = {
    padding: "16px 20px",
    fontSize: "13px",
    color: "var(--text-main)",
    fontWeight: "500",
    verticalAlign: "middle",
  };

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "24px", boxSizing: "border-box" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "#ecfdf5", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IconFlag />
          </div>
          <div>
            <h1 style={{ margin: "0 0 4px 0", fontSize: "22px", fontWeight: "800", color: "var(--text-main)", letterSpacing: "-0.5px" }}>Moderación de contenido</h1>
            <p style={{ margin: 0, fontSize: "12px", fontWeight: "600", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
              Revisa los reportes y gestiona el contenido reportado.
            </p>
          </div>
        </div>
        <button
          onClick={cargarReportadas}
          style={{
            display: "flex", alignItems: "center", gap: "8px", background: "transparent", 
            border: "1px solid #10b981", color: "#10b981", padding: "10px 20px", borderRadius: "8px", 
            fontSize: "12px", fontWeight: "700", cursor: cargando ? "wait" : "pointer" 
          }}
          disabled={cargando}
        >
          <IconFilter /> {cargando ? "..." : "FILTRAR"}
        </button>
      </div>

      <div style={{ background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border)", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)", overflow: "hidden" }}>
      {cargando ? (
        <div style={{ padding: "60px", textAlign: "center", color: "var(--text-muted)", fontWeight: "600" }}>
          Cargando imágenes reportadas...
        </div>
      ) : imagenes.length === 0 ? (
        <div style={{ padding: "120px 20px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          {/* Olas decorativas en el fondo */}
          <div style={{ position: "absolute", bottom: "-50px", left: 0, right: 0, height: "150px", background: "linear-gradient(180deg, transparent 0%, #f0fdf4 100%)", opacity: 0.5, zIndex: 0, borderRadius: "50% 50% 0 0 / 100% 100% 0 0", transform: "scaleX(1.5)" }}></div>
          
          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ position: "relative", marginBottom: "24px" }}>
              <div style={{ width: "96px", height: "96px", borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#4ade80", display: "flex", alignItems: "center", justifyContent: "center", color: "white", boxShadow: "0 4px 12px rgba(74, 222, 128, 0.4)" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
              </div>
              {/* Sparkles */}
              <div style={{ position: "absolute", top: "10px", left: "-10px", color: "#34d399" }}>✦</div>
              <div style={{ position: "absolute", top: "20px", right: "-15px", color: "#6ee7b7", fontSize: "12px" }}>✧</div>
              <div style={{ position: "absolute", bottom: "15px", left: "10px", color: "#6ee7b7", fontSize: "10px" }}>✦</div>
              <div style={{ position: "absolute", bottom: "25px", right: "5px", color: "#34d399", fontSize: "14px" }}>✦</div>
            </div>
            
            <h2 style={{ margin: "0 0 12px 0", fontSize: "24px", fontWeight: "800", color: "var(--text-main)" }}>¡Todo en orden!</h2>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)", maxWidth: "400px", lineHeight: "1.6", fontWeight: "500" }}>
              No hay reportes registrados en este momento.<br />
              Cuando existan reportes, aparecerán aquí para su revisión.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg-app)", borderBottom: "1px solid #DBE3E0" }}>
                <th style={th}>IMAGEN</th>
                <th style={th}>EVENTO</th>
                <th style={th}>USUARIO</th>
                <th style={th}>MOTIVO</th>
                <th style={th}>FECHA</th>
                <th style={th} align="right">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {imagenes.map((img) => {
                const user = nombres[img.id_usuario];
                return (
                  <tr
                    key={img.id_imagen}
                    style={{ borderBottom: "1px solid #f1f5f9" }}
                    onMouseOver={(e) => e.currentTarget.style.background = "var(--bg-app)"}
                    onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={td}>
                      <div style={{ width: "60px", height: "60px", borderRadius: "8px", overflow: "hidden", border: "1px solid #DBE3E0" }}>
                        <img
                          src={img.url}
                          alt="Reportada"
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                      </div>
                    </td>
                    <td style={{ ...td, fontWeight: "700", color: "#0F766E" }}>
                      {img.evento_nombre}
                    </td>
                    <td style={td}>
                      {user ? (
                        <div>
                          <div style={{ fontWeight: "700", fontSize: "13px", color: "var(--text-main)" }}>
                            {user.nombre} {user.apellido}
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>#{img.id_usuario}</div>
                        </div>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>Usuario #{img.id_usuario}</span>
                      )}
                    </td>
                    <td style={{ ...td, maxWidth: "250px" }}>
                      <div style={{
                        background: "#fef2f2", color: "#991b1b", padding: "6px 10px",
                        borderRadius: "6px", fontSize: "12px", fontWeight: "600",
                        lineHeight: "1.4",
                      }}>
                        {img.motivo_reporte}
                      </div>
                    </td>
                    <td style={{ ...td, fontSize: "12px", color: "var(--text-muted)" }}>
                      {new Date(img.fecha_subida).toLocaleDateString()}
                    </td>
                    <td style={{ ...td, textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => abrirConfirmEliminar(img.id_imagen)}
                          style={{
                            padding: "8px 14px", background: "#fee2e2", border: "1px solid #fca5a5",
                            borderRadius: "6px", color: "#dc2626", fontSize: "11px",
                            fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap",
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background = "#fecaca"}
                          onMouseOut={(e) => e.currentTarget.style.background = "#fee2e2"}
                        >
                          ELIMINAR IMAGEN
                        </button>
                        <button
                          onClick={() => handleDescartar(img.id_imagen)}
                          style={{
                            padding: "8px 14px", background: "#d1fae5", border: "1px solid #6ee7b7",
                            borderRadius: "6px", color: "#059669", fontSize: "11px",
                            fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap",
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background = "#a7f3d0"}
                          onMouseOut={(e) => e.currentTarget.style.background = "#d1fae5"}
                        >
                          DESCARTAR REPORTE
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      </div>

      {confirm.open && (
        <div
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(15, 23, 42, 0.7)", display: "flex",
            alignItems: "center", justifyContent: "center", zIndex: 1000,
          }}
        >
          <div style={{
            background: "var(--text-inverse)", width: "100%", maxWidth: "400px",
            borderRadius: "12px", overflow: "hidden",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
          }}>
            <div style={{
              background: "var(--bg-app)", padding: "16px 24px", borderBottom: "1px solid #DBE3E0",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "var(--text-main)" }}>
                Confirmar Eliminación
              </h3>
            </div>
            <div style={{ padding: "24px" }}>
              <p style={{ margin: "0 0 24px 0", fontSize: "14px", color: "var(--text-muted)" }}>
                {confirmarTexto}
              </p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  onClick={() => setConfirm({ open: false, id_imagen: null, accion: null })}
                  style={{
                    padding: "10px 16px", background: "var(--bg-app)", border: "1px solid #cbd5e1",
                    borderRadius: "6px", fontSize: "13px", fontWeight: "600",
                    color: "var(--text-muted)", cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEliminar}
                  style={{
                    padding: "10px 16px", background: "#ef4444", border: "none",
                    borderRadius: "6px", fontSize: "13px", fontWeight: "600",
                    color: "var(--text-inverse)", cursor: "pointer",
                  }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
