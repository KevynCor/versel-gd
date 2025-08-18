import { FolderOpen } from "lucide-react";

export const EmptyState = ({ title = "No hay datos", message = "No se encontraron registros", onCreate, createLabel = "Crear" }) => (
  <div className="bg-white rounded-xl shadow p-8 text-center">
    <FolderOpen size={32} className="mx-auto text-slate-300" />
    <h3 className="text-slate-700 mt-2 font-semibold">{title}</h3>
    <p className="text-slate-500 mt-1">{message}</p>
    {onCreate && (
      <button
        onClick={onCreate}
        className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:shadow"
      >
        {createLabel}
      </button>
    )}
  </div>
);