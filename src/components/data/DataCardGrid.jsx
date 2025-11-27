import React from 'react';

export const DataCardGrid = ({ data, renderCard }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
    {data.map((item, i) => (
      <div 
        key={i} 
        className="
          bg-white rounded-lg border border-slate-200 
          hover:border-blue-400 hover:shadow-md 
          transition-all duration-200 ease-in-out overflow-hidden
        "
      >
        {renderCard(item)}
      </div>
    ))}
  </div>
);