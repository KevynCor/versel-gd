import React from 'react';

export default function CheckboxList({ items = [], isChecked, isDisabled, onToggle, render }) {
  return (
    <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50/50 shadow-inner custom-scrollbar">
      {items.length === 0 ? (
        <div className="text-center py-4 text-xs text-slate-400 italic">
          No hay elementos disponibles
        </div>
      ) : (
        items.map(it => (
          <label 
            key={it.id} 
            className={`
              flex items-center gap-3 p-2 mb-1 rounded-md cursor-pointer transition-all duration-200
              ${isDisabled?.(it) 
                ? "opacity-60 cursor-not-allowed" 
                : "hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200"
              }
            `}
          >
            <input
              type="checkbox"
              checked={isChecked(it)}
              disabled={isDisabled?.(it)}
              onChange={() => onToggle(it)}
              className="
                w-4 h-4 rounded 
                border-slate-300 text-blue-600 
                focus:ring-blue-500 focus:ring-offset-0 focus:ring-2
                cursor-pointer disabled:cursor-not-allowed
              "
            />
            <span className={`text-sm font-medium select-none ${isDisabled?.(it) ? "line-through text-slate-400" : "text-slate-700"}`}>
              {render(it)}
            </span>
          </label>
        ))
      )}
    </div>
  );
}