import React from "react";

export const SelectInput = ({ label, icon: Icon, value, onChange, options = [], placeholder = "Seleccione..." }) => {
  return (
    <div className="flex flex-col">
      {label && (
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
          {Icon && <Icon className="w-4 h-4" />}
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        className="border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
      >
        <option value="">{placeholder}</option>
        {options.map((opt, idx) => (
          <option key={idx} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
};
