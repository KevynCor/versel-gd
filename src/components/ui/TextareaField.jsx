import React from "react";

export const TextareaField = ({ 
  label, 
  value, 
  onChange, 
  icon: Icon, 
  className = "", 
  ...props 
}) => (
  <div className={`group space-y-1.5 ${className}`}>
    {label && (
      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
        {Icon && <Icon size={14} className="text-slate-400 group-focus-within:text-blue-600 transition-colors" />}
        {label}
      </label>
    )}
    <div className="relative">
      <textarea
        {...props}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className={`
          w-full px-4 py-3 
          bg-white border border-slate-300 rounded-lg 
          text-slate-800 text-sm leading-relaxed placeholder-slate-400
          focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 
          resize-y transition-all duration-200
          disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed disabled:border-slate-200
          ${props.readOnly ? 'bg-slate-50 text-slate-600 border-slate-200' : 'hover:border-slate-400'}
        `}
      />
    </div>
  </div>
);