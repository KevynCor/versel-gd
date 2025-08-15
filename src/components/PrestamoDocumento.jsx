import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../utils/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, RotateCcw, X, Eye } from 'lucide-react';

/* utils: fechas y formato en una línea */
const nowLima = () => new Date(Date.now() - 5 * 60 * 60 * 1000);
const fechaLimaISO = () => nowLima().toISOString().slice(0, 19);
const fechaDevolucionPrevistaISO = d => { const x = nowLima(); x.setDate(x.getDate() + d); return x.toISOString().slice(0, 19); };
const fmt = s => new Date(s).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' });

/* componentes chicos reutilizables */
const Toast = ({ toast, onClose }) => (
  <AnimatePresence>
    {toast && (
      <motion.div initial={{ opacity: 0, y: -50, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -50, scale: 0.8 }}
        className={`fixed top-6 right-6 px-4 py-3 rounded-xl shadow-lg text-white flex items-center gap-3 z-50 ${toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-yellow-600'}`}>
        <span>{toast.message}</span>
        <button onClick={onClose} className="hover:scale-110 transition"><X size={16} /></button>
      </motion.div>
    )}
  </AnimatePresence>
);

const Modal = ({ open, onClose, size = 'max-w-4xl', children }) => (
  <AnimatePresence>
    {open && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={onClose} // ⬅️ Cierra al hacer clic en el fondo
      >
        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} className={`bg-white rounded-xl shadow-lg p-6 w-full ${size} relative`}
          onClick={(e) => e.stopPropagation()} // ⬅️ Evita que clic dentro cierre
        >
          <button onClick={onClose} className="absolute top-3 right-3" >
            <X size={20} />
          </button>
          {children}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const BadgeEstado = ({ estado }) => <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${estado === 'prestado' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>{estado}</span>;

const RowAction = ({ title, onClick, className, children }) => (
  <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={onClick} className={`rounded-full p-2 flex items-center justify-center transition-colors shadow-sm ${className}`} title={title}>{children}</motion.button>
);

/* listas de checkboxes reutilizables */
const CheckboxList = ({ items, isChecked, isDisabled, onToggle, render }) => (
  <div className="max-h-40 overflow-y-auto border rounded-lg p-2">{items.map(it => (
    <label key={it.key} className="flex items-center gap-2 mb-1">
      <input type="checkbox" checked={isChecked(it)} disabled={isDisabled?.(it)} onChange={() => onToggle(it)} />
      <span className={isDisabled?.(it) ? 'line-through text-gray-400' : ''}>{render(it)}</span>
    </label>
  ))}</div>
);

/* tabla de préstamos compacta */
const LoanTable = ({ loans, loading, onView, onReturn }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full bg-white rounded-xl shadow-lg">
      <thead className="bg-blue-100 text-blue-700">
        <tr>{['Acción', 'Prestatario', 'Fecha Préstamo', 'Fecha Prevista', 'Fecha Devolución', 'Estado', 'Observación Préstamo'].map(h => <th key={h} className="px-4 py-2">{h}</th>)}</tr>
      </thead>
      <tbody>
        {loading ? <tr><td colSpan={8} className="text-center py-4 text-gray-500 italic">Cargando...</td></tr> :
         loans.length === 0 ? <tr><td colSpan={8} className="text-center py-4 text-gray-500 italic">No hay préstamos</td></tr> :
         loans.map(loan => (
          <tr key={loan.id} className="border-b hover:bg-gray-100">
            <td className="px-4 py-2 flex gap-2">
              <RowAction title="Ver detalle" onClick={() => onView(loan.id)} className="bg-gray-100 hover:bg-gray-200 text-gray-700"><Eye className="w-5 h-5" /></RowAction>
              {loan.estado_prestamo === 'prestado' && <RowAction title="Registrar devolución" onClick={() => onReturn(loan.id)} className="bg-blue-100 hover:bg-blue-200 text-blue-700"><RotateCcw className="w-5 h-5" /></RowAction>}
            </td>
            <td className="px-4 py-2 font-medium text-gray-700">{loan.nombre_prestatario}</td>
            <td className="px-4 py-2 text-gray-600">{fmt(loan.fecha_prestamo)}</td>
            <td className="px-4 py-2 text-gray-600">{fmt(loan.fecha_devolucion_prevista)}</td>
            <td className="px-4 py-2 text-gray-600">{loan.fecha_devolucion_real ? fmt(loan.fecha_devolucion_real) : ''}</td>
            <td className="px-4 py-2"><BadgeEstado estado={loan.estado_prestamo} /></td>
            <td className="px-4 py-2 text-sm italic text-gray-500">{loan.observaciones || ' - '}</td>
          </tr>
        )) }
      </tbody>
    </table>
  </div>
);

const PrestamoDocumentoTabla = () => {
  /* estado: datos y ui */
  const [loans, setLoans] = useState([]);                  // préstamos con documentos embebidos
  const [loanDocuments, setLoanDocuments] = useState([]);  // tabla relacional cruda
  const [docSearchResults, setDocSearchResults] = useState([]); // resultados de búsqueda de inventario
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [ui, setUI] = useState({ searchTerm: '', statusFilter: '', fechaFilter: '', newLoanModal: false, editingLoanId: null, viewLoanId: null, confirmNewLoan: false, showSelectedOnly: false });
  const [form, setForm] = useState({ nombre_prestatario: '', cantidad_dias: 1, observaciones: '', selectedDocs: [], docSearchInput: '', returnObservation: '', extendDays: 0 });

  /* toasts en una línea */
  const showToast = (type, message) => { setToast({ type, message }); setTimeout(() => setToast(null), 4000); };

  /* cargar préstamos + documentos */
  const fetchLoans = useCallback(async () => {
    setLoading(true);
    try {
      const { data: prestamos = [], error: prestErr } = await supabase.from('prestamos').select('*').order('fecha_prestamo', { ascending: false }); if (prestErr) throw prestErr;
      const { data: prestamosDocs = [], error: pdErr } = await supabase.from('prestamos_documentos').select('*'); if (pdErr) throw pdErr;
      const { data: inventarioDocs = [], error: invErr } = await supabase.from('Inventario_documental').select('*'); if (invErr) throw invErr;
      const loansWithDocs = prestamos.map(p => ({ ...p, prestamos_documentos: prestamosDocs.filter(pd => pd.prestamo_id === p.id).map(pd => ({ ...pd, Descripcion: inventarioDocs.find(d => d.id === pd.documento_id)?.Descripcion || 'Sin descripción' })) }));
      setLoans(loansWithDocs); setLoanDocuments(prestamosDocs);
    } catch (err) { showToast('error', `Error al cargar préstamos: ${err.message}`); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchLoans(); }, [fetchLoans]);

  /* búsqueda de inventario para nuevo préstamo */
  const fetchDocumentsForLoan = async (search = '') => {
    try {
      const q = search.trim() ? supabase.from('Inventario_documental').select('*').or(`Descripcion.ilike.%${search}%,id.ilike.%${search}%`) : supabase.from('Inventario_documental').select('*');
      const { data = [], error } = await q; if (error) throw error; setDocSearchResults(data);
    } catch (err) { showToast('error', `Error al cargar documentos: ${err.message}`); }
  };

  /* helpers selección docs */
  const isDocPrestado = useCallback(docId => loans.some(l => l.estado_prestamo === 'prestado' && l.prestamos_documentos.some(pd => pd.documento_id === docId && !pd.fecha_devolucion)), [loans]);
  const toggleSelectedDoc = docId => setForm(p => ({ ...p, selectedDocs: p.selectedDocs.includes(docId) ? p.selectedDocs.filter(id => id !== docId) : [...p.selectedDocs, docId] }));

  /* filtros de préstamos */
  const filteredLoans = useMemo(() => loans.filter(l =>
    l.nombre_prestatario?.toLowerCase().includes(ui.searchTerm.toLowerCase()) &&
    (ui.statusFilter ? l.estado_prestamo === ui.statusFilter : true) &&
    (ui.fechaFilter ? new Date(l.fecha_prestamo).toISOString().slice(0, 10) === ui.fechaFilter : true)
  ), [loans, ui]);

  /* préstamo seleccionado (ver o editar) */
  const selectedLoan = useMemo(() => loans.find(l => l.id === ui.viewLoanId || l.id === ui.editingLoanId), [loans, ui.viewLoanId, ui.editingLoanId]);

  /* handlers de formularios compactos */
  const onChangeForm = e => setForm(p => ({ ...p, [e.target.name]: e.target.name === 'cantidad_dias' ? +e.target.value : e.target.value }));
  const resetNewLoanForm = () => { setForm({ nombre_prestatario: '', cantidad_dias: 1, observaciones: '', selectedDocs: [], docSearchInput: '', returnObservation: '', extendDays: 0 }); setDocSearchResults([]); setUI(u => ({ ...u, newLoanModal: false, confirmNewLoan: false })); };

  /* validaciones comunes */
  const validateLoanForm = () => {
    if (!form.nombre_prestatario.trim()) return showToast('error', 'Ingrese nombre del prestatario');
    if (!form.selectedDocs.length) return showToast('warning', 'Seleccione al menos un documento');
    if (!form.cantidad_dias || isNaN(form.cantidad_dias)) return showToast('error', 'Ingrese un número válido de días');
    return true;
  };

  /* crear préstamo */
  const handleAddLoan = async e => {
    e?.preventDefault?.();
    if (!validateLoanForm()) return;
    setLoading(true);
    try {
      const { data: insertedLoan, error: insertErr } = await supabase.from('prestamos').insert({
        nombre_prestatario: form.nombre_prestatario.trim(),
        fecha_prestamo: fechaLimaISO(),
        fecha_devolucion_prevista: fechaDevolucionPrevistaISO(form.cantidad_dias),
        estado_prestamo: 'prestado',
        observaciones: form.observaciones.trim()
      }).select().single();
      if (insertErr) throw insertErr;
      const { error: docsErr } = await supabase.from('prestamos_documentos').insert(form.selectedDocs.map(docId => ({ prestamo_id: insertedLoan.id, documento_id: docId })));
      if (docsErr) throw docsErr;
      resetNewLoanForm(); fetchLoans(); showToast('success', 'Préstamo agregado');
    } catch (err) { showToast('error', `Error al agregar préstamo: ${err.message}`); } finally { setLoading(false); }
  };

  /* confirmar y crear préstamo (2 pasos) */
  const handleConfirmNewLoan = e => { e.preventDefault(); if (!validateLoanForm()) return; setUI(u => ({ ...u, confirmNewLoan: true })); };
  const confirmAndAddLoan = async () => { setUI(u => ({ ...u, confirmNewLoan: false })); await handleAddLoan({ preventDefault: () => {} }); };

  /* devolución parcial */
  const handlePartialReturn = async loanId => {
    if (!form.selectedDocs.length) return showToast('warning', 'Seleccione al menos un documento a devolver');
    setLoading(true);
    try {
      for (const docId of form.selectedDocs) {
        const { error } = await supabase.from('prestamos_documentos').update({ fecha_devolucion: fechaLimaISO(), observacion_devolucion: form.returnObservation.trim() }).eq('prestamo_id', loanId).eq('documento_id', docId);
        if (error) throw error;
      }
      const { data: docs = [] } = await supabase.from('prestamos_documentos').select('*').eq('prestamo_id', loanId);
      const allReturned = docs.every(d => d.fecha_devolucion);
      if (allReturned) {
        const { error: loanErr } = await supabase.from('prestamos').update({ estado_prestamo: 'devuelto', fecha_devolucion_real: fechaLimaISO() }).eq('id', loanId);
        if (loanErr) throw loanErr;
        showToast('success', 'Todos los documentos devueltos, préstamo cerrado');
      } else showToast('success', 'Devolución parcial registrada');
      setUI(u => ({ ...u, editingLoanId: null })); setForm(p => ({ ...p, selectedDocs: [], returnObservation: '', extendDays: 0 })); fetchLoans();
    } catch (err) { showToast('error', `Error al registrar devolución: ${err.message}`); } finally { setLoading(false); }
  };

  /* render */
  return (
    <div className="p-6 max-w-7xl mx-auto rounded-xl shadow-md border border-gray-300 p-6 shadow-lg max-w-7xl mx-aut">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* header y btn nuevo */}
      <div className="flex justify-between items-center mb-4">
        <motion.h2 className="text-2xl font-bold flex items-center gap-2 mb-6" initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <Search className="w-6 h-6 text-blue-600" /> Préstamos
        </motion.h2>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setUI(u => ({ ...u, newLoanModal: true }))} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow-md flex items-center gap-2">
          <Plus className="w-5 h-5" /> Nuevo préstamo
        </motion.button>
      </div>

      {/* filtros */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <input type="search" placeholder="Buscar por nombre..." className="border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none rounded-xl p-2 flex-1" value={ui.searchTerm} onChange={e => setUI({ ...ui, searchTerm: e.target.value })} />
        <select className="border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none rounded-xl p-2" value={ui.statusFilter} onChange={e => setUI({ ...ui, statusFilter: e.target.value })}>
          <option value="">Todos</option><option value="prestado">Prestado</option><option value="devuelto">Devuelto</option>
        </select>
        <input type="date" className="border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none rounded-xl p-2" value={ui.fechaFilter} onChange={e => setUI({ ...ui, fechaFilter: e.target.value })} />
      </div>

      {/* tabla */}
      <LoanTable loans={filteredLoans} loading={loading} onView={id => setUI({ ...ui, viewLoanId: id })} onReturn={id => { setUI({ ...ui, editingLoanId: id }); setForm(p => ({ ...p, selectedDocs: [], returnObservation: '', extendDays: 0 })); }} />

      {/* modal ver préstamo */}
      <Modal open={Boolean(ui.viewLoanId && selectedLoan)} onClose={() => setUI(u => ({ ...u, viewLoanId: null }))} size="max-w-3xl">
        {selectedLoan && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-blue-600">Detalles del préstamo</h2>
            <div className="space-y-2 text-gray-700">
              <p><strong>Prestatario:</strong> {selectedLoan.nombre_prestatario}</p>
              <p><strong>Fecha préstamo:</strong> {fmt(selectedLoan.fecha_prestamo)}</p>
              <p><strong>Fecha prevista devolución:</strong> {fmt(selectedLoan.fecha_devolucion_prevista)}</p>
              <p><strong>Fecha devolución real:</strong> {selectedLoan.fecha_devolucion_real ? fmt(selectedLoan.fecha_devolucion_real) : '-'}</p>
              <p className="flex items-center gap-2"><strong>Estado:</strong> <BadgeEstado estado={selectedLoan.estado_prestamo} /></p>
              <p><strong>Observación préstamo:</strong> {selectedLoan.observaciones || '-'}</p>
              <p><strong>Observación devolución:</strong> {selectedLoan.observacion_devolucion || '-'}</p>
              <div>
                <strong>Documentos:</strong>
                <ul className="list-disc list-inside">
                  {selectedLoan.prestamos_documentos.map(doc => (
                    <li key={doc.documento_id}>{doc.Descripcion} (ID: {doc.documento_id}) {doc.fecha_devolucion && <span className="px-2 py-1 rounded-full text-xs font-semibold text-green-600">(Devuelto)</span>}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex justify-end mt-4"><button onClick={() => setUI(u => ({ ...u, viewLoanId: null }))} className="px-4 py-2 rounded-lg bg-gray-300">Cerrar</button></div>
          </div>
        )}
      </Modal>

      {/* modal nuevo préstamo */}
      <Modal open={ui.newLoanModal} onClose={resetNewLoanForm}>
        <h2 className="text-xl font-bold mb-4 text-blue-600">Nuevo préstamo</h2>
        <form onSubmit={handleAddLoan} className="space-y-4">
          <input type="text" name="nombre_prestatario" placeholder="Nombre del prestatario" className="w-full border rounded-lg p-2" value={form.nombre_prestatario} onChange={onChangeForm} />
          <div className="inline-flex items-center gap-2 w-full"><input type="number" name="cantidad_dias" min="1" className="w-24 border rounded-lg p-2" value={form.cantidad_dias} onChange={onChangeForm} placeholder="Días" /><span className="text-gray-600 font-medium">días a prestarse</span></div>
          <textarea name="observaciones" className="w-full border rounded-lg p-2" value={form.observaciones} onChange={onChangeForm} placeholder="Observaciones" />
          <h3 className="text-lg font-semibold text-gray-700">Selección de documentos</h3>
          <div className="flex items-center gap-2 mb-2"><input type="checkbox" id="showSelectedOnly" checked={ui.showSelectedOnly} onChange={e => setUI(u => ({ ...u, showSelectedOnly: e.target.checked }))} /><label htmlFor="showSelectedOnly" className="text-gray-700 font-medium">Mostrar solo seleccionados</label></div>
          <div>
            <div className="flex gap-2 mb-2">
              <input type="text" value={form.docSearchInput} onChange={e => setForm(p => ({ ...p, docSearchInput: e.target.value }))} className="w-full border rounded-lg p-2" placeholder="Buscar documento" />
              <button type="button" onClick={() => fetchDocumentsForLoan(form.docSearchInput)} className="px-4 py-2 bg-blue-500 text-white rounded-lg">Buscar</button>
            </div>
            <CheckboxList
              items={(ui.showSelectedOnly ? docSearchResults.filter(doc => form.selectedDocs.includes(doc.id)) : docSearchResults).map(d => ({ key: d.id, ...d }))}
              isChecked={it => form.selectedDocs.includes(it.id)}
              isDisabled={it => isDocPrestado(it.id)}
              onToggle={it => toggleSelectedDoc(it.id)}
              render={it => (<>{it.Descripcion} (ID: {it.id})</>)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={resetNewLoanForm} className="px-4 py-2 rounded-lg bg-gray-300">Cancelar</button>
            <button type="button" onClick={handleConfirmNewLoan} className="px-4 py-2 rounded-lg bg-blue-600 text-white">Guardar</button>
          </div>
        </form>
      </Modal>

      {/* modal confirmación nuevo préstamo */}
      <Modal open={ui.confirmNewLoan} onClose={() => setUI(u => ({ ...u, confirmNewLoan: false }))} size="max-w-md">
        <h3 className="text-lg font-bold mb-4 text-blue-600">Confirmar préstamo</h3>
        <p><strong>Prestatario:</strong> {form.nombre_prestatario}</p>
        <p><strong>Días de préstamo:</strong> {form.cantidad_dias}</p>
        <p><strong>Cantidad de tomos:</strong> {form.selectedDocs.length}</p>
        <p><strong>Observaciones:</strong> {form.observaciones || '-'}</p>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={() => setUI(u => ({ ...u, confirmNewLoan: false }))} className="px-4 py-2 rounded-lg bg-gray-300">Cancelar</button>
          <button onClick={confirmAndAddLoan} className="px-4 py-2 rounded-lg bg-green-600 text-white">Aceptar</button>
        </div>
      </Modal>

      {/* modal registrar devolución */}
      <Modal open={Boolean(ui.editingLoanId)} onClose={() => { setUI(u => ({ ...u, editingLoanId: null })); setForm(p => ({ ...p, selectedDocs: [], returnObservation: '' })); }}>
        <h2 className="text-xl font-bold mb-4 text-blue-600">Registrar devolución</h2>

        {/* checkbox general */}
        <label className="flex items-center gap-2 mb-2 font-semibold">
          <input
            type="checkbox"
            checked={Boolean(loans.find(l => l.id === ui.editingLoanId)?.prestamos_documentos.filter(pd => !pd.fecha_devolucion).every(pd => form.selectedDocs.includes(pd.documento_id)))}
            onChange={e => {
              const loanDocs = loans.find(l => l.id === ui.editingLoanId)?.prestamos_documentos || [];
              const availableDocs = loanDocs.filter(pd => !pd.fecha_devolucion).map(pd => pd.documento_id);
              setForm(p => ({ ...p, selectedDocs: e.target.checked ? availableDocs : p.selectedDocs.filter(id => !availableDocs.includes(id)) }));
            }}
          /> Seleccionar todos
        </label>

        {/* lista de documentos del préstamo a devolver */}
        <CheckboxList
          items={(loans.find(l => l.id === ui.editingLoanId)?.prestamos_documentos || []).map(pd => ({ key: pd.documento_id, ...pd }))}
          isChecked={it => form.selectedDocs.includes(it.documento_id)}
          isDisabled={it => Boolean(it.fecha_devolucion)}
          onToggle={it => toggleSelectedDoc(it.documento_id)}
          render={it => (<>{`${it.Descripcion} (ID: ${it.documento_id})`} {it.fecha_devolucion && '(Devuelto)'}</>)}
        />

        {/* observación y extensión de días (la extensión solo se registra en UI como en el original) */}
        <div className="flex items-center gap-2 w-full mt-3">
          <textarea value={form.returnObservation} onChange={e => setForm(p => ({ ...p, returnObservation: e.target.value }))} placeholder="Observación de devolución" className="flex-[8] border rounded-lg p-2 resize-none" />
          <input type="number" min="0" value={form.extendDays} onChange={e => setForm(p => ({ ...p, extendDays: +e.target.value }))} placeholder="Días" className="w-24 border rounded-lg p-2" />
          <span className="flex-[2] text-gray-600 font-medium">Extender días devolución</span>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={() => { setUI(u => ({ ...u, editingLoanId: null })); setForm(p => ({ ...p, selectedDocs: [], returnObservation: '' })); }} className="px-4 py-2 rounded-lg bg-gray-300">Cancelar</button>
          <button onClick={() => handlePartialReturn(ui.editingLoanId)} className="px-4 py-2 rounded-lg bg-green-600 text-white">Guardar</button>
        </div>
      </Modal>
    </div>
  );
};

export default PrestamoDocumentoTabla;
