import React, { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, ArrowUpDown, FileText, AlertTriangle } from "lucide-react";

export const DataTable = ({ 
  columns, 
  data, 
  renderActions,
  loading = false,
  emptyMessage = "No se encontraron datos",
  emptyIcon: EmptyIcon = FileText
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;

    // Buscamos la definición de la columna activa para ver si tiene un sortValue personalizado
    const currentColumn = columns.find(col => col.key === sortConfig.key);

    const sorted = [...data].sort((a, b) => {
      // 1. OBTENCIÓN DEL VALOR
      // Si la columna tiene 'sortValue', usamos esa función. Si no, usamos la key directa.
      let valA, valB;

      if (currentColumn && typeof currentColumn.sortValue === "function") {
        valA = currentColumn.sortValue(a);
        valB = currentColumn.sortValue(b);
      } else {
        valA = a[sortConfig.key];
        valB = b[sortConfig.key];
      }

      // 2. NORMALIZACIÓN (evitar crashes con nulos)
      if (valA === null || valA === undefined) valA = '';
      if (valB === null || valB === undefined) valB = '';

      // 3. COMPARACIÓN NUMÉRICA
      if (typeof valA === "number" && typeof valB === "number") {
        return sortConfig.direction === "asc" ? valA - valB : valB - valA;
      }

      // 4. COMPARACIÓN DE TEXTO (Natural Sort)
      const strA = String(valA).trim();
      const strB = String(valB).trim();

      const comparison = strA.localeCompare(strB, 'es', { 
        numeric: true, 
        sensitivity: 'base' 
      });

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [data, sortConfig, columns]); // Agregamos 'columns' a las dependencias

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig?.key !== columnKey) {
      return <ArrowUpDown size={14} className="text-slate-400 opacity-50 group-hover:opacity-100 transition-opacity" />;
    }
    return sortConfig?.direction === 'asc' 
      ? <ChevronUp size={14} className="text-blue-600 font-bold" />
      : <ChevronDown size={14} className="text-blue-600 font-bold" />;
  };

  const hasMissingTomo = (row) => {
    const tomoFaltante = row.Tomo_Faltante;
    return tomoFaltante && 
           (tomoFaltante.toString().toUpperCase().trim() === 'TRUE' || 
            tomoFaltante.toString().toUpperCase().trim() === 'SI' ||
            tomoFaltante.toString().toUpperCase().trim() === 'SÍ' ||
            tomoFaltante.toString().toUpperCase().trim() === '1');
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-12 shadow-sm">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-blue-700"></div>
          <span className="text-slate-500 font-medium animate-pulse">Cargando registros...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {columns.map((col) => (
                <th 
                  key={col.key}
                  className={`
                    px-4 py-3 font-bold text-slate-700 uppercase tracking-wider text-xs
                    ${col.sortable !== false ? 'cursor-pointer hover:bg-slate-100 transition-colors' : ''}
                    ${col.className || ''}
                  `}
                  style={col.width ? { width: col.width } : {}}
                >
                  {col.sortable !== false ? (
                    <button
                      onClick={() => handleSort(col.key)}
                      className="flex items-center gap-2 w-full text-left group focus:outline-none"
                    >
                      <span>{col.label}</span>
                      {getSortIcon(col.key)}
                    </button>
                  ) : (
                    <span>{col.label}</span>
                  )}
                </th>
              ))}
              {renderActions && (
                <th className="w-32 px-4 py-3 font-bold text-slate-700 uppercase tracking-wider text-xs text-center">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, i) => (
              <tr 
                key={i} 
                className={`transition-colors duration-150 ease-in-out
                  ${hasMissingTomo(row) 
                    ? 'bg-red-50/50 hover:bg-red-50 border-l-4 border-l-red-500' 
                    : 'hover:bg-slate-100 border-l-4 border-l-transparent hover:border-l-blue-500'
                  }
                `}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-slate-600">
                    <div className="flex items-center gap-2">
                      {hasMissingTomo(row) && col.key === columns[0].key && (
                        <AlertTriangle size={16} className="text-red-500 flex-shrink-0 animate-pulse" />
                      )}
                      <div className="flex-1">
                        {col.render ? col.render(row) : (
                          <span className={`
                            ${hasMissingTomo(row) ? 'text-red-700 font-semibold' : 'text-slate-700'}
                          `}>
                            {row[col.key]}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                ))}
                {renderActions && (
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      {renderActions(row)}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4 p-4 bg-slate-50">
        {sortedData.map((row, i) => (
          <div 
            key={i} 
            className={`
              bg-white rounded-lg shadow-sm border transition-all duration-200
              ${hasMissingTomo(row) 
                ? 'border-red-200 shadow-red-100 ring-1 ring-red-100' 
                : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
              }
            `}
          >
            <div className="p-4 space-y-4">
              {hasMissingTomo(row) && (
                <div className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-2 rounded-md border border-red-100 mb-3">
                  <AlertTriangle size={16} />
                  <span className="text-sm font-bold uppercase tracking-wide">Documento Incompleto</span>
                </div>
              )}

              <div className="space-y-4">
                {columns.slice(0, 3).map((col) => (
                  <div key={col.key} className="border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">{col.label}</p>
                    <div className={`text-sm ${hasMissingTomo(row) ? 'text-red-700 font-medium' : 'text-slate-800'}`}>
                      {col.render ? col.render(row) : row[col.key]}
                    </div>
                  </div>
                ))}
                
                <div className="grid grid-cols-2 gap-4 pt-2 bg-slate-50/50 p-3 rounded-lg -mx-2">
                  {columns.slice(3).map((col) => (
                    <div key={col.key}>
                      <p className="text-xs text-slate-400 font-medium mb-1 truncate">{col.label}</p>
                      <div className={`text-sm font-medium ${hasMissingTomo(row) ? 'text-red-600' : 'text-slate-700'}`}>
                         {col.render ? col.render(row) : (row[col.key] || "-")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {renderActions && (
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-2">
                  <span className="text-xs text-slate-400 mr-auto">Acciones disponibles:</span>
                  {renderActions(row)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {sortedData.length === 0 && !loading && (
        <div className="p-16 text-center bg-white">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
            <EmptyIcon size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">No se encontraron datos</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            {emptyMessage}
          </p>
        </div>
      )}
    </div>
  );
};