import { FolderOpen } from "lucide-react";

export const EmptyState = ({ 
  title = "No hay datos", 
  message = "No se encontraron registros disponibles.", 
  onCreate, 
  createLabel = "Crear Nuevo",
  icon: Icon = FolderOpen 
}) => (
  <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center shadow-sm">
    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
      <Icon size={32} className="text-slate-400" />
    </div>
    <h3 className="text-slate-800 mt-2 font-bold text-lg">{title}</h3>
    <p className="text-slate-500 mt-1 text-sm max-w-sm mx-auto">{message}</p>
    {onCreate && (
      <button
        onClick={onCreate}
        className="mt-6 px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-bold shadow-sm hover:shadow transition-all duration-200"
      >
        {createLabel}
      </button>
    )}
  </div>
);