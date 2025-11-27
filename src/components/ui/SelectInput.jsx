import React from "react";

export const SelectInput = ({ label, icon: Icon, value, onChange, options = [], placeholder = "Seleccione una opción...", disabled }) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
          {Icon && <Icon className="w-4 h-4 text-slate-400" />}
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`
            w-full rounded-lg border border-slate-300 
            py-2.5 px-3 text-sm text-slate-800
            focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
            transition-all duration-200 appearance-none
            ${disabled 
              ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200' 
              : 'bg-white hover:border-slate-400 cursor-pointer'
            }
            ${!value ? 'text-slate-500' : ''}
          `}
        >
          <option value="" disabled className="text-slate-400">{placeholder}</option>
          {options.map((opt, idx) => (
            <option key={idx} value={typeof opt === 'object' ? opt.value : opt} className="text-slate-800">
              {typeof opt === 'object' ? opt.label : opt}
            </option>
          ))}
        </select>
        
        {/* Flecha personalizada para mantener estilo consistente en navegadores */}
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
};