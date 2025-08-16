import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Eye, X, Filter, Download } from "lucide-react";
import { supabase } from "../utils/supabaseClient";
import * as XLSX from "xlsx";

const MensajeFlotante = ({ mensaje, tipo, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 300, opacity: 0 }}
      className={`fixed top-20 right-6 px-4 py-3 rounded-xl shadow-lg text-white z-50 ${
        tipo==="error"?"bg-red-600":tipo==="info"?"bg-blue-600":tipo==="warning"?"bg-yellow-600":"bg-green-600"}`}
    >
      <div className="flex items-center justify-between gap-4">
        <span>{mensaje}</span>
        <button onClick={onClose} className="font-bold text-white">×</button>
      </div>
    </motion.div>
  );
};

const ModalDetalleDocumento = ({ doc, onClose }) => (
  <motion.div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4"
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose}>
    <motion.div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 w-full max-w-3xl overflow-y-auto max-h-[90vh]"
      initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e=>e.stopPropagation()}>
      <div className="flex justify-between items-center border-b pb-2 mb-4">
        <h3 className="text-lg sm:text-xl font-bold text-blue-600 break-words">{doc.Descripcion}</h3>
        <button onClick={onClose} className="text-red-600 hover:text-red-800">
          <X className="w-5 h-5 sm:w-6 sm:h-6"/>
        </button>
      </div>
      <ul className="space-y-1 text-sm sm:text-base">
        {Object.entries(doc).map(([k,v])=>v&&<li key={k}><strong className="capitalize">{k.replace(/_/g," ")}:</strong> {k.toLowerCase().includes("fecha")?new Date(v).toLocaleDateString():v.toString()}</li>)}
      </ul>
    </motion.div>
  </motion.div>
);

const SelectInput = ({ value, onChange, options, placeholder }) => (
  <select value={value} onChange={onChange} className="w-full px-3 sm:px-4 py-2 border focus:ring-2 focus:ring-blue-500 rounded-lg text-sm sm:text-base">
    <option value="">{placeholder}</option>
    {options.map(opt=><option key={opt} value={opt}>{opt}</option>)}
  </select>
);

export default function BusquedaDocumento() {
  const [filters,setFilters]=useState({unidad:"",serie:"",anio:"",search:""});
  const [data,setData]=useState({documentos:[],unidades:[],series:[],anios:[]});
  const [state,setState]=useState({loading:false,mensaje:null,selectedDoc:null,page:0,total:0});
  const [pageSize,setPageSize]=useState(10);

  const showMessage=(m,t)=>setState(s=>({...s,mensaje:{mensaje:m,tipo:t}}));

  useEffect(()=>{(async()=>{
    const {data: unidades}=await supabase.rpc("get_unidades_organicas");
    setData(d=>({...d,unidades:[...new Set(unidades.map(u=>u.unidad_organica?.trim()).filter(Boolean))]}));
  })()},[]);

  const cargarFiltrosPorUnidad=async u=>{if(!u)return setData(d=>({...d,series:[],anios:[]})); const {data:f}=await supabase.rpc("get_series_y_anios",{unidad_organica_param:u}); setData(d=>({...d,series:f.map(f=>f.serie),anios:f[0]?.lista_anios||[]}));};

  const fetchDocuments=useCallback(async(page=0,showToast=false)=>{
    if(!filters.unidad)return; setState(s=>({...s,loading:true}));
    const from=page*pageSize,to=from+pageSize-1;
    let query=supabase.from("Inventario_documental").select("*",{count:"exact"}).eq("Unidad_Organica",filters.unidad).range(from,to);
    if(filters.serie)query.eq("Serie_Documental",filters.serie);
    if(filters.anio)query.or(`and(Fecha_Inicial.gte.${filters.anio}-01-01,Fecha_Inicial.lte.${filters.anio}-12-31),and(Fecha_Final.gte.${filters.anio}-01-01,Fecha_Final.lte.${filters.anio}-12-31)`);
    if(filters.search.trim())query.or(`Descripcion.ilike.%${filters.search}%,Observaciones.ilike.%${filters.search}%`,{foreignTable:undefined});
    const {data:docs,count}=await query; setData(d=>({...d,documentos:docs})); setState(s=>({...s,page,total:count,loading:false}));
    if(showToast)showMessage(`Se encontraron ${count} registros`,count?"success":"error");
  },[filters,pageSize]);

  useEffect(()=>{if(filters.unidad)fetchDocuments(0,true);},[pageSize,fetchDocuments,filters.unidad]);

  const exportToExcel=async()=>{
    if(!filters.unidad){showMessage("Selecciona una unidad para exportar","warning");return;}
    setState(s=>({...s,loading:true}));
    let query=supabase.from("Inventario_documental").select("*").eq("Unidad_Organica",filters.unidad);
    if(filters.serie)query.eq("Serie_Documental",filters.serie);
    if(filters.anio)query.or(`and(Fecha_Inicial.gte.${filters.anio}-01-01,Fecha_Inicial.lte.${filters.anio}-12-31),and(Fecha_Final.gte.${filters.anio}-01-01,Fecha_Final.lte.${filters.anio}-12-31)`);
    if(filters.search.trim())query.or(`Descripcion.ilike.%${filters.search}%,Observaciones.ilike.%${filters.search}%`);
    const {data:allDocs,error}=await query; setState(s=>({...s,loading:false}));
    if(error){showMessage("Error al exportar registros","error");return;}
    if(!allDocs||allDocs.length===0){showMessage("No hay datos para exportar","warning");return;}
    const ws=XLSX.utils.json_to_sheet(allDocs); const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,"Documentos"); XLSX.writeFile(wb,"documentos.xlsx");
  };

  return (
    <motion.div className="bg-white border border-gray-300 rounded-3xl p-4 sm:p-6 shadow-lg max-w-7xl mx-auto">
      {state.mensaje && <MensajeFlotante {...state.mensaje} onClose={()=>setState(s=>({...s,mensaje:null}))} />}
      <motion.h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 mb-4 sm:mb-6" initial={{y:-10,opacity:0}} animate={{y:0,opacity:1}}>
        <Search className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600"/> Búsqueda de Documentos
      </motion.h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 sm:mb-6">
        <div className="col-span-1 md:col-start-2 flex justify-center">
          <SelectInput value={filters.unidad} onChange={e=>{const u=e.target.value; setFilters(f=>({...f,unidad:u,serie:"",anio:"",search:""})); cargarFiltrosPorUnidad(u);}} options={data.unidades} placeholder="* Seleccionar una Sección Documental"/>
        </div>
      </div>

      {filters.unidad && <>
        <div className="grid grid-cols-1 gap-3 mb-4 sm:mb-6">
          <input value={filters.search} onChange={e=>setFilters(f=>({...f,search:e.target.value}))} onKeyDown={e=>{if(e.key==="Enter")fetchDocuments(0,true);}} placeholder="Buscar por descripción u observaciones" className="px-3 sm:px-4 py-2 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none w-full text-sm sm:text-base"/>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 sm:mb-6 items-center">
          <SelectInput value={filters.serie} onChange={e=>setFilters(f=>({...f,serie:e.target.value}))} options={data.series} placeholder="* Todas las series documentales"/>
          <SelectInput value={filters.anio} onChange={e=>setFilters(f=>({...f,anio:e.target.value}))} options={data.anios} placeholder="* Todos los años"/>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <button onClick={()=>{setFilters(f=>({...f,serie:"",anio:"",search:""})); fetchDocuments(0,true);}} className="px-4 sm:px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg shadow-md flex items-center gap-2 transition-transform hover:scale-105"><Filter className="w-4 h-4 sm:w-5 sm:h-5"/> Limpiar</button>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base">Items por página:</span>
              <select value={pageSize} onChange={e=>setPageSize(Number(e.target.value))} className="w-auto px-3 py-1 border focus:ring-2 focus:ring-blue-500 rounded-lg text-sm sm:text-base">
                <option value={10}>10</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full border-collapse border border-gray-300 text-xs sm:text-sm">
            <thead className="bg-blue-100 text-gray-700">
              <tr>{['Ver','Descripción','Observaciones','Tomo','Caja','Ubicación'].map(h=><th key={h} className="p-1 sm:p-2 border">{h}</th>)}</tr>
            </thead>
            <tbody>
              {data.documentos.map(doc=>(
                <tr key={doc.id} className="hover:bg-gray-50 transition">
                  <td className="p-1 sm:p-2 border text-center">
                    <button onClick={()=>setState(s=>({...s,selectedDoc:doc}))} className="text-blue-600 hover:scale-110 transition-transform"><Eye className="w-4 h-4 sm:w-5 sm:h-5"/></button>
                  </td>
                  <td className="p-1 sm:p-2 border break-words">{doc.Descripcion}</td>
                  <td className="p-1 sm:p-2 border break-words">{doc.Observaciones||''}</td>
                  <td className="p-1 sm:p-2 border text-center">{doc.Numero_Tomo}</td>
                  <td className="p-1 sm:p-2 border text-center">{doc.Numero_Caja}</td>
                  <td className="p-1 sm:p-2 border break-words">{[doc.Estante?`E${doc.Estante}`:'',doc.Cuerpo?`C${doc.Cuerpo}`:'',doc.Balda?`B${doc.Balda}`:''].filter(Boolean).join('-')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data.documentos.length>0 && (
          <div className="flex flex-col sm:flex-row justify-center sm:justify-between items-center gap-2 mt-4 flex-wrap">
            <div className="flex items-center gap-1 flex-wrap">
              <button disabled={state.page===0} onClick={()=>fetchDocuments(state.page-1,false)} className="px-3 py-1 bg-blue-600 text-white rounded disabled:bg-gray-300">«</button>
              {Array.from({length:Math.ceil(state.total/pageSize)},(_,i)=>i).filter(i=>i<2||i>=Math.ceil(state.total/pageSize)-2||Math.abs(i-state.page)<=2).map((i,idx,arr)=>{const prev=arr[idx-1];if(prev!==undefined&&i-prev>1)return <span key={`e-${i}`}>…</span>; return <button key={i} onClick={()=>fetchDocuments(i,false)} className={`px-3 py-1 rounded ${i===state.page?"bg-blue-700 text-white":"bg-gray-200 hover:bg-gray-300"}`}>{i+1}</button>})}
              <button disabled={(state.page+1)*pageSize>=state.total} onClick={()=>fetchDocuments(state.page+1,false)} className="px-3 py-1 bg-blue-600 text-white rounded disabled:bg-gray-300">»</button>
            </div>
            <button onClick={exportToExcel} className="text-blue-600 px-3 py-2 rounded-xl flex items-center gap-2 overflow-hidden transition-all duration-300 ease-in-out group hover:px-5 hover:text-green-700">
              <Download className="flex-shrink-0"/>
              <span className="whitespace-nowrap opacity-0 translate-x-2 transition-all duration-300 ease-in-out group-hover:opacity-100 group-hover:translate-x-0">Exportar registros</span>
            </button>
          </div>
        )}
      </>}
      {state.selectedDoc && <ModalDetalleDocumento doc={state.selectedDoc} onClose={()=>setState(s=>({...s,selectedDoc:null}))}/>}
    </motion.div>
  );
}
