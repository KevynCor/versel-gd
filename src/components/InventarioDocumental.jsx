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
import { 
  BookOpen, FileText, Package, Archive, Calendar, 
  Building2, AlertTriangle, CheckCircle, Clock,
  Download, Upload, Filter, RefreshCw, Plus
} from "lucide-react";

// Componente de filtros avanzados
const AdvancedFilters = ({ filters, onFiltersChange, areas, tiposDocumento, contratistas }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filtros Avanzados
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          {isExpanded ? 'Contraer' : 'Expandir'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Búsqueda general */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Búsqueda General
          </label>
          <SearchBar
            value={filters.search || ""}
            onChange={(value) => updateFilter('search', value)}
            placeholder="ID, descripción, código..."
          />
        </div>

        {/* Tipo de documento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Documento
          </label>
          <select
            value={filters.tipoDocumento || ""}
            onChange={(e) => updateFilter('tipoDocumento', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Todos los tipos</option>
            {tiposDocumento.map(tipo => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>
        </div>

        {/* Área responsable */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Área Responsable
          </label>
          <select
            value={filters.area || ""}
            onChange={(e) => updateFilter('area', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Todas las áreas</option>
            {areas.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>

        {/* Contratista del Inventario */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contratista
          </label>
          <select
            value={filters.Contratista || ""}
            onChange={(e) => updateFilter('estado', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Todos los contratistas</option>
            {contratistas.map(Contratista => (
              <option key={Contratista} value={Contratista}>{Contratista}</option>
            ))}
          </select>
        </div>

        {isExpanded && (
          <>
            {/* Rango de fechas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Desde
              </label>
              <input
                type="date"
                value={filters.fechaDesde || ""}
                onChange={(e) => updateFilter('fechaDesde', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Hasta
              </label>
              <input
                type="date"
                value={filters.fechaHasta || ""}
                onChange={(e) => updateFilter('fechaHasta', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Frecuencia de consulta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frecuencia de Consulta
              </label>
              <select
                value={filters.frecuenciaConsulta || ""}
                onChange={(e) => updateFilter('frecuenciaConsulta', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Todas</option>
                <option value="Alta">ALTA</option>
                <option value="Media">MEDIA</option>
                <option value="Baja">BAJA</option>
              </select>
            </div>

            {/* Número de caja */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Caja
              </label>
              <input
                type="text"
                value={filters.numeroCaja || ""}
                onChange={(e) => updateFilter('numeroCaja', e.target.value)}
                placeholder="Ej: 001"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={() => onFiltersChange({})}
          className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Limpiar Filtros
        </button>
        <div className="text-sm text-gray-500 flex items-center ml-auto">
          Filtros activos: {Object.keys(filters).filter(key => filters[key] && filters[key] !== "").length}
        </div>
      </div>
    </div>
  );
};

// Componente del modal de documento
const DocumentModal = ({ doc, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState({
    id: "",
    Descripcion: "",
    Unidad_Organica: "",
    Serie_Documental: "",
    Subserie_Documental: "",
    Tipo_Documento: "",
    Numero_Caja: "",
    Numero_Tomo: "",
    Numero_Folio: "",
    Fecha_Inicial: "",
    Fecha_Final: "",
    Frecuencia_Consulta: "",
    Estado: "",
    Ubicacion_Fisica: "",
    Observaciones: "",
    ...doc
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.Descripcion?.trim()) newErrors.Descripcion = "La descripción es obligatoria";
    if (!formData.Unidad_Organica?.trim()) newErrors.Unidad_Organica = "La unidad orgánica es obligatoria";
    if (!formData.Serie_Documental?.trim()) newErrors.Serie_Documental = "La serie documental es obligatoria";
    if (!formData.Tipo_Documento?.trim()) newErrors.Tipo_Documento = "El tipo de documento es obligatorio";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const InputField = ({ label, field, type = "text", required = false, placeholder = "" }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={formData[field] || ""}
        onChange={(e) => handleChange(field, e.target.value)}
        placeholder={placeholder}
        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
          errors[field] ? 'border-red-500' : 'border-gray-300'
        }`}
      />
      {errors[field] && <p className="text-red-500 text-xs mt-1">{errors[field]}</p>}
    </div>
  );

  const SelectField = ({ label, field, options, required = false }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={formData[field] || ""}
        onChange={(e) => handleChange(field, e.target.value)}
        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
          errors[field] ? 'border-red-500' : 'border-gray-300'
        }`}
      >
        <option value="">Seleccionar...</option>
        {options.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      {errors[field] && <p className="text-red-500 text-xs mt-1">{errors[field]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">
              {doc.id ? 'Editar Documento' : 'Nuevo Documento'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="ID/Código" field="id" placeholder="Ej: 2024-00001" />
            <InputField label="Unidad Orgánica" field="Unidad_Organica" required placeholder="Área responsable" />
            <InputField label="Sigla" field="Sigla" required placeholder="Sigla Unidad" />
            <InputField label="Descripción" field="Descripcion" required placeholder="Descripción del documento" /> 
            <InputField label="Serie Documental" field="Serie_Documental" required placeholder="Ej: Correspondencia"/>
            <InputField label="Fecha Inicial" field="Fecha_Inicial" type="date" />
            <InputField label="Fecha Final" field="Fecha_Final" type="date" />                  
            <InputField label="Número de Caja" field="Numero_Caja" placeholder="Ej: 135" />
            <InputField label="Número de Tomo" field="Numero_Tomo" placeholder="Ej: 1" />
            <InputField label="Número de Folio" field="Numero_Folio" placeholder="Ej: 150" />
            <SelectField label="Soporte" field="Soporte" options={["FISICO", "DIGITAL"]}/>
            <SelectField label="Frecuencia de Consulta" field="Frecuencia_Consulta" options={["ALTA", "MEDIA", "BAJA"]}/>
            <SelectField  label="Estado"  field="Estado" options={["Activo", "Inactivo", "En revisión", "Archivado", "Digitalizado"]} />
            <InputField label="Estante" field="Estante" placeholder="EJ: 1" />
            <InputField label="Cuerpo" field="Cuerpo" placeholder="Ej: A" />
            <InputField label="Balda" field="Balda" placeholder="Ej: 3" />
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones
            </label>
            <textarea
              value={formData.Observaciones || ""}
              onChange={(e) => handleChange('Observaciones', e.target.value)}
              placeholder="Observaciones adicionales..."
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField label="Analista" field="Analista" placeholder="Ej: Kevyn" />
              <InputField label="Fecha Inventario" field="Fecha_Inventario" placeholder="Ej: 12/07/2025" />
              <InputField label="Contratista" field="Contratista" placeholder="Ej: Contratista S.A.C." />
              <InputField label="Número de Entregable" field="Numero_Entregable" placeholder="Ej: 5" />
            </div>
          </div>

          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <div>
              {doc.id && (
                <button
                  type="button"
                  onClick={() => onDelete(doc.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Eliminar
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {doc.id ? 'Actualizar' : 'Crear'}
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
  
  // Filtros avanzados
  const [filters, setFilters] = useState({});

  // Opciones para filtros (en un caso real, estos vendrían de la BD)
  const areas = useMemo(() => 
    [...new Set(data.documentos.map(d => d.Unidad_Organica).filter(Boolean))],
    [data.documentos]
  );

  const tiposDocumento = useMemo(() => 
    [...new Set(data.documentos.map(d => d.Tipo_Documento).filter(Boolean))],
    [data.documentos]
  );

  const contratistas = useMemo(() => 
    [...new Set(data.documentos.map(d => d.Contratista).filter(Boolean))],
    [data.documentos]
  );

  // Función para mostrar mensajes
  const showMessage = (mensaje, tipo) => 
    setState(s => ({ ...s, mensaje: { mensaje, tipo } }));

  // Función principal para obtener documentos
  const fetchDocuments = useCallback(async (page = 0) => {
    setState(s => ({ ...s, loading: true }));
    
    try {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      
      let query = supabase
        .from("Inventario_documental")
        .select("*", { count: "exact" })
        .order("id", { ascending: false })
        .range(from, to);

      // Aplicar filtros
      if (filters.search?.trim()) {
        query = query.or(`id.ilike.%${filters.search}%,Descripcion.ilike.%${filters.search}%,Serie_Documental.ilike.%${filters.search}%`);
      }
      
      if (filters.tipoDocumento) {
        query = query.eq('Tipo_Documento', filters.tipoDocumento);
      }
      
      if (filters.area) {
        query = query.eq('Unidad_Organica', filters.area);
      }
      
      if (filters.contratista) {
        query = query.eq('Contratista', filters.contratista);
      }
      
      if (filters.frecuenciaConsulta) {
        query = query.eq('Frecuencia_Consulta', filters.frecuenciaConsulta);
      }
      
      if (filters.numeroCaja) {
        query = query.ilike('Numero_Caja', `%${filters.numeroCaja}%`);
      }
      
      if (filters.fechaDesde) {
        query = query.gte('Fecha_Inicial', filters.fechaDesde);
      }
      
      if (filters.fechaHasta) {
        query = query.lte('Fecha_Final', filters.fechaHasta);
      }

      const { data: docs, count, error } = await query;
      
      if (error) throw error;
      
      setData({ documentos: docs || [] });
      setState(s => ({ ...s, page, total: count || 0, loading: false }));
      
    } catch (error) {
      showMessage("Error al cargar documentos", "error");
      setState(s => ({ ...s, loading: false }));
    }
  }, [filters, pageSize]);

  // Efecto para cargar datos cuando cambian los filtros
  useEffect(() => {
    fetchDocuments(0);
  }, [filters]);

  // Efecto para cargar datos iniciales
  useEffect(() => {
    fetchDocuments(state.page);
  }, [fetchDocuments]);

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
      fetchDocuments(state.page);
      
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
      fetchDocuments(state.page);
      
    } catch (error) {
      showMessage("Error al eliminar el documento", "error");
    }
  };

  // Función para exportar a Excel
  const exportToExcel = async () => {
    if (!data.documentos.length) {
      return showMessage("No hay datos para exportar", "warning");
    }

    try {
      // Obtener todos los datos sin paginación
      const { data: allDocs } = await supabase
        .from("Inventario_documental")
        .select("*")
        .order("id", { ascending: false });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(allDocs || []);
      
      XLSX.utils.book_append_sheet(wb, ws, "Inventario Documental");
      XLSX.writeFile(wb, `inventario_documental_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      showMessage("Archivo exportado exitosamente", "success");
      
    } catch (error) {
      showMessage("Error al exportar el archivo", "error");
    }
  };

  // Función para importar desde Excel
  const importFromExcel = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target.result;
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
        fetchDocuments(0);
        
      } catch (error) {
        showMessage("Error al importar el archivo", "error");
      }
    };

    reader.readAsArrayBuffer(file);
    event.target.value = ''; // Reset input
  };

  // Definición de columnas para la tabla
  const columns = [
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
          <div className="text-gray-500">
            {doc.Tipo_Documento || 'Sin tipo'}
          </div>
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
            {doc.Estante || doc.Cuerpo || doc.Balda ? [ doc.Estante ? `E${doc.Estante}` : null, doc.Cuerpo ? `C${doc.Cuerpo}` : null, doc.Balda ? `B${doc.Balda}` : null ].filter(Boolean).join("-") : "Sin ubicación"}
          </div>
        </div>
      )
    },
    { 
      label: "Contratista/Consulta", 
      key: "estado", 
      render: (doc) => (
        <div className="flex flex-col gap-1">
          {/* <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            doc.Estado === 'Activo' ? 'bg-green-100 text-green-800' :
            doc.Estado === 'Inactivo' ? 'bg-red-100 text-red-800' :
            doc.Estado === 'En revisión' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {doc.Estado || 'Sin estado'}
          </span> */}
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium" >
            {doc.Contratista}
          </span>
          {doc.Frecuencia_Consulta && (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
              doc.Frecuencia_Consulta === 'Alta' ? 'bg-orange-100 text-orange-800' :
              doc.Frecuencia_Consulta === 'Media' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {doc.Frecuencia_Consulta}
            </span>
          )}
        </div>
      )
    },
  ];

  // Función para renderizar acciones de la tabla
  const renderActions = (doc) => (
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
  );

  // Función para renderizar tarjetas
  const renderCard = (doc) => (
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

        <div className="flex items-center justify-between pt-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            doc.Estado === 'Activo' ? 'bg-green-100 text-green-800' :
            doc.Estado === 'Inactivo' ? 'bg-red-100 text-red-800' :
            doc.Estado === 'En revisión' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {doc.Estado || 'Sin estado'}
          </span>
          
          {doc.Frecuencia_Consulta && (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
              doc.Frecuencia_Consulta === 'Alta' ? 'bg-orange-100 text-orange-800' :
              doc.Frecuencia_Consulta === 'Media' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {doc.Frecuencia_Consulta}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  // Cálculo de estadísticas
  const stats = useMemo(() => {
    const docs = data.documentos;
    return {
      total: state.total,
      activos: docs.filter(d => d.Estado === 'Activo').length,
      altaConsulta: docs.filter(d => d.Frecuencia_Consulta === 'ALTA').length,
      conCaja: docs.filter(d => d.Numero_Caja).length,
      digitalizados: docs.filter(d => d.Estado === 'Digitalizado').length,
      series: new Set(docs.map(d => d.Serie_Documental).filter(Boolean)).size
    };
  }, [data.documentos, state.total]);

  return (
    <>
      <CrudLayout 
        title="Sistema de Inventario Documental" 
        icon={BookOpen}
        subtitle="Gestión avanzada del patrimonio documental institucional"
      >
        {/* Toast de notificaciones */}
        {state.mensaje && (
          <Toast 
            {...state.mensaje} 
            onClose={() => setState(s => ({ ...s, mensaje: null }))} 
          />
        )}

        {/* Panel de estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard 
            title="Total Documentos" 
            value={stats.total} 
            icon={FileText} 
            color="from-blue-600 to-blue-700"
            subtitle="Registros totales"
          />
          <StatCard 
            title="Documentos Activos" 
            value={stats.activos} 
            icon={CheckCircle} 
            color="from-green-600 to-green-700"
            subtitle="En uso actual"
          />
          <StatCard 
            title="Alta Consulta" 
            value={stats.altaConsulta} 
            icon={Clock} 
            color="from-orange-600 to-orange-700"
            subtitle="Frecuentemente consultados"
          />
          <StatCard 
            title="Con Ubicación" 
            value={stats.conCaja} 
            icon={Package} 
            color="from-purple-600 to-purple-700"
            subtitle="Documentos ubicados"
          />
          <StatCard 
            title="Digitalizados" 
            value={stats.digitalizados} 
            icon={Archive} 
            color="from-indigo-600 to-indigo-700"
            subtitle="Versión digital"
          />
          <StatCard 
            title="Series Documentales" 
            value={stats.series} 
            icon={Building2} 
            color="from-teal-600 to-teal-700"
            subtitle="Tipos de series"
          />
        </div>

        {/* Filtros avanzados */}
        <AdvancedFilters 
          filters={filters}
          onFiltersChange={setFilters}
          areas={areas}
          tiposDocumento={tiposDocumento}
          contratistas={contratistas}
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
                <span>Mostrando {data.documentos.length} de {state.total.toLocaleString()}</span>
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
                onClick={() => fetchDocuments(state.page)}
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
          <SparkleLoader message="Cargando documentos..." />
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
                setState(s => ({ ...s, page: newPage }));
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