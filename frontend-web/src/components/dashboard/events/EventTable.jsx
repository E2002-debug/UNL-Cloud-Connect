/**
 * @author Isabel Morocho
 * @date 10/06/2026
 * @version 0.1
 * @description Tabla para visualizar y administrar eventos académicos.
 *
 * @history
 * 10/06/2026 v0.1 - Isabel Morocho (Rol: Frontend)
 */

const obtenerEstiloEstado = (estado) => {
  switch (estado) {
    case "EN_PROGRESO":
      return { background: "#d1fae5", color: "#065f46", border: "1px solid #a7f3d0" }; // Rojo suave para llamar la atención en ejecución
    case "PROGRAMADO":
      return { background: "#dbeafe", color: "#1e40af", border: "1px solid #bfdbfe" };
    case "FINALIZADO":
      return { background: "#e2e8f0", color: "#475569", border: "1px solid #cbd5e1" };
    case "CANCELADO":
      return { background: "#fef2f2", color: "#991b1b", border: "1px solid #fee2e2" };
    default:
      return { background: "#f1f5f9", color: "#334155", border: "1px solid #e2e8f0" };
  }
};

const IconEdit = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const IconCamera = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>;

export default function EventTable({ eventos, onEdit, onDelete }) {
  const cellStyle = { padding: "14px 20px", fontSize: "13px", color: "var(--text-main)", borderBottom: "1px solid #f1f5f9", textAlign: "left" };
  const thStyle = { padding: "12px 20px", fontSize: "11px", fontWeight: "800", color: "var(--text-muted)", background: "var(--bg-app)", borderBottom: "1px solid #DBE3E0", textAlign: "left", letterSpacing: "0.5px" };

  return (
    <div style={{ overflowX: "auto", width: "100%" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
        <thead>
          <tr>
            <th style={{ ...thStyle, width: "8%" }}>IMAGEN</th>
            <th style={{ ...thStyle, width: "32%" }}>DETALLES DEL EVENTO</th>
            <th style={{ ...thStyle, width: "22%" }}>FECHA Y DURACIÓN</th>
            <th style={{ ...thStyle, width: "13%" }}>ZONA / UBICACIÓN</th>
            <th style={{ ...thStyle, width: "15%" }}>ESTADO</th>
            <th style={{ ...thStyle, width: "10%", textAlign: "right" }}>ACCIONES</th>
          </tr>
        </thead>
        <tbody>
          {eventos.map((evento) => (
            <tr key={evento.id_evento} style={{ transition: "background 0.2s" }} onMouseOver={(e) => e.currentTarget.style.background = "var(--bg-app)"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>

              {/* IMAGEN */}
              <td style={{ ...cellStyle, verticalAlign: "middle" }}>
                {evento.imagen_url ? (
                  <img src={evento.imagen_url} alt={evento.nombre} style={{ width: "44px", height: "44px", borderRadius: "6px", objectFit: "cover", border: "1px solid #DBE3E0", display: "block" }} />
                ) : (
                  <span style={{ color: "var(--text-muted)", opacity: 0.4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <IconCamera />
                  </span>
                )}
              </td>

              {/* NOMBRE Y DESCRIPCION */}
              <td style={cellStyle}>
                <div style={{ fontWeight: "700", color: "#0F766E", fontSize: "14px" }}>{evento.nombre}</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px", maxWidth: "320px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {evento.descripcion || "Sin descripción registrada"}
                </div>
              </td>

              {/* FECHA Y HORA */}
              <td style={cellStyle}>
                <div style={{ fontWeight: "600" }}>
                  {new Date(evento.fecha_hora_inicio).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                  {new Date(evento.fecha_hora_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(evento.fecha_hora_final).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </td>

              {/* UBICACION */}
              <td style={{ ...cellStyle, fontWeight: "700", color: "var(--text-muted)" }}>
                {evento.ubicacion?.nombre_lugar || `Zona #${evento.id_ubicacion}`}
              </td>

              {/* ESTADO BADGE */}
              <td style={cellStyle}>
                <span style={{
                  ...obtenerEstiloEstado(evento.estado),
                  padding: "4px 10px", borderRadius: "4px", fontSize: "10px", fontWeight: "800", display: "inline-block", letterSpacing: "0.5px"
                }}>
                  {evento.estado?.replace('_', ' ')}
                </span>
              </td>

              {/* ACCIONES */}
              <td style={{ ...cellStyle, textAlign: "right" }}>
                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => onEdit(evento)}
                    title="Editar evento"
                    style={{
                      background: "transparent", border: "1px solid #5eead4", color: "#0F766E",
                      padding: "6px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "700",
                      cursor: "pointer", transition: "all 0.2s", lineHeight: 0,
                    }}
                    onMouseOver={(e) => { e.target.style.background = "#ccfbf1" }}
                    onMouseOut={(e) => { e.target.style.background = "transparent" }}
                  >
                    <IconEdit />
                  </button>
                  {evento.estado !== "CANCELADO" && evento.estado !== "FINALIZADO" && (
                    <button
                      onClick={() => onDelete(evento.id_evento)}
                      style={{
                        background: "transparent", border: "1px solid #fca5a5", color: "#ef4444",
                        padding: "6px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: "700",
                        cursor: "pointer", transition: "all 0.2s"
                      }}
                      onMouseOver={(e) => { e.target.style.background = "#fee2e2" }}
                      onMouseOut={(e) => { e.target.style.background = "transparent" }}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}

          {eventos.length === 0 && (
            <tr>
              <td colSpan="6" style={{ ...cellStyle, padding: "40px", textAlign: "center", color: "var(--text-muted)", fontWeight: "600" }}>
                No se encontraron registros de eventos activos en la base de datos.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}