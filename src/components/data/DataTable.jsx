import React, { useState, useMemo } from "react";

export const DataTable = ({ columns, data, renderActions }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;
    const sorted = [...data].sort((a, b) => {
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];

      // Manejar nulos y strings
      if (valA == null) return 1;
      if (valB == null) return -1;

      if (typeof valA === "number" && typeof valB === "number") {
        return sortConfig.direction === "asc" ? valA - valB : valB - valA;
      }

      return sortConfig.direction === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
    return sorted;
  }, [data, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        // alternar asc <-> desc
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b text-xs uppercase text-slate-600">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-2 text-left cursor-pointer select-none ${col.className || ""}`}
                  onClick={() => handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {sortConfig.key === col.key && (
                      <span>
                        {sortConfig.direction === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {renderActions && <th className="px-3 py-2">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedData.map((row, i) => (
              <tr key={i} className="hover:bg-indigo-50 transition">
                {columns.map((col) => (
                  <td key={col.key} className="px-3 py-2">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
                {renderActions && (
                  <td className="px-3 py-2">{renderActions(row)}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
