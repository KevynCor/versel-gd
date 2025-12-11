import React, { useState, useMemo } from "react";
import { 
  AlertTriangle, X, Info, Loader2, Save, Trash2, 
  Box, FileText, Calendar, User, Building2, MapPin, 
  Hash, Layers, Archive, Shield, ChevronDown, ChevronUp,
  CheckCircle2, Clock, HelpCircle, Eye, Activity, Flag, FileWarning,
  AlertCircle, Ban 
} from "lucide-react";
import { InputField } from "../ui/InputField";
import { TextareaField } from "../ui/TextareaField";
import { ESTADOS_DOCUMENTO, ESTADOS_GESTION, ESTADO_INFO } from "../data/Shared";

// --- Subcomponente: Sección Colapsable ---
const CollapsibleSection = ({ title, icon: Icon, children, defaultOpen = false, error = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen || error);

  return (
    <div className={`border rounded-lg transition-all duration-200 ${isOpen ? 'border-slate-300 bg-white' : 'border-slate-100 bg-slate-50'}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 text-left focus:outline-none"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {Icon && <Icon size={16} className={`shrink-0 ${error ? 'text-red-500' : 'text-slate-500'}`} />}
          <span className={`text-sm font-semibold truncate ${error ? 'text-red-600' : 'text-slate-700'}`}>
            {title}
          </span>
        </div>
        {isOpen ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
      </button>
      
      {isOpen && (
        <div className="p-3 sm:p-4 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
};

// --- Subcomponente: Botón de Pestaña ---
const TabButton = ({ active, onClick, icon: Icon, label, hasError }) => (
  <button
    type="button"
    onClick={onClick}
    className={`
      flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 relative whitespace-nowrap flex-shrink-0
      ${active 
        ? 'border-blue-600 text-blue-700 bg-blue-50/50' 
        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
      }
    `}
  >
    <Icon size={16} className="shrink-0" />
    {label}
    {hasError && (
      <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" title="Errores en esta sección" />
    )}
  </button>
);

export const ModalDetalleDocumento = ({ doc, onClose, onSave, onDelete, readOnly = false }) => {
  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
   
  const [formData, setFormData] = useState(() => {
    const { created_at, updated_at, ...docData } = doc || {};
    return {
      id: "",
      Numero_Caja: "",
      Tomo_Faltante: false,
      Unidad_Organica: "",
      Sigla: "",
      Serie_Documental: "",
      Descripcion: "",
      Fecha_Inicial: "",
      Fecha_Final: "",
      Numero_Tomo: "",
      Tipo_Unidad_Conservacion: "",
      Numero_Folios: "",
      Soporte: "",
      Estante: "",
      Cuerpo: "",
      Balda: "",
      Frecuencia_Consulta: "",
      Observaciones: "",
      Analista: "",
      Fecha_Inventario: new Date().toISOString().split('T')[0],
      Contratista: "",
      Numero_Entregable: "",
      Ambiente: "",
      Estado_Documento: "DISPONIBLE",
      Estado_Gestion: "VIGENTE",
      Estado_Documento_Obs: "",
      Estado_Gestion_Obs: "",
      ...docData
    };
  });

  // --- SOLUCIÓN AL ERROR DE UNDEFINED VALUE ---
  const handleSafeChange = (field, eventOrValue) => {
    if (readOnly) return;

    let value = eventOrValue;
    if (eventOrValue && typeof eventOrValue === 'object' && eventOrValue.target) {
        value = eventOrValue.target.type === 'checkbox' ? eventOrValue.target.checked : eventOrValue.target.value;
    }
    
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      const updated = { ...errors };
      delete updated[field];
      setErrors(updated);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.Descripcion?.trim()) newErrors.Descripcion = "Requerido";
    if (!formData.Unidad_Organica?.trim()) newErrors.Unidad_Organica = "Requerido";
    if (!formData.Serie_Documental?.trim()) newErrors.Serie_Documental = "Requerido";
    
    if (formData.Fecha_Inicial && formData.Fecha_Final) {
      if (new Date(formData.Fecha_Inicial) > new Date(formData.Fecha_Final)) {
        newErrors.Fecha_Final = "La fecha final debe ser posterior";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    if (readOnly) return;
    
    if (!validateForm()) {
        return;
    }
    
    setSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (label, field, icon, type = "text", placeholder = "", widthClass = "w-full") => (
    <div className={widthClass}>
      <InputField
        label={label}
        icon={icon}
        type={type}
        value={formData[field] || ""}
        onChange={(e) => handleSafeChange(field, e)}
        placeholder={placeholder}
        disabled={saving || readOnly}
        className={errors[field] ? "border-red-500 bg-red-50" : ""}
      />
      {errors[field] && (
        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
          <AlertTriangle size={10} /> {errors[field]}
        </p>
      )}
    </div>
  );

  const renderSelect = (label, field, Icon, options) => (
    <div className="w-full">
      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
        {label}
      </label>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
          <Icon size={18} />
        </div>
        <select
          value={formData[field] || ""}
          onChange={(e) => handleSafeChange(field, e)}
          disabled={saving || readOnly}
          className={`
            w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm 
            text-slate-700 font-medium placeholder-slate-400 outline-none transition-all
            focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:border-slate-400
            disabled:bg-slate-50 disabled:text-slate-400 appearance-none
          `}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
           <ChevronDown size={16} />
        </div>
      </div>
    </div>
  );

  const tabErrors = useMemo(() => {
    const keys = Object.keys(errors);
    return {
      general: keys.some(k => ["Unidad_Organica", "Serie_Documental", "Descripcion", "Numero_Tomo", "Numero_Folios", "Estado_Documento", "Estado_Gestion"].includes(k)),
      location: keys.some(k => ["Estante", "Cuerpo", "Balda", "Numero_Caja"].includes(k)),
      control: keys.some(k => ["Analista", "Contratista"].includes(k))
    };
  }, [errors]);

  // Obtener info del estado actual
  const currentStateInfo = ESTADO_INFO[formData.Estado_Documento] || ESTADO_INFO.DISPONIBLE;
  const StateIcon = currentStateInfo.icon;
  // Booleano para saber si es No Localizado (para usar en otras alertas si se requiere)
  const isNoLocalizado = formData.Estado_Documento === "NO_LOCALIZADO";

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-200"
          onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden border border-slate-200"
          onClick={(e) => e.stopPropagation()}>
        
        {/* --- Header --- */}
        <div className="px-4 sm:px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
             <div className="bg-blue-100 p-2 rounded-lg text-blue-600 shrink-0">
                {readOnly ? <Eye size={20} /> : (doc?.id ? <FileText size={20} /> : <Layers size={20} />)}
             </div>
             <div className="overflow-hidden">
               <h2 className="text-sm sm:text-base font-bold text-slate-800 truncate">
                 {readOnly ? "Visualizar Expediente" : (doc?.id ? "Editar Expediente" : "Nuevo Registro")}
               </h2>
               <p className="text-xs text-slate-500 truncate">Gestión Documental Centralizada</p>
             </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors p-1 hover:bg-slate-100 rounded shrink-0">
            <X size={20} />
          </button>
        </div>

        {/* --- KPI Bar Contextual (ENCABEZADO CON ESTADO) --- */}
        <div className="bg-slate-50 px-4 sm:px-6 py-2 border-b border-slate-100 flex gap-4 sm:gap-6 text-xs font-medium text-slate-600 overflow-x-auto whitespace-nowrap shrink-0 scrollbar-hide items-center h-10">
            
            {/* ID */}
            {doc?.id && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-slate-200/50 transition-colors">
                    <Hash size={13} className="text-blue-500"/> 
                    ID: <span className="text-slate-900 font-mono">{doc.id}</span>
                </div>
            )}
            
            {/* Caja */}
            {formData.Numero_Caja && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-slate-200/50 transition-colors">
                    <Box size={13} className="text-blue-500"/> 
                    Caja: <span className="text-slate-900 font-mono">{formData.Numero_Caja}</span>
                </div>
            )}

            {/* ESTADO EN EL HEADER (AQUÍ ESTÁ EL CAMBIO SOLICITADO) */}
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border ${currentStateInfo.style} bg-opacity-30`}>
                <StateIcon size={12} strokeWidth={2.5}/>
                <span className="uppercase font-bold text-[10px]">
                    {ESTADOS_DOCUMENTO.find(e => e.value === formData.Estado_Documento)?.label || formData.Estado_Documento}
                </span>
            </div>
        </div>

        {/* --- Tabs --- */}
        <div className="flex px-2 border-b border-slate-200 bg-white overflow-x-auto shrink-0 no-scrollbar">
          <TabButton active={activeTab === "general"} onClick={() => setActiveTab("general")} icon={Shield} label="General" hasError={tabErrors.general} />
          <TabButton active={activeTab === "location"} onClick={() => setActiveTab("location")} icon={MapPin} label="Ubicación" hasError={tabErrors.location} />
          <TabButton active={activeTab === "control"} onClick={() => setActiveTab("control")} icon={User} label="Control" hasError={tabErrors.control} />
        </div>

        {/* --- Content --- */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-slate-50/50">
          <form id="docForm" onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
            
            {/* TAB: GENERAL */}
            {activeTab === "general" && (
              <div className="space-y-5 animate-in slide-in-from-right-4 duration-200">
                
                {/* 1. Clasificación */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                   {renderInput("Unidad Orgánica *", "Unidad_Organica", Building2)}
                   {renderInput("Serie Documental *", "Serie_Documental", Layers)}
                </div>

                {/* 2. Descripción */}
                <div className="bg-white p-3 sm:p-4 rounded-lg border border-slate-200 shadow-sm">
                   <TextareaField
                      label="Descripción del Expediente *"
                      value={formData.Descripcion || ""}
                      onChange={(e) => handleSafeChange("Descripcion", e)}
                      placeholder="Describa el asunto..."
                      rows={3}
                      disabled={saving || readOnly}
                      className={errors.Descripcion ? "border-red-500" : ""}
                   />
                </div>

                {/* 3. Datos Temporales */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
                   {renderInput("Fecha Inicial", "Fecha_Inicial", Calendar, "date")}
                   {renderInput("Fecha Final", "Fecha_Final", Calendar, "date")}
                   {renderInput("Sigla", "Sigla", Hash)}
                   {renderInput("Frecuencia", "Frecuencia_Consulta", Clock)}
                </div>

                {/* 4. Estados del Documento */}
                <CollapsibleSection title="Estado y Disponibilidad" icon={Activity} defaultOpen={true}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Columna Izquierda: Estado Documento */}
                            <div className="space-y-3">
                                {renderSelect("Estado Documento", "Estado_Documento", Activity, ESTADOS_DOCUMENTO)}
                                
                                {/* Mensaje Dinámico por Estado */}
                                <div className={`flex items-start gap-3 p-3 rounded-lg border text-xs leading-relaxed transition-all duration-300 ${currentStateInfo.style}`}>
                                    <StateIcon size={18} className="shrink-0 mt-0.5" />
                                    <span>{currentStateInfo.text}</span>
                                </div>

                                <TextareaField
                                    label="Observación Estado Doc."
                                    value={formData.Estado_Documento_Obs || ""}
                                    onChange={(e) => handleSafeChange("Estado_Documento_Obs", e)}
                                    placeholder="Detalles adicionales sobre el estado..."
                                    rows={2}
                                    disabled={saving || readOnly}
                                />
                            </div>

                            {/* Columna Derecha: Estado Gestión */}
                            <div className="space-y-3">
                                {renderSelect("Estado Gestión", "Estado_Gestion", Flag, ESTADOS_GESTION)}
                                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 text-xs">
                                    Define el ciclo de vida administrativo del expediente (Vigente, Eliminado, etc).
                                </div>
                                <TextareaField
                                    label="Observación Gestión"
                                    value={formData.Estado_Gestion_Obs || ""}
                                    onChange={(e) => handleSafeChange("Estado_Gestion_Obs", e)}
                                    placeholder="Motivo de cambio de gestión..."
                                    rows={2}
                                    disabled={saving || readOnly}
                                />
                            </div>
                        </div>
                    </div>
                </CollapsibleSection>

                {/* 5. Características Físicas (Neutro) */}
                <div className="p-3 sm:p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b border-slate-100 pb-2 gap-2">
                        <div className="flex items-center gap-2">
                            <Archive size={16} className="text-slate-500"/>
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                                Características Físicas
                            </h3>
                        </div>
                        
                        {/* Se mantiene el control visual pero sin etiquetas de alerta roja */}
                        <label className={`flex items-center gap-2 ${readOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'} select-none`}>
                            <span className="text-xs font-bold text-slate-500 uppercase">
                                {formData.Tomo_Faltante ? "Unidad NO Localizada" : "Unidad Localizada"}
                            </span>
                            <div className="relative">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={!!formData.Tomo_Faltante}
                                    disabled={readOnly}
                                    onChange={(e) => handleSafeChange("Tomo_Faltante", e)}
                                />
                                <div className={`w-9 h-5 rounded-full peer peer-focus:ring-2 peer-focus:ring-offset-1 transition-colors ${formData.Tomo_Faltante ? 'bg-slate-600 peer-focus:ring-slate-300' : 'bg-slate-200 hover:bg-slate-300'}`}></div>
                                <div className={`absolute top-1 left-1 bg-white border border-gray-300 w-3 h-3 rounded-full transition-transform ${formData.Tomo_Faltante ? 'translate-x-full border-white' : ''}`}></div>
                            </div>
                        </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                        {renderInput("Tipo Unidad", "Tipo_Unidad_Conservacion", Archive)}
                        {renderInput("Soporte", "Soporte", FileText)}
                        {renderInput("Tomo N°", "Numero_Tomo", Layers, "text", "")}
                        {renderInput("N° Folios", "Numero_Folios", Hash, "number")}
                    </div>
                </div>

                {/* 6. Observaciones Generales */}
                 <div className="bg-white p-3 sm:p-4 rounded-lg border border-slate-200 shadow-sm">
                   <TextareaField
                      label="Notas Generales del Registro"
                        value={formData.Observaciones || ""}
                        onChange={(e) => handleSafeChange("Observaciones", e)}
                        placeholder="Cualquier otra observación relevante..."
                        rows={3}
                        disabled={saving || readOnly}
                   />
                </div>

              </div>
            )}

            {/* TAB: UBICACIÓN */}
            {activeTab === "location" && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-200">
                <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <MapPin size={16} className="text-blue-600"/> Coordenadas de Archivo
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        {renderInput("Ambiente", "Ambiente", null, "text", "")}
                        {renderInput("Estante", "Estante", null, "text", "")}
                        {renderInput("Cuerpo", "Cuerpo", null, "text", "")}
                        {renderInput("Balda", "Balda", null, "text", "")}
                        <div className="col-span-2 sm:col-span-1">
                          {renderInput("N° Caja", "Numero_Caja", Box, "text", "")}
                        </div>
                    </div>
                </div>
              </div>
            )}

            {/* TAB: CONTROL */}
            {activeTab === "control" && (
              <div className="space-y-5 animate-in slide-in-from-right-4 duration-200">
                 <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
                     <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <User size={16} className="text-blue-600"/> Responsables
                     </h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {renderInput("Analista Responsable", "Analista", User)}
                        {renderInput("Empresa Responsable", "Contratista", Building2)}
                     </div>
                 </div>

                 <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
                     <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-blue-600"/> Datos de Entrega
                     </h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {renderInput("N° Entregable", "Numero_Entregable", Hash)}
                        {renderInput("Fecha Inventario", "Fecha_Inventario", Calendar, "date")}
                     </div>
                 </div>
              </div>
            )}

          </form>
        </div>

        {/* --- Footer --- */}
        <div className="px-4 sm:px-6 py-4 border-t border-slate-200 bg-white flex flex-col-reverse sm:flex-row justify-between items-center z-10 gap-3">
          <div className="w-full sm:w-auto">
            {!readOnly && doc?.id && (
              <button type="button" onClick={() => onDelete(doc.id)} className="w-full sm:w-auto text-slate-400 hover:text-red-600 text-sm font-medium flex items-center justify-center sm:justify-start gap-2 transition-colors py-2 sm:py-0">
                <Trash2 size={16} /> <span>Eliminar</span>
              </button>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button 
                onClick={onClose} 
                disabled={saving} 
                className="w-full sm:w-auto px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-semibold transition-colors border sm:border-transparent border-slate-200"
            >
                {readOnly ? "Cerrar" : "Cancelar"}
            </button>
            
            {!readOnly && (
                <button 
                    type="submit" 
                    form="docForm" 
                    disabled={saving} 
                    className="w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                {saving ? "Guardando..." : "Guardar"}
                </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ModalDetalleDocumento;