// components/data/Pagination.jsx
import React from "react";

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
    <div className="flex flex-col sm:flex-row items-center gap-3 text-sm">
      {/* Texto de info */}
      <div className="text-slate-600">
        Mostrando {page * pageSize + 1} - {Math.min((page + 1) * pageSize, total)} de {total}
      </div>

      {/* Botones de paginación */}
      <div className="flex gap-1">
        <button
          disabled={page === 0}
          onClick={() => handlePageChange(page - 1)}
          className="px-2 py-1 bg-slate-100 rounded disabled:bg-slate-50 disabled:text-slate-400 text-slate-700 hover:bg-slate-200 transition"
        >
          «
        </button>

        {pages.map((i, idx) => {
          const prev = pages[idx - 1];
          if (prev !== undefined && i - prev > 1) {
            return <span key={`dots-${i}`} className="px-2 text-slate-400">…</span>;
          }
          return (
            <button
              key={i}
              onClick={() => handlePageChange(i)}
              className={`w-8 h-8 rounded transition ${
                i === page
                  ? "bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-sm scale-105"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              {i + 1}
            </button>
          );
        })}

        <button
          disabled={(page + 1) * pageSize >= total}
          onClick={() => handlePageChange(page + 1)}
          className="px-2 py-1 bg-slate-100 rounded disabled:bg-slate-50 disabled:text-slate-400 text-slate-700 hover:bg-slate-200 transition"
        >
          »
        </button>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-600 whitespace-nowrap">Mostrar:</span>
        <select
          value={pageSize}
          onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
        >
          {[5, 10, 25, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
