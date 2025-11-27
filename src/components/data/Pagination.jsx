import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react"; // Usaremos iconos para las flechas

export const Pagination = ({ page, total, pageSize, onPageChange, onPageSizeChange, scrollRef }) => {
  const totalPages = Math.ceil(total / pageSize);
  const pages = Array.from({ length: totalPages }, (_, i) => i)
    .filter(i => i < 2 || i >= totalPages - 2 || Math.abs(i - page) <= 1);

  const handlePageChange = (newPage) => {
    onPageChange(newPage);
    // Scroll suave al inicio del contenedor
    scrollRef?.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handlePageSizeChange = (newSize) => {
    onPageSizeChange(newSize);
    scrollRef?.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm border-t border-slate-200 pt-4 mt-4">
      {/* Texto de info */}
      <div className="text-slate-500 font-medium">
        Mostrando <span className="text-slate-800 font-bold">{page * pageSize + 1}</span> - <span className="text-slate-800 font-bold">{Math.min((page + 1) * pageSize, total)}</span> de <span className="text-slate-800 font-bold">{total}</span> registros
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Selector de tamaño */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 whitespace-nowrap">Filas por pág:</span>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="
              px-3 py-1.5 
              bg-white border border-slate-300 rounded-md 
              text-slate-700 text-sm font-medium
              focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 
              cursor-pointer hover:border-slate-400 transition-colors
            "
          >
            {[5, 10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        {/* Botones de paginación */}
        <div className="flex items-center gap-1">
          <button
            disabled={page === 0}
            onClick={() => handlePageChange(page - 1)}
            className="
              p-2 rounded-md border border-slate-300 bg-white 
              text-slate-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200
              disabled:bg-slate-50 disabled:text-slate-300 disabled:border-slate-200 disabled:cursor-not-allowed
              transition-all duration-200
            "
            title="Anterior"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex gap-1 mx-1">
            {pages.map((i, idx) => {
              const prev = pages[idx - 1];
              if (prev !== undefined && i - prev > 1) {
                return <span key={`dots-${i}`} className="px-2 py-1 text-slate-400 select-none">...</span>;
              }
              return (
                <button
                  key={i}
                  onClick={() => handlePageChange(i)}
                  className={`
                    min-w-[32px] h-8 px-2 rounded-md text-sm font-bold transition-all duration-200 border
                    ${i === page
                      ? "bg-blue-700 border-blue-700 text-white shadow-sm" // Activo
                      : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-blue-700 hover:border-blue-300" // Inactivo
                    }
                  `}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          <button
            disabled={(page + 1) * pageSize >= total}
            onClick={() => handlePageChange(page + 1)}
            className="
              p-2 rounded-md border border-slate-300 bg-white 
              text-slate-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200
              disabled:bg-slate-50 disabled:text-slate-300 disabled:border-slate-200 disabled:cursor-not-allowed
              transition-all duration-200
            "
            title="Siguiente"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};