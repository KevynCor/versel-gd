import React, { useState, useRef, useCallback, useMemo } from "react";
import {
  Search, Upload, Download, Loader2, FileText,
  CheckCircle, XCircle, AlertCircle, Info,
  Archive, Calendar, MapPin, FileSpreadsheet, X, Box, Book, Filter, Layers, EyeIcon, Hash
} from "lucide-react";
import * as XLSX from "xlsx";

// --- IMPORTACIONES (Descomenta para tu proyecto real) ---
import { supabase } from "../../utils/supabaseClient"; 
import { CrudLayout } from "../../components/layout/CrudLayout";   
import { SparkleLoader } from "../../components/ui/SparkleLoader"; 
import { EmptyState } from "../../components/ui/EmptyState";       
import ModalDetalleDocumento from "../../components/form/ModalDetalle"; 

/* ===================================================================================
   ESTILOS Y CONFIGURACIÓN DE LA TABLA (DISEÑO TIPO IMAGEN)
   =================================================================================== */

const TABLE_HEADERS = [
  { name: "Código", icon: Hash, className: "w-32" },
  { name: "Descripción del Documento", icon: FileText, className: "min-w-[350px]" },
  { name: "Sección", icon: Layers, className: "w-48" },
  { name: "Periodo", icon: Calendar, className: "w-32" },
  { name: "Ubicación Topográfica", icon: MapPin, className: "w-40" },
  { name: "Estado", icon: Info, className: "w-32" },
  { name: "ACCIONES", icon: null, className: "w-24 text-center" },
];

const parseFecha = (fecha) => fecha ? new Date(fecha).toLocaleDateString('en-CA') : ""; // Formato YYYY-MM-DD

const ubicacionTopografica = (fila) => {
  const { Ambiente, Estante, Cuerpo, Balda } = fila || {};
  const partes = [];
  if (Ambiente) partes.push(Ambiente);
  if (Estante) partes.push(`E${Estante}`);
  if (Cuerpo) partes.push(`C${Cuerpo}`);
  if (Balda) partes.push(`B${Balda}`);
  return partes.join("-");
};

const normalizarVoucher = (input) => {
  if (!input) return null;
  const str = input.toString().trim();

  const matchClasico = str.match(/^(\d+)-(\d{4})$/);
  if (matchClasico) {
    const [, corr, anio] = matchClasico;
    return { correlativo: +corr, anio: +anio, normalizado: `${corr}-${anio}` };
  }

  if (/^\d{12,13}$/.test(str)) {
    const anio = +str.slice(3, 7);
    const corr = +str.slice(7).replace(/^0+/, "");
    return { correlativo: corr, anio, normalizado: `${corr}-${anio}` };
  }

  const matchAnioFinal = str.match(/^(\d+)(\d{4})$/);
  if (matchAnioFinal) {
    const [, corr, anio] = matchAnioFinal;
    const nCorr = +corr.replace(/^0+/, "");
    return { correlativo: nCorr, anio: +anio, normalizado: `${nCorr}-${anio}` };
  }

  return null;
};

// --- COMPONENTES UI INTERNOS ---

const StatItem = ({ label, value, color, icon: Icon }) => (
  <div className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
    <div className={`w-12 h-12 bg-${color}-50 rounded-lg flex items-center justify-center border border-${color}-100`}>
      <Icon className={`w-6 h-6 text-${color}-600`} />
    </div>
    <div>
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</div>
      <div className="font-extrabold text-xl text-slate-800">{value}</div>
    </div>
  </div>
);

const TableHeaderCell = ({ name, icon: Icon, className = "" }) => (
  <th className={`px-6 py-4 text-left text-xs font-extrabold text-slate-600 uppercase tracking-wider border-b border-slate-200 bg-slate-50/80 ${className}`}>
    <div className={`flex items-center gap-2 ${!Icon ? 'justify-center' : ''}`}>
      {/* Icono opcional en header */}
      {name}
    </div>
  </th>
);

const FilaResultado = ({ r, onSelect }) => {
  // Detectar si hay observaciones o tomo faltante para mostrar la alerta amarilla
  const tieneAlerta = (r.tomo_faltante && (r.tomo_faltante === "SI" || r.tomo_faltante === true)) || r.observaciones;
  
  // Estilo para el badge de estado (verde/azul/gris)
  const getStatusColor = (tipo) => {
    if (tipo === 'ARCHIVADOR') return "bg-emerald-50 text-emerald-700 border-emerald-100";
    if (tipo === 'EMPASTADO') return "bg-blue-50 text-blue-700 border-blue-100";
    return "bg-slate-100 text-slate-600 border-slate-200";
  };

  return (
    <tr className="text-sm border-b border-slate-100 hover:bg-slate-50 transition-colors group">
      
      {/* 1. Código */}
      <td className="px-6 py-5 align-center">
        <span className="inline-block bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-mono font-bold border border-slate-200 group-hover:border-slate-300 transition-colors">
          {r.id}
        </span>
      </td>

      {/* 2. Descripción */}
      <td className="px-6 py-2 align-center">
        <div className="flex flex-col gap-1">
          <p className="font-bold text-slate-800 text-sm leading-snug uppercase">
            {r.descripcion}
          </p>
          
          {/* Caja de Alerta Amarilla (Tomo Faltante / Observaciones) */}
          {tieneAlerta && (
            <div className="mt-2 flex items-start gap-2 text-amber-700 bg-amber-50 px-3 py-2 rounded border border-amber-100 w-fit max-w-md">
              <Info size={14} className="mt-0.5 flex-shrink-0 text-amber-600"/>
              <span className="text-[10px] font-bold uppercase leading-tight">
                {r.observaciones || "TOMO CONTIENE FALTANTES"}
              </span>
            </div>
          )}
        </div>
      </td>

      {/* 3. Sección */}
      <td className="px-6 py-2 align-center">
        <p className="text-xs font-bold text-slate-700 uppercase leading-tight max-w-[180px">
          {r.unidad}
        </p>
      </td>

      {/* 4. Periodo */}
      <td className="px-6 py-2 align-center">
        <div className="flex flex-col gap-1.5 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>{r.desde || '-'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>{r.hasta || '-'}</span>
          </div>
        </div>
      </td>

      {/* 5. Ubicación Topográfica */}
      <td className="px-6 py-2 align-center">
        <div className="flex flex-col gap-2 items-start">
          {/* Badge de Caja */}
          <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded border border-slate-200 shadow-sm">
            <Box size={12} className="text-slate-600"/>
            <span className="text-xs font-bold text-slate-700">Caja {r.n_caja}</span>
          </div>
          {/* Código de Ambiente debajo */}
          <span className="text-[10px] text-slate-500 pl-1 font-bold uppercase tracking-wider">
            {r.ubicacion}
          </span>
        </div>
      </td>

      {/* 6. Estado */}
      <td className="px-6 py-2 align-center">
        <div className="flex flex-col gap-1.5 items-start">
          {/* Badge de Estado (Archivador/Empastado) */}
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border w-fit tracking-wide ${getStatusColor(r.tipo_unidad)}`}>
            {r.tipo_unidad || 'S/T'}
          </span>
          
          {/* Detalles de Tomo y Folios */}
          <div className="text-[10px] text-slate-500 pl-1 font-medium">
            {r.n_tomo && <span>T: {r.n_tomo}</span>}
            {r.n_tomo && r.n_folios && <span className="mx-1 text-slate-300">|</span>}
            {r.n_folios && <span>F: {r.n_folios}</span>}
          </div>
        </div>
      </td>

      {/* 7. Acciones */}
      <td className="px-6 py-2 align-center text-center">
        <button
          onClick={() => onSelect(r._original)}
          className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all border border-transparent hover:border-blue-100"
          title="Ver detalle"
        >
          <EyeIcon size={18} strokeWidth={2} />
        </button>
      </td>
    </tr>
  );
};

const StatsResumen = ({ stats, resultados }) => {
  const statItems = [
    { label: "Vouchers Procesados", value: stats.total, color: "blue", icon: FileText },
    { label: "Encontrados", value: stats.encontrados, color: "emerald", icon: CheckCircle },
    { label: "No Encontrados", value: stats.noEncontrados, color: "amber", icon: XCircle },
    { label: "Registros en Tabla", value: resultados.length, color: "slate", icon: Archive },
  ];

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6 shadow-inner">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statItems.map((item) => (
          <StatItem key={item.label} {...item} />
        ))}
      </div>
    </div>
  );
};

/* ===================================================================================
   LÓGICA DEL COMPONENTE
   =================================================================================== */

const useVoucherSearch = () => {
  const [state, setState] = useState({
    voucher: "",
    resultados: [],
    cargando: false,
    procesandoListado: false,
    stats: null,
    selectedDoc: null,
  });
  
  const fileInputRef = useRef(null);

  const buscarVoucherEnBD = useCallback(async ({ correlativo, anio }) => {
    try {
      const { data, error } = await supabase
        .from("Inventario_documental")
        .select("*")
        .eq("Unidad_Organica", "CONTABILIDAD") // Ajusta esto si buscas en todo el inventario
        .gte("Fecha_Final", `${anio}-01-01`)
        .lte("Fecha_Inicial", `${anio}-12-31`);

      if (error) throw error;

      return (data || []).flatMap((fila) => {
        const desc = (fila.Descripcion || "").toUpperCase();

        // Lógica de coincidencia (ajusta según tu necesidad real de regex)
        const enRango = [...desc.matchAll(/(\d+)\s*(?:-|AL)\s*(\d+)/gi)].some(
          ([, ini, fin]) => correlativo >= +ini.replace(/^0+/, "") && correlativo <= +fin.replace(/^0+/, "")
        );
        const esSuelto = (desc.match(/\d+/g) || [])
          .map((n) => +n.replace(/^0+/, ""))
          .includes(correlativo);

        if (!enRango && !esSuelto) return [];

        // Mapeo de campos para la tabla
        return {
          voucherBuscado: `${correlativo}-${anio}`,
          id: fila.id || "",
          n_caja: fila.Numero_Caja || "",
          n_tomo: fila.Numero_Tomo || "",
          descripcion: fila.Descripcion || "",
          n_folios: fila.Numero_Folios || "",
          desde: parseFecha(fila.Fecha_Inicial),
          hasta: parseFecha(fila.Fecha_Final),
          tomo_faltante: fila.Tomo_Faltante || "",
          observaciones: fila.Observaciones || "", // Agregado para mostrar en alerta
          ubicacion: ubicacionTopografica(fila),
          unidad: fila.Unidad_Organica || "",      // Agregado para la columna Sección
          tipo_unidad: fila.Tipo_Unidad_Conservacion || "ARCHIVADOR", // Agregado para el badge
          _original: fila,
        };
      });
    } catch (err) {
      console.error("Error en búsqueda:", err);
      return [];
    }
  }, []);

  const procesarVouchers = useCallback(async (vouchers) => {
    setState((s) => ({ ...s, cargando: true, resultados: [], stats: null }));
    let encontrados = 0, noEncontrados = 0, invalidos = 0;

    const resultados = (
      await Promise.all(vouchers.map(async (v) => {
        const norm = normalizarVoucher(v);
        if (!norm) {
          invalidos++;
          return { voucherBuscado: v, valido: false }; // Objeto simple para inválidos
        }
        const hallados = await buscarVoucherEnBD(norm);
        if (hallados.length) {
          encontrados++;
          return hallados;
        } else {
          noEncontrados++;
          // Retornamos un objeto vacío con datos mínimos para mostrar que no se encontró
          return { 
            voucherBuscado: norm.normalizado, 
            descripcion: "NO ENCONTRADO", 
            id: "-",
            unidad: "-",
            n_caja: "-",
            valido: true 
          };
        }
      }))
    ).flat();

    // Filtrar solo los encontrados para la tabla (o decidir si mostrar los no encontrados)
    // En este caso, mostraremos todos, pero los no encontrados tendrán datos vacíos.
    const resultadosFiltrados = resultados.filter(r => r.id !== "-");

    setState((s) => ({
      ...s,
      voucher: "",
      resultados: resultadosFiltrados,
      cargando: false,
      procesandoListado: false,
      stats: { total: vouchers.length, encontrados, noEncontrados, invalidos },
    }));
  }, [buscarVoucherEnBD]);

  const buscarVoucher = useCallback(() => {
    const lista = state.voucher.split(",").map((v) => v.trim()).filter(Boolean);
    if (lista.length) procesarVouchers(lista);
  }, [state.voucher, procesarVouchers]);

  const procesarExcel = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    fileInputRef.current.value = "";
    setState((s) => ({ ...s, procesandoListado: true, resultados: [] }));
    
    const reader = new FileReader();
    reader.onload = ({ target }) => {
      try {
        const wb = XLSX.read(target.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });        
        const vouchers = data.slice(1).map((row) => row[0]).filter(Boolean);
        procesarVouchers(vouchers);
      } catch (err) {
        console.error("Error Excel:", err);
        setState((s) => ({ ...s, procesandoListado: false }));
      }
    };
    reader.readAsBinaryString(file);
  }, [procesarVouchers]);

  const exportar = useCallback(() => {
    if (!state.resultados.length) return;
    const ws = XLSX.utils.json_to_sheet(state.resultados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Resultados");
    XLSX.writeFile(wb, "resultados_vouchers.xlsx");
  }, [state.resultados]);

  return { state, setState, fileInputRef, buscarVoucher, procesarExcel, exportar };
};

export default function BusquedaVoucher() {
  const { state, setState, fileInputRef, buscarVoucher, procesarExcel, exportar } = useVoucherSearch();
  const { stats, resultados, selectedDoc, cargando, procesandoListado, voucher } = state;
  const isLoading = cargando || procesandoListado;

  const ejemplosVoucher = useMemo(() => ["001201612694", "6500000107-2017", "3100001245-2018"], []);

  return (
    <CrudLayout 
      title="Búsqueda de Vouchers" 
      icon={Search}
      description="Consulta masiva de comprobantes contables y su ubicación topográfica."
    >
      {/* Panel de Instrucciones */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 mb-8 flex flex-col lg:flex-row items-start gap-6">
        <div className="flex-1 space-y-4">
           <div className="flex items-start gap-3">
              <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600 border border-blue-100 shrink-0">
                 <Info size={24} />
              </div>
              <div>
                 <h3 className="text-lg font-bold text-slate-800">Instrucciones de Búsqueda</h3>
                 <p className="text-slate-600 mt-1 text-sm leading-relaxed">
                    Ingrese el número de voucher y el año separados por coma (Ej: <code className="text-xs">6500001017-2021, 001201612694,...</code>). 
                 </p>
              </div>
           </div>
           <div className="flex flex-wrap gap-2 pl-14">
              {ejemplosVoucher.map((ej) => (
                <span key={ej} className="bg-slate-100 text-slate-600 px-3 py-1 rounded-md text-xs font-mono border border-slate-200 font-medium">
                  {ej}
                </span>
              ))}
            </div>
        </div>
        
        <div className="w-full lg:w-auto flex flex-col gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Busqueda Masiva</label>
            <label className="flex items-center justify-center gap-2 bg-white border border-slate-300 hover:border-emerald-500 hover:text-emerald-600 text-slate-600 px-6 py-3 rounded-lg cursor-pointer text-sm font-bold shadow-sm transition-all group w-full lg:w-64">
                <FileSpreadsheet className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">Importar desde Excel</span>
                <input
                    type="file"
                    accept=".xls,.xlsx"
                    onChange={procesarExcel}
                    disabled={isLoading}
                    className="hidden"
                    ref={fileInputRef}
                />
            </label>
        </div>
      </div>

      {/* Panel de Estadísticas */}
      {stats && <StatsResumen stats={stats} resultados={resultados} />}

      {/* Barra de Búsqueda */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
           <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
           </div>
           <input
             type="text"
             value={voucher}
             onChange={(e) => setState((s) => ({ ...s, voucher: e.target.value }))}
             onKeyDown={(e) => e.key === "Enter" && !isLoading && buscarVoucher()}
             placeholder="Ingrese vouchers aquí..."
             className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
             disabled={isLoading}
           />
        </div>
        <button
            onClick={buscarVoucher}
            disabled={isLoading || !voucher.trim()}
            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg text-sm font-bold uppercase tracking-wide transition-all shadow-md hover:shadow-lg justify-center"
          >
            {cargando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            <span>{cargando ? "Buscando..." : "Buscar"}</span>
        </button>
      </div>

      {procesandoListado && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8 flex flex-col items-center justify-center gap-3 animate-pulse">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          <div className="text-center">
            <div className="font-bold text-amber-800 text-lg">Procesando archivo masivo</div>
            <div className="text-amber-700 text-sm">Analizando registros...</div>
          </div>
        </div>
      )}      

      {cargando ? (
        <SparkleLoader />
      ) : resultados.length === 0 ? (
        <EmptyState 
          title="Lista de Resultados Vacía" 
          message="Utilice el buscador o importe un Excel para ver los resultados aquí."
          icon={Filter}
        />
      ) : (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col">
          {/* Header de Tabla */}
          <div className="px-6 py-5 border-b border-slate-200 bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
             <div className="flex items-center gap-3">
                <div className="bg-slate-100 p-2 rounded-lg text-slate-500">
                    <Archive className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-base font-extrabold text-slate-800 uppercase tracking-wide">Resultados</h3>
                    <p className="text-xs text-slate-500 font-medium">{resultados.length} registros encontrados</p>
                </div>
             </div>
             
             <button
               onClick={exportar}
               className="flex items-center gap-2 bg-white border border-slate-300 hover:border-emerald-500 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 px-4 py-2 rounded-lg transition-all text-sm font-bold shadow-sm"
             >
               <Download className="w-4 h-4" />
               Exportar Excel
             </button>
          </div>

          <div className="overflow-auto max-h-[75vh] w-full">
            <table className="w-full border-collapse text-sm min-w-[1200px]">
              <thead className="sticky top-0 z-20 shadow-sm">
                <tr>
                  {TABLE_HEADERS.map((header) => (
                    <TableHeaderCell key={header.name} {...header} />
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {resultados.map((r, i) => (
                  <FilaResultado
                    key={i}
                    r={r}
                    onSelect={(doc) => setState((s) => ({ ...s, selectedDoc: doc }))}
                  />
                ))}
              </tbody>
            </table>
          </div>
          
        </div>
      )}

      {selectedDoc && (
        <ModalDetalleDocumento
          doc={selectedDoc}
          onClose={() => setState((s) => ({ ...s, selectedDoc: null }))}
        />
      )}
    </CrudLayout>
  );
}