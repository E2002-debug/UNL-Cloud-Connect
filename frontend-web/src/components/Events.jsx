import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:8000/eventos";

export default function Events() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [nuevoEvento, setNuevoEvento] = useState({
    titulo: "",
    descripcion: "",
    fecha_inicio: "",
    fecha_fin: "",
    id_ubicacion: ""
  });

  useEffect(() => {
    cargarEventos();
  }, []);

  const cargarEventos = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API_URL}/activos`
      );

      setEventos(response.data);
    } catch (error) {
      console.error("Error al cargar eventos:", error);
    } finally {
      setLoading(false);
    }
  };

  const crearEvento = async () => {
    try {
      await axios.post(
        `${API_URL}/`,
        nuevoEvento,
        {
          headers: {
            "x-user-id": "1",
            "x-user-role": "1"
          }
        }
      );

      cargarEventos();

      setNuevoEvento({
        titulo: "",
        descripcion: "",
        fecha_inicio: "",
        fecha_fin: "",
        id_ubicacion: ""
      });

    } catch (error) {
      console.error(error);
      alert("No se pudo crear el evento");
    }
  };

  const eliminarEvento = async (id) => {
    if (!window.confirm("¿Cancelar este evento?")) {
      return;
    }

    try {
      await axios.delete(
        `${API_URL}/${id}`,
        {
          headers: {
            "x-user-id": "1",
            "x-user-role": "1"
          }
        }
      );

      cargarEventos();

    } catch (error) {
      console.error(error);
      alert("No se pudo cancelar el evento");
    }
  };

  return (
    <div className="p-6">

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          Gestión de Eventos UNL
        </h1>
      </div>

      {/* Formulario */}

      <div className="bg-white rounded-lg shadow-md p-5 mb-6">

        <h2 className="text-xl font-semibold mb-4">
          Registrar Evento
        </h2>

        <div className="grid grid-cols-2 gap-4">

          <input
            type="text"
            placeholder="Título"
            value={nuevoEvento.titulo}
            onChange={(e) =>
              setNuevoEvento({
                ...nuevoEvento,
                titulo: e.target.value
              })
            }
            className="border p-2 rounded"
          />

          <input
            type="number"
            placeholder="ID Ubicación"
            value={nuevoEvento.id_ubicacion}
            onChange={(e) =>
              setNuevoEvento({
                ...nuevoEvento,
                id_ubicacion: e.target.value
              })
            }
            className="border p-2 rounded"
          />

          <input
            type="datetime-local"
            value={nuevoEvento.fecha_inicio}
            onChange={(e) =>
              setNuevoEvento({
                ...nuevoEvento,
                fecha_inicio: e.target.value
              })
            }
            className="border p-2 rounded"
          />

          <input
            type="datetime-local"
            value={nuevoEvento.fecha_fin}
            onChange={(e) =>
              setNuevoEvento({
                ...nuevoEvento,
                fecha_fin: e.target.value
              })
            }
            className="border p-2 rounded"
          />

        </div>

        <textarea
          placeholder="Descripción"
          value={nuevoEvento.descripcion}
          onChange={(e) =>
            setNuevoEvento({
              ...nuevoEvento,
              descripcion: e.target.value
            })
          }
          className="border p-2 rounded w-full mt-4"
          rows="4"
        />

        <button
          onClick={crearEvento}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
        >
          Crear Evento
        </button>

      </div>

      {/* Tabla */}

      <div className="bg-white rounded-lg shadow-md p-5">

        <h2 className="text-xl font-semibold mb-4">
          Eventos Activos
        </h2>

        {loading ? (
          <p>Cargando eventos...</p>
        ) : (
          <table className="w-full border-collapse">

            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">ID</th>
                <th className="border p-2">Título</th>
                <th className="border p-2">Estado</th>
                <th className="border p-2">Acciones</th>
              </tr>
            </thead>

            <tbody>

              {eventos.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="text-center p-4"
                  >
                    No existen eventos activos
                  </td>
                </tr>
              ) : (
                eventos.map((evento) => (
                  <tr key={evento.id_evento}>

                    <td className="border p-2">
                      {evento.id_evento}
                    </td>

                    <td className="border p-2">
                      {evento.titulo}
                    </td>

                    <td className="border p-2">
                      {evento.estado}
                    </td>

                    <td className="border p-2">

                      <button
                        onClick={() =>
                          eliminarEvento(
                            evento.id_evento
                          )
                        }
                        className="bg-red-600 text-white px-3 py-1 rounded"
                      >
                        Cancelar
                      </button>

                    </td>

                  </tr>
                ))
              )}

            </tbody>

          </table>
        )}

      </div>

    </div>
  );
}