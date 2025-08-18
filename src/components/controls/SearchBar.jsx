import { Search } from "lucide-react";

export const SearchBar = ({ value, onChange, placeholder = "Buscar..." }) => (
  <div className="relative flex-1">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <Search size={16} className="text-slate-400" />
    </div>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
    />
  </div>
);