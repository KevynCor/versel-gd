// src/pages/prestamos/PrestamoDocumentoHistorial.jsx
import React, { useState } from "react";
import { Pagination } from "../../components/data/Pagination";
import { SearchBar } from "../../components/controls/SearchBar";
import { EmptyState } from "../../components/ui/EmptyState";

// Iconos
import { Eye, Printer } from "lucide-react";

export default function PrestamoDocumentoHistorial({ prestamos }) {
  const historial = prestamos.filter(p => ["devuelto", "cancelado"].includes(p.estado_prestamo));
  const [filters, setFilters] = useState({ search: "" });
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [modalDetalle, setModalDetalle] = useState(null);

  const filtered = historial.filter(p => !filters.search || p.nombre_prestatario.toLowerCase().includes(filters.search.toLowerCase()));
  const total = filtered.length;
  const current = filtered.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className="space-y-4">
      <SearchBar value={filters.search} onChange={v => setFilters(f => ({ ...f, search: v }))} />
      {current.length === 0 ? (
        <EmptyState title="Sin historial" message="No hay préstamos finalizados." />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-slate-50 uppercase text-xs">
                <tr>
                  <th className="px-3 py-2 border-b text-left">Acciones</th>
                  <th className="px-3 py-2 border-b text-left">Prestatario</th>
                  <th className="px-3 py-2 border-b text-left">F. Préstamo</th>
                  <th className="px-3 py-2 border-b text-left">F. Dev. Real</th>
                  <th className="px-3 py-2 border-b text-left">Estado</th>
                </tr>
              </thead>
              <tbody>
                {current.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 border-b">
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button onClick={() => setModalDetalle(p)} className="text-blue-600 hover:text-blue-800" title="Ver detalle">
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2">{p.nombre_prestatario}</td>
                    <td className="px-3 py-2">{new Date(p.fecha_prestamo).toLocaleDateString()}</td>
                    <td className="px-3 py-2">{p.fecha_devolucion_real ? new Date(p.fecha_devolucion_real).toLocaleDateString() : "—"}</td>
                    <td className="px-3 py-2">
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs uppercase">
                        {p.estado_prestamo}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={total} pageSize={pageSize} onPageChange={setPage} />
        </>
      )}

      {modalDetalle && <ModalDetalle prestamo={modalDetalle} onClose={() => setModalDetalle(null)} />}
    </div>
  );
}

const ModalDetalle = ({ prestamo, onClose }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
    <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full" onClick={e => e.stopPropagation()}>
      <div className="p-6 border-b flex justify-between">
        <h3 className="text-xl font-bold">Detalle del Préstamo</h3>
        <button onClick={onClose} className="text-gray-500"><X size={20} /></button>
      </div>
      <div className="p-6 space-y-3">
        <p><strong>ID:</strong> {prestamo.id.slice(0,8)}</p>
        <p><strong>Prestatario:</strong> {prestamo.nombre_prestatario}</p>
        <p><strong>Estado:</strong> <span className="uppercase">{prestamo.estado_prestamo}</span></p>
        <div>
          <strong>Documentos:</strong>
          <table className="w-full mt-2 text-sm border-collapse">
            <thead><tr className="bg-slate-100"><th>ID + Descripción</th><th>Estado</th></tr></thead>
            <tbody>
              {prestamo.documentos?.map(d => (
                <tr key={d.id}>
                  <td>{d.documento_id} - {d.descripcion}</td>
                  <td>{d.estado_documento}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="p-6 flex justify-end border-t">
        <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg">Cerrar</button>
      </div>
    </div>
  </div>
);