import React from "react";

const ModalDetalleDocumento = ({ doc, onClose }) => (
  <div
    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4"
    onClick={onClose}
  >
    <div
      className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-start border-b pb-3 mb-4">
        <h3 className="text-lg sm:text-xl font-bold text-blue-600 break-words">
          {doc.Descripcion || "Sin descripción"}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-red-600 transition"
        >
          <svg
            className="w-5 h-5"
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
      <ul className="space-y-2 text-sm sm:text-base">
        {Object.entries(doc)
          .filter(([_, v]) => v != null && v !== "")
          .map(([key, value]) => (
            <li
              key={key}
              className="flex flex-col sm:flex-row sm:items-center gap-1"
            >
              <strong className="capitalize text-slate-700 text-xs sm:text-sm min-w-32">
                {key.replace(/_/g, " ")}:
              </strong>
              <span className="text-slate-800 break-words">
                {key.toLowerCase().includes("fecha") &&
                !isNaN(new Date(value))
                  ? new Date(value).toLocaleDateString()
                  : String(value)}
              </span>
            </li>
          ))}
      </ul>
    </div>
  </div>
);

export default ModalDetalleDocumento;
