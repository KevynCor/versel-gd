import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../utils/supabaseClient";
import * as XLSX from "xlsx";

// Componentes
import { Toast } from "../components/ui/Toast";
import { SearchBar } from "../components/controls/SearchBar";
import { Pagination } from "../components/data/Pagination";
import { CrudLayout } from "../components/layout/CrudLayout";
import { SparkleLoader } from "../components/ui/SparkleLoader";
import { EmptyState } from "../components/ui/EmptyState";
import ModalDetalleDocumento from "../components/form/ModalDetalle";

// Iconos
import { Search, Eye, Filter, Download, Box } from "lucide-react";

// ------------------ Select Reutilizable ------------------
const SelectInput = ({ value, onChange, options, placeholder, label }) => (
  <div className="space-y-1">
    {label && <label className="text-xs font-medium text-slate-700">{label}</label>}
    <select value={value} onChange={onChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
      <option value="">{placeholder}</option>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

export default function BusquedaDocumento() {
  const [filters, setFilters] = useState({ unidad: "", serie: "", anio: "", search: "" });
  const [data, setData] = useState({ documentos: [], unidades: [], series: [], anios: [] });
  const [state, setState] = useState({ loading: false, mensaje: null, selectedDoc: null, page: 0, total: 0 });
  const [pageSize, setPageSize] = useState(10);

  const showMessage = (mensaje, tipo) => setState(s => ({ ...s, mensaje: { mensaje, tipo } }));

  // ------------------ Cargar Unidades ------------------
  useEffect(() => {
    (async () => {
      try {
        const { data: rawData, error, status } = await supabase.rpc("get_unidades_organicas");
        if (error) throw { ...error, status };
        const unidades = [...new Set(rawData.map(u => u.unidad_organica?.trim()).filter(Boolean))];
        setData(d => ({ ...d, unidades }));
      } catch (err) {
        console.error(err);
        if (err.status === 404) showMessage("❌ Función 'get_unidades_organicas' no encontrada.", "error");
        else if (err.status === 401 || err.status === 403) showMessage("🔐 Acceso denegado.", "error");
        else showMessage(`❌ Error de conexión.`, "error");
      }
    })();
  }, []);

  // ------------------ Cargar Series y Años ------------------
  const cargarFiltros = useCallback(async (unidad) => {
    if (!unidad) return setData(d => ({ ...d, series: [], anios: [] }));
    try {
      const { data: rawData, error } = await supabase.rpc("get_series_y_anios", { unidad_organica_param: unidad });
      if (error) throw error;
      setData(d => ({
        ...d,
        series: [...new Set(rawData.map(f => f.serie).filter(Boolean))],
        anios: Array.isArray(rawData[0]?.lista_anios) ? rawData[0].lista_anios : []
      }));
    } catch (err) {
      console.error(err);
      setData(d => ({ ...d, series: [], anios: [] }));
      showMessage("❌ Error al cargar series o años.", "error");
    }
  }, []);

  // ------------------ Buscar Documentos ------------------
  const fetchDocuments = useCallback(
    async (page = 0, size = pageSize, showToast = false, overrideFilters = null) => {
      const f = overrideFilters || filters;
      if (!f.unidad) return setState(s => ({ ...s, loading: false, total: 0, page: 0 }));

      setData(d => ({ ...d, documentos: [] }));
      setState(s => ({ ...s, loading: true }));

      try {
        let query = supabase
          .from("Inventario_documental")
          .select("*", { count: "exact" })
          .eq("Unidad_Organica", f.unidad);

        if (f.serie) query = query.eq("Serie_Documental", f.serie);
        if (f.anio) {
          query = query.or(
            `and(Fecha_Inicial.gte.${f.anio}-01-01,Fecha_Inicial.lte.${f.anio}-12-31),` +
            `and(Fecha_Final.gte.${f.anio}-01-01,Fecha_Final.lte.${f.anio}-12-31)`
          );
        }
        if (f.search.trim()) {
          query = query.or(
            `Descripcion.ilike.%${f.search}%,Observaciones.ilike.%${f.search}%`
          );
        }

        const from = page * size;
        const to = from + size - 1;
        const { data: docs, count, error } = await query.range(from, to);
        if (error) throw error;

        setData(d => ({ ...d, documentos: docs || [] }));
        setState(s => ({ ...s, page, total: count || 0, loading: false }));

        if (showToast) {
          showMessage(
            count
              ? `Se encontraron ${count} registros`
              : "No se encontraron documentos",
            count ? "success" : "info"
          );
        }
      } catch (err) {
        console.error(err);
        showMessage("❌ Error de conexión o formato de datos.", "error");
        setState(s => ({ ...s, loading: false, total: 0 }));
      }
    },
    [filters, pageSize]
  );

  useEffect(() => {
    fetchDocuments(0, pageSize);
  }, [pageSize, fetchDocuments]);

  // ------------------ Exportar a Excel ------------------
  const exportToExcel = async () => {
    if (!filters.unidad) return showMessage("⚠️ Selecciona una unidad para exportar", "warning");
    setState(s => ({ ...s, loading: true }));

    try {
      let query = supabase.from("Inventario_documental").select("*").eq("Unidad_Organica", filters.unidad);
      if (filters.serie) query = query.eq("Serie_Documental", filters.serie);
      if (filters.anio) query = query.or(
        `and(Fecha_Inicial.gte.${filters.anio}-01-01,Fecha_Inicial.lte.${filters.anio}-12-31),` +
        `and(Fecha_Final.gte.${filters.anio}-01-01,Fecha_Final.lte.${filters.anio}-12-31)`
      );
      if (filters.search.trim()) query = query.or(`Descripcion.ilike.%${filters.search}%,Observaciones.ilike.%${filters.search}%`);
      const { data, error } = await query;
      if (error) throw error;
      if (!data.length) return showMessage("⚠️ No hay datos para exportar.", "warning");

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Documentos");
      XLSX.writeFile(wb, "documentos.xlsx");
      showMessage(`✅ Exportados ${data.length} registros`, "success");
    } catch (err) {
      console.error(err);
      showMessage(`❌ Error al exportar: ${err.message || "Desconocido"}`, "error");
    } finally {
      setState(s => ({ ...s, loading: false }));
    }
  };

  // ------------------ Renderizado ------------------
  const columns = [
    { label: "Ver", key: "actions" },
    { label: "Descripción", key: "descripcion", render: d => d.Descripcion },
    { label: "Observaciones", key: "observaciones", render: d => d.Observaciones || "—" },
    { label: "Desde", key: "desde", render: d => d.Fecha_Inicial || "—" },
    { label: "Hasta", key: "hasta", render: d => d.Fecha_Final || "—" },
    { label: "Tomo", key: "tomo", render: d => d.Numero_Tomo || "—" },
    { label: "Folios", key: "folios", render: d => d.Numero_Folios || "—" },
    { label: "Caja", key: "caja", render: d => (
        <div className="flex items-center gap-1">
          <Box className="w-4 h-4 text-gray-600" />
          <span>{d.Numero_Caja ? d.Numero_Caja : "Sin caja"}</span>
        </div>
      )
    },
    { label: "Ubicación", key: "ubicacion", render: d => (
        <div className="flex items-center gap-1">          
          <span>
            {[d.Estante && `E${d.Estante}`, d.Cuerpo && `C${d.Cuerpo}`, d.Balda && `B${d.Balda}`]
              .filter(Boolean)
              .join("-") || "—"}
          </span>
        </div>
      )
    }
  ];

  const renderActions = doc => (
    <button onClick={() => setState(s => ({ ...s, selectedDoc: doc }))} className="text-blue-600 hover:text-blue-800 transition" aria-label="Ver detalle">
      <Eye size={16} />
    </button>
  );

  return (
    <>
      {state.mensaje && <Toast {...state.mensaje} onClose={() => setState(s => ({ ...s, mensaje: null }))} />}
      <CrudLayout title="Búsqueda de Documentos" icon={Search}>
        {/* Unidad */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4">
          <div className="max-w-2xl mx-auto">
            <SelectInput
              label="Sección Documental *"
              value={filters.unidad}
              onChange={async e => {
                const unidad = e.target.value;
                const newFilters = { unidad, serie: "", anio: "", search: "" };
                setState(s => ({ ...s, page: 0 }));
                setFilters(newFilters);
                if (unidad) { await cargarFiltros(unidad); fetchDocuments(0, pageSize, true, newFilters); }
                else setData(d => ({ ...d, series: [], anios: [], documentos: [] }));
              }}
              options={data.unidades}
              placeholder="Seleccionar una Sección Documental"
            />
          </div>
        </div>

        {filters.unidad && (
          <div className="space-y-4">       
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
              <div className="col-span-full">
                <SearchBar
                  className="w-full"
                  value={filters.search}
                  onChange={s => {
                    const f = { ...filters, search: s };
                    setFilters(f);
                    setState(st => ({ ...st, page: 0 }));
                    fetchDocuments(0, pageSize, true, f);
                  }}
                  onEnter={() => fetchDocuments(0, pageSize, true, filters)}
                  placeholder="Buscar por descripción u observaciones..."
                />
              </div>              
              <SelectInput label="Serie Documental" value={filters.serie} onChange={e => { const f = { ...filters, serie: e.target.value }; setFilters(f); fetchDocuments(0, pageSize, true, f);}} options={data.series} placeholder="Todas las series"/>
              <SelectInput label="Año" value={filters.anio} onChange={e => { const f = { ...filters, anio: e.target.value }; setFilters(f); fetchDocuments(0, pageSize, true, f); }} options={data.anios} placeholder="Todos los años" />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const f = { unidad: filters.unidad, serie: "", anio: "", search: "" };
                    setFilters(f);
                    setState(s => ({ ...s, page: 0 }));
                    fetchDocuments(0, pageSize, true, f);
                  }}
                  className="flex-1 px-2 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm flex items-center justify-center gap-1"
                >
                  <Filter size={14} /> Limpiar
                </button>                
                <button
                  onClick={exportToExcel}
                  className="flex-1 px-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm flex items-center justify-center gap-1"
                >
                  <Download size={14} /> Exportar
                </button>
              </div>
            </div>

            {/* Tabla + Paginación */}
            {state.loading ? <SparkleLoader /> :
              !data.documentos.length ? (
                <EmptyState title="Sin resultados" message="No se encontraron documentos con los filtros aplicados." />
              ) : (
                <>
                  <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm border-collapse border border-slate-200">
                      <thead className="bg-slate-50 text-slate-700 text-xs uppercase">
                        <tr>
                          {columns.map(c => (
                            <th key={c.key} className="border border-slate-200 px-3 py-2 text-left">
                              {c.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.documentos.map(doc => (
                          <tr key={doc.id} className="hover:bg-slate-50 transition">
                            <td className="border border-slate-200 px-3 py-2 text-center">{renderActions(doc)}</td>
                            {columns.slice(1).map(col => (
                              <td key={col.key} className="border border-slate-200 px-3 py-2">
                                {col.render ? col.render(doc) : doc[col.key]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-white rounded-xl shadow p-4">
                    <Pagination
                      page={state.page}
                      total={state.total}
                      pageSize={pageSize}
                      onPageChange={(newPage) => fetchDocuments(newPage, pageSize)}
                      onPageSizeChange={setPageSize}
                    />
                  </div>
                </>
              )
            }
          </div>
        )}
      </CrudLayout>

      {/* Modal detalle */}
      {state.selectedDoc && <ModalDetalleDocumento doc={state.selectedDoc} onClose={() => setState(s => ({ ...s, selectedDoc: null }))} />}
      
    </>
  );
}
