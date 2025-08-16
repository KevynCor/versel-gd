import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Edit, Trash, BookOpen, Download, X, Search, Filter, Eye, Archive, Calendar, Hash, FileText, Building2, Package, Layers, FolderOpen, Clock, MapPin, Sparkles } from "lucide-react";
import { supabase } from "../utils/supabaseClient";
import * as XLSX from "xlsx";

// ------------------ Toast Notification System ------------------
const Toast = ({ mensaje, tipo, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const config = {
    success: { bg: "from-emerald-500 to-green-600", icon: "✓", border: "border-emerald-300" },
    error: { bg: "from-red-500 to-pink-600", icon: "✗", border: "border-red-300" },
    warning: { bg: "from-amber-500 to-orange-600", icon: "⚠", border: "border-amber-300" },
    info: { bg: "from-blue-500 to-indigo-600", icon: "ⓘ", border: "border-blue-300" }
  };

  const { bg, icon, border } = config[tipo] || config.info;

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className={`fixed top-6 right-6 z-[100] transform transition-all duration-500 ease-out`}
    >
      <div className={`bg-gradient-to-r ${bg} backdrop-blur-lg border ${border} rounded-2xl shadow-2xl p-4 min-w-[300px] max-w-md`}>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white font-bold">
            {icon}
          </div>
          <p className="text-white font-medium flex-1">{mensaje}</p>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-6 h-6 text-white/80 hover:text-white hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ------------------ Modern Document Modal ------------------
const DocumentModal = ({ doc, onClose, onSave, onDelete }) => {
  const [form, setForm] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [currentTab, setCurrentTab] = useState("basic");
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
      try {
        const lastDocResult = await supabase.from("Inventario_documental").select("id").order("id", { ascending: false }).limit(1);
        const lastNum = lastDocResult.data?.[0]?.id ? parseInt(lastDocResult.data[0].id.split("-")[1]) : 0;
        const today = new Date();
        const todayStr = `${String(today.getDate()).padStart(2,"0")}/${String(today.getMonth()+1).padStart(2,"0")}/${today.getFullYear()}`;
        
        setForm({
          ...doc,
          id: doc?.id || `${currentYear}-${String(lastNum+1).padStart(8,"0")}`,
          Fecha_Inventario: formatDate(doc?.Fecha_Inventario) || todayStr,
          Fecha_Inicial: formatDate(doc?.Fecha_Inicial),
          Fecha_Final: formatDate(doc?.Fecha_Final),
        });
      } catch (error) {
        console.error("Error generating ID:", error);
        const today = new Date();
        const todayStr = `${String(today.getDate()).padStart(2,"0")}/${String(today.getMonth()+1).padStart(2,"0")}/${today.getFullYear()}`;
        
        setForm({
          ...doc,
          id: doc?.id || `${currentYear}-${String(Date.now()).slice(-8)}`,
          Fecha_Inventario: formatDate(doc?.Fecha_Inventario) || todayStr,
          Fecha_Inicial: formatDate(doc?.Fecha_Inicial),
          Fecha_Final: formatDate(doc?.Fecha_Final),
        });
      }
    };
    generateID();
  }, [doc, currentYear]);

  const handleChange = (field, value) => setForm(f => ({...f, [field]: value}));
  const handleNumero = (field, value) => handleChange(field, value.replace(/\D/g,'').slice(0,4));
  const handleFecha = (field, value) => {
    const onlyDigits = value.replace(/\D/g,'');
    let formatted = '';
    if(onlyDigits.length >= 2) formatted += onlyDigits.slice(0,2) + '/';
    else formatted += onlyDigits;
    if(onlyDigits.length >= 4) formatted += onlyDigits.slice(2,4) + '/';
    else if(onlyDigits.length > 2) formatted += onlyDigits.slice(2);
    if(onlyDigits.length > 4) formatted += onlyDigits.slice(4,8);
    setForm(f => ({...f, [field]: formatted}));
  };

  const InputField = ({ label, field, type = "text", icon: Icon, disabled = false, numeric = false, fecha = false, className = "" }) => (
    <div className={`group ${className}`}>
      <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
        {Icon && <Icon size={16} className="text-indigo-600" />}
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          value={form[field] || ""}
          onChange={e => {
            if (disabled) return;
            if (numeric) handleNumero(field, e.target.value);
            else if (fecha) handleFecha(field, e.target.value);
            else handleChange(field, e.target.value);
          }}
          disabled={disabled}
          className={`w-full px-4 py-3 bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:shadow-md ${disabled ? 'opacity-60' : 'hover:border-indigo-300'} ${numeric ? 'text-center font-mono' : ''}`}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl opacity-0 group-focus-within:opacity-5 transition-opacity pointer-events-none"></div>
      </div>
    </div>
  );

  const TextareaField = ({ label, field, icon: Icon, className = "" }) => (
    <div className={`group ${className}`}>
      <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
        {Icon && <Icon size={16} className="text-indigo-600" />}
        {label}
      </label>
      <div className="relative">
        <textarea
          value={form[field] || ""}
          onChange={e => handleChange(field, e.target.value)}
          rows={3}
          className="w-full px-4 py-3 bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:shadow-md hover:border-indigo-300 resize-none"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl opacity-0 group-focus-within:opacity-5 transition-opacity pointer-events-none"></div>
      </div>
    </div>
  );

  const tabs = [
    { id: "basic", label: "Información Básica", icon: FileText },
    { id: "details", label: "Detalles", icon: Archive },
    { id: "location", label: "Ubicación", icon: MapPin }
  ];

  return (
    <motion.div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      onClick={onClose}
    >
      <motion.div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden"
        initial={{ scale: 0.95 }} 
        animate={{ scale: 1 }} 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-8 py-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold">
                  {doc?.id ? "Editar Documento" : "Nuevo Documento"}
                </h3>
                <p className="text-indigo-100 text-sm">{form.id || "Generando ID..."}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-slate-50 px-8 py-4 border-b border-slate-200">
          <div className="flex gap-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id)}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
                    currentTab === tab.id
                      ? "bg-indigo-600 text-white shadow-lg transform scale-105"
                      : "text-slate-600 hover:bg-white hover:shadow-sm"
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[60vh]">
          {currentTab === "basic" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Fecha Inventario" field="Fecha_Inventario" icon={Calendar} disabled />
                <InputField label="Analista" field="Analista" icon={Eye} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Contratista" field="Contratista" icon={Building2} />
                <InputField label="N° Entregable" field="Numero_Entregable" icon={Hash} numeric />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InputField label="Sigla" field="Sigla" icon={Archive} />
                <InputField label="Unidad Orgánica" field="Unidad_Organica" icon={Building2} className="md:col-span-2" />
              </div>
              <InputField label="Serie Documental" field="Serie_Documental" icon={Archive} />
              <TextareaField label="Descripción" field="Descripcion" icon={FileText} />
              <TextareaField label="Observaciones" field="Observaciones" icon={Eye} />
            </div>
          )}

          {currentTab === "details" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InputField label="N° Caja" field="Numero_Caja" icon={Package} numeric />
                <InputField label="N° Tomo" field="Numero_Tomo" icon={Layers} numeric />
                <InputField label="N° Folios" field="Numero_Folios" icon={FileText} numeric />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Fecha Inicial" field="Fecha_Inicial" icon={Calendar} fecha />
                <InputField label="Fecha Final" field="Fecha_Final" icon={Calendar} fecha />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Soporte" field="Soporte" icon={Archive} />
                <InputField label="Frecuencia Consulta" field="Frecuencia_Consulta" icon={Clock} />
              </div>
            </div>
          )}

          {currentTab === "location" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InputField label="Estante" field="Estante" icon={MapPin} />
                <InputField label="Cuerpo" field="Cuerpo" icon={Package} />
                <InputField label="Balda" field="Balda" icon={Layers} />
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <MapPin size={18} className="text-indigo-600" />
                  Ubicación Física
                </h4>
                <div className="text-lg font-mono text-slate-600">
                  {form.Estante && form.Cuerpo && form.Balda 
                    ? `${form.Estante} - ${form.Cuerpo} - ${form.Balda}`
                    : "Pendiente de asignar"
                  }
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-8 py-6 border-t border-slate-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {doc?.id && (
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <input
                    type="checkbox"
                    checked={confirmDelete}
                    onChange={e => setConfirmDelete(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                  />
                  Confirmar eliminación
                </label>
                <button
                  disabled={!confirmDelete}
                  onClick={() => onDelete(form.id)}
                  className={`px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
                    confirmDelete
                      ? "hover:shadow-lg hover:scale-105 opacity-100"
                      : "opacity-50 cursor-not-allowed"
                  }`}
                >
                  <Trash size={18} />
                  Eliminar
                </button>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => onSave(form)}
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-xl font-medium hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-2"
              >
                <Plus size={18} />
                Guardar
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ------------------ Main Component ------------------
export default function ModernInventarioDocumental() {
  const [filters, setFilters] = useState({ search: "" });
  const [data, setData] = useState({ documentos: [] });
  const [state, setState] = useState({ loading: false, mensaje: null, selectedDoc: null, page: 0, total: 0 });
  const [pageSize, setPageSize] = useState(10);
  const [viewMode, setViewMode] = useState("table");

  const showMessage = (m, t) => setState(s => ({ ...s, mensaje: { mensaje: m, tipo: t } }));

  const fetchDocuments = useCallback(async (page = 0) => {
    setState(s => ({ ...s, loading: true }));
    const from = page * pageSize, to = from + pageSize - 1;
    let query = supabase.from("Inventario_documental").select("*", { count: "exact" }).order("id", { ascending: false }).range(from, to);
    if (filters.search.trim()) query.or(`id.ilike.%${filters.search}%,Descripcion.ilike.%${filters.search}%`);
    const { data: docs, count } = await query;
    setData({ documentos: docs || [] });
    setState(s => ({ ...s, page, total: count || 0, loading: false }));
  }, [filters.search, pageSize]);

  useEffect(() => { fetchDocuments(state.page); }, [fetchDocuments, state.page]);

  const saveDocument = async (doc) => {
    setState(s => ({ ...s, loading: true }));
    const { error } = doc.id
      ? await supabase.from("Inventario_documental").upsert(doc)
      : await supabase.from("Inventario_documental").insert(doc);
    if (error) showMessage("Error al guardar", "error");
    else showMessage("Documento guardado exitosamente", "success");
    setState(s => ({ ...s, selectedDoc: null, loading: false }));
    fetchDocuments(state.page);
  };

  const deleteDocument = async (id) => {
    const { error } = await supabase.from("Inventario_documental").delete().eq("id", id);
    if (error) showMessage("Error eliminando documento", "error");
    else showMessage("Documento eliminado", "info");
    setState(s => ({ ...s, selectedDoc: null }));
    fetchDocuments(state.page);
  };

  const exportToExcel = () => {
    if (!data.documentos.length) { showMessage("No hay datos para exportar", "warning"); return; }
    const ws = XLSX.utils.json_to_sheet(data.documentos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    XLSX.writeFile(wb, "inventario_documental.xlsx");
  };

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className={`bg-gradient-to-br ${color} rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          {trend && <p className="text-white/90 text-xs mt-2">{trend}</p>}
        </div>
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
          <Icon size={24} />
        </div>
      </div>
    </div>
  );

  const DocumentCard = ({ doc }) => (
    <div className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group hover:scale-[1.02]">
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center text-white font-bold">
              {doc.id?.split('-')[1]?.slice(-2) || '??'}
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">{doc.id}</h3>
              <p className="text-sm text-slate-600">{doc.Unidad_Organica}</p>
            </div>
          </div>
          <button
            onClick={() => setState(s => ({ ...s, selectedDoc: doc }))}
            className="w-8 h-8 bg-white/60 hover:bg-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
          >
            <Edit size={16} className="text-indigo-600" />
          </button>
        </div>
      </div>
      <div className="p-4">
        <p className="text-slate-700 font-medium mb-3 line-clamp-2">{doc.Descripcion}</p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Package size={14} className="text-slate-400" />
            <span className="text-slate-600">Caja: {doc.Numero_Caja}</span>
          </div>
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-slate-400" />
            <span className="text-slate-600">Tomo: {doc.Numero_Tomo}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-slate-400" />
            <span className="text-slate-600">{doc.Estante || "N/A"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-slate-400" />
            <span className="text-slate-600">{doc.Frecuencia_Consulta || "N/A"}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      {state.mensaje && (
        <Toast
          {...state.mensaje}
          onClose={() => setState(s => ({ ...s, mensaje: null }))}
        />
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl flex items-center justify-center">
              <BookOpen size={32} className="text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-700 bg-clip-text text-transparent">
                Inventario Documental
              </h1>
              <p className="text-slate-600 text-lg">Sistema de gestión documental moderno</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Total Documentos"
            value={state.total}
            icon={FileText}
            color="from-blue-600 to-blue-700"
          />
          <StatCard
            title="Cajas Registradas"
            value={data.documentos.filter(d => d.Numero_Caja).length}
            icon={Package}
            color="from-emerald-600 to-emerald-700"
          />
          <StatCard
            title="Consultas Alta"
            value={data.documentos.filter(d => d.Frecuencia_Consulta === "Alta").length}
            icon={Archive}
            color="from-amber-600 to-orange-700"
          />
          <StatCard
            title="Series Activas"
            value={new Set(data.documentos.map(d => d.Serie_Documental)).size}
            icon={Archive}
            color="from-purple-600 to-purple-700"
          />
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search size={20} className="text-slate-400" />
              </div>
              <input
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                onKeyDown={e => { if (e.key === "Enter") fetchDocuments(0); }}
                placeholder="Buscar por ID, descripción..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setViewMode(viewMode === "table" ? "cards" : "table")}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-2"
              >
                <Filter size={18} />
                {viewMode === "table" ? "Vista Tarjetas" : "Vista Tabla"}
              </button>
              <button
                onClick={exportToExcel}
                className="px-4 py-3 bg-gradient-to-r from-emerald-600 to-green-700 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-2"
              >
                <Download size={18} />
                Exportar
              </button>
              <button
                onClick={() => setState(s => ({ ...s, selectedDoc: {} }))}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-2"
              >
                <Plus size={18} />
                Nuevo Documento
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {state.loading && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles size={24} className="text-indigo-600 animate-pulse" />
                </div>
              </div>
              <p className="text-slate-600 mt-4 font-medium">Cargando documentos...</p>
            </div>
          </div>
        )}

        {/* Content Area */}
        {!state.loading && (
          <>
            {viewMode === "cards" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.documentos.map(doc => (
                  <DocumentCard key={doc.id} doc={doc} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Acciones</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">ID Documento</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Descripción</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Unidad Orgánica</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Caja</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Tomo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.documentos.map((doc, index) => (
                        <tr
                          key={doc.id}
                          className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-300 group"
                        >
                          <td className="px-6 py-4">
                            <button
                              onClick={() => setState(s => ({ ...s, selectedDoc: doc }))}
                              className="w-9 h-9 bg-indigo-100 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 group-hover:shadow-lg"
                            >
                              <Edit size={16} />
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                                {doc.id?.split('-')[1]?.slice(-2) || '??'}
                              </div>
                              <span className="font-mono text-sm font-medium text-slate-800">{doc.id}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="max-w-xs">
                              <p className="text-slate-800 font-medium truncate" title={doc.Descripcion}>
                                {doc.Descripcion}
                              </p>
                              <p className="text-slate-500 text-sm">{doc.Serie_Documental}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Building2 size={16} className="text-slate-400" />
                              <span className="text-slate-700">{doc.Unidad_Organica}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {doc.Numero_Caja || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {doc.Numero_Tomo || 'N/A'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Empty State */}
            {data.documentos.length === 0 && !state.loading && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <FolderOpen size={48} className="text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">No hay documentos</h3>
                  <p className="text-slate-500 mb-6">Comienza agregando tu primer documento al inventario</p>
                  <button
                    onClick={() => setState(s => ({ ...s, selectedDoc: {} }))}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-2 mx-auto"
                  >
                    <Plus size={18} />
                    Crear Primer Documento
                  </button>
                </div>
              </div>
            )}

            {/* Pagination */}
            {data.documentos.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="text-slate-600">
                    Mostrando {state.page * pageSize + 1} - {Math.min((state.page + 1) * pageSize, state.total)} de {state.total} documentos
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      disabled={state.page === 0}
                      onClick={() => fetchDocuments(state.page - 1)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400 text-slate-700 rounded-xl transition-colors flex items-center gap-2"
                    >
                      « Anterior
                    </button>
                    
                    <div className="flex gap-1">
                      {Array.from({ length: Math.ceil(state.total / pageSize) }, (_, i) => i)
                        .filter(i => i < 2 || i >= Math.ceil(state.total / pageSize) - 2 || Math.abs(i - state.page) <= 2)
                        .map((i, idx, arr) => {
                          const prev = arr[idx - 1];
                          if (prev !== undefined && i - prev > 1) {
                            return <span key={`ellipsis-${i}`} className="px-3 py-2 text-slate-400">…</span>;
                          }
                          return (
                            <button
                              key={i}
                              onClick={() => fetchDocuments(i)}
                              className={`px-4 py-2 rounded-xl transition-all duration-300 ${
                                i === state.page
                                  ? "bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-lg scale-105"
                                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 hover:scale-105"
                              }`}
                            >
                              {i + 1}
                            </button>
                          );
                        })}
                    </div>
                    
                    <button
                      disabled={(state.page + 1) * pageSize >= state.total}
                      onClick={() => fetchDocuments(state.page + 1)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400 text-slate-700 rounded-xl transition-colors flex items-center gap-2"
                    >
                      Siguiente »
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-600">Mostrar:</span>
                    <select
                      value={pageSize}
                      onChange={e => {
                        setPageSize(Number(e.target.value));
                        fetchDocuments(0);
                      }}
                      className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Modal */}
        {state.selectedDoc && (
          <DocumentModal
            doc={state.selectedDoc}
            onClose={() => setState(s => ({ ...s, selectedDoc: null }))}
            onSave={saveDocument}
            onDelete={deleteDocument}
          />
        )}

        {/* Footer */}
        <div className="text-center py-8">
          <div className="flex items-center justify-center gap-2 text-slate-500">
            <Sparkles size={16} />
            <span>Sistema de Inventario Documental v2.0</span>
            <Sparkles size={16} />
          </div>
          <p className="text-slate-400 text-sm mt-2">Desarrollado con tecnología moderna y diseño vanguardista</p>
        </div>
      </div>
    </div>
  );
}