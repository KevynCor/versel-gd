import React from "react";
import { Calendar, FileText, Info, AlignLeft, CheckCircle } from "lucide-react";

const ModalDetalleDocumento = ({ doc, onClose }) => {
  const parseValue = (key, value) => {
    if (key.toLowerCase().includes("fecha") && !isNaN(new Date(value))) {
      return new Date(value).toLocaleDateString();
    }
    return String(value);
  };

  const getIcon = (key) => {
    const k = key.toLowerCase();
    if (k.includes("fecha")) return <Calendar className="w-4 h-4 text-blue-700" />;
    if (k.includes("descripcion") || k.includes("observaciones")) return <AlignLeft className="w-4 h-4 text-slate-600" />;
    if (k.includes("estado") || k.includes("check")) return <CheckCircle className="w-4 h-4 text-emerald-600" />;
    return <Info className="w-4 h-4 text-slate-400" />;
  };

  // Función para determinar si el campo debe ocupar 2 columnas
  const isFullWidth = (key) => {
    const k = key.toLowerCase();
    return k.includes("descripcion") || k.includes("observaciones") || k.includes("asunto");
  };

  // Filtramos campos vacíos para no mostrar ruido visual
  const camposVisibles = Object.entries(doc).filter(([_, v]) => v != null && v !== "");

  return (
    <div
      className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="
          bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] 
          overflow-y-auto animate-fadeIn border border-slate-200 flex flex-col
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Corporativo */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
          <div>
            <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">
              Detalle del Documento
            </h3>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">
              Información Registrada en Base de Datos
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50"
            title="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido en Grid */}
        <div className="p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {camposVisibles.map(([key, value]) => {
              const fullWidth = isFullWidth(key);
              
              return (
                <div 
                  key={key} 
                  className={`
                    group relative p-4 rounded-lg border transition-all duration-200
                    ${fullWidth 
                      ? "sm:col-span-2 bg-blue-50/50 border-blue-100 hover:border-blue-200" 
                      : "sm:col-span-1 bg-slate-50 border-slate-100 hover:border-slate-300 hover:shadow-sm"
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    {/* Icono con fondo */}
                    <div className={`
                      flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border
                      ${fullWidth ? "bg-white border-blue-200" : "bg-white border-slate-200"}
                    `}>
                      {getIcon(key)}
                    </div>

                    {/* Datos */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                        {key.replace(/_/g, " ")}
                      </h4>
                      <div className={`
                        text-sm font-medium break-words leading-relaxed
                        ${fullWidth ? "text-slate-800" : "text-slate-700"}
                      `}>
                        {parseValue(key, value)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Footer del Modal */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-right mt-auto">
           <button 
             onClick={onClose}
             className="px-6 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-sm"
           >
             Cerrar Ventana
           </button>
        </div>
      </div>
    </div>
  );
};

export default ModalDetalleDocumento;