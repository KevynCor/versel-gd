// src/components/form/ModalGenerico.jsx
import React from "react";
import { X } from "lucide-react";

export const ModalGenerico = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4" onClick={onClose}>
    <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-red-600">
          <X size={20} />
        </button>
      </div>
      {children}
    </div>
  </div>
);