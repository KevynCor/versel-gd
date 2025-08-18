// src/pages/prestamos/PrestamoDocumentoNuevo.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../../utils/supabaseClient";

// Componentes
import { SearchBar } from "../../components/controls/SearchBar";

// Iconos
import { Plus, XCircle } from "lucide-react";

export default function PrestamoDocumentoNuevo({ setMensaje }) {
  const [prestatario, setPrestatario] = useState("");
  const [emailPrestatario, setEmailPrestatario] = useState("");
  const [fechaDevolucion, setFechaDevolucion] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [documentosSeleccionados, setDocumentosSeleccionados] = useState([]);
  const [showSelected, setShowSelected] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [documentos, setDocumentos] = useState([]);
  const [documentosDisponibles, setDocumentosDisponibles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalConfirmacion, setModalConfirmacion] = useState(null);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const cargarDocumentos = async () => {
      const {  data, error } = await supabase.from("Inventario_documental").select("id, Descripcion");
      if (error) {
        setMensaje({ mensaje: "Error cargando documentos", tipo: "error" });
      } else {
        setDocumentos(data || []);
      }
    };
    cargarDocumentos();
  }, []);

  useEffect(() => {
    if (!documentos.length) return;

    const prestados = new Set(
      documentosSeleccionados
        .map(id => id)
        .filter(id => documentosDisponibles.some(d => d.id === id))
    );

    setDocumentosDisponibles(documentos.filter(d => !prestados.has(d.id)));
  }, [documentos, documentosSeleccionados]);

  const seleccionadosDetalles = documentos.filter(d => documentosSeleccionados.includes(d.id));
  const documentosFiltrados = documentosDisponibles.filter(doc =>
    doc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.Descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validarCampos = () => {
    if (!prestatario.trim()) {
      setMensaje({ mensaje: "Debe ingresar el nombre del prestatario", tipo: "warning" });
      return false;
    }
    if (!fechaDevolucion) {
      setMensaje({ mensaje: "Debe ingresar la fecha de devolución", tipo: "warning" });
      return false;
    }
    if (new Date(fechaDevolucion) < new Date(today)) {
      setMensaje({ mensaje: "La fecha no puede ser anterior a hoy", tipo: "warning" });
      return false;
    }
    if (documentosSeleccionados.length === 0) {
      setMensaje({ mensaje: "Debe seleccionar al menos un documento", tipo: "warning" });
      return false;
    }
    return true;
  };

  const confirmarNuevoPrestamo = () => {
    if (!validarCampos()) return;
    setModalConfirmacion({
      prestatario,
      emailPrestatario,
      fechaDevolucion,
      observaciones,
      documentos: seleccionadosDetalles
    });
  };

  const crearPrestamo = async () => {
    setLoading(true);
    try {
      const {  prestamo, error: err1 } = await supabase
        .from("prestamos")
        .insert([{
          nombre_prestatario: modalConfirmacion.prestatario,
          email_prestatario: modalConfirmacion.emailPrestatario,
          fecha_devolucion_prevista: modalConfirmacion.fechaDevolucion,
          observaciones: modalConfirmacion.observaciones,
          estado_prestamo: "prestado"
        }])
        .select()
        .single();

      if (err1) throw err1;

      const docs = modalConfirmacion.documentos.map(d => ({
        prestamo_id: prestamo.id,
        documento_id: d.id,
        estado_documento: "prestado"
      }));

      const { error: err2 } = await supabase.from("prestamos_documentos").insert(docs);
      if (err2) throw err2;

      setMensaje({ mensaje: "✅ Préstamo creado", tipo: "success" });
      resetForm();
      setModalConfirmacion(null);
    } catch (err) {
      setMensaje({ mensaje: "Error creando préstamo", tipo: "error" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPrestatario("");
    setEmailPrestatario("");
    setFechaDevolucion("");
    setObservaciones("");
    setDocumentosSeleccionados([]);
    setShowSelected(false);
    setSearchTerm("");
  };

  return (
    <div className="space-y-4 bg-white rounded-xl shadow-lg p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-slate-800">Nuevo Préstamo</h3>

      {/* Formulario */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Prestatario *</label>
          <input value={prestatario} onChange={e => setPrestatario(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input value={emailPrestatario} onChange={e => setEmailPrestatario(e.target.value)} type="email" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Devolución *</label>
          <input type="date" value={fechaDevolucion} onChange={e => setFechaDevolucion(e.target.value)} min={today} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones</label>
        <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
      </div>

      {/* Búsqueda */}
      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Buscar por ID o descripción..."
      />

      {/* Selector */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <input type="checkbox" id="verSeleccionados" checked={showSelected} onChange={e => setShowSelected(e.target.checked)} />
          <label htmlFor="verSeleccionados" className="text-sm font-medium text-slate-700">Ver seleccionados</label>
        </div>
        <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1 text-sm">
          {showSelected ? (
            seleccionadosDetalles.length === 0 ? (
              <p className="text-slate-500">No has seleccionado documentos</p>
            ) : (
              seleccionadosDetalles.map(doc => (
                <div key={doc.id} className="flex items-center gap-2 bg-blue-50 p-1 rounded">
                  <input type="checkbox" checked={true} onChange={() => setDocumentosSeleccionados(prev => prev.filter(id => id !== doc.id))} className="text-indigo-600" />
                  <span>{doc.id} - {doc.Descripcion}</span>
                </div>
              ))
            )
          ) : (
            documentosFiltrados.map(doc => (
              <label key={doc.id} className="flex items-center gap-2 hover:bg-slate-50 p-1 rounded">
                <input
                  type="checkbox"
                  checked={documentosSeleccionados.includes(doc.id)}
                  onChange={e => {
                    if (e.target.checked) setDocumentosSeleccionados(prev => [...prev, doc.id]);
                    else setDocumentosSeleccionados(prev => prev.filter(id => id !== doc.id));
                  }}
                  className="text-indigo-600"
                />
                <span>{doc.id} - {doc.Descripcion}</span>
              </label>
            ))
          )}
        </div>
      </div>

      <button
        onClick={confirmarNuevoPrestamo}
        disabled={loading}
        className="w-full sm:w-auto px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-60"
      >
        Confirmar Préstamo
      </button>

      {/* Modal Confirmación */}
      {modalConfirmacion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setModalConfirmacion(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold">Confirmar Préstamo</h3>
            </div>
            <div className="p-6 space-y-4">
              <p><strong>Prestatario:</strong> {modalConfirmacion.prestatario}</p>
              <p><strong>Email:</strong> {modalConfirmacion.emailPrestatario || "N/A"}</p>
              <p><strong>Devolución:</strong> {new Date(modalConfirmacion.fechaDevolucion).toLocaleDateString()}</p>
              <p><strong>Observaciones:</strong> {modalConfirmacion.observaciones || "—"}</p>
              <div>
                <strong>Documentos ({modalConfirmacion.documentos.length}):</strong>
                <ul className="list-disc pl-5 mt-1">
                  {modalConfirmacion.documentos.map(d => <li key={d.id}>{d.id} - {d.Descripcion}</li>)}
                </ul>
              </div>
            </div>
            <div className="p-6 flex justify-end gap-3 border-t">
              <button onClick={() => setModalConfirmacion(null)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg">Cancelar</button>
              <button onClick={crearPrestamo} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
                {loading ? "Guardando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}