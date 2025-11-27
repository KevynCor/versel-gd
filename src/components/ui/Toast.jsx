import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export const Toast = ({ mensaje, tipo = "info", onClose }) => {
  // Configuración de estilos corporativos (Borde lateral y colores de icono)
  const config = {
    success: { 
      border: "border-emerald-500", 
      text: "text-emerald-700", 
      bgIcon: "bg-emerald-100",
      icon: <CheckCircle size={20} className="text-emerald-600" /> 
    },
    error: { 
      border: "border-red-500", 
      text: "text-red-700", 
      bgIcon: "bg-red-100",
      icon: <AlertCircle size={20} className="text-red-600" /> 
    },
    warning: { 
      border: "border-amber-500", 
      text: "text-amber-700", 
      bgIcon: "bg-amber-100",
      icon: <AlertTriangle size={20} className="text-amber-600" /> 
    },
    info: { 
      border: "border-blue-500", 
      text: "text-blue-700", 
      bgIcon: "bg-blue-100",
      icon: <Info size={20} className="text-blue-600" /> 
    }
  };

  const style = config[tipo] || config.info;

  // Cerrar automáticamente a los 4 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose?.();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 100, opacity: 0 }}
      className="fixed top-20 right-6 z-[100] flex flex-col gap-2"
    >
      <div className={`
        flex items-start gap-3 p-4 
        bg-white border-l-4 ${style.border} 
        rounded-r-lg shadow-lg border-y border-r border-slate-200
        min-w-[320px] max-w-md relative overflow-hidden
      `}>
        {/* Icono */}
        <div className={`p-2 rounded-full ${style.bgIcon} flex-shrink-0`}>
          {style.icon}
        </div>

        {/* Contenido */}
        <div className="flex-1 pt-0.5">
          <h4 className={`text-sm font-bold capitalize mb-0.5 ${style.text}`}>
            {tipo === 'info' ? 'Información' : tipo}
          </h4>
          <p className="text-sm text-slate-600 leading-relaxed">
            {mensaje}
          </p>
        </div>

        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded transition-colors absolute top-2 right-2"
        >
          <X size={16} />
        </button>
      </div>
    </motion.div>
  );
};