import React from "react";

export const SimpleBarChart = ({ data }) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.value));

  return (
    <div className="h-40 w-full flex items-end justify-between gap-1 pt-6 px-2">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center w-full group relative">
          {/* Tooltip */}
          <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] py-1 px-2 rounded pointer-events-none z-10 whitespace-nowrap">
            {d.value} Unidades
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
          </div>
          
          {/* Barra */}
          <div className="w-full flex items-end justify-center h-32 bg-slate-50 rounded-t-sm overflow-hidden relative">
             <div 
               className="w-4/5 bg-blue-500 hover:bg-blue-600 rounded-t-sm transition-all duration-500 ease-out relative group-hover:shadow-lg"
               style={{ height: `${max > 0 ? (d.value / max) * 100 : 0}%` }}
             ></div>
          </div>
          
          {/* Etiqueta Eje X */}
          <span className="text-[10px] text-slate-500 mt-2 font-medium truncate w-full text-center border-t border-slate-200 pt-1">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
};