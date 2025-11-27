import React from "react";
import { X } from "lucide-react";

export const ModalGenerico = ({ title, onClose, children }) => (
  <div 
    className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 transition-opacity duration-300" 
    onClick={onClose}
  >
    <div 
      className="
        bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] 
        overflow-hidden flex flex-col border border-slate-200
        animate-fadeIn
      " 
      onClick={e => e.stopPropagation()}
    >
      {/* Header Corporativo */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50 sticky top-0 z-10 flex-shrink-0">
        <div>
          <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">
            {title}
          </h3>
        </div>
        <button 
          onClick={onClose} 
          className="text-slate-400 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500/20"
          title="Cerrar ventana"
        >
          <X size={20} />
        </button>
      </div>

      {/* Contenido con Scroll */}
      <div className="p-6 overflow-y-auto custom-scrollbar">
        {children}
      </div>
    </div>
  </div>
);