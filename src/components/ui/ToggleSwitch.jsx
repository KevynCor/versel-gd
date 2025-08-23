import React from "react";

export const ToggleSwitch = ({ checked, onChange, label, description }) => {
  return (
    <div className="flex items-center gap-4">
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
        <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:bg-blue-600 transition-all duration-200"></div>
        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-md peer-checked:translate-x-5 transition-transform duration-200"></div>
      </label>
      <div className="flex flex-col">
        {label && <span className="text-sm font-medium text-gray-900">{label}</span>}
        {description && <span className="text-xs text-gray-500">{description}</span>}
      </div>
    </div>
  );
};
