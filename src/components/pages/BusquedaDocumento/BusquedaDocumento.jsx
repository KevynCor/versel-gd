import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { supabase } from "../../../utils/supabaseClient";
import * as XLSX from "xlsx";
import { Toast } from "../../ui/Toast";
import { SearchBar } from "../../controls/SearchBar";
import { Pagination } from "../../data/Pagination";
import { CrudLayout } from "../../layout/CrudLayout";
import { SparkleLoader } from "../../ui/SparkleLoader";
import { EmptyState } from "../../ui/EmptyState";
import ModalDetalleDocumento from "../../form/ModalDetalle";
import { Search, Eye, Filter, Download, Box, Globe, Building2, FileText, Calendar, MapPin, ChevronDown, AlertCircle } from "lucide-react";

const ToggleSwitch = ({ checked, onChange, label, description }) => (
  <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 transition-all duration-300 hover:shadow-sm">
    <div className="flex-shrink-0">
      <div className="relative inline-flex items-center cursor-pointer" onClick={onChange}>
        <input type="checkbox" checked={checked} readOnly className="sr-only" />
        <div className={`w-14 h-7 rounded-full transition-all duration-300 ease-in-out ${checked ? "bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-200" : "bg-gray-300 hover:bg-gray-400"}`} />
        <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${checked ? "translate-x-7" : "translate-x-0"}`} />
      </div>
    </div>
    <div className="flex-1">
      <div className="flex items-center gap-2">
        {checked ? <Globe className="w-4 h-4 text-blue-600" /> : <Building2 className="w-4 h-4 text-gray-600" />}
        <span className="font-semibold text-gray-800">{label}</span>
      </div>
      <p className="text-sm text-gray-600 mt-0.5">{description}</p>
    </div>
  </div>
);

const SelectInput = ({ value, onChange, options, placeholder, label, icon: Icon, disabled = false }) => (
  <div className="space-y-2">
    {label && (
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </label>
    )}
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full px-4 py-3 text-sm rounded-xl border-2 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 appearance-none ${
          disabled ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed" : "border-gray-200 hover:border-gray-300 bg-white"
        }`}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  </div>
);

const DocumentTable = ({ 
  columns, 
  data, 
  renderActions, 
  searchAll,
  isLoading,
  totalItems,
  currentPage,
  pageSize 
}) => {
  if (isLoading) return <div className="p-6"><SparkleLoader /></div>;
  if (!data.length) return (
    <div className="p-6">
      <EmptyState
        title="Sin resultados"
        message={searchAll ? "No se encontraron documentos con los filtros aplicados en todo el inventario." : "No se encontraron documentos con los filtros aplicados en esta sección."}
      />
    </div>
  );

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <FileText className="w-4 h-4" />
          <span>Mostrando {Math.min(currentPage * pageSize + 1, totalItems)} - {Math.min((currentPage + 1) * pageSize, totalItems)} de {totalItems} documentos</span>
        </div>
        {searchAll && (
          <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
            <Globe className="w-3 h-3" /> Búsqueda global
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={`px-3 py-2 text-left font-semibold text-gray-700 uppercase tracking-wide border-b border-gray-200 ${c.key === "descripcion" ? "w-auto" : "w-24 sm:w-32"}`}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((doc, index) => (
              <tr key={doc.id} className={`transition-colors duration-200 hover:bg-blue-200 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"} ${doc.Tomo_Faltante ? "bg-red-50 hover:bg-red-100 border-l-4 border-l-red-500" : ""}`}>
                <td className="px-3 py-2 text-center">{renderActions(doc)}</td>
                {columns.slice(1).map((col) => (
                  <td key={col.key} className={`px-3 py-2 ${col.key === "descripcion" ? "w-auto" : "w-24 sm:w-32 text-center"} ${doc.Tomo_Faltante && col.key === "volumen" ? "text-red-700 font-semibold" : ""}`}>
                    {col.render ? col.render(doc) : doc[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

const FilterSection = ({ 
  filters, 
  setFilters, 
  fetchDocuments, 
  searchAll, 
  currentSeries, 
  currentAnios, 
  pageSize,
  exportToExcel 
}) => (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
    <div className="mb-6">
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
        <Search className="w-4 h-4" /> Búsqueda de texto
      </label>
      <SearchBar
        className="w-full"
        value={filters.search}
        onChange={(s) => {
          const f = { ...filters, search: s };
          setFilters(f);
          fetchDocuments(0, pageSize, true, f);
        }}
        onEnter={() => fetchDocuments(0, pageSize, true, filters)}
        placeholder={searchAll ? "Buscar en descripción, observaciones, unidad o serie..." : "Buscar por descripción u observaciones..."}
      />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
      <SelectInput
        label="Serie Documental"
        icon={FileText}
        value={filters.serie}
        onChange={(e) => {
          const f = { ...filters, serie: e.target.value };
          setFilters(f);
          fetchDocuments(0, pageSize, true, f);
        }}
        options={currentSeries}
        placeholder="Todas las series"
      />
      <SelectInput
        label="Año"
        icon={Calendar}
        value={filters.anio}
        onChange={(e) => {
          const f = { ...filters, anio: e.target.value };
          setFilters(f);
          fetchDocuments(0, pageSize, true, f);
        }}
        options={currentAnios}
        placeholder="Todos los años"
      />
      <div className="flex gap-3">
        <button
          onClick={() => {
            const baseFilters = searchAll ? { unidad: "", serie: "", anio: "", search: "" } : { unidad: filters.unidad, serie: "", anio: "", search: "" };
            setFilters(baseFilters);
            fetchDocuments(0, pageSize, true, baseFilters);
          }}
          className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200"
        >
          <Filter size={16} /> Limpiar
        </button>
        <button
          onClick={exportToExcel}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 shadow-lg"
        >
          <Download size={16} /> Exportar
        </button>
      </div>
    </div>
  </div>
);

export default function BusquedaDocumento() {
  const [searchAll, setSearchAll] = useState(false);
  const tableContainerRef = useRef(null);
  const [filters, setFilters] = useState({ unidad: "", serie: "", anio: "", search: "" });
  const [data, setData] = useState({ documentos: [], unidades: [], series: [], anios: [], allSeries: [], allAnios: [] });
  const [state, setState] = useState({ loading: false, mensaje: null, selectedDoc: null, page: 0, total: 0 });
  const [pageSize, setPageSize] = useState(10);

  const showMessage = (mensaje, tipo) => setState((s) => ({ ...s, mensaje: { mensaje, tipo } }));

  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        const { data: catalogs, error } = await supabase.rpc("get_busqueda_documentos", { p_operation: "catalogs" });
        if (error) throw error;

        const unidades = catalogs.filter(c => c.catalog_type === "unidades").map(c => c.catalog_value);
        const allSeries = catalogs.filter(c => ["all_series", "series"].includes(c.catalog_type)).map(c => c.catalog_value);
        const allAnios = catalogs
          .filter(c => ["all_years", "years"].includes(c.catalog_type))
          .map(c => parseInt(c.catalog_value))
          .sort((a, b) => b - a);

        setData(prevData => ({ ...prevData, unidades, allSeries, allAnios }));
      } catch (err) {
        console.error("Error al cargar catálogos:", err);
        showMessage("Error al cargar catálogos.", "error");
      }
    };
    fetchCatalogs();
  }, []);

  const cargarFiltros = useCallback(async (unidad) => {
    if (!unidad) return setData(prevData => ({ ...prevData, series: [], anios: [] }));
    
    try {
      const { data: catalogs, error } = await supabase.rpc("get_busqueda_documentos", { p_operation: "catalogs", p_unidad_organica: unidad });
      if (error) throw error;

      const series = catalogs.filter(c => c.catalog_type === "series").map(c => c.catalog_value);
      const anios = catalogs
        .filter(c => c.catalog_type === "years")
        .map(c => parseInt(c.catalog_value))
        .sort((a, b) => b - a);

      setData(prevData => ({ ...prevData, series, anios }));
    } catch (err) {
      console.error("Error al cargar series o años:", err);
      setData(prevData => ({ ...prevData, series: [], anios: [] }));
      showMessage("Error al cargar series o años.", "error");
    }
  }, []);

  const fetchDocuments = useCallback(
    async (page = 0, size = pageSize, showToast = false, overrideFilters = null, overrideSearchAll = null) => {
      const f = overrideFilters || filters;
      const isSearchAll = overrideSearchAll !== null ? overrideSearchAll : searchAll;
      const scrollPosition = tableContainerRef.current?.scrollTop || 0;

      setData(prevData => ({ ...prevData, documentos: [] }));
      setState(prevState => ({ ...prevState, loading: true }));

      try {
        const { data: docs, error } = await supabase.rpc("get_busqueda_documentos", {
          p_operation: "search",
          p_unidad_organica: f.unidad || null,
          p_serie_documental: f.serie || null,
          p_anio: f.anio ? parseInt(f.anio) : null,
          p_search_text: f.search || null,
          p_search_all: isSearchAll,
          p_page: page,
          p_page_size: size
        });

        if (error) throw error;
        const total = docs?.[0]?.total_records || 0;
        setData(prevData => ({ ...prevData, documentos: docs || [] }));
        setState(prevState => ({ ...prevState, page, total, loading: false }));

        if (tableContainerRef.current) tableContainerRef.current.scrollTop = scrollPosition;
        if (showToast) showMessage(total ? `Se encontraron ${total} documento${total !== 1 ? "s" : ""}` : "No se encontraron documentos", total ? "success" : "info");
      } catch (err) {
        console.error("Error al buscar documentos:", err);
        showMessage("Error de conexión o formato de datos.", "error");
        setState(prevState => ({ ...prevState, loading: false, total: 0 }));
      }
    },
    [filters, pageSize, searchAll]
  );

  useEffect(() => {
    fetchDocuments(0, pageSize);
  }, [pageSize, fetchDocuments]);

  const exportToExcel = async () => {
    if (!searchAll && !filters.unidad) return showMessage("Selecciona una unidad o habilita búsqueda global para exportar", "warning");

    setState(prevState => ({ ...prevState, loading: true }));
    try {
      let query = supabase.from("Inventario_documental").select("*");
      if (!searchAll && filters.unidad) query = query.eq("Unidad_Organica", filters.unidad);
      if (filters.serie) query = query.eq("Serie_Documental", filters.serie);
      if (filters.anio) query = query.or(
        `and(Fecha_Inicial.gte.${filters.anio}-01-01,Fecha_Inicial.lte.${filters.anio}-12-31),and(Fecha_Final.gte.${filters.anio}-01-01,Fecha_Final.lte.${filters.anio}-12-31)`
      );
      if (filters.search.trim()) query = query.or(
        `Descripcion.ilike.%${filters.search}%,Observaciones.ilike.%${filters.search}%,Unidad_Organica.ilike.%${filters.search}%,Serie_Documental.ilike.%${filters.search}%`
      );

      const { data, error } = await query;
      if (error) throw error;
      if (!data.length) return showMessage("No hay datos para exportar.", "warning");

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Documentos");
      const fileName = `documentos_${searchAll ? "completo" : filters.unidad}_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      showMessage(`Exportados ${data.length} registros exitosamente`, "success");
    } catch (err) {
      console.error("Error al exportar:", err);
      showMessage(`Error al exportar: ${err.message || "Error desconocido"}`, "error");
    } finally {
      setState(prevState => ({ ...prevState, loading: false }));
    }
  };

  const handleToggleSearchAll = () => {
    const newSearchAll = !searchAll;
    setSearchAll(newSearchAll);

    if (newSearchAll) {
      const newFilters = { unidad: "", serie: "", anio: "", search: filters.search };
      setFilters(newFilters);
      setState(prevState => ({ ...prevState, page: 0 }));
      fetchDocuments(0, pageSize, true, newFilters, true);
    } else {
      const resetFilters = { unidad: "", serie: "", anio: "", search: "" };
      setFilters(resetFilters);
      setData(prevData => ({ ...prevData, documentos: [], series: [], anios: [] }));
      setState(prevState => ({ ...prevState, page: 0, total: 0 }));
    }
  };

  const handleUnidadChange = async (e) => {
    const unidad = e.target.value;
    const newFilters = { ...filters, unidad, serie: "", anio: "" };
    setFilters(newFilters);
    setState(prevState => ({ ...prevState, page: 0 }));

    if (unidad) {
      await cargarFiltros(unidad);
      fetchDocuments(0, pageSize, true, newFilters);
    } else {
      setData(prevData => ({ ...prevData, series: [], anios: [], documentos: [] }));
      setState(prevState => ({ ...prevState, total: 0 }));
    }
  };

  const columns = useMemo(() => [
    { label: "Ver", key: "actions", width: "w-16" },
    ...(searchAll ? [
      {
        label: "Unidad",
        key: "unidad",
        render: (d) => (
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-gray-800">{d.Unidad_Organica || "—"}</span>
          </div>
        ),
        width: "w-48"
      }
    ] : []),
    {
      label: "Descripción",
      key: "descripcion",
      render: (d) => (
        <div className="max-w-full relative group">
          <div className="flex items-start gap-2">
            <p className="font-medium text-gray-900 flex-1">{d.Descripcion}</p>
            {d.Tomo_Faltante && (
              <div className="flex items-center gap-1 bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                <AlertCircle className="w-3 h-3" />
                Unidad Faltante
              </div>
            )}
          </div>
          <div className="absolute left-0 bottom-full mb-2 w-max max-w-xs hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 shadow-lg z-50">
            <strong>OBSERVACIÓNES:</strong> {d.Observaciones || "—"}
          </div>
          <p className="text-xs text-gray-500 mt-1 line-clamp-1">({d.Tipo_Unidad_Conservacion})</p>
        </div>
      ),
      width: "w-80"
    },
    {
      label: "Fechas Extremas",
      key: "fechas",
      render: (d) => (
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-gray-500" />
          <div>
            <div>{d.Fecha_Inicial ? new Date(d.Fecha_Inicial).toLocaleDateString() : "—"}</div>
            <div>{d.Fecha_Final ? new Date(d.Fecha_Final).toLocaleDateString() : "—"}</div>
          </div>
        </div>
      ),
      width: "w-32"
    },
    {
      label: "Tomo/Folios",
      key: "tomofolios",
      render: (d) => (
        <div className={`text-sm text-center ${d.Tomo_Faltante ? "text-red-700 font-semibold" : ""}`}>
          <div className="font-medium">Tomo: {d.Numero_Tomo || "—"}</div>
          <div className="text-gray-500">Folios: {d.Numero_Folios || "—"}</div>
        </div>
      ),
      width: "w-24"
    },
    {
      label: "Ubicación",
      key: "ubicacion",
      render: (d) => (
        <div className="text-sm">
          <div className="flex items-center gap-1 mb-1">
            <Box className="w-4 h-4 text-gray-500" />
            <span className="font-medium">Caja: {d.Numero_Caja || "S/N"}</span>
          </div>
          <div className="flex items-center gap-1 mb-1">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="text-gray-500">
              {[d.Ambiente, d.Estante && `E${d.Estante}`, d.Cuerpo && `C${d.Cuerpo}`, d.Balda && `B${d.Balda}`].filter(Boolean).join("-") || "Sin ubicación"}
            </span>
          </div>
        </div>
      ),
      width: "w-32"
    }
  ], [searchAll]);

  const renderActions = (doc) => (
    <button
      onClick={() => setState(prevState => ({ ...prevState, selectedDoc: doc }))}
      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
      aria-label="Ver detalle"
    >
      <Eye size={18} />
    </button>
  );

  const currentSeries = searchAll ? data.allSeries : data.series;
  const currentAnios = searchAll ? data.allAnios : data.anios;

  return (
    <>
      {state.mensaje && <Toast {...state.mensaje} onClose={() => setState(prevState => ({ ...prevState, mensaje: null }))} />}
      <CrudLayout title="Búsqueda de Documentos" icon={Search}>
        <div className="mb-3">
          <ToggleSwitch
            checked={searchAll}
            onChange={handleToggleSearchAll}
            label={searchAll ? "Búsqueda en todo el inventario" : "Búsqueda por sección específica"}
            description={searchAll ? "Buscando en todas las unidades orgánicas del sistema" : "Selecciona una sección documental para buscar"}
          />
        </div>

        {!searchAll && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6 max-w-2xl mx-auto">
            <SelectInput
              label="Sección Documental *"
              icon={Building2}
              value={filters.unidad}
              onChange={handleUnidadChange}
              options={data.unidades}
              placeholder="Seleccionar una Sección Documental"
            />
          </div>
        )}

        {(searchAll || filters.unidad) && (
          <div className="space-y-6">
            <FilterSection
              filters={filters}
              setFilters={setFilters}
              fetchDocuments={fetchDocuments}
              searchAll={searchAll}
              currentSeries={currentSeries}
              currentAnios={currentAnios}
              pageSize={pageSize}
              exportToExcel={exportToExcel}
            />

            <div ref={tableContainerRef} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <DocumentTable
                columns={columns}
                data={data.documentos}
                renderActions={renderActions}
                searchAll={searchAll}
                isLoading={state.loading}
                totalItems={state.total}
                currentPage={state.page}
                pageSize={pageSize}
              />

              {data.documentos.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-4">
                  <Pagination
                    page={state.page}
                    total={state.total}
                    pageSize={pageSize}
                    onPageChange={(newPage) => fetchDocuments(newPage, pageSize)}
                    onPageSizeChange={setPageSize}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </CrudLayout>

      {state.selectedDoc && <ModalDetalleDocumento doc={state.selectedDoc} onClose={() => setState(prevState => ({ ...prevState, selectedDoc: null }))} />}
    </>
  );
}