import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../utils/supabaseClient";
import {
  FileText, Archive, MapPin, Calendar, Eye,
  Building2, Package, Layers, Clock, Hash, X, Trash, Plus
} from "lucide-react";
import { formatDate } from "../../utils/helpers";

export const DocumentModal = ({ doc, onClose, onSave, onDelete }) => {
  const [form, setForm] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [currentTab, setCurrentTab] = useState("basic");
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const generateId = async () => {
      try {
        const { data, error } = await supabase
          .from("Inventario_documental")
          .select("id")
          .order("id", { ascending: false })
          .limit(1);
        if (error) throw error;

        let lastNum = 0;
        if (data?.length) {
          const lastId = data[0].id;
          const parts = lastId?.split("-") || [];
          lastNum = parts.length > 1 ? parseInt(parts[1], 10) : 0;
        }

        const newId = doc?.id || `${currentYear}-${String(lastNum + 1).padStart(8, "0")}`;
        const todayStr = formatDate(new Date());

        setForm({
          ...doc,
          id: newId,
          Fecha_Inventario: formatDate(doc?.Fecha_Inventario) || todayStr,
          Fecha_Inicial: formatDate(doc?.Fecha_Inicial),
          Fecha_Final: formatDate(doc?.Fecha_Final),
        });
      } catch (err) {
        console.error("Error generando ID:", err);
        const fallbackId = doc?.id || `${currentYear}-${String(Date.now()).slice(-8)}`;
        setForm({
          ...doc,
          id: fallbackId,
          Fecha_Inventario: formatDate(doc?.Fecha_Inventario) || formatDate(new Date()),
          Fecha_Inicial: formatDate(doc?.Fecha_Inicial),
          Fecha_Final: formatDate(doc?.Fecha_Final),
        });
      }
    };
    generateId();
  }, [doc, currentYear]);

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const handleSave = () => onSave(form);

  const tabs = [
    { id: "basic", label: "Básico", icon: FileText },
    { id: "details", label: "Detalles", icon: Archive },
    { id: "location", label: "Ubicación", icon: MapPin },
  ];

  return (
    <motion.div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-4 py-3 sm:px-6 sm:py-4 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center">
              <FileText size={18} />
            </div>
            <div className="truncate">
              <h3 className="text-lg sm:text-xl font-bold truncate">{doc?.id ? "Editar" : "Nuevo"}</h3>
              <p className="text-indigo-100 text-xs sm:text-sm truncate">{form.id || "Generando..."}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 hover:bg-white/30 rounded-lg sm:rounded-xl flex items-center justify-center transition self-end sm:self-auto"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-slate-50 px-2 sm:px-6 py-2 sm:py-3 border-b border-slate-200 overflow-x-auto">
          <div className="flex gap-1 sm:gap-2 whitespace-nowrap">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setCurrentTab(id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  currentTab === id ? "bg-indigo-600 text-white shadow" : "text-slate-600 hover:bg-white"
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6 overflow-y-auto max-h-[65vh] space-y-4">
          {currentTab === "basic" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <InputField label="Fecha Inventario" field="Fecha_Inventario" value={form.Fecha_Inventario} onChange={handleChange} disabled icon={Calendar} />
              <InputField label="Analista" field="Analista" value={form.Analista} onChange={handleChange} icon={Eye} />
              <InputField label="Contratista" field="Contratista" value={form.Contratista} onChange={handleChange} icon={Building2} />
              <InputField label="N° Entregable" field="Numero_Entregable" value={form.Numero_Entregable} onChange={handleChange} icon={Hash} type="numeric" />
              <InputField label="Sigla" field="Sigla" value={form.Sigla} onChange={handleChange} icon={Archive} />
              <InputField label="Unid. Orgánica" field="Unidad_Organica" value={form.Unidad_Organica} onChange={handleChange} icon={Building2} className="sm:col-span-2" />
              <InputField label="Serie Documental" field="Serie_Documental" value={form.Serie_Documental} onChange={handleChange} icon={Archive} />
              <TextareaField label="Descripción" field="Descripcion" value={form.Descripcion} onChange={handleChange} icon={FileText} className="sm:col-span-3" />
              <TextareaField label="Observaciones" field="Observaciones" value={form.Observaciones} onChange={handleChange} icon={Eye} className="sm:col-span-3" />
            </div>
          )}

          {currentTab === "details" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <InputField label="N° Caja" field="Numero_Caja" value={form.Numero_Caja} onChange={handleChange} icon={Package} type="numeric" />
              <InputField label="N° Tomo" field="Numero_Tomo" value={form.Numero_Tomo} onChange={handleChange} icon={Layers} type="numeric" />
              <InputField label="N° Folios" field="Numero_Folios" value={form.Numero_Folios} onChange={handleChange} icon={FileText} type="numeric" />
              <InputField label="Fecha Inicial" field="Fecha_Inicial" value={form.Fecha_Inicial} onChange={handleChange} icon={Calendar} type="fecha" />
              <InputField label="Fecha Final" field="Fecha_Final" value={form.Fecha_Final} onChange={handleChange} icon={Calendar} type="fecha" />
              <InputField label="Soporte" field="Soporte" value={form.Soporte} onChange={handleChange} icon={Archive} />
              <InputField label="Frec. Consulta" field="Frecuencia_Consulta" value={form.Frecuencia_Consulta} onChange={handleChange} icon={Clock} />
            </div>
          )}

          {currentTab === "location" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <InputField label="Estante" field="Estante" value={form.Estante} onChange={handleChange} icon={MapPin} />
              <InputField label="Cuerpo" field="Cuerpo" value={form.Cuerpo} onChange={handleChange} icon={Package} />
              <InputField label="Balda" field="Balda" value={form.Balda} onChange={handleChange} icon={Layers} />
              <div className="sm:col-span-3 bg-blue-50 rounded-xl p-4 border border-blue-200">
                <h4 className="font-semibold text-slate-700 text-sm flex items-center gap-1.5">
                  <MapPin size={16} className="text-indigo-600" />
                  Ubicación Física
                </h4>
                <div className="text-sm font-mono text-slate-600 mt-1">
                  {form.Estante && form.Cuerpo && form.Balda
                    ? `${form.Estante} - ${form.Cuerpo} - ${form.Balda}`
                    : "Pendiente"}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-3 sm:px-6 py-3 sm:py-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
          {doc?.id && (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label className="flex items-center gap-1.5 text-xs text-slate-600">
                <input type="checkbox" checked={confirmDelete} onChange={(e) => setConfirmDelete(e.target.checked)} className="w-3 h-3 rounded focus:ring-red-500" />
                Confirmar eliminación
              </label>
              <button
                disabled={!confirmDelete}
                onClick={() => onDelete(form.id)}
                className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-lg flex items-center gap-1.5 transition w-full sm:w-auto ${
                  confirmDelete
                    ? "bg-gradient-to-r from-red-500 to-pink-600 text-white hover:shadow hover:scale-105"
                    : "bg-slate-200 text-slate-500 cursor-not-allowed opacity-60"
                }`}
              >
                <Trash size={14} /> Eliminar
              </button>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto justify-end">
            <button onClick={onClose} className="px-4 py-2 text-xs sm:text-sm bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition w-full sm:w-auto">Cancelar</button>
            <button onClick={handleSave} className="px-5 py-2 text-xs sm:text-sm bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-lg hover:shadow hover:scale-105 transition flex items-center gap-1.5 w-full sm:w-auto justify-center">
              <Plus size={14} /> Guardar
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ------------------ InputField ------------------
const InputField = ({ label, field, value, onChange, disabled = false, type = "text", icon: Icon, className = "" }) => {
  const handleChange = (e) => {
    let val = e.target.value;
    if (type === "numeric") val = val.replace(/\D/g, "").slice(0, 4);
    if (type === "fecha") {
      const digits = val.replace(/\D/g, "");
      val = '';
      if (digits.length >= 2) val += digits.slice(0, 2) + '/';
      else val += digits;
      if (digits.length >= 4) val += digits.slice(2, 4) + '/';
      else if (digits.length > 2) val += digits.slice(2);
      if (digits.length > 4) val += digits.slice(4, 8);
    }
    onChange(field, val);
  };

  return (
    <div className={`group ${className}`}>
      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
        {Icon && <Icon size={14} className="text-indigo-600" />}
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={value || ""}
          onChange={handleChange}
          disabled={disabled}
          className={`w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm ${
            disabled ? 'opacity-60' : 'hover:border-indigo-300'
          } ${type === "numeric" ? 'text-center font-mono' : ''}`}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg opacity-0 group-focus-within:opacity-5 pointer-events-none"></div>
      </div>
    </div>
  );
};

// ------------------ TextareaField ------------------
const TextareaField = ({ label, field, value, onChange, icon: Icon, className = "" }) => (
  <div className={`group ${className}`}>
    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
      {Icon && <Icon size={14} className="text-indigo-600" />}
      {label}
    </label>
    <div className="relative">
      <textarea
        value={value || ""}
        onChange={(e) => onChange(field, e.target.value)}
        rows={2}
        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm resize-none"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg opacity-0 group-focus-within:opacity-5 pointer-events-none"></div>
    </div>
  </div>
);
