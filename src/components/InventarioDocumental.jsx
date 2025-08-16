import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Edit, Trash, BookOpen, Download, X } from "lucide-react";
import { supabase } from "../utils/supabaseClient";
import * as XLSX from "xlsx";

// ------------------ Mensaje Flotante ------------------
const MensajeFlotante = ({ mensaje, tipo, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  const colorClass =
    tipo === "error"
      ? "bg-red-600"
      : tipo === "info"
      ? "bg-blue-600"
      : tipo === "warning"
      ? "bg-yellow-600"
      : "bg-green-600";

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className={`fixed top-20 right-6 px-4 py-3 rounded-xl shadow-lg text-white z-50 ${colorClass}`}
    >
      <div className="flex items-center justify-between gap-4">
        <span>{mensaje}</span>
        <button onClick={onClose} className="font-bold text-white">×</button>
      </div>
    </motion.div>
  );
};

// ------------------ Modal Documento ------------------
const ModalDocumento = ({ doc, onClose, onSave, onDelete }) => {
  const [form, setForm] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const currentYear = new Date().getFullYear();

  // Helper para formatear fecha DD/MM/YYYY
  const formatDate = (date) => {
    if (!date) return "";
    if (date.includes("/")) return date;
    const d = new Date(date);
    if (isNaN(d)) return "";
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  };

  useEffect(() => {
    const generateID = async () => {
      const lastDocResult = await supabase
        .from("Inventario_documental")
        .select("id, Fecha_Inventario, Fecha_Inicial, Fecha_Final")
        .order("id", { ascending: false })
        .limit(1);

      const lastNum = lastDocResult.data?.[0]?.id
        ? parseInt(lastDocResult.data[0].id.split("-")[1])
        : 0;

      const today = new Date();
      const todayStr = `${String(today.getDate()).padStart(2,"0")}/${String(today.getMonth()+1).padStart(2,"0")}/${today.getFullYear()}`;

      setForm({
        ...doc,
        id: doc?.id || `${currentYear}-${String(lastNum + 1).padStart(8, "0")}`,
        Fecha_Inventario: formatDate(doc?.Fecha_Inventario) || todayStr,
        Fecha_Inicial: formatDate(doc?.Fecha_Inicial),
        Fecha_Final: formatDate(doc?.Fecha_Final),
      });
    };
    generateID();
  }, [doc]);

  const handleChange = (field, value) => setForm(f => ({ ...f, [field]: value }));
  const handleNumero = (field, value) => handleChange(field, value.replace(/\D/g, '').slice(0, 4));

  // Limitar y formatear fechas en DD/MM/YYYY
  const handleFecha = (field, value) => {
    const onlyDigits = value.replace(/\D/g, '');
    let formatted = '';
    if (onlyDigits.length >= 2) formatted += onlyDigits.slice(0,2) + '/';
    else formatted += onlyDigits;
    if (onlyDigits.length >= 4) formatted += onlyDigits.slice(2,4) + '/';
    else if (onlyDigits.length > 2) formatted += onlyDigits.slice(2);
    if (onlyDigits.length > 4) formatted += onlyDigits.slice(4,8);
    setForm(f => ({ ...f, [field]: formatted }));
  };

  const renderInput = (label, field, { numeric=false, flex=1, disabled=false, fecha=false }={}) => (
    <div className="flex flex-col" style={{ flex }}>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        type="text"
        value={form[field] || ""}
        onChange={e => {
          if (disabled) return;
          if (numeric) handleNumero(field, e.target.value);
          else if (fecha) handleFecha(field, e.target.value);
          else handleChange(field, e.target.value);
        }}
        className={`px-2 py-1 border rounded-lg ${numeric ? "text-center" : ""} focus:outline-none focus:ring-2 focus:ring-blue-400`}
        disabled={disabled}
      />
    </div>
  );

  const renderTextarea = (label, field, flex=1) => (
    <div className="flex flex-col" style={{ flex }}>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <textarea
        value={form[field] || ""}
        onChange={e => handleChange(field, e.target.value)}
        className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
    </div>
  );

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-6xl overflow-y-auto max-h-[90vh]"
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b pb-2 mb-4">
          <h3 className="text-lg sm:text-xl font-bold text-blue-600">
            {doc?.id ? "Editar Documento" : "Nuevo Documento"}
          </h3>
          <button onClick={onClose} className="text-red-600 hover:text-red-800">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Fila 1 */}
          <div className="flex gap-2 flex-wrap">
            {renderInput("ID", "id", { flex:2, disabled:true })}
            {renderInput("Fecha Inventario", "Fecha_Inventario", { flex:2, disabled:true })}
            {renderInput("Analista", "Analista", { flex:2 })}
            {renderInput("Contratista", "Contratista", { flex:2 })}
            {renderInput("N° Entregable", "Numero_Entregable", { numeric:true, flex:0.8 })}
          </div>

          {/* Fila 2 */}
          <div className="flex gap-2 flex-wrap">
            {renderInput("Sigla", "Sigla", { flex:0.8 })}
            {renderInput("Unidad Orgánica", "Unidad_Organica", { flex:2 })}
            {renderInput("Serie Documental", "Serie_Documental", { flex:3 })}
            {renderInput("N° Caja", "Numero_Caja", { numeric:true, flex:0.2 })}
            {renderInput("N° Tomo", "Numero_Tomo", { numeric:true, flex:0.2 })}
            {renderInput("N° Folios", "Numero_Folios", { numeric:true, flex:0.2 })}
          </div>

          {/* Descripción y Observaciones */}
          <div className="flex gap-2 flex-wrap">{renderTextarea("Descripción","Descripcion",1)}</div>
          <div className="flex gap-2 flex-wrap">{renderTextarea("Observaciones","Observaciones",1)}</div>

          {/* Fila 5 */}
          <div className="flex gap-2 flex-wrap">
            {renderInput("Fecha Inicial","Fecha_Inicial",{fecha:true, flex:2})}
            {renderInput("Fecha Final","Fecha_Final",{fecha:true, flex:2})}
            {renderInput("Soporte","Soporte",{flex:2})}
            {renderInput("Estante","Estante",{numeric:true, flex:0.2})}
            {renderInput("Cuerpo","Cuerpo",{numeric:true, flex:0.2})}
            {renderInput("Balda","Balda",{numeric:true, flex:0.2})}
            {renderInput("Frecuencia Consulta","Frecuencia_Consulta",{flex:2})}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end mt-6 gap-3 items-center">
          {doc?.id && (
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={confirmDelete} onChange={e => setConfirmDelete(e.target.checked)} id="confirmDelete"/>
              <label htmlFor="confirmDelete" className="text-sm">Confirmar eliminación</label>
              <button
                disabled={!confirmDelete}
                onClick={()=>onDelete(form.id)}
                className={`px-4 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2 ${confirmDelete ? "hover:bg-red-700 opacity-100":"opacity-50 cursor-not-allowed"}`}
              >
                <Trash className="w-4 h-4"/>Eliminar
              </button>
            </div>
          )}
          <button
            onClick={()=>onSave(form)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4"/>Actualizar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ------------------ Componente Principal ------------------
export default function InventarioDocumental() {
  const [data,setData] = useState([]);
  const [state,setState] = useState({loading:false,mensaje:null,selectedDoc:null});
  const [filters,setFilters] = useState({search:""});

  const showMessage = (m,t) => setState(s=>({...s,mensaje:{mensaje:m,tipo:t}}));

  const fetchDocuments = useCallback(async()=>{
    setState(s=>({...s,loading:true}));
    let query = supabase.from("Inventario_documental").select("*");
    if(filters.search) query = query.or(`id.ilike.%${filters.search}%,Descripcion.ilike.%${filters.search}%`);
    query = query.order("id",{ascending:false}).limit(10);
    const {data:docs,error} = await query;
    if(error) showMessage("Error cargando documentos","error");
    else setData(docs||[]);
    setState(s=>({...s,loading:false}));
  },[filters.search]);

  useEffect(()=>{ fetchDocuments(); },[fetchDocuments]);

  const saveDocument = async(doc)=>{
    setState(s=>({...s,loading:true}));
    const {error} = doc.id 
      ? await supabase.from("Inventario_documental").upsert(doc)
      : await supabase.from("Inventario_documental").insert(doc);
    if(error) showMessage("Error al guardar","error");
    setState(s=>({...s,selectedDoc:null,loading:false}));
    fetchDocuments();
  };

  const deleteDocument = async(id)=>{
    const {error} = await supabase.from("Inventario_documental").delete().eq("id",id);
    if(error) showMessage("Error eliminando documento","error");
    else showMessage("Documento eliminado","info");
    setState(s=>({...s,selectedDoc:null}));
    fetchDocuments();
  };

  const exportToExcel = ()=>{
    if(!data.length){ showMessage("No hay datos para exportar","warning"); return; }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    XLSX.writeFile(wb,"inventario_documental.xlsx");
  };

  return (
    <motion.div className="bg-white border border-gray-300 rounded-3xl p-4 sm:p-6 shadow-lg max-w-7xl mx-auto">
      {state.mensaje && <MensajeFlotante {...state.mensaje} onClose={()=>setState(s=>({...s,mensaje:null}))}/>}

      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600"/> Inventario Documental
        </h2>
        <div className="flex gap-2 flex-wrap w-full sm:w-auto">
          <input type="text" placeholder="Buscar por ID o descripción" value={filters.search} onChange={e=>setFilters(f=>({...f,search:e.target.value}))} className="px-3 py-2 border rounded-lg w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-400"/>
          <button onClick={()=>setState(s=>({...s,selectedDoc:{}}))} className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"><Plus className="w-4 h-4"/>Nuevo</button>
          <button onClick={exportToExcel} className="px-3 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 flex items-center gap-2"><Download className="w-4 h-4"/>Exportar</button>
        </div>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full border-collapse border border-gray-300 text-xs sm:text-sm">
          <thead className="bg-blue-100 text-gray-700">
            <tr>
              <th className="p-1 sm:p-2 border">Acciones</th>
              <th className="p-1 sm:p-2 border">ID</th>
              <th className="p-1 sm:p-2 border">Descripción</th>
              <th className="p-1 sm:p-2 border">Unidad Orgánica</th>
              <th className="p-1 sm:p-2 border">N° Caja</th>
              <th className="p-1 sm:p-2 border">N° Tomo</th>
            </tr>
          </thead>
          <tbody>
            {data.map(doc=>(
              <tr key={doc.id} className="hover:bg-gray-50 transition">
                <td className="p-1 sm:p-2 border flex justify-center gap-1">
                  <button onClick={()=>setState(s=>({...s,selectedDoc:doc}))} className="text-green-600 hover:scale-110 transition-transform"><Edit className="w-4 h-4"/></button>
                </td>
                <td className="p-1 sm:p-2 border text-center">{doc.id}</td>
                <td className="p-1 sm:p-2 border break-words">{doc.Descripcion}</td>
                <td className="p-1 sm:p-2 border">{doc.Unidad_Organica}</td>
                <td className="p-1 sm:p-2 border">{doc.Numero_Caja}</td>
                <td className="p-1 sm:p-2 border">{doc.Numero_Tomo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {state.selectedDoc && 
        <ModalDocumento 
          doc={state.selectedDoc} 
          onClose={()=>setState(s=>({...s,selectedDoc:null}))} 
          onSave={saveDocument} 
          onDelete={deleteDocument}
        />}
    </motion.div>
  );
}
