import { useState, useEffect, useCallback } from "react";
import { reaccionarImagen, obtenerReacciones, obtenerNombresUsuarios } from "./eventService";

const IconLike = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
  </svg>
);

const IconDislike = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
  </svg>
);

const IconClose = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function ImageReactions({ idImagen }) {
  const [reacciones, setReacciones] = useState({ total_me_gusta: 0, total_no_me_gusta: 0, usuarios_me_gusta: [], usuarios_no_me_gusta: [] });
  const [cargando, setCargando] = useState(false);
  const [popupTipo, setPopupTipo] = useState(null);
  const [usuariosPopup, setUsuariosPopup] = useState([]);
  const [cargandoPopup, setCargandoPopup] = useState(false);

  const cargarReacciones = useCallback(async () => {
    try {
      const data = await obtenerReacciones(idImagen);
      setReacciones(data);
    } catch {
      // La imagen puede no tener reacciones aún
    }
  }, [idImagen]);

  useEffect(() => {
    cargarReacciones();
  }, [cargarReacciones]);

  const toggleReaccion = async (tipo) => {
    setCargando(true);
    try {
      await reaccionarImagen(idImagen, tipo);
      await cargarReacciones();
    } catch {
      // Error silencioso
    } finally {
      setCargando(false);
    }
  };

  const abrirPopup = async (tipo) => {
    setPopupTipo(tipo);
    setCargandoPopup(true);
    setUsuariosPopup([]);
    try {
      const ids = tipo === "ME_GUSTA" ? reacciones.usuarios_me_gusta : reacciones.usuarios_no_me_gusta;
      if (ids.length > 0) {
        const usuarios = await obtenerNombresUsuarios(ids);
        setUsuariosPopup(usuarios);
      }
    } catch {
      setUsuariosPopup([]);
    } finally {
      setCargandoPopup(false);
    }
  };

  const cerrarPopup = () => {
    setPopupTipo(null);
    setUsuariosPopup([]);
  };

  const btnBase = {
    background: "transparent",
    border: "1px solid #DBE3E0",
    borderRadius: "4px",
    padding: "3px 8px",
    fontSize: "10px",
    fontWeight: "700",
    cursor: cargando ? "wait" : "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    opacity: cargando ? 0.5 : 1,
    transition: "all 0.2s",
  };

  const badgeBase = {
    background: "transparent",
    border: "none",
    borderRadius: "4px",
    padding: "2px 6px",
    fontSize: "10px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.2s",
    fontFamily: "inherit",
    lineHeight: 1,
  };

  return (
    <div style={{ display: "flex", gap: "4px", marginTop: "4px", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
        <button
          type="button"
          style={{ ...btnBase, color: "#0F766E", borderRight: "none", borderRadius: "4px 0 0 4px" }}
          onClick={() => toggleReaccion("ME_GUSTA")}
          disabled={cargando}
          title="Me gusta"
          onMouseOver={(e) => { e.currentTarget.style.background = "#ccfbf1" }}
          onMouseOut={(e) => { e.currentTarget.style.background = "transparent" }}
        >
          <IconLike />
        </button>
        <button
          type="button"
          style={{ ...badgeBase, color: "#0F766E", background: "#f0fdfa", border: "1px solid #DBE3E0", borderRadius: "0 4px 4px 0", borderLeft: "none" }}
          onClick={() => reacciones.total_me_gusta > 0 && abrirPopup("ME_GUSTA")}
          title={reacciones.total_me_gusta > 0 ? "Ver quiénes reaccionaron" : ""}
          onMouseOver={(e) => { if (reacciones.total_me_gusta > 0) e.currentTarget.style.background = "#ccfbf1" }}
          onMouseOut={(e) => { e.currentTarget.style.background = "#f0fdfa" }}
        >
          {reacciones.total_me_gusta}
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
        <button
          type="button"
          style={{ ...btnBase, color: "#991b1b", borderRight: "none", borderRadius: "4px 0 0 4px" }}
          onClick={() => toggleReaccion("NO_ME_GUSTA")}
          disabled={cargando}
          title="No me gusta"
          onMouseOver={(e) => { e.currentTarget.style.background = "#fee2e2" }}
          onMouseOut={(e) => { e.currentTarget.style.background = "transparent" }}
        >
          <IconDislike />
        </button>
        <button
          type="button"
          style={{ ...badgeBase, color: "#991b1b", background: "#fef2f2", border: "1px solid #DBE3E0", borderRadius: "0 4px 4px 0", borderLeft: "none" }}
          onClick={() => reacciones.total_no_me_gusta > 0 && abrirPopup("NO_ME_GUSTA")}
          title={reacciones.total_no_me_gusta > 0 ? "Ver quiénes reaccionaron" : ""}
          onMouseOver={(e) => { if (reacciones.total_no_me_gusta > 0) e.currentTarget.style.background = "#fee2e2" }}
          onMouseOut={(e) => { e.currentTarget.style.background = "#fef2f2" }}
        >
          {reacciones.total_no_me_gusta}
        </button>
      </div>

      {popupTipo && (
        <div
          style={{
            position: "absolute", top: "100%", left: "0", zIndex: 1000,
            background: "white", border: "1px solid #DBE3E0", borderRadius: "8px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)", minWidth: "220px", maxWidth: "280px", marginTop: "4px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderBottom: "1px solid #f1f5f9" }}>
            <span style={{ fontWeight: "800", fontSize: "11px", color: popupTipo === "ME_GUSTA" ? "#0F766E" : "#991b1b" }}>
              {popupTipo === "ME_GUSTA" ? "👍 Me gusta" : "👎 No me gusta"}
            </span>
            <button type="button" onClick={cerrarPopup} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", padding: "2px" }}>
              <IconClose />
            </button>
          </div>
          <div style={{ maxHeight: "180px", overflowY: "auto", padding: "4px 0" }}>
            {cargandoPopup ? (
              <div style={{ padding: "12px", textAlign: "center", fontSize: "11px", color: "#94a3b8" }}>Cargando...</div>
            ) : usuariosPopup.length === 0 ? (
              <div style={{ padding: "12px", textAlign: "center", fontSize: "11px", color: "#94a3b8" }}>Sin reacciones</div>
            ) : (
              usuariosPopup.map((u) => (
                <div key={u.id_usuario} style={{ padding: "6px 12px", fontSize: "12px", display: "flex", flexDirection: "column", gap: "1px" }}>
                  <span style={{ fontWeight: "700", color: "#1e293b" }}>{u.nombre} {u.apellido}</span>
                  <span style={{ fontSize: "10px", color: "#94a3b8" }}>{u.correo}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
