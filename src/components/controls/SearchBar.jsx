import { Search } from "lucide-react";

export const SearchBar = ({ value, onChange, placeholder = "Buscar..." }) => (
  <div className="relative flex-1 group">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <Search size={16} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
    </div>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="
        w-full pl-10 pr-4 py-2.5 
        bg-white border border-slate-300 
        rounded-lg 
        text-sm text-slate-700 placeholder-slate-400
        shadow-sm transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
        hover:border-slate-400
      "
    />
  </div>
);