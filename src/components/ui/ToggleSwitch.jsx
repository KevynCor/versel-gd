import React from "react";

export const ToggleSwitch = ({ checked, onChange, label, description, disabled }) => {
  return (
    <div className={`flex items-start gap-4 ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
      {/* Switch interactivo */}
      <label className="relative inline-flex items-center cursor-pointer mt-0.5">
        <input 
          type="checkbox" 
          checked={checked} 
          onChange={onChange} 
          disabled={disabled}
          className="sr-only peer" 
        />
        
        {/* Track (Fondo) */}
        <div className="
          w-11 h-6 
          bg-slate-300 
          peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500/30 
          rounded-full 
          peer 
          peer-checked:after:translate-x-full peer-checked:after:border-white 
          after:content-[''] 
          after:absolute after:top-[2px] after:left-[2px] 
          after:bg-white after:border-gray-300 after:border after:rounded-full 
          after:h-5 after:w-5 after:transition-all after:shadow-sm
          peer-checked:bg-blue-700
          transition-colors duration-200 ease-in-out
        "></div>
      </label>

      {/* Textos */}
      <div className="flex flex-col cursor-pointer" onClick={() => !disabled && onChange({ target: { checked: !checked } })}>
        {label && (
          <span className="text-sm font-bold text-slate-700 select-none">
            {label}
          </span>
        )}
        {description && (
          <span className="text-xs text-slate-500 mt-0.5 leading-snug max-w-xs">
            {description}
          </span>
        )}
      </div>
    </div>
  );
};