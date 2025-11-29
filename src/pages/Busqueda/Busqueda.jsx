import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "../../utils/supabaseClient";
import * as XLSX from "xlsx";
// Componentes UI base
import { Toast } from "../../components/ui/Toast";
import { StatCard } from "../../components/ui/StatCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { SparkleLoader } from "../../components/ui/SparkleLoader";
import { AdvancedFilters } from "../../components/ui/AdvancedFilters";
// Componentes de datos
import { DataTable } from "../../components/data/DataTable";
import { DataCardGrid } from "../../components/data/DataCardGrid";
import { Pagination } from "../../components/data/Pagination";
// Componentes de layout
import { CrudLayout } from "../../components/layout/CrudLayout";
import { ViewToggle } from "../../components/layout/ViewToggle";
// Iconos
import { 
  BookOpen, FileText, Package, Calendar, AlertTriangle, Building2, 
  BarChart3, CheckCircle, Download, Upload, RefreshCw, 
  Plus, Box, Info, Activity, TrendingUp, Eye, Edit, Search 
} from "lucide-react";
// Componentes Internos Refactorizados
import { ModalDetalleDocumento } from "../../components/form/ModalDetalleDocumento";

export default function InventarioDocumental() {
  // Estados principales
  const [data, setData] = useState({ documentos: [] });
  const [state, setState] = useState({ 
    loading: false, 
    mensaje: null, 
    selectedDoc: null, 
    page: 0, 
    total: 0,
    viewOnly: false
  });

  // Referencia para el scroll al paginar
  const tableTopRef = useRef(null);

  // Configuración de vista
  const [viewMode, setViewMode] = useState("table");
  const [pageSize, setPageSize] = useState(10);

  // Filtros avanzados y opciones
  const [filters, setFilters] = useState({});
  // CORRECCIÓN 1: Eliminado 'tomo_faltante' de las opciones ya que ahora es un switch lógico
  const [filterOptions, setFilterOptions] = useState({
    areas: [], series_documentales: [], frecuencias_consulta: [],
    tipo_unidad_conservacion: [], soporte: [],
    estante: [], cuerpo: [], balda: [],
    analistas: [], contratistas: [], ambientes: []
  });


  // Función para mostrar mensajes
  const showMessage = (mensaje, tipo) => 
    setState(s => ({ ...s, mensaje: { mensaje, tipo } }));

  // Función para obtener estadísticas según filtros
  const fetchStats = useCallback(async (currentFilters = {}) => {
    try {
      const statsParams = {
        p_search: currentFilters.search || null,
        p_area: currentFilters.area || null,
        p_serie: currentFilters.serie || null,
        p_frecuencia: currentFilters.frecuencia || null,
        p_numero_caja: currentFilters.numeroCaja || null,
        p_numero_entregable: currentFilters.numeroEntregable || null,
        p_anio: currentFilters.anio ? parseInt(currentFilters.anio) : null,        
        p_tomo_faltante: currentFilters.tomoFaltante ? 'true' : null,        
        p_tipo_unidad_conservacion: currentFilters.tipoUnidadConservacion || null,
        p_soporte: currentFilters.soporte || null,
        p_estante: currentFilters.estante || null,
        p_cuerpo: currentFilters.cuerpo || null,
        p_balda: currentFilters.balda || null,
        p_analista: currentFilters.analista || null,
        p_fecha_inventario: currentFilters.fechaInventario || null,
        p_contratista: currentFilters.contratista || null,
        p_ambiente: currentFilters.ambiente || null
      };

      // Limpieza de parámetros vacíos
      const cleanedParams = {};
      Object.keys(statsParams).forEach(key => {
        const value = statsParams[key];
        if (value !== null && value !== undefined && value !== '') {
          cleanedParams[key] = value;
        }
      });
      
      const { data: statsResult, error } = await supabase.rpc('get_inventario_stats', cleanedParams);
      
      if (error) throw error;
      
    } catch (error) {
      console.error('Error fetching stats:', error);
      showMessage("Error al cargar estadísticas", "error");
    }
  }, []);

  const fetchDocuments = useCallback(async (page = 0) => {
      setState(s => ({ ...s, loading: true }));

      try {
          const offset = page * pageSize;
          const filterParams = {
              p_search: filters.search || null,
              p_area: filters.area || null,
              p_serie: filters.serie || null,
              p_frecuencia: filters.frecuencia || null,
              p_numero_caja: filters.numeroCaja || null,
              p_numero_entregable: filters.numeroEntregable || null, 
              p_anio: filters.anio ? parseInt(filters.anio) : null,
              p_fecha_inventario: filters.fechaInventario || null,              
              p_contratista: filters.contratista || null,
              p_analista: filters.analista || null,
              p_soporte: filters.soporte || null,              
              p_tipo_unidad_conservacion: filters.tipoUnidadConservacion || null,
              p_tomo_faltante: filters.tomoFaltante ? 'true' : null,
              p_estante: filters.estante || null,
              p_cuerpo: filters.cuerpo || null,
              p_balda: filters.balda || null,
              p_ambiente: filters.ambiente || null,
              p_numero_tomo: filters.numeroTomo || null,
              p_numero_folios: filters.numeroFolios ? Number(filters.numeroFolios) : null,              
              p_limit: pageSize,
              p_offset: offset,
              p_order_by: 'id',
              p_order_direction: 'desc'
          };
          
          const { data: result, error } = await supabase.rpc('get_documentos_filtrados', filterParams);
          
          if (error) throw error;

          if (!result || result.length === 0) {
              setData({ documentos: [] });
              setState(s => ({ ...s, page, total: 0, loading: false }));
              return;
          }

          let documents_data = result[0].documentos || [];
          const total_records = result[0].total || 0;
          
          // Validación robusta de array
          if (!Array.isArray(documents_data)) {
              if (documents_data && documents_data.data && Array.isArray(documents_data.data)) {
                  documents_data = documents_data.data;
              } else if (typeof documents_data === 'object' && documents_data !== null) {
                  documents_data = [documents_data];
              } else {
                  documents_data = [];
              }
          }
          
          setData({ documentos: documents_data });
          setState(s => ({ ...s, page, total: Number(total_records), loading: false }));    

      } catch (error) {
          console.error('Error fetching documents:', error);
          showMessage("Error al cargar documentos", "error");
          setData({ documentos: [] });
          setState(s => ({ ...s, loading: false }));
      }
  }, [filters, pageSize]);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const { data: options, error: optionsError } = await supabase.rpc('get_filter_options', {
          p_unidad_organica: filters.area || null
        });
        if (optionsError) throw optionsError;

        if (options && options.length > 0) {
          const opt = options[0];

          const normalizeArray = (arr) => {
            if (!Array.isArray(arr)) return [];
            const map = new Map();
            arr.forEach(item => {
              if (item != null) {
                const key = item.toString().trim().toLowerCase();
                if (!map.has(key)) map.set(key, item.toString().trim());
              }
            });
            return Array.from(map.values());
          };

          setFilterOptions({
            areas: normalizeArray(opt?.areas),
            series_documentales: normalizeArray(opt?.series_documentales),
            years: normalizeArray(opt?.years),
            frecuencias_consulta: normalizeArray(opt?.frecuencias_consulta),
            tipo_unidad_conservacion: normalizeArray(opt?.tipo_unidad_conservacion),
            soporte: normalizeArray(opt?.soporte),
            estante: normalizeArray(opt?.estante),
            cuerpo: normalizeArray(opt?.cuerpo),
            balda: normalizeArray(opt?.balda),
            analistas: normalizeArray(opt?.analistas),
            contratistas: normalizeArray(opt?.contratistas),
            ambientes: normalizeArray(opt?.ambientes)
          });
        }
      } catch (error) {
        console.error('Error loading options:', error);
        showMessage("Error al cargar opciones de filtros", "error");
      }
    };

    loadOptions();
  }, [filters.area]);

  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        fetchStats({}),
        fetchDocuments(0)
      ]);
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    const fetchDataAndStats = async () => {
      await Promise.all([
        fetchStats(filters),
        fetchDocuments(0)
      ]);
    };

    fetchDataAndStats();
  }, [filters, fetchStats, fetchDocuments]);

  const saveDocument = async (doc) => {
    try {
      const { error } = doc.id 
        ? await supabase.from("Inventario_documental").upsert(doc)
        : await supabase.from("Inventario_documental").insert(doc);
        
      if (error) throw error;
      
      showMessage(
        doc.id ? "Documento actualizado exitosamente" : "Documento creado exitosamente", 
        "success"
      );
      
      setState(s => ({ ...s, selectedDoc: null }));
      await Promise.all([
        fetchStats(filters),
        fetchDocuments(state.page)
      ]);
      
    } catch (error) {
      showMessage("Error al guardar el documento", "error");
    }
  };

  const deleteDocument = async (id) => {
    if (!window.confirm("¿Está seguro de eliminar este documento?")) return;
    
    try {
      const { error } = await supabase
        .from("Inventario_documental")
        .delete()
        .eq("id", id);
        
      if (error) throw error;
      
      showMessage("Documento eliminado exitosamente", "info");
      setState(s => ({ ...s, selectedDoc: null }));
      await Promise.all([
        fetchStats(filters),
        fetchDocuments(state.page)
      ]);
      
    } catch (error) {
      showMessage("Error al eliminar el documento", "error");
    }
  };

  const exportToExcel = async () => {
    try {
      setState(s => ({ ...s, loading: true }));
      
      const BATCH_SIZE = 1000;
      let allDocs = [];
      let offset = 0;
      let hasMore = true;
      
      const baseParams = {
          p_search: filters.search || null,
          p_area: filters.area || null,
          p_serie: filters.serie || null,
          p_numero_caja: filters.numeroCaja || null,
          p_estante: filters.estante || null,
          p_cuerpo: filters.cuerpo || null,
          p_balda: filters.balda || null,
          p_ambiente: filters.ambiente || null,
          p_tipo_unidad_conservacion: filters.tipoUnidadConservacion || null,
          p_soporte: filters.soporte || null,
          p_tomo_faltante: filters.tomoFaltante ? 'true' : null,          
          p_frecuencia: filters.frecuencia || null,
          p_analista: filters.analista || null,
          p_contratista: filters.contratista || null,
          p_numero_entregable: filters.numeroEntregable || null,
          p_anio: filters.anio ? parseInt(filters.anio) : null,
          p_fecha_inventario: filters.fechaInventario || null,
          p_order_by: 'id',
          p_order_direction: 'asc'
      };

      while (hasMore) {
          const { data: result, error } = await supabase.rpc('get_documentos_filtrados', {
              ...baseParams,
              p_limit: BATCH_SIZE,
              p_offset: offset
          });

          if (error) throw error;

          let rawData = result?.[0]?.documentos;
          let batchDocs = [];

          if (Array.isArray(rawData)) {
              batchDocs = rawData;
          } else if (rawData && typeof rawData === 'object') {
              if (Array.isArray(rawData.data)) {
                  batchDocs = rawData.data;
              } else {
                  batchDocs = [rawData];
              }
          } else {
              batchDocs = [];
          }

          if (batchDocs.length === 0) {
              hasMore = false;
          } else {
              allDocs = [...allDocs, ...batchDocs];
              offset += BATCH_SIZE;
              
              if (batchDocs.length < BATCH_SIZE) {
                  hasMore = false;
              }
          }
      }

      if (allDocs.length === 0) {
        showMessage("No hay datos para exportar con los filtros actuales", "warning");
        return;
      }

      const wb = XLSX.utils.book_new();       
      const cleanData = allDocs.map(doc => ({
          'Código (ID)': doc.id,
          'Unidad Orgánica': doc.Unidad_Organica,
          'Sigla': doc.Sigla,
          'Serie Documental': doc.Serie_Documental,
          'Descripción': doc.Descripcion,
          'Fecha Inicial': doc.Fecha_Inicial,
          'Fecha Final': doc.Fecha_Final,
          'N° Caja': doc.Numero_Caja,
          'N° Tomo': doc.Numero_Tomo,
          'N° Folios': doc.Numero_Folios,
          'Tipo Unidad Conservación': doc.Tipo_Unidad_Conservacion,
          'Soporte': doc.Soporte,
          'Tomo Faltante': doc.Tomo_Faltante ? 'SÍ' : 'NO',
          'Frecuencia Consulta': doc.Frecuencia_Consulta,
          'Ambiente': doc.Ambiente,
          'Estante': doc.Estante,
          'Cuerpo': doc.Cuerpo,
          'Balda': doc.Balda,
          'Fecha Inventario': doc.Fecha_Inventario,
          'Observaciones': doc.Observaciones,
          'Analista': doc.Analista,
          'Contratista': doc.Contratista,
          'N° Entregable': doc.Numero_Entregable          
      }));

      const ws = XLSX.utils.json_to_sheet(cleanData);
      const wscols = Object.keys(cleanData[0] || {}).map(() => ({ wch: 20 }));
      ws['!cols'] = wscols;

      XLSX.utils.book_append_sheet(wb, ws, "Inventario Completo");
      XLSX.writeFile(wb, `Inventario_Fondo_Documental_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      showMessage(`${allDocs.length} documentos exportados exitosamente`, "success");
      
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      showMessage(`Error al exportar: ${error.message || 'Error desconocido'}`, "error");
    } finally {
      setState(s => ({ ...s, loading: false }));
    }
  };

  const importFromExcel = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      const data = await new Promise((resolve, reject) => {
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error("Error leyendo archivo"));
        reader.readAsArrayBuffer(file);
      });

      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        showMessage("El archivo está vacío", "warning");
        return;
      }

      const { error } = await supabase
        .from("Inventario_documental")
        .insert(jsonData);

      if (error) throw error;

      showMessage(`${jsonData.length} documentos importados exitosamente`, "success");
      await Promise.all([
        fetchStats(filters),
        fetchDocuments(0)
      ]);
      
    } catch (error) {
      console.error('Error importing Excel:', error);
      showMessage("Error al importar el archivo", "error");
    } finally {
      event.target.value = '';
    }
  };

  const columns = useMemo(() => [
    { 
      label: "Código", 
      key: "id",
      render: (doc) => (         
        <div className="text-xs font-mono font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md inline-block">
          {doc.id || 'S/C'}
        </div>
      ) 
    },
    { 
      label: "Descripción del Documento", 
      key: "descripcion", 
      render: (doc) => (
        <div className="group">
          <div className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors group-hover:line-clamp-none transition-all duration-200">
            {doc.Descripcion}
          </div>
          {(doc.Serie_Documental || doc.Observaciones) && (
            <div className="mt-1 text-xs text-slate-500 flex flex-col gap-0.5">
              {doc.Serie_Documental && <span className="font-medium uppercase text-slate-400">{doc.Serie_Documental}</span>}
              {doc.Observaciones && (
                <div className="flex items-start gap-1 text-amber-600 bg-amber-50 p-1 rounded">
                   <Info size={10} className="mt-0.5" />
                   <span className="line-clamp-1 group-hover:line-clamp-none transition-all duration-200">{doc.Observaciones}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )
    },
    { 
      label: "Sección", 
      key: "seccion", 
      render: (doc) => (
        <div className="text-xs text-slate-600">
          <div className="font-bold uppercase">
            {doc.Unidad_Organica || '-'}
          </div>
        </div>
      )
    },
    { 
      label: "Periodo", 
      key: "fechasExtremas", 
      render: (doc) => (
        <div className="text-xs text-slate-500 flex flex-col gap-1">
          <span className="flex items-center gap-1">{doc.Fecha_Inicial || '-'}</span>
          <span className="flex items-center gap-1">{doc.Fecha_Final || '-'}</span>
        </div>
      )
    },    
    { 
      label: "Ubicación Topográfica", 
      key: "ubicacion", 
      render: (doc) => (
        <div className="text-xs">
          <div className="flex items-center gap-1 font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded mb-1 w-fit">
            <Package className="w-3 h-3" />
            Caja {doc.Numero_Caja || '?'}
          </div>
          <div className="text-slate-500 font-mono">
            {doc.Ambiente || doc.Estante || doc.Cuerpo || doc.Balda ? (
              [
                doc.Ambiente,
                doc.Estante && `E${doc.Estante}`,
                doc.Cuerpo && `C${doc.Cuerpo}`,
                doc.Balda && `B${doc.Balda}`
              ]
                .filter(Boolean)
                .join('-')
            ) : (
              <span className="italic text-slate-400">No asignada</span>
            )}
          </div>
        </div>
      )
    },
    { 
      label: "Estado", 
      key: "tipoUnidad", 
      render: (doc) => (
        <div className="flex flex-col gap-1 items-start">
          {doc.Tipo_Unidad_Conservacion && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
              doc.Tipo_Unidad_Conservacion === 'SIN UNIDAD' ? 'bg-red-50 text-red-700 border-red-100' :
              doc.Tipo_Unidad_Conservacion === 'EMPASTADO' ? 'bg-blue-50 text-blue-700 border-blue-100' :
              doc.Tipo_Unidad_Conservacion === 'ARCHIVADOR' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
              doc.Tipo_Unidad_Conservacion === 'FOLDER MANILA' ? 'bg-amber-50 text-amber-700 border-amber-100' :              
              'bg-slate-50 text-slate-600 border-slate-200'
            }`}>
              {doc.Tipo_Unidad_Conservacion}
            </span>
          )}
          {/* Indicador visual de Tomo Faltante si aplica */}
          {doc.Tomo_Faltante && (
             <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-red-100 text-red-700 border border-red-200">
               <AlertTriangle size={10} /> FALTANTE
             </span>
          )}
          {(doc.Numero_Tomo || doc.Numero_Folios) && (
            <span className="text-[10px] text-slate-400">
              {doc.Numero_Tomo && `T: ${doc.Numero_Tomo}`}
              {doc.Numero_Tomo && doc.Numero_Folios && " | "}
              {doc.Numero_Folios && `F: ${doc.Numero_Folios}`}
            </span>
          )}
        </div>
      )
    },
  ], []);

  const renderActions = useCallback((doc) => (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setState(s => ({ ...s, selectedDoc: doc, viewOnly: true }))}
        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        title="Ver detalles (Solo lectura)"
      >
        <Eye size={18} />
      </button>
    </div>
  ), []);

  const renderCard = useCallback((doc) => (
    <div className={`bg-white border rounded-xl p-5 hover:shadow-md transition-all duration-200 group relative overflow-hidden ${doc.Tomo_Faltante ? 'border-red-200' : 'border-slate-200 hover:border-blue-300'}`}>
      <div className={`absolute top-0 left-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity ${doc.Tomo_Faltante ? 'bg-red-500' : 'bg-blue-600'}`}></div>
      
      <div className="flex justify-between items-start mb-3 pl-2">
        <div className="flex-1">
          <div className="font-mono text-xs font-bold text-blue-700 bg-blue-50 inline-block px-1.5 py-0.5 rounded mb-1.5">
            {doc.id || 'S/C'}
          </div>
          <h3 className="font-bold text-slate-800 text-sm line-clamp-2 group-hover:text-blue-800 transition-colors">
            {doc.Descripcion}
          </h3>
        </div>
        <button
          onClick={() => setState(s => ({ ...s, selectedDoc: doc }))}
          className="text-slate-400 hover:text-blue-600 p-1 hover:bg-blue-50 rounded transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      </div>

      <div className="space-y-2 pl-2">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-medium">{doc.Unidad_Organica || 'N/A'}</span>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          <span className="truncate">{doc.Serie_Documental || 'Sin serie'}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mt-2">
            {doc.Numero_Caja && (
            <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 p-1.5 rounded border border-slate-100">
                <Package className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-bold">Caja: {doc.Numero_Caja}</span>
            </div>
            )}
            {doc.Fecha_Inicial && (
            <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 p-1.5 rounded border border-slate-100">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{new Date(doc.Fecha_Inicial).getFullYear()}</span>
            </div>
            )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
          <div className="flex gap-1">
            {doc.Frecuencia_Consulta && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                doc.Frecuencia_Consulta === 'Alta' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                doc.Frecuencia_Consulta === 'Media' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                'bg-slate-50 text-slate-600 border border-slate-200'
                }`}>
                {doc.Frecuencia_Consulta}
                </span>
            )}
            {/* Tag visual en Card si falta tomo */}
            {doc.Tomo_Faltante && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-red-100 text-red-700 border border-red-200" title="Tomo Reportado Faltante">
                   <AlertTriangle size={8} className="mr-1"/> Faltante
                </span>
            )}
          </div>
          
          {doc.Ubicacion_Fisica && (
            <span className="text-[10px] font-mono text-slate-400">
              {doc.Ubicacion_Fisica}
            </span>
          )}
        </div>
      </div>
    </div>
  ), []);

  return (
    <>
      <CrudLayout 
        title="Busqueda Documental" 
        icon={Search}
        description="Busqueda del Patrimonio Documental"
      >
        {/* Toast de notificaciones */}
        {state.mensaje && (
          <Toast 
            {...state.mensaje} 
            onClose={() => setState(s => ({ ...s, mensaje: null }))} 
          />
        )}

        {/* Filtros avanzados */}
        <AdvancedFilters 
          filters={filters}
          onFiltersChange={setFilters}
          filterOptions={filterOptions}
          loading={state.loading}
        />

        {/* Panel de controles principales y Lista */}
        <div ref={tableTopRef} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6">
          <div className="flex flex-col lg:flex-row gap-5 items-center justify-between mb-4">
            {/* Lado izquierdo - Vista y Contadores */}
            <div className="flex items-center gap-5 flex-1 w-full lg:w-auto">
              <ViewToggle view={viewMode} onViewChange={setViewMode} />
              
              <div className="hidden lg:block w-px h-8 bg-slate-200"></div>
              
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-800 font-bold">{data.documentos.length}</span>
                <span>registros visibles de</span>
                <span className="font-bold">{state.total}</span>
              </div>
            </div>

            {/* Lado derecho - Acciones */}
            <div className="flex items-center gap-3 flex-wrap w-full lg:w-auto justify-end">
              {/* Actualizar */}
              <button
                onClick={() => {
                  fetchDocuments(state.page);
                  fetchStats(filters);
                }}
                className="p-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center"
                disabled={state.loading}
                title="Actualizar datos"
              >
                <RefreshCw className={`w-4 h-4 ${state.loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Contenido principal */}
          {state.loading ? (
            <SparkleLoader />
          ) : data.documentos.length === 0 ? (
            <EmptyState
              title="Sin registros disponibles"
              message={
                Object.keys(filters).length > 0 
                  ? "No se encontraron documentos con los filtros actuales."
                  : "La base de datos del inventario está vacía."
              }
              onCreate={() => setState(s => ({ ...s, selectedDoc: {} }))}
              createLabel="Registrar Primer Documento"
              icon={FileText}
            />
          ) : (
            <>
              {/* Vista de tabla */}
              {viewMode === "table" && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <DataTable
                    columns={columns}
                    data={data.documentos}
                    renderActions={renderActions}
                    emptyMessage="No hay documentos para mostrar"
                  />
                </div>
              )}

              {/* Vista de tarjetas */}
              {viewMode === "cards" && (
                <DataCardGrid
                  data={data.documentos}
                  renderCard={renderCard}
                  emptyMessage="No hay documentos para mostrar"
                />
              )}
            </>
          )}

          {/* Paginación */}
          {data.documentos.length > 0 && (
            <div className="mt-6">
              <Pagination
                page={state.page}
                total={state.total}
                pageSize={pageSize}
                onPageChange={(newPage) => {
                  setState(prev => ({ ...prev, page: newPage }));
                  fetchDocuments(newPage);
                }}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setState(s => ({ ...s, page: 0 }));
                  fetchDocuments(0);
                }}
                scrollRef={tableTopRef}
              />
            </div>
          )}
        </div>

      </CrudLayout>

      {/* Modal de documento */}
      {state.selectedDoc && (
        <ModalDetalleDocumento
          doc={state.selectedDoc}
          readOnly={state.viewOnly} 
          onClose={() => setState(s => ({ ...s, selectedDoc: null, viewOnly: false }))}
          onSave={saveDocument}
          onDelete={deleteDocument}
        />
      )}
    </>
  );
}