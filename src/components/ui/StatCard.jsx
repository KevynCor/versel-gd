import React from 'react';

export const StatCard = ({ title, value, icon: Icon, color = "blue" }) => {
  // Mapeo de colores para mantener consistencia
  const colorClasses = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    red: "bg-red-50 text-red-700 border-red-100",
    yellow: "bg-amber-50 text-amber-700 border-amber-100",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-100"
  };

  const activeColor = colorClasses[color] || colorClasses.blue;

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wide mb-1">{title}</p>
          <p className="text-2xl font-extrabold text-slate-800">{value}</p>
        </div>
        
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center border transition-colors ${activeColor}`}>
          <Icon size={24} />
        </div>
      </div>
      
      {/* Indicador decorativo inferior */}
      <div className="mt-4 w-full h-1 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full opacity-80 ${activeColor.split(' ')[1].replace('text', 'bg')}`} style={{ width: '60%' }}></div>
      </div>
    </div>
  );
};