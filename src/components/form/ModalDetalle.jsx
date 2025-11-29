import React, { useState } from "react";
import { 
  AlertTriangle, X, Info, Loader2, Save, Trash2, 
  Box, FileText, Calendar, User, Building2, MapPin, 
  Hash, Layers, Archive, Shield 
} from "lucide-react";
import { InputField } from "../ui/InputField";
import { TextareaField } from "../ui/TextareaField";

export const DocumentModal = ({ doc, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState(() => {
    const { created_at, updated_at, ...docData } = doc || {};
    return {
      id: "",
      Numero_Caja: "",
      Tomo_Faltante: "",
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
      Fecha_Inventario: "",
      Contratista: "",
      Numero_Entregable: "",
      Ambiente: "",
      ...docData
    };
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.Descripcion?.trim()) newErrors.Descripcion = "La descripción es obligatoria";
    if (!formData.Unidad_Organica?.trim()) newErrors.Unidad_Organica = "La unidad orgánica es obligatoria";
    if (!formData.Serie_Documental?.trim()) newErrors.Serie_Documental = "La serie documental es obligatoria";

    if (formData.Fecha_Inicial && formData.Fecha_Final) {
      const fechaInicial = new Date(formData.Fecha_Inicial);
      const fechaFinal = new Date(formData.Fecha_Final);
      if (isNaN(fechaInicial) || isNaN(fechaFinal)) {
        newErrors.Fecha_Inicial = "Fechas inválidas";
      } else if (fechaInicial > fechaFinal) {
        newErrors.Fecha_Final = "La fecha final debe ser posterior a la inicial";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      const updated = { ...errors };
      delete updated[field];
      setErrors(updated);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error("Error saving document:", error);
    } finally {
      setSaving(false);
    }
  };

  // Helper para renderizar inputs usando tu componente UI
  const renderInput = (label, field, icon, type = "text", placeholder = "") => (
    <div>
      <InputField
        label={label}
        icon={icon}
        type={type}
        value={formData[field] || ""}
        onChange={(e) => handleChange(field, e.target.value)}
        placeholder={placeholder}
        disabled={saving}
        className={errors[field] ? "border-red-500 focus:border-red-500 bg-red-50" : ""}
      />
      {errors[field] && (
        <p className="text-red-500 text-xs mt-1 flex items-center gap-1 font-medium">
          <AlertTriangle size={10} /> {errors[field]}
        </p>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* --- Header --- */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="text-lg font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              {doc?.id ? <FileText className="text-blue-600" size={20}/> : <PlusSquare className="text-blue-600" size={20}/>}
              {doc?.id ? "Editar Expediente" : "Nuevo Registro Documental"}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {doc?.id ? `ID: ${doc.id} • Complete los cambios necesarios` : "Ingrese la información del nuevo documento"}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* --- Body (Formulario con Scroll) --- */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Sección 1: Identificación y Clasificación */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-2">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold uppercase tracking-wide">Identificación y Clasificación</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {renderInput("Unidad Orgánica *", "Unidad_Organica", Building2, "text", "Ej: LOGÍSTICA")}
                    {renderInput("Serie Documental *", "Serie_Documental", Layers, "text", "Ej: CONTRATOS")}
                    {renderInput("Sigla", "Sigla", Hash)}
                    {renderInput("Tipo Unidad", "Tipo_Unidad_Conservacion", Archive, "text", "Ej: ARCHIVADOR")}
                    {renderInput("Soporte", "Soporte", FileText, "text", "Ej: PAPEL")}
                    {renderInput("Frecuencia Consulta", "Frecuencia_Consulta", Loader2)}
                </div>
            </div>

            {/* Sección 2: Descripción */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold uppercase tracking-wide">Detalle del Documento</h3>
                </div>
                <div className="grid grid-cols-1 gap-5">
                    <div className="whitespace-pre-line">
                        <TextareaField
                            label="Descripción del Contenido *"
                            value={formData.Descripcion || ""}
                            onChange={(e) => handleChange("Descripcion", e.target.value)}
                            placeholder="Describa detalladamente el contenido del expediente..."
                            rows={3}
                            className={errors.Descripcion ? "border-red-500" : ""}
                        />
                        {errors.Descripcion && <p className="text-red-500 text-xs mt-1 font-medium">{errors.Descripcion}</p>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {renderInput("Fecha Inicial", "Fecha_Inicial", Calendar, "date")}
                        {renderInput("Fecha Final", "Fecha_Final", Calendar, "date")}
                        {renderInput("Fecha Inventario", "Fecha_Inventario", Calendar, "date")}
                    </div>
                </div>
            </div>

            {/* Sección 3: Ubicación Topográfica */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold uppercase tracking-wide">Ubicación Topográfica</h3>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {renderInput("Ambiente", "Ambiente")}
                    {renderInput("Estante", "Estante")}
                    {renderInput("Cuerpo", "Cuerpo")}
                    {renderInput("Balda", "Balda")}
                    {renderInput("Caja N°", "Numero_Caja", Box)}
                    {renderInput("Tomo N°", "Numero_Tomo")}
                </div>
            </div>

            {/* Sección 4: Control y Gestión */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold uppercase tracking-wide">Datos de Control</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {renderInput("N° Folios", "Numero_Folios", Hash, "number")}
                    {renderInput("Tomo Faltante", "Tomo_Faltante", AlertTriangle)}
                    {renderInput("Analista", "Analista", User)}
                    {renderInput("Contratista", "Contratista", Building2)}
                    {renderInput("N° Entregable", "Numero_Entregable", Hash)}
                </div>
                <div className="pt-2 whitespace-pre-line">
                    <TextareaField
                        label="Observaciones Generales"
                        value={formData.Observaciones || ""}
                        onChange={(e) => handleChange("Observaciones", e.target.value)}
                        placeholder="Notas adicionales, estado de conservación, etc."
                        rows={2}
                    />
                </div>
            </div>

          </form>
        </div>

        {/* --- Footer --- */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center flex-shrink-0">
          <div>
            {doc?.id && (
              <button
                type="button"
                onClick={() => onDelete(doc.id)}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-bold transition-colors border border-transparent hover:border-red-200"
              >
                <Trash2 size={18} />
                <span className="hidden sm:inline">Eliminar Registro</span>
              </button>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-bold hover:bg-white hover:text-slate-900 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-70"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={18} />}
              {saving ? "Guardando..." : doc?.id ? "Guardar Cambios" : "Registrar Documento"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DocumentModal;