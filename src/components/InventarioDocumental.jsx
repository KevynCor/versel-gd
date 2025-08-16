import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Edit, Trash, BookOpen, Download, X } from "lucide-react";
import { supabase } from "../utils/supabaseClient";
import * as XLSX from "xlsx";

// ------------------ Mensaje Flotante ------------------
const MensajeFlotante = ({ mensaje, tipo, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  const colorClass =
    tipo === "error" ? "bg-red-600" :
    tipo === "info" ? "bg-blue-600" :
    tipo === "warning" ? "bg-yellow-600" : "bg-green-600";
  return (
    <motion.div initial={{x:300,opacity:0}} animate={{x:0,opacity:1}} exit={{x:300,opacity:0}}
      className={`fixed top-20 right-6 px-4 py-3 rounded-xl shadow-lg text-white z-50 ${colorClass}`}>
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

  const formatDate = date => {
    if (!date) return "";
    if (date.includes("/")) return date;
    const d = new Date(date);
    if (isNaN(d)) return "";
    return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
  };

  useEffect(() => {
    const generateID = async () => {
      const lastDocResult = await supabase.from("Inventario_documental").select("id").order("id",{ascending:false}).limit(1);
      const lastNum = lastDocResult.data?.[0]?.id ? parseInt(lastDocResult.data[0].id.split("-")[1]) : 0;
      const today = new Date();
      const todayStr = `${String(today.getDate()).padStart(2,"0")}/${String(today.getMonth()+1).padStart(2,"0")}/${today.getFullYear()}`;
      setForm({
        ...doc,
        id: doc?.id || `${currentYear}-${String(lastNum+1).padStart(8,"0")}`,
        Fecha_Inventario: formatDate(doc?.Fecha_Inventario)||todayStr,
        Fecha_Inicial: formatDate(doc?.Fecha_Inicial),
        Fecha_Final: formatDate(doc?.Fecha_Final),
      });
    };
    generateID();
  }, [doc]);

  const handleChange = (field,value)=>setForm(f=>({...f,[field]:value}));
  const handleNumero = (field,value)=>handleChange(field,value.replace(/\D/g,'').slice(0,4));
  const handleFecha = (field,value)=>{
    const onlyDigits=value.replace(/\D/g,''); let formatted='';
    if(onlyDigits.length>=2) formatted+=onlyDigits.slice(0,2)+'/';
    else formatted+=onlyDigits;
    if(onlyDigits.length>=4) formatted+=onlyDigits.slice(2,4)+'/';
    else if(onlyDigits.length>2) formatted+=onlyDigits.slice(2);
    if(onlyDigits.length>4) formatted+=onlyDigits.slice(4,8);
    setForm(f=>({...f,[field]:formatted}));
  };

  const renderInput = (label,field,{numeric=false,flex=1,disabled=false,fecha=false}={}) => (
    <div className="flex flex-col" style={{flex}}>
      <label className="text-sm sm:text-base font-medium text-gray-700">{label}</label>
      <input type="text" value={form[field]||""} onChange={e=>{
        if(disabled) return;
        if(numeric) handleNumero(field,e.target.value);
        else if(fecha) handleFecha(field,e.target.value);
        else handleChange(field,e.target.value);
      }} 
      className={`px-3 sm:px-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${numeric?"text-center":""}`}
      disabled={disabled}/>
    </div>
  );

  const renderTextarea = (label,field,flex=1) => (
    <div className="flex flex-col" style={{flex}}>
      <label className="text-sm sm:text-base font-medium text-gray-700">{label}</label>
      <textarea value={form[field]||""} onChange={e=>handleChange(field,e.target.value)} className="px-3 sm:px-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
    </div>
  );

  return (
    <motion.div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4"
      initial={{opacity:0}} animate={{opacity:1}} onClick={onClose}>
      <motion.div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 w-full max-w-5xl overflow-y-auto max-h-[90vh]"
        initial={{scale:0.95}} animate={{scale:1}} onClick={e=>e.stopPropagation()}>
        <div className="flex justify-between items-center border-b pb-2 mb-4">
          <h3 className="text-lg sm:text-xl font-bold text-blue-600">{doc?.id?"Editar Documento":"Nuevo Documento"}</h3>
          <button onClick={onClose} className="text-red-600 hover:text-red-800"><X className="w-5 h-5 sm:w-6 sm:h-6"/></button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex gap-2 flex-wrap">
            {renderInput("ID","id",{flex:2,disabled:true})}
            {renderInput("Fecha Inventario","Fecha_Inventario",{flex:2,disabled:true})}
            {renderInput("Analista","Analista",{flex:2})}
            {renderInput("Contratista","Contratista",{flex:2})}
            {renderInput("N° Entregable","Numero_Entregable",{numeric:true,flex:0.8})}
          </div>
          <div className="flex gap-2 flex-wrap">
            {renderInput("Sigla","Sigla",{flex:0.8})}
            {renderInput("Unidad Orgánica","Unidad_Organica",{flex:2})}
            {renderInput("Serie Documental","Serie_Documental",{flex:3})}
            {renderInput("N° Caja","Numero_Caja",{numeric:true,flex:0.2})}
            {renderInput("N° Tomo","Numero_Tomo",{numeric:true,flex:0.2})}
            {renderInput("N° Folios","Numero_Folios",{numeric:true,flex:0.2})}
          </div>
          <div className="flex gap-2 flex-wrap">{renderTextarea("Descripción","Descripcion",1)}</div>
          <div className="flex gap-2 flex-wrap">{renderTextarea("Observaciones","Observaciones",1)}</div>
          <div className="flex gap-2 flex-wrap">
            {renderInput("Fecha Inicial","Fecha_Inicial",{fecha:true,flex:2})}
            {renderInput("Fecha Final","Fecha_Final",{fecha:true,flex:2})}
            {renderInput("Soporte","Soporte",{flex:2})}
            {renderInput("Estante","Estante",{numeric:true,flex:0.2})}
            {renderInput("Cuerpo","Cuerpo",{numeric:true,flex:0.2})}
            {renderInput("Balda","Balda",{numeric:true,flex:0.2})}
            {renderInput("Frecuencia Consulta","Frecuencia_Consulta",{flex:2})}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end mt-6 gap-3 items-center">
          {doc?.id && <div className="flex items-center gap-2">
            <input type="checkbox" checked={confirmDelete} onChange={e=>setConfirmDelete(e.target.checked)} id="confirmDelete"/>
            <label htmlFor="confirmDelete" className="text-sm sm:text-base">Confirmar eliminación</label>
            <button disabled={!confirmDelete} onClick={()=>onDelete(form.id)} className={`px-4 sm:px-5 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2 ${confirmDelete?"hover:bg-red-700 opacity-100":"opacity-50 cursor-not-allowed"}`}>
              <Trash className="w-4 h-4 sm:w-5 sm:h-5"/>Eliminar
            </button>
          </div>}
          <button onClick={()=>onSave(form)} className="px-4 sm:px-5 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700">
            <Plus className="w-4 h-4 sm:w-5 sm:h-5"/>Guardar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ------------------ Componente Principal ------------------
export default function InventarioDocumental() {
  const [filters,setFilters]=useState({search:""});
  const [data,setData]=useState({documentos:[]});
  const [state,setState]=useState({loading:false,mensaje:null,selectedDoc:null,page:0,total:0});
  const [pageSize,setPageSize]=useState(10);

  const showMessage=(m,t)=>setState(s=>({...s,mensaje:{mensaje:m,tipo:t}}));

  const fetchDocuments=useCallback(async(page=0)=>{
    setState(s=>({...s,loading:true}));
    const from=page*pageSize,to=from+pageSize-1;
    let query=supabase.from("Inventario_documental").select("*",{count:"exact"}).order("id",{ascending:false}).range(from,to);
    if(filters.search.trim()) query.or(`id.ilike.%${filters.search}%,Descripcion.ilike.%${filters.search}%`);
    const {data:docs,count}=await query;
    setData({documentos:docs});
    setState(s=>({...s,page,total:count,loading:false}));
  },[filters.search,pageSize]);

  useEffect(()=>{ fetchDocuments(state.page); },[fetchDocuments,state.page]);

  const saveDocument=async(doc)=>{
    setState(s=>({...s,loading:true}));
    const {error}=doc.id 
      ? await supabase.from("Inventario_documental").upsert(doc)
      : await supabase.from("Inventario_documental").insert(doc);
    if(error) showMessage("Error al guardar","error");
    setState(s=>({...s,selectedDoc:null,loading:false}));
    fetchDocuments(state.page);
  };

  const deleteDocument=async(id)=>{
    const {error}=await supabase.from("Inventario_documental").delete().eq("id",id);
    if(error) showMessage("Error eliminando documento","error");
    else showMessage("Documento eliminado","info");
    setState(s=>({...s,selectedDoc:null}));
    fetchDocuments(state.page);
  };

  const exportToExcel=()=>{
    if(!data.documentos.length){showMessage("No hay datos para exportar","warning");return;}
    const ws=XLSX.utils.json_to_sheet(data.documentos);
    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,ws,"Inventario");
    XLSX.writeFile(wb,"inventario_documental.xlsx");
  };

  return (
    <motion.div className="bg-white border border-gray-300 rounded-3xl p-4 sm:p-6 shadow-lg max-w-7xl mx-auto">
      {state.mensaje && <MensajeFlotante {...state.mensaje} onClose={()=>setState(s=>({...s,mensaje:null}))}/>}

      <motion.h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 mb-4 sm:mb-6">
        <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600"/> Inventario Documental
      </motion.h2>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4 sm:mb-6">
        <input
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          onKeyDown={e => { if (e.key === "Enter") fetchDocuments(0); }}
          placeholder="Buscar por ID o descripción"
          className="col-span-1 sm:col-span-3 px-4 py-2 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base w-full"
        />
        <button
          onClick={() => setState(s => ({ ...s, selectedDoc: {} }))}
          className="col-span-1 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 flex items-center gap-2 justify-center"
        >
          <Plus className="w-5 h-5 sm:w-6 sm:h-6"/>Nuevo
        </button>
      </div>
      <div className="overflow-x-auto w-full">
        <table className="w-full border-collapse border border-gray-300 text-xs sm:text-sm">
          <thead className="bg-blue-100 text-gray-700">
            <tr>
              {['Acciones','ID','Descripción','Unidad Orgánica','N° Caja','N° Tomo'].map(h=><th key={h} className="p-1 sm:p-2 border">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.documentos.map(doc=>(
              <tr key={doc.id} className="hover:bg-gray-50 transition">
                <td className="p-1 sm:p-2 border text-center">
                  <button onClick={()=>setState(s=>({...s,selectedDoc:doc}))} className="text-blue-600 hover:scale-110 transition-transform"><Edit className="w-4 h-4 sm:w-5 sm:h-5"/></button>
                </td>
                <td className="p-1 sm:p-2 border text-center">{doc.id}</td>
                <td className="p-1 sm:p-2 border break-words">{doc.Descripcion}</td>
                <td className="p-1 sm:p-2 border">{doc.Unidad_Organica}</td>
                <td className="p-1 sm:p-2 border text-center">{doc.Numero_Caja}</td>
                <td className="p-1 sm:p-2 border text-center">{doc.Numero_Tomo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.documentos.length>0 && (
        <div className="flex flex-col sm:flex-row justify-center sm:justify-between items-center gap-2 mt-4 flex-wrap">
          <div className="flex items-center gap-1 flex-wrap">
            <button disabled={state.page===0} onClick={()=>fetchDocuments(state.page-1)} className="px-3 py-1 bg-blue-600 text-white rounded disabled:bg-gray-300">«</button>
            {Array.from({length:Math.ceil(state.total/pageSize)},(_,i)=>i).filter(i=>i<2||i>=Math.ceil(state.total/pageSize)-2||Math.abs(i-state.page)<=2).map((i,idx,arr)=>{
              const prev=arr[idx-1]; if(prev!==undefined&&i-prev>1) return <span key={`e-${i}`}>…</span>;
              return <button key={i} onClick={()=>fetchDocuments(i)} className={`px-3 py-1 rounded ${i===state.page?"bg-blue-700 text-white":"bg-gray-200 hover:bg-gray-300"}`}>{i+1}</button>
            })}
            <button disabled={(state.page+1)*pageSize>=state.total} onClick={()=>fetchDocuments(state.page+1)} className="px-3 py-1 bg-blue-600 text-white rounded disabled:bg-gray-300">»</button>
          </div>
          <button onClick={exportToExcel} className="text-blue-600 px-3 py-2 rounded-xl flex items-center gap-2 overflow-hidden transition-all duration-300 ease-in-out group hover:px-5 hover:text-green-700">
            <Download className="flex-shrink-0"/>
            <span className="whitespace-nowrap opacity-0 translate-x-2 transition-all duration-300 ease-in-out group-hover:opacity-100 group-hover:translate-x-0">Exportar Excel</span>
          </button>
        </div>
      )}

      {state.selectedDoc && <ModalDocumento doc={state.selectedDoc} onClose={()=>setState(s=>({...s,selectedDoc:null}))} onSave={saveDocument} onDelete={deleteDocument}/>}
    </motion.div>
  );
}
