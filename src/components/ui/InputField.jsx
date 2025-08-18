export const InputField = ({ label, field, value, onChange, disabled = false, type = "text", icon: Icon, className = "" }) => {
  const handleChange = (e) => {
    let val = e.target.value;
    if (type === "numeric") val = val.replace(/\D/g, "").slice(0, 4);
    if (type === "fecha") {
      const digits = val.replace(/\D/g, "");
      val = '';
      if (digits.length >= 2) val += digits.slice(0, 2) + '/';
      else val += digits;
      if (digits.length >= 4) val += digits.slice(2, 4) + '/';
      else if (digits.length > 2) val += digits.slice(2);
      if (digits.length > 4) val += digits.slice(4, 8);
    }
    onChange(field, val);
  };

  return (
    <div className={`group ${className}`}>
      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
        {Icon && <Icon size={14} className="text-indigo-600" />}
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={value || ""}
          onChange={handleChange}
          disabled={disabled}
          className={`w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm ${
            disabled ? 'opacity-60' : 'hover:border-indigo-300'
          } ${type === "numeric" ? 'text-center font-mono' : ''}`}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg opacity-0 group-focus-within:opacity-5 pointer-events-none"></div>
      </div>
    </div>
  );
};