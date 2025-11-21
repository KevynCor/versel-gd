import React from "react";

export const TextareaField = ({ 
  label, 
  value, 
  onChange, 
  icon: Icon, 
  className = "", 
  ...props // Captura rows, placeholder, disabled, etc.
}) => (
  <div className={`group ${className}`}>
    {label && (
      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
        {Icon && <Icon size={14} className="text-indigo-600" />}
        {label}
      </label>
    )}
    <div className="relative">
      <textarea
        {...props}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 bg-white border border-slate-200 rounded-lg 
          focus:outline-none focus:ring-2 focus:ring-indigo-500 
          text-slate-900 text-sm resize-y transition
          disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
          ${props.readOnly ? 'bg-gray-50 text-gray-600' : ''}
        `}
      />
    </div>
  </div>
);