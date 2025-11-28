import React from "react";

export const FrequencyBar = ({ label, count, total, colorClass, bgClass }) => {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  
  return (
    <div className="mb-4 last:mb-0 group">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="font-bold text-slate-700 flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${colorClass.replace('bg-', 'bg-')}`}></span>
          {label}
        </span>
        <span className="text-slate-600 font-medium">
          {count?.toLocaleString()} <span className="text-slate-400 text-[10px]">({percentage}%)</span>
        </span>
      </div>
      <div className={`w-full ${bgClass} rounded-full h-2.5 overflow-hidden`}>
        <div 
          className={`h-full rounded-full ${colorClass} transition-all duration-1000 ease-out relative overflow-hidden`} 
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
        </div>
      </div>
    </div>
  );
};