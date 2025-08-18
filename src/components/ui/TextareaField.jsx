export const TextareaField = ({ label, field, value, onChange, icon: Icon, className = "" }) => (
  <div className={`group ${className}`}>
    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
      {Icon && <Icon size={14} className="text-indigo-600" />}
      {label}
    </label>
    <div className="relative">
      <textarea
        value={value || ""}
        onChange={(e) => onChange(field, e.target.value)}
        rows={2}
        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm resize-none"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg opacity-0 group-focus-within:opacity-5 pointer-events-none"></div>
    </div>
  </div>
);