import React, { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../utils/supabaseClient";
import * as XLSX from "xlsx";

// Componentes UI base
import { Toast } from "./ui/Toast";
import { StatCard } from "./ui/StatCard";
import { EmptyState } from "./ui/EmptyState";
import { SparkleLoader } from "./ui/SparkleLoader";

// Componentes de datos
import { DataTable } from "./data/DataTable";
import { DataCardGrid } from "./data/DataCardGrid";
import { Pagination } from "./data/Pagination";

// Componentes de layout
import { CrudLayout } from "./layout/CrudLayout";
import { ViewToggle } from "./layout/ViewToggle";

// Componentes de controles
import { SearchBar } from "./controls/SearchBar";

// Iconos
import { BookOpen, FileText, Package, Calendar, AlertTriangle, Building2, BarChart3, CheckCircle, Clock, Download, Upload, Filter, RefreshCw, Plus, Box } from "lucide-react";

// Componente de filtros avanzados
const AdvancedFilters = ({ filters, onFiltersChange, filterOptions, loading }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const activeFiltersCount = Object.keys(filters).filter(
    key => filters[key] && filters[key] !== ""
  ).length;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filtros Avanzados
          {activeFiltersCount > 0 && (
            <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-1 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          {isExpanded ? 'Contraer' : 'Expandir'}
        </button>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Búsqueda general */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Búsqueda General
          </label>
          <SearchBar
            value={filters.search || ""}
            onChange={(value) => updateFilter('search', value)}
            placeholder="ID, descripción, serie..."
          />
        </div>

        {/* Área responsable */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Área Responsable
          </label>
          <select
            value={filters.area ?? ""}
            onChange={(e) => updateFilter("area", e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={loading}
          >
            <option value="">Todas las áreas</option>
            {filterOptions?.areas?.map((area) => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>

        {/* Serie documental */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Serie Documental
          </label>
          <select
            value={filters.serie || ""}
            onChange={(e) => updateFilter('serie', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={loading}
          >
            <option value="">Todas las series</option>
            {filterOptions?.series_documentales?.map(serie => (
              <option key={serie} value={serie}>{serie}</option>
            ))}
          </select>
        </div>

        {/* Frecuencia de consulta */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Frecuencia de Consulta
          </label>
          <select
            value={filters.frecuencia || ""}
            onChange={(e) => updateFilter('frecuencia', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={loading}
          >
            <option value="">Todas</option>
            {filterOptions?.frecuencias_consulta?.map(frecuencia => (
              <option key={frecuencia} value={frecuencia}>{frecuencia}</option>
            ))}
          </select>
        </div>

        {isExpanded && (
        <>
          {/* Número de caja */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Caja
              </label>
              <input
                type="number"
                value={filters.numeroCaja || ""}
                onChange={(e) => updateFilter('numeroCaja', e.target.value)}
                placeholder="Ej: 1, 10, 210"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={loading}
              />
            </div>

          {/* Número Entregable */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número Entregable
            </label>
            <input
              type="number"
              value={filters.numeroEntregable || ""}
              onChange={(e) => updateFilter('numeroEntregable', e.target.value)}
              placeholder="Ej: 1, 2, 3"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={loading}
            />
          </div>

          {/* Tomo Faltante */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tomo Faltante
            </label>
            <select
              value={filters.tomoFaltante || ""}
              onChange={(e) => updateFilter('tomoFaltante', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo Unidad Conservación
            </label>
            <select
              value={filters.tipoUnidadConservacion || ""}
              onChange={(e) => updateFilter('tipoUnidadConservacion', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={loading}
            >
              <option value="">Todos</option>
              {filterOptions?.tipo_unidad_conservacion?.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </div>

          {/* Soporte */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Soporte
            </label>
            <select
              value={filters.soporte || ""}
              onChange={(e) => updateFilter('soporte', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={loading}
            >
              <option value="">Todos</option>
              {filterOptions?.soporte?.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Estante */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estante
            </label>
            <select
              value={filters.estante || ""}
              onChange={(e) => updateFilter('estante', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={loading}
            >
              <option value="">Todos</option>
              {filterOptions?.estante?.map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          {/* Cuerpo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cuerpo
            </label>
            <select
              value={filters.cuerpo || ""}
              onChange={(e) => updateFilter('cuerpo', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={loading}
            >
              <option value="">Todos</option>
              {filterOptions?.cuerpo?.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Balda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Balda
            </label>
            <select
              value={filters.balda || ""}
              onChange={(e) => updateFilter('balda', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={loading}
            >
              <option value="">Todos</option>
              {filterOptions?.balda?.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Analista */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Analista
            </label>
            <select
              value={filters.analista || ""}
              onChange={(e) => updateFilter('analista', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={loading}
            >
              <option value="">Todos</option>
              {filterOptions?.analistas?.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* Fecha Inventario */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Inventario
            </label>
            <input
              type="date"
              value={filters.fechaInventario || ""}
              onChange={(e) => updateFilter('fechaInventario', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={loading}
            />
          </div>

          {/* Contratista */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contratista
            </label>
            <select
              value={filters.contratista || ""}
              onChange={(e) => updateFilter('contratista', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={loading}
            >
              <option value="">Todos</option>
              {filterOptions?.contratistas?.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>          
        </>
      )}

      </div>

      {/* Botones de acción */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={clearFilters}
          disabled={activeFiltersCount === 0 || loading}
          className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className="w-4 h-4" />
          Limpiar Filtros
        </button>
      </div>
    </div>
  );
};

// Componente del modal de documento
const DocumentModal = ({ doc, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState(() => {
    const { created_at, updated_at, ...docData } = doc || {};
    return {
      id: "",
      Numero_Caja: "",
      Tomo_Faltante: "",
      Unidad_Organica: "",
      Sigla: "",
      Serie_Documental: "",
      Descripcion: "",
      Fecha_Inicial: "",
      Fecha_Final: "",
      Numero_Tomo: "",
      Tipo_Unidad_Conservacion: "",
      Numero_Folios: "",
      Soporte: "",
      Estante: "",
      Cuerpo: "",
      Balda: "",
      Frecuencia_Consulta: "",
      Observaciones: "",
      Analista: "",
      Fecha_Inventario: "",
      Contratista: "",
      Numero_Entregable: "",
      ...docData
    };
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.Descripcion?.trim())
      newErrors.Descripcion = "La descripción es obligatoria";
    if (!formData.Unidad_Organica?.trim())
      newErrors.Unidad_Organica = "La unidad orgánica es obligatoria";
    if (!formData.Serie_Documental?.trim())
      newErrors.Serie_Documental = "La serie documental es obligatoria";

    if (formData.Fecha_Inicial && formData.Fecha_Final) {
      const fechaInicial = new Date(formData.Fecha_Inicial);
      const fechaFinal = new Date(formData.Fecha_Final);
      if (isNaN(fechaInicial) || isNaN(fechaFinal))
        newErrors.Fecha_Inicial = "Fechas inválidas";
      else if (fechaInicial > fechaFinal)
        newErrors.Fecha_Final =
          "La fecha final debe ser posterior a la fecha inicial";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      const updated = { ...errors };
      delete updated[field];
      setErrors(updated);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error("Error saving document:", error);
    } finally {
      setSaving(false);
    }
  };

  const InputField = ({
    label,
    field,
    type = "text",
    required = false,
    placeholder = "",
    rows
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {rows ? (
        <textarea
          value={formData[field] || ""}
          onChange={(e) => handleChange(field, e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none ${
            errors[field] ? "border-red-500" : "border-gray-300"
          }`}
          disabled={saving}
        />
      ) : (
        <input
          type={type}
          value={formData[field] || ""}
          onChange={(e) => handleChange(field, e.target.value)}
          placeholder={placeholder}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
            errors[field] ? "border-red-500" : "border-gray-300"
          }`}
          disabled={saving}
        />
      )}
      {errors[field] && (
        <p className="text-red-500 text-xs mt-1">{errors[field]}</p>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-10 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            {doc?.id ? "Editar Documento" : "Nuevo Documento"}
          </h2>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {doc?.id && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Información del Registro
              </h4>
              <div className="text-sm text-gray-600">
                <div>
                  ID del documento: <span className="font-medium">{doc.id}</span>
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">            
            <InputField label="Número de Caja" field="Numero_Caja" />
            <InputField label="Tomo Faltante" field="Tomo_Faltante" />
            <InputField label="Unidad Orgánica" field="Unidad_Organica" required />
            <InputField label="Sigla" field="Sigla" />
            <InputField label="Serie Documental" field="Serie_Documental" required />
            <InputField label="Descripción" field="Descripcion" required rows={2} />
            <InputField label="Fecha Inicial" field="Fecha_Inicial" type="date" />
            <InputField label="Fecha Final" field="Fecha_Final" type="date" />
            <InputField label="Número de Tomo" field="Numero_Tomo" />
            <InputField label="Tipo Unidad Conservación" field="Tipo_Unidad_Conservacion" />
            <InputField label="Número de Folios" field="Numero_Folios" />
            <InputField label="Soporte" field="Soporte" />
            <InputField label="Estante" field="Estante" />
            <InputField label="Cuerpo" field="Cuerpo" />
            <InputField label="Balda" field="Balda" />
            <InputField label="Frecuencia de Consulta" field="Frecuencia_Consulta" />
            <InputField label="Analista" field="Analista" />
            <InputField label="Fecha Inventario" field="Fecha_Inventario" type="date" />
            <InputField label="Contratista" field="Contratista" />
            <InputField label="Número Entregable" field="Numero_Entregable" />
          </div>

          <div className="mt-6">
            <InputField
              label="Observaciones"
              field="Observaciones"
              placeholder="Notas adicionales..."
              rows={3}
            />
          </div>         

          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <div>
              {doc?.id && (
                <button
                  type="button"
                  onClick={() => onDelete(doc.id)}
                  disabled={saving}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Eliminar
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                {saving ? "Guardando..." : doc?.id ? "Actualizar" : "Crear"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// Componente principal
export default function InventarioDocumental() {
  // Estados principales
  const [data, setData] = useState({ documentos: [] });
  const [state, setState] = useState({ 
    loading: false, 
    mensaje: null, 
    selectedDoc: null, 
    page: 0, 
    total: 0 
  });

  // Configuración de vista
  const [viewMode, setViewMode] = useState("table");
  const [pageSize, setPageSize] = useState(10);

  // Filtros avanzados y opciones
  const [filters, setFilters] = useState({});
  const [filterOptions, setFilterOptions] = useState({
    areas: [],
    series_documentales: [],
    frecuencias_consulta: [],
    tomo_faltante: [],
    tipo_unidad_conservacion: [],
    soporte: [],
    estante: [],
    cuerpo: [],
    balda: [],
    analistas: [],
    contratistas: []
  });

  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    altaConsulta: 0,
    conCaja: 0,
    digitalizados: 0,
    series: 0,
    areas: 0,
    mediaConsulta: 0,
    bajaConsulta: 0,
    folios: 0,
    cajasporunidad: 0,
    tomosfaltantes: 0,
    rangoFechas: {}
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
        p_fecha_desde: currentFilters.fechaDesde || null,
        p_fecha_hasta: currentFilters.fechaHasta || null,
        p_tomo_faltante: currentFilters.tomoFaltante || null,
        p_tipo_unidad_conservacion: currentFilters.tipoUnidadConservacion || null,
        p_soporte: currentFilters.soporte || null,
        p_estante: currentFilters.estante || null,
        p_cuerpo: currentFilters.cuerpo || null,
        p_balda: currentFilters.balda || null,
        p_analista: currentFilters.analista || null,
        p_fecha_inventario: currentFilters.fechaInventario || null,
        p_contratista: currentFilters.contratista || null,
        p_numero_entregable: currentFilters.numeroEntregable || null
      };

      const { data: statsResult, error } = await supabase.rpc('get_inventario_stats', statsParams);
      
      if (error) throw error;

      // statsResult es un array con un objeto
      const statsData = statsResult?.[0] || {};

      setStats({
        total: Number(statsData.total_documentos) || 0,
        conCaja: Number(statsData.con_caja) || 0,
        altaConsulta: Number(statsData.alta_consulta) || 0,
        mediaConsulta: Number(statsData.media_consulta) || 0,
        bajaConsulta: Number(statsData.baja_consulta) || 0,
        series: Number(statsData.series_documentales) || 0,
        areas: Number(statsData.areas_responsables) || 0,
        folios: Number(statsData.total_folios) || 0,
        cajasporunidad: Number(statsData.cajas_por_unidad) || 0,
        tomosfaltantes: Number(statsData.con_tomo_faltante) || 0,
        digitalizados: 0, // Mantener este campo si lo necesitas
        rangoFechas: statsData.rango_fechas || {}
      });
      
    } catch (error) {
      console.error('Error fetching stats:', error);
      showMessage("Error al cargar estadísticas", "error");
    }
  }, []);

  // Función principal para obtener documentos usando la función de Supabase
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
              p_fecha_desde: filters.fechaDesde || null,
              p_fecha_hasta: filters.fechaHasta || null,
              p_tomo_faltante: filters.tomoFaltante || null,
              p_tipo_unidad_conservacion: filters.tipoUnidadConservacion || null,
              p_soporte: filters.soporte || null,
              p_estante: filters.estante || null,
              p_cuerpo: filters.cuerpo || null,
              p_balda: filters.balda || null,
              p_analista: filters.analista || null,
              p_fecha_inventario: filters.fechaInventario || null,
              p_contratista: filters.contratista || null,
              p_numero_entregable: filters.numeroEntregable || null,
              p_limit: pageSize,
              p_offset: offset,
              p_order_by: 'id',
              p_order_direction: 'desc'
          };

          const { data: result, error } = await supabase.rpc('get_documentos_filtrados', filterParams);

          if (error) throw error;

          // Asegúrate de que result contenga un array con un objeto que tenga 'documents_data' y 'total_records'
          if (!result || result.length === 0) {
              setData({ documentos: [] });
              setState(s => ({ ...s, page, total: 0, loading: false }));
              return;
          }

          const documents_data = result[0].documents_data || []; // Asegúrate de que esta propiedad sea correcta
          const total_records = result[0].total_records || 0; // Asegúrate de que esta propiedad sea correcta

          setData({ documentos: documents_data });
          setState(s => ({ ...s, page, total: Number(total_records), loading: false }));

      } catch (error) {
          console.error('Error fetching documents:', error);
          showMessage("Error al cargar documentos", "error");
          setState(s => ({ ...s, loading: false }));
      }
  }, [filters, pageSize]);

  // Cargar opciones iniciales
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const { data: options, error: optionsError } = await supabase.rpc('get_filter_options');
        if (optionsError) throw optionsError;

        if (options && options.length > 0) {
          const opt = options[0];

          // Función para limpiar y eliminar duplicados ignorando mayúsculas y espacios
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
            frecuencias_consulta: normalizeArray(opt?.frecuencias_consulta),
            tomo_faltante: normalizeArray(opt?.tomo_faltante),
            tipo_unidad_conservacion: normalizeArray(opt?.tipo_unidad_conservacion),
            soporte: normalizeArray(opt?.soporte),
            estante: normalizeArray(opt?.estante),
            cuerpo: normalizeArray(opt?.cuerpo),
            balda: normalizeArray(opt?.balda),
            analistas: normalizeArray(opt?.analistas),
            contratistas: normalizeArray(opt?.contratistas)
          });
        }
      } catch (error) {
        console.error('Error loading options:', error);
        showMessage("Error al cargar opciones de filtros", "error");
      }
    };

    loadOptions();
  }, []);

  // Cargar datos y estadísticas iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        fetchStats({}),
        fetchDocuments(0)
      ]);
    };

    loadInitialData();
  }, []);

  // Actualizar datos y estadísticas cuando cambian los filtros
  useEffect(() => {
    const fetchDataAndStats = async () => {
      await Promise.all([
        fetchStats(filters),
        fetchDocuments(0)
      ]);
    };

    fetchDataAndStats();
  }, [filters, fetchStats, fetchDocuments]);

  // Función para guardar documento
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

  // Función para eliminar documento
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

  // Función para exportar a Excel
  const exportToExcel = async () => {
    try {
      setState(s => ({ ...s, loading: true }));
      
      const filterParams = {
        p_search: filters.search || null,
        p_area: filters.area || null,
        p_serie: filters.serie || null,
        p_frecuencia: filters.frecuencia || null,
        p_numero_caja: filters.numeroCaja || null,
        p_fecha_desde: filters.fechaDesde || null,
        p_fecha_hasta: filters.fechaHasta || null,
        p_tomo_faltante: filters.tomoFaltante || null,
        p_tipo_unidad_conservacion: filters.tipoUnidadConservacion || null,
        p_soporte: filters.soporte || null,
        p_estante: filters.estante || null,
        p_cuerpo: filters.cuerpo || null,
        p_balda: filters.balda || null,
        p_analista: filters.analista || null,
        p_fecha_inventario: filters.fechaInventario || null,
        p_contratista: filters.contratista || null,
        p_numero_entregable: filters.numeroEntregable || null,        
        p_limit: 999999, // Límite muy alto para obtener todos los registros
        p_offset: 0,
        p_order_by: 'id',
        p_order_direction: 'desc'
      };

      const { data: result, error } = await supabase.rpc('get_documentos_filtrados', filterParams);
      
      if (error) throw error;

      const allDocs = result?.[0]?.data || [];

      if (allDocs.length === 0) {
        showMessage("No hay datos para exportar", "warning");
        return;
      }

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(allDocs);
      
      XLSX.utils.book_append_sheet(wb, ws, "Inventario Documental");
      XLSX.writeFile(wb, `Inventario_documental_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      showMessage(`${allDocs.length} documentos exportados exitosamente`, "success");
      
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      showMessage("Error al exportar el archivo", "error");
    } finally {
      setState(s => ({ ...s, loading: false }));
    }
  };

  // Función para importar desde Excel
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

      // Insertar datos en la base de datos
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
      event.target.value = ''; // Reset input
    }
  };

  // Definición de columnas para la tabla
  const columns = useMemo(() => [
    { 
      label: "ID/Código", 
      key: "id", 
      render: (doc) => (
        <div className="font-mono text-sm font-medium text-indigo-600">
          {doc.id || 'Sin código'}
        </div>
      )
    },
    { 
      label: "Descripción", 
      key: "descripcion", 
      render: (doc) => (
        <div className="max-w-xs">
          <div className="font-medium text-gray-900 truncate">
            {doc.Descripcion}
          </div>
          <div className="text-sm text-gray-500 truncate">
            {doc.Serie_Documental}
          </div>
        </div>
      )
    },
    { 
      label: "Unidad/Área", 
      key: "unidad", 
      render: (doc) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            {doc.Unidad_Organica || 'Sin asignar'}
          </div>
          {doc.Subserie_Documental && (
            <div className="text-gray-500">
              {doc.Subserie_Documental}
            </div>
          )}
        </div>
      )
    },
    { 
      label: "Ubicación", 
      key: "ubicacion", 
      render: (doc) => (
        <div className="text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <Package className="w-4 h-4" />
            {doc.Numero_Caja || 'N/A'}
          </div>
          <div className="text-gray-500">
            {doc.Estante && doc.Cuerpo && doc.Balda 
              ? `E${doc.Estante}-C${doc.Cuerpo}-B${doc.Balda}` 
              : 'Sin ubicación'}
          </div>
        </div>
      )
    },
    { 
      label: "Consulta", 
      key: "frecuencia", 
      render: (doc) => (
        <div className="flex flex-col gap-1">
          {doc.Frecuencia_Consulta && (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              doc.Frecuencia_Consulta === 'Alta' ? 'bg-orange-100 text-orange-800' :
              doc.Frecuencia_Consulta === 'Media' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {doc.Frecuencia_Consulta}
            </span>
          )}
          {doc.Numero_Tomo && (
            <span className="text-xs text-gray-500">
              Tomo: {doc.Numero_Tomo}
            </span>
          )}
        </div>
      )
    },
  ], []);

  // Función para renderizar acciones de la tabla
  const renderActions = useCallback((doc) => (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setState(s => ({ ...s, selectedDoc: doc }))}
        className="w-8 h-8 bg-indigo-100 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-lg flex items-center justify-center transition-colors"
        title="Editar documento"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
    </div>
  ), []);

  // Función para renderizar tarjetas
  const renderCard = useCallback((doc) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="font-mono text-sm font-medium text-indigo-600 mb-1">
            {doc.id || 'Sin código'}
          </div>
          <h3 className="font-medium text-gray-900 line-clamp-2">
            {doc.Descripcion}
          </h3>
        </div>
        <button
          onClick={() => setState(s => ({ ...s, selectedDoc: doc }))}
          className="text-gray-400 hover:text-indigo-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <Building2 className="w-4 h-4" />
          <span>{doc.Unidad_Organica || 'Sin área asignada'}</span>
        </div>
        
        <div className="flex items-center gap-2 text-gray-600">
          <FileText className="w-4 h-4" />
          <span>{doc.Serie_Documental || 'Sin serie'}</span>
        </div>
        
        {doc.Numero_Caja && (
          <div className="flex items-center gap-2 text-gray-600">
            <Package className="w-4 h-4" />
            <span>Caja: {doc.Numero_Caja}</span>
          </div>
        )}

        {doc.Fecha_Inicial && doc.Fecha_Final && (
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{new Date(doc.Fecha_Inicial).getFullYear()} - {new Date(doc.Fecha_Final).getFullYear()}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          {doc.Frecuencia_Consulta && (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              doc.Frecuencia_Consulta === 'Alta' ? 'bg-orange-100 text-orange-800' :
              doc.Frecuencia_Consulta === 'Media' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {doc.Frecuencia_Consulta}
            </span>
          )}
          
          {doc.Ubicacion_Fisica && (
            <span className="text-xs text-gray-500 truncate max-w-24">
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
        title="Sistema de Inventario Documental" 
        icon={BookOpen}
      >
        {/* Toast de notificaciones */}
        {state.mensaje && (
          <Toast 
            {...state.mensaje} 
            onClose={() => setState(s => ({ ...s, mensaje: null }))} 
          />
        )}

        {/* Encabezado de estadísticas */}
        <div className="flex items-center justify-between mb-6">          
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            Estadísticas del Inventario Documental
          </h3>          
          <div className="hidden sm:block w-24 h-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600"></div>
        </div>
        
        {/* Panel de estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard 
            title="Total Unidades Documentales" 
            value={stats.total?.toLocaleString("es-PE")} 
            icon={FileText} 
            color="from-blue-600 to-blue-700"
          />
          <StatCard 
            title="Total Unidades Órganicas" 
            value={stats.areas?.toLocaleString("es-PE")} 
            icon={CheckCircle} 
            color="from-green-600 to-green-700"
          />          
          <StatCard 
            title="Total Series Documentales" 
            value={stats.series?.toLocaleString("es-PE")} 
            icon={Building2} 
            color="from-teal-600 to-teal-700"
          />
          <StatCard 
            title="Total Folios" 
            value={stats.folios?.toLocaleString("es-PE")} 
            icon={FileText} 
            color="from-purple-600 to-purple-700"
          />
          <StatCard 
            title="Total Cajas Archiveras" 
            value={stats.cajasporunidad?.toLocaleString("es-PE")} 
            icon={Box} 
            color="from-red-600 to-red-700"
          />
          <StatCard 
            title="Tomos Faltantes" 
            value={stats.tomosfaltantes?.toLocaleString("es-PE")} 
            icon={AlertTriangle} 
            color="from-amber-500 to-orange-600"
          />
          <StatCard 
            title="Alta Consulta" 
            value={stats.altaConsulta?.toLocaleString("es-PE")} 
            icon={Clock} 
            color="from-orange-600 to-orange-700"
          />
          <StatCard 
            title="Media Consulta" 
            value={stats.mediaConsulta?.toLocaleString("es-PE")} 
            icon={Clock} 
            color="from-blue-600 to-blue-700"
          />
          <StatCard 
            title="Baja Consulta" 
            value={stats.bajaConsulta?.toLocaleString("es-PE")} 
            icon={Clock} 
            color="from-gray-600 to-gray-700"
          />
        </div>

        {/* Filtros avanzados */}
        <AdvancedFilters 
          filters={filters}
          onFiltersChange={setFilters}
          filterOptions={filterOptions}
          loading={state.loading}
        />

        {/* Panel de controles principales */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Lado izquierdo - Vista y búsqueda rápida */}
            <div className="flex items-center gap-4 flex-1">
              <ViewToggle 
                view={viewMode} 
                onViewChange={setViewMode} 
              />
              
              <div className="hidden lg:block w-px h-8 bg-gray-300"></div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Mostrando {data.documentos.length} de {state.total}</span>
              </div>
            </div>

            {/* Lado derecho - Acciones */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Importar Excel */}
              <label className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer flex items-center gap-2 text-sm">
                <Upload className="w-4 h-4" />
                Importar Excel
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={importFromExcel}
                  className="hidden"
                />
              </label>

              {/* Exportar Excel */}
              <button
                onClick={exportToExcel}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
              >
                <Download className="w-4 h-4" />
                Exportar Excel
              </button>

              {/* Actualizar */}
              <button
                onClick={() => {
                  fetchDocuments(state.page);
                  fetchStats(filters);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm"
                disabled={state.loading}
              >
                <RefreshCw className={`w-4 h-4 ${state.loading ? 'animate-spin' : ''}`} />
                Actualizar
              </button>

              {/* Nuevo documento */}
              <button
                onClick={() => setState(s => ({ ...s, selectedDoc: {} }))}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Nuevo Documento
              </button>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        {state.loading ? (
          <SparkleLoader message="Cargando documentos y estadísticas..." />
        ) : data.documentos.length === 0 ? (
          <EmptyState
            title="Sin documentos registrados"
            message={
              Object.keys(filters).length > 0 
                ? "No se encontraron documentos que coincidan con los filtros aplicados"
                : "Comience agregando el primer documento al inventario"
            }
            onCreate={() => setState(s => ({ ...s, selectedDoc: {} }))}
            createLabel="Crear Primer Documento"
            icon={FileText}
          />
        ) : (
          <>
            {/* Vista de tabla */}
            {viewMode === "table" && (
              <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
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
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4">
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
              showInfo={true}
            />
          </div>
        )}

      </CrudLayout>

      {/* Modal de documento */}
      {state.selectedDoc && (
        <DocumentModal
          doc={state.selectedDoc}
          onClose={() => setState(s => ({ ...s, selectedDoc: null }))}
          onSave={saveDocument}
          onDelete={deleteDocument}
        />
      )}
    </>
  );
}