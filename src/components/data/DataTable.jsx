import React, { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, ArrowUpDown, Eye, Edit, Trash2, FileText, AlertTriangle } from "lucide-react";

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
    const sorted = [...data].sort((a, b) => {
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];

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
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig?.key !== columnKey) {
      return <ArrowUpDown size={16} className="text-muted-foreground" />;
    }
    return sortConfig?.direction === 'asc' 
      ? <ChevronUp size={16} className="text-primary" />
      : <ChevronDown size={16} className="text-primary" />;
  };

  // Función para verificar si hay tomo faltante - MODIFICADA para buscar "TRUE"
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
      <div className="bg-card border border-border rounded-lg p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted-foreground">Cargando datos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              {columns.map((col) => (
                <th 
                  key={col.key}
                  className={`
                    text-left p-2 font-medium text-foreground
                    ${col.sortable !== false ? 'cursor-pointer hover:text-primary transition-colors' : ''}
                    ${col.className || ''}
                  `}
                >
                  {col.sortable !== false ? (
                    <button
                      onClick={() => handleSort(col.key)}
                      className="flex items-center space-x-2 w-full text-left hover:text-primary"
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
                <th className="w-32 p-4 font-medium text-foreground text-center">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, i) => (
              <tr 
                key={i} 
                className={`
                  border-b border-border transition-colors
                  ${hasMissingTomo(row) 
                    ? 'bg-red-50/80 hover:bg-red-100 border-l-4 border-l-red-400' 
                    : 'hover:bg-muted/50'
                  }
                `}
              >
                {columns.map((col) => (
                  <td key={col.key} className="p-2">
                    <div className="flex items-center gap-2">
                      {/* Icono de advertencia para tomo faltante */}
                      {hasMissingTomo(row) && (
                        <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        {col.render ? col.render(row) : (
                          <span className={`
                            ${hasMissingTomo(row) 
                              ? 'text-red-700 font-semibold' 
                              : 'text-foreground'
                            }
                          `}>
                            {row[col.key]}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                ))}
                {renderActions && (
                  <td className="p-4">
                    <div className="flex items-center justify-center space-x-1">
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
      <div className="lg:hidden space-y-4 p-4">
        {sortedData.map((row, i) => (
          <div 
            key={i} 
            className={`
              border rounded-lg p-4 space-y-3 transition-colors
              ${hasMissingTomo(row) 
                ? 'bg-red-50/80 border-red-200 border-l-4 border-l-red-400' 
                : 'border-border hover:bg-muted/50'
              }
            `}
          >
            {/* Indicador de tomo faltante en mobile */}
            {hasMissingTomo(row) && (
              <div className="flex items-center gap-2 bg-red-100/50 px-3 py-2 rounded-lg -mx-2 -mt-1">
                <AlertTriangle size={16} className="text-red-500" />
                <span className="text-red-700 text-sm font-medium">Tomo Faltante</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3">
              {columns.slice(0, 3).map((col) => (
                <div key={col.key}>
                  <p className="text-sm text-muted-foreground font-medium">{col.label}</p>
                  <div className={`
                    mt-1 flex items-center gap-2
                    ${hasMissingTomo(row) ? 'text-red-700 font-semibold' : 'text-foreground'}
                  `}>
                    {hasMissingTomo(row) && (
                      <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
                    )}
                    {col.render ? col.render(row) : row[col.key]}
                  </div>
                </div>
              ))}
              
              {/* Columnas restantes en grupos de 2 */}
              {columns.slice(3).reduce((acc, col, index) => {
                if (index % 2 === 0) {
                  acc.push([col]);
                } else {
                  acc[acc.length - 1].push(col);
                }
                return acc;
              }, []).map((colGroup, groupIndex) => (
                <div key={groupIndex} className="grid grid-cols-2 gap-4">
                  {colGroup.map((col) => (
                    <div key={col.key}>
                      <p className="text-sm text-muted-foreground font-medium">{col.label}</p>
                      <div className={`
                        mt-1 flex items-center gap-2
                        ${hasMissingTomo(row) ? 'text-red-700 font-semibold' : 'text-foreground'}
                      `}>
                        {hasMissingTomo(row) && (
                          <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
                        )}
                        {col.render ? col.render(row) : row[col.key]}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {renderActions && (
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-border">
                {renderActions(row)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {sortedData.length === 0 && !loading && (
        <div className="p-12 text-center">
          <EmptyIcon size={48} className="text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No hay datos disponibles</h3>
          <p className="text-muted-foreground">
            {emptyMessage}
          </p>
        </div>
      )}
    </div>
  );
};

// Componente de botón para acciones
export const TableActionButton = ({ 
  variant = "ghost", 
  size = "icon", 
  onClick, 
  title, 
  children,
  className = "",
  ...props 
}) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background";
  
  const variantClasses = {
    ghost: "hover:bg-accent hover:text-accent-foreground",
    destructive: "text-destructive hover:bg-destructive hover:text-destructive-foreground"
  };

  const sizeClasses = {
    icon: "h-10 w-10",
    sm: "h-9 px-3"
  };

  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      onClick={onClick}
      title={title}
      {...props}
    >
      {children}
    </button>
  );
};