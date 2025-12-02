import React, { useState } from "react";
import { ChevronLeft, ChevronRight, CornerDownLeft } from "lucide-react"; 

export const Pagination = ({ page, total, pageSize, onPageChange, onPageSizeChange, scrollRef }) => {
  const totalPages = Math.ceil(total / pageSize);
  const [jumpPage, setJumpPage] = useState("");

  // Lógica original conservada: Muestra 2 al inicio, 2 al final y vecinos
  const pages = Array.from({ length: totalPages }, (_, i) => i)
    .filter(i => i < 2 || i >= totalPages - 2 || Math.abs(i - page) <= 1);

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      onPageChange(newPage);
      scrollRef?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      setJumpPage("");
    }
  };

  const handlePageSizeChange = (newSize) => {
    onPageSizeChange(newSize);
    scrollRef?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setJumpPage("");
  };

  const handleJump = (e) => {
    e.preventDefault();
    const pageNum = parseInt(jumpPage) - 1; // Visual (1) a Lógico (0)
    if (!isNaN(pageNum)) {
      handlePageChange(Math.max(0, Math.min(pageNum, totalPages - 1)));
    }
  };

  const startRecord = page * pageSize + 1;
  const endRecord = Math.min((page + 1) * pageSize, total);

  if (total === 0) return null;

  return (
    <div className="flex flex-col lg:flex-row items-center justify-between gap-4 text-sm border-t border-slate-200 pt-4 mt-4 select-none">
      {/* Texto de info */}
      <div className="text-slate-500 font-medium text-center lg:text-left order-2 lg:order-1">
        Mostrando <span className="text-slate-800 font-bold">{startRecord} - {endRecord}</span> de <span className="text-slate-800 font-bold">{total}</span> registros
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 order-1 lg:order-2">
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

        {/* Contenedor de Botones + Ir a Página */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
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

            <div className="flex gap-1 mx-1 hidden sm:flex">
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

            {/* Indicador solo visible en móviles pequeños */}
            <span className="sm:hidden text-xs font-bold text-slate-700 px-2">
                {page + 1} / {totalPages}
            </span>

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

            {/* Input para ir a página específica */}
            <form onSubmit={handleJump} className="flex items-center gap-1 border-l border-slate-200 pl-3 ml-1 h-8">
                <input 
                    type="number" 
                    min="1" 
                    max={totalPages}
                    value={jumpPage}
                    onChange={(e) => setJumpPage(e.target.value)}
                    placeholder="#"
                    className="w-11 h-8 px-1 text-xs font-medium text-center bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none transition-all placeholder:text-slate-400"
                    title="Ir a página..."
                />
                {jumpPage && (
                <button 
                    type="submit" 
                    className="text-slate-400 hover:text-blue-600 p-1 animate-in fade-in zoom-in duration-200"
                    title="Ir"
                >
                    <CornerDownLeft size={14} />
                </button>
                )}
            </form>
        </div>
      </div>
    </div>
  );
};