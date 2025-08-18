import { Filter } from "lucide-react";

export const ViewToggle = ({ view, onViewChange }) => (
  <button
    onClick={() => onViewChange(view === "table" ? "cards" : "table")}
    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs sm:text-sm transition flex items-center gap-1"
  >
    <Filter size={14} />
    {view === "table" ? "Tarjetas" : "Tabla"}
  </button>
);