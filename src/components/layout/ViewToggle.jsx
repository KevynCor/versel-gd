import { Filter } from "lucide-react";

export const ViewToggle = ({ view, onViewChange }) => (
  <button
    onClick={() => onViewChange(view === "table" ? "cards" : "table")}
    className="
      flex items-center gap-2 
      px-4 py-2.5 
      bg-white border border-slate-300 
      hover:bg-blue-50 hover:border-blue-400 
      text-slate-700 hover:text-blue-800 
      rounded-lg text-sm font-bold 
      shadow-sm hover:shadow-md 
      transition-all duration-200 
      focus:outline-none focus:ring-2 focus:ring-blue-500/20
    "
  >
    <Filter size={16} className="text-slate-500 group-hover:text-blue-600" />
    {view === "table" ? "Tarjetas" : "Tabla"}
  </button>
);