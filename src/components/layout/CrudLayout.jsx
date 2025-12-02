import React from 'react';

export const CrudLayout = ({ children, title, icon: Icon, description }) => (
  <div className="min-h-screen bg-slate-50">
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Corporativo */}
      <div className="bg-white border-b border-slate-200 mb-3 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4 p-5">
          {/* Icono con sombra corporativa */}
          <div className="w-12 h-12 bg-blue-700 rounded-lg shadow-lg shadow-blue-900/20 flex items-center justify-center flex-shrink-0">
            <Icon size={24} className="text-white" />
          </div>
          
          <div className="text-left">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
              {title}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="h-px w-8 bg-slate-300 hidden sm:block"></span>
            </div>
            {/* Soporte opcional para descripción si se pasa como prop (usado en BusquedaVoucher) */}
            {description && (
               <p className="mt-2 text-slate-400 text-sm max-w-2xl">{description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="fade-in-up">
        {children}
      </div>
    </div>
  </div>
);