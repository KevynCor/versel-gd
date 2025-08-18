// src/pages/prestamos/PrestamoDocumentoActivos.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../../utils/supabaseClient";
import { Pagination } from "../../components/data/Pagination";
import { SearchBar } from "../../components/controls/SearchBar";
import { EmptyState } from "../../components/ui/EmptyState";

// Iconos
import { Eye, XCircle, X, CheckCircle } from "lucide-react";

export default function PrestamoDocumentoActivos({ setPrestamos: setPrestamosProp, setMensaje }) {
  const [prestamos, setPrestamos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "", estado: "prestado" });
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [modalDetalle, setModalDetalle] = useState(null);
  const [modalCancelar, setModalCancelar] = useState(null);

  // Cargar préstamos activos
  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from("prestamos")
          .select(`*, documentos: prestamos_documentos(*)`)
          .order("fecha_prestamo", { ascending: false });

        if (filters.estado === "prestado") {
          query = query.eq("estado_prestamo", "prestado");
        } else if (filters.estado === "retrasado") {
          query = query.eq("estado_prestamo", "retrasado");
        }
        // Si estado === "", trae todos (prestado + retrasado)

        const {  data, error } = await query;

        if (error) throw error;
        setPrestamos(data || []);
        setPrestamosProp?.(data || []);
      } catch (err) {
        console.error("Error cargando préstamos:", err);
        setMensaje({ mensaje: "Error cargando préstamos", tipo: "error" });
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, [filters.estado, setPrestamosProp, setMensaje]);

  // Filtrar por búsqueda
  const filtered = prestamos.filter(p =>
    !filters.search ||
    p.nombre_prestatario.toLowerCase().includes(filters.search.toLowerCase())
  );

  const total = filtered.length;
  const startIndex = page * pageSize;
  const current = filtered.slice(startIndex, startIndex + pageSize);

  // --- Devolución Parcial ---
  const devolverDocumento = async (prestamoId, docId, observacion = "") => {
    try {
      const { error } = await supabase
        .from("prestamos_documentos")
        .update({
          estado_documento: "devuelto",
          fecha_devolucion: new Date().toISOString(),
          observacion_devolucion: observacion
        })
        .eq("prestamo_id", prestamoId)
        .eq("documento_id", docId);

      if (error) throw error;

      // Verificar si todos están devueltos
      const {  docs } = await supabase
        .from("prestamos_documentos")
        .select("estado_documento")
        .eq("prestamo_id", prestamoId);

      const todosDevueltos = docs.every(d => d.estado_documento === "devuelto");

      if (todosDevueltos) {
        await supabase
          .from("prestamos")
          .update({
            estado_prestamo: "devuelto",
            fecha_devolucion_real: new Date().toISOString()
          })
          .eq("id", prestamoId);
      }

      setMensaje({ mensaje: "✅ Documento devuelto", tipo: "success" });

      // Refrescar datos
      const { data } = await supabase
        .from("prestamos")
        .select(`*, documentos: prestamos_documentos(*)`)
        .order("fecha_prestamo", { ascending: false });

      setPrestamos(data || []);
      setPrestamosProp?.(data || []);
    } catch (err) {
      console.error("Error al devolver documento:", err);
      setMensaje({ mensaje: "Error al devolver el documento", tipo: "error" });
    }
  };

  // --- Cancelar Préstamo ---
  const cancelarPrestamo = async (id, onSuccess) => {
    try {
      const { error } = await supabase
        .from("prestamos")
        .update({ estado_prestamo: "cancelado" })
        .eq("id", id);

      if (error) throw error;

      setMensaje({ mensaje: "Préstamo cancelado", tipo: "info" });

      const { data } = await supabase
        .from("prestamos")
        .select(`*, documentos: prestamos_documentos(*)`)
        .order("fecha_prestamo", { ascending: false });

      setPrestamos(data || []);
      setPrestamosProp?.(data || []);

      onSuccess?.(); // Cierra el modal
    } catch (err) {
      console.error("Error al cancelar préstamo:", err);
      setMensaje({ mensaje: "Error al cancelar", tipo: "error" });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin w-6 h-6 border-2 border-blue-600 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
          value={filters.search}
          onChange={v => setFilters(f => ({ ...f, search: v }))}
          placeholder="Buscar por prestatario..."
        />
        <select
          value={filters.estado}
          onChange={e => {
            setFilters(f => ({ ...f, estado: e.target.value }));
            setPage(0);
          }}
          className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm self-start sm:self-center"
        >
          <option value="">Todos</option>
          <option value="prestado">Prestado</option>
          <option value="retrasado">Retrasado</option>
        </select>
      </div>

      {/* Tabla */}
      {current.length === 0 ? (
        <EmptyState title="Sin préstamos activos" message="No hay préstamos en curso." />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-slate-50 uppercase text-xs text-slate-700">
                <tr>
                  <th className="px-3 py-2 border-b text-left">Acciones</th>
                  <th className="px-3 py-2 border-b text-left">Prestatario</th>
                  <th className="px-3 py-2 border-b text-left">F. Préstamo</th>
                  <th className="px-3 py-2 border-b text-left">F. Dev. Prevista</th>
                  <th className="px-3 py-2 border-b text-left">F. Dev. Real</th>
                  <th className="px-3 py-2 border-b text-left">Estado</th>
                </tr>
              </thead>
              <tbody>
                {current.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 border-b border-slate-200">
                    <td className="px-3 py-2">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => setModalDetalle(p)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Ver detalle"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => setModalCancelar(p)}
                          className="text-red-600 hover:text-red-800"
                          title="Cancelar préstamo"
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2">{p.nombre_prestatario}</td>
                    <td className="px-3 py-2">{new Date(p.fecha_prestamo).toLocaleDateString()}</td>
                    <td className="px-3 py-2">{new Date(p.fecha_devolucion_prevista).toLocaleDateString()}</td>
                    <td className="px-3 py-2">
                      {p.fecha_devolucion_real
                        ? new Date(p.fecha_devolucion_real).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs uppercase font-semibold
                          ${p.estado_prestamo === "prestado" ? "bg-blue-100 text-blue-800" :
                            p.estado_prestamo === "retrasado" ? "bg-red-100 text-red-800" :
                            "bg-gray-100 text-gray-800"}`
                        }
                      >
                        {p.estado_prestamo}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="flex justify-end">
            <Pagination
              page={page}
              total={total}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </div>
        </>
      )}

      {/* Modal Detalle con Devolución Parcial */}
      {modalDetalle && (
        <ModalDetalle
          prestamo={modalDetalle}
          onClose={() => setModalDetalle(null)}
          onDevolver={devolverDocumento}
        />
      )}

      {/* Modal Cancelar */}
      {modalCancelar && (
        <ModalCancelar
          prestamo={modalCancelar}
          onConfirm={() => cancelarPrestamo(modalCancelar.id, () => setModalCancelar(null))}
          onCancel={() => setModalCancelar(null)}
        />
      )}
    </div>
  );
}

// --- Modal Detalle con Devolución Parcial ---
const ModalDetalle = ({ prestamo, onClose, onDevolver }) => {
  const [observaciones, setObservaciones] = useState({});
  const [selectAll, setSelectAll] = useState(false);
  const [selected, setSelected] = useState({});

  useEffect(() => {
    const init = {};
    prestamo.documentos.forEach(d => {
      init[d.documento_id] = d.estado_documento !== "devuelto";
    });
    setSelected(init);
  }, [prestamo]);

  useEffect(() => {
    if (selectAll) {
      const nuevos = {};
      prestamo.documentos.forEach(d => {
        if (d.estado_documento !== "devuelto") nuevos[d.documento_id] = true;
      });
      setSelected(nuevos);
    } else {
      const actuales = { ...selected };
      Object.keys(actuales).forEach(id => {
        if (prestamo.documentos.find(d => d.documento_id === id)?.estado_documento !== "devuelto") {
          actuales[id] = false;
        }
      });
      setSelected(actuales);
    }
  }, [selectAll, prestamo]);

  const handleDevolver = async (docId) => {
    const obs = observaciones[docId] || "";
    await onDevolver(prestamo.id, docId, obs);
    setSelected(prev => ({ ...prev, [docId]: false }));
  };

  const handleDevolverSeleccionados = () => {
    Object.keys(selected)
      .filter(id => selected[id])
      .forEach(docId => {
        handleDevolver(docId);
      });
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b flex justify-between items-start">
          <h3 className="text-xl font-bold">Detalle del Préstamo</h3>
          <button onClick={onClose} className="text-gray-500">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <p><strong>ID:</strong> {prestamo.id.slice(0, 8)}</p>
            <p><strong>Prestatario:</strong> {prestamo.nombre_prestatario}</p>
            <p><strong>Fecha Préstamo:</strong> {new Date(prestamo.fecha_prestamo).toLocaleDateString()}</p>
            <p><strong>Devolución Prevista:</strong> {new Date(prestamo.fecha_devolucion_prevista).toLocaleDateString()}</p>
            <p><strong>Devolución Real:</strong> {prestamo.fecha_devolucion_real ? new Date(prestamo.fecha_devolucion_real).toLocaleDateString() : "—"}</p>
            <p><strong>Estado:</strong> <span className="uppercase font-bold">{prestamo.estado_prestamo}</span></p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id="selectAll"
                checked={selectAll}
                onChange={e => setSelectAll(e.target.checked)}
              />
              <label htmlFor="selectAll" className="text-sm font-medium">Seleccionar todos pendientes</label>
            </div>

            <table className="w-full text-sm border-collapse">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-2 py-2 text-left">Devolver</th>
                  <th className="px-2 py-2 text-left">Documento</th>
                  <th className="px-2 py-2 text-left">Estado</th>
                  <th className="px-2 py-2 text-left">Observación</th>
                  <th className="px-2 py-2 text-left">Acción</th>
                </tr>
              </thead>
              <tbody>
                {prestamo.documentos.map(d => (
                  <tr key={d.id} className="border-b border-slate-100">
                    <td className="px-2 py-2">
                      <input
                        type="checkbox"
                        checked={!!selected[d.documento_id]}
                        disabled={d.estado_documento === "devuelto"}
                        onChange={e => setSelected(prev => ({ ...prev, [d.documento_id]: e.target.checked }))}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <strong>{d.documento_id}</strong> - {d.descripcion}
                    </td>
                    <td className="px-2 py-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs uppercase
                          ${d.estado_documento === "devuelto" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`
                        }
                      >
                        {d.estado_documento}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        placeholder="Observación"
                        className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                        onChange={e => setObservaciones(prev => ({ ...prev, [d.documento_id]: e.target.value }))}
                      />
                    </td>
                    <td className="px-2 py-2">
                      {d.estado_documento === "devuelto" ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle size={16} />
                          <span className="text-sm">Devuelto</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleDevolver(d.documento_id)}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          Devolver
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {Object.values(selected).some(v => v) && (
            <div className="flex justify-end">
              <button
                onClick={handleDevolverSeleccionados}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm"
              >
                Devolver Seleccionados
              </button>
            </div>
          )}
        </div>

        <div className="p-6 flex justify-end border-t">
          <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Modal Cancelar ---
const ModalCancelar = ({ prestamo, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onCancel}>
    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
      <div className="p-6 border-b">
        <h3 className="text-xl font-bold text-red-700">Cancelar Préstamo</h3>
      </div>
      <div className="p-6">
        <p>¿Estás seguro de cancelar el préstamo de:</p>
        <p className="font-semibold mt-1">{prestamo.nombre_prestatario}?</p>
        <p className="text-sm text-slate-600 mt-2">Esta acción no se puede deshacer.</p>
      </div>
      <div className="p-6 flex justify-end gap-3 border-t">
        <button onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg">No</button>
        <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg">
          Sí, Cancelar
        </button>
      </div>
    </div>
  </div>
);