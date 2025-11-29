import React, { useState } from "react";
import { Filter, RefreshCw, Scan } from "lucide-react";
// Asumo la ruta a QRScanner y otros componentes basados en el contexto de un proyecto React.
import QRScanner from "./QRScanner"; 
import { SearchBar } from "../controls/SearchBar";

export const AdvancedFilters = ({ filters, onFiltersChange, filterOptions, loading }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  // Estado para controlar la visibilidad del escáner QR
  const [showScanner, setShowScanner] = useState(false); 

  const updateFilter = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  // Nueva función para manejar el resultado del escaneo
  const handleScanResult = (code) => {
    // Cuando el QRScanner detecta un código, actualizamos el filtro 'search'
    updateFilter('search', code);
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const activeFiltersCount = Object.keys(filters).filter(
    key => filters[key] && filters[key] !== ""
  ).length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6">
      {/* Header Filtros */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wide">
          <Filter className="w-4 h-4 text-blue-600" />
          Filtros Avanzados
          {activeFiltersCount > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-bold text-blue-700 hover:text-blue-900 hover:underline transition-colors"
        >
          {isExpanded ? 'Contraer opciones' : 'Mostrar más filtros'}
        </button>
      </div>

      {/* Grid de Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        
        {/* Búsqueda general con Escáner QR integrado */}
        <div className="col-span-1 md:col-span-2 xl:col-span-1">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
            Búsqueda General (ID, Descripción o QR)
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <SearchBar
                value={filters.search || ""}
                onChange={(value) => updateFilter('search', value)}
                placeholder="Buscar por ID, descripción..."
              />
            </div>
            <button
                onClick={() => setShowScanner(true)}
                className={`p-2 rounded-md transition-colors shadow-sm w-10 h-10 flex items-center justify-center 
                  ${loading
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                  }`}
                title="Escanear código QR"
                disabled={loading}
            >
              <Scan size={18} />
            </button>
          </div>
        </div>

        {/* Área responsable */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
            Sección / Área
          </label>
          <select
            value={filters.area ?? ""}
            onChange={(e) => updateFilter("area", e.target.value)}
            className="w-full p-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            disabled={loading}
          >
            <option value="">Todas las secciones</option>
            {filterOptions?.areas?.map((area) => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>

        {/* Serie documental */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
            Serie Documental
          </label>
          <select
            value={filters.serie || ""}
            onChange={(e) => updateFilter('serie', e.target.value)}
            className="w-full p-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            disabled={loading}
          >
            <option value="">Todas las series</option>
            {filterOptions?.series_documentales?.map(serie => (
              <option key={serie} value={serie}>{serie}</option>
            ))}
          </select>
        </div>

        {/* Año */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
            Año
          </label>
          <select
            value={filters.anio || ""}
            onChange={(e) => updateFilter('anio', e.target.value)}
            className="w-full p-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            disabled={loading}
          >
            <option value="">Todos</option>
            {filterOptions?.years?.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div> 	

        {isExpanded && (
        <> 		
          {/* Frecuencia de consulta */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Frecuencia Consulta
            </label>
            <select
              value={filters.frecuencia || ""}
              onChange={(e) => updateFilter('frecuencia', e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              disabled={loading}
            >
              <option value="">Todas</option>
              {filterOptions?.frecuencias_consulta?.map(frecuencia => (
                <option key={frecuencia} value={frecuencia}>{frecuencia}</option>
              ))}
            </select>
          </div>

          {/* Número de caja */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              N° Caja
            </label>
            <input
              type="number"
              value={filters.numeroCaja || ""}
              onChange={(e) => updateFilter('numeroCaja', e.target.value)}
              placeholder="Ej: 10"
              className="w-full p-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              disabled={loading}
            />
          </div>

          {/* NUEVO: Número de Tomo */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              N° Tomo
            </label>
            <input
              type="text" 
              value={filters.numeroTomo || ""}
              onChange={(e) => updateFilter('numeroTomo', e.target.value)}
              placeholder="Ej: 1A"
              className="w-full p-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              disabled={loading}
            />
          </div>

          {/* NUEVO: Número de Folios */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              N° Folios
            </label>
            <input
              type="number"
              value={filters.numeroFolios || ""}
              onChange={(e) => updateFilter('numeroFolios', e.target.value)}
              placeholder="Ej: 200"
              className="w-full p-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              disabled={loading}
            />
          </div>

          {/* Tomo Faltante */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Tomo Faltante
            </label>
            <select
              value={filters.tomoFaltante || ""}
              onChange={(e) => updateFilter('tomoFaltante', e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              disabled={loading}
            >
              <option value="">Todos</option>
              {filterOptions?.tomo_faltante?.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Tipo Unidad Conservación */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Tipo Unidad
            </label>
            <select
              value={filters.tipoUnidadConservacion || ""}
              onChange={(e) => updateFilter('tipoUnidadConservacion', e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              disabled={loading}
            >
              <option value="">Todos</option>
              {filterOptions?.tipo_unidad_conservacion?.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </div>

          {/* Ambiente */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Ambiente
            </label>
            <select
              value={filters.ambiente || ""}
              onChange={(e) => updateFilter('ambiente', e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              disabled={loading}
            >
              <option value="">Todos</option>
              {filterOptions?.ambientes?.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div> 

          {/* Soporte */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Soporte
            </label>
            <select
              value={filters.soporte || ""}
              onChange={(e) => updateFilter('soporte', e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              disabled={loading}
            >
              <option value="">Todos</option>
              {filterOptions?.soporte?.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Ubicación Física (Estante, Cuerpo, Balda) */}
          <div className="col-span-1 md:col-span-2 xl:col-span-1 grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Est.</label>
                <select value={filters.estante || ""} onChange={(e) => updateFilter('estante', e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                  <option value="">-</option>{filterOptions?.estante?.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Cpo.</label>
                <select value={filters.cuerpo || ""} onChange={(e) => updateFilter('cuerpo', e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                  <option value="">-</option>{filterOptions?.cuerpo?.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Bal.</label>
                <select value={filters.balda || ""} onChange={(e) => updateFilter('balda', e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                  <option value="">-</option>{filterOptions?.balda?.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
          </div>

          {/* Contratista */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Contratista
            </label>
            <select
              value={filters.contratista || ""}
              onChange={(e) => updateFilter('contratista', e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              disabled={loading}
            >
              <option value="">Todos</option>
              {filterOptions?.contratistas?.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Número Entregable */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              N° Entregable
            </label>
            <input
              type="number"
              value={filters.numeroEntregable || ""}
              onChange={(e) => updateFilter('numeroEntregable', e.target.value)}
              placeholder="Ej: 1"
              className="w-full p-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              disabled={loading}
            />
          </div> 

          {/* Analista */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Analista
            </label>
            <select
              value={filters.analista || ""}
              onChange={(e) => updateFilter('analista', e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              disabled={loading}
            >
              <option value="">Todos</option>
              {filterOptions?.analistas?.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </>
      )}
      </div>

      {/* Botones de acción Filtros */}
      <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
        <button
          onClick={clearFilters}
          disabled={activeFiltersCount === 0 || loading}
          className="px-4 py-2 text-sm bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-800 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Limpiar Filtros
        </button>
      </div>

      {/* Componente QR Scanner */}
      <QRScanner 
        isOpen={showScanner} 
        onClose={() => setShowScanner(false)} 
        onScan={handleScanResult} 
      />
    </div>
  );
};