import React from "react";
import { Calendar, FileText, Info } from "lucide-react";

const ModalDetalleDocumento = ({ doc, onClose }) => {
  const parseValue = (key, value) => {
    if (key.toLowerCase().includes("fecha") && !isNaN(new Date(value))) {
      return new Date(value).toLocaleDateString();
    }
    return String(value);
  };

  const getIcon = (key) => {
    if (key.toLowerCase().includes("fecha"))
      return <Calendar className="w-5 h-5 text-blue-600" />;
    if (key.toLowerCase().includes("descripcion"))
      return <FileText className="w-5 h-5 text-green-600" />;
    return <Info className="w-5 h-5 text-slate-500" />;
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
          <h3 className="text-ms font-bold text-slate-800">
            {doc.Descripcion || "Detalle del Documento"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-600 transition rounded-full p-1 hover:bg-red-50"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Timeline */}
        <div className="p-6">
          <ol className="relative border-l border-slate-300 space-y-3">
            {Object.entries(doc)
              .filter(([_, v]) => v != null && v !== "")
              .map(([key, value]) => (
                <li key={key} className="ml-6">
                  {/* Icono */}
                  <span className="absolute -left-3 flex items-center justify-center w-6 h-6 bg-white border border-slate-300 rounded-full">
                    {getIcon(key)}
                  </span>

                  {/* Campo */}
                  <h4 className="text-sm font-semibold text-slate-700 capitalize">
                    {key.replace(/_/g, " ")}
                  </h4>
                  <p className="text-slate-900 text-sm break-words">
                    {parseValue(key, value)}
                  </p>
                </li>
              ))}
          </ol>
        </div>
      </div>
    </div>
  );
};

export default ModalDetalleDocumento;
