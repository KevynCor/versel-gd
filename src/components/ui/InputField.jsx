import React from "react";

export const InputField = ({ label, icon: Icon, className = "", ...props }) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
          {label}
        </label>
      )}
      <div className="relative rounded-md shadow-sm group">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" aria-hidden="true" />
          </div>
        )}
        <input
          {...props} 
          className={`
            block w-full rounded-lg border border-slate-300 
            py-2.5 px-3 text-sm text-slate-800 placeholder-slate-400
            focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 
            transition-all duration-200
            ${Icon ? 'pl-10' : ''} 
            ${props.disabled 
              ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200' 
              : 'bg-white hover:border-slate-400'
            }
            ${className}
          `}
        />
      </div>
    </div>
  );
};