import React, { useState, useRef, useCallback, useMemo } from "react";
import { supabase } from "../utils/supabaseClient";
import { CrudLayout } from "../components/layout/CrudLayout";
import { SparkleLoader } from "../components/ui/SparkleLoader";
import { EmptyState } from "../components/ui/EmptyState";
import ModalDetalleDocumento from "../components/form/ModalDetalle";
import {
  Search, Upload, Download, Loader2, FileText,
  CheckCircle, XCircle, AlertCircle, Info,
  Archive, Calendar, MapPin
} from "lucide-react";
import * as XLSX from "xlsx";

const ICON_SIZE = 16;
const TABLE_HEADERS = [
  { name: "Voucher Buscado", icon: Search },
  { name: "ID", icon: FileText },
  { name: "Caja", icon: Archive },
  { name: "Tomo", icon: FileText },
  { name: "Descripción", icon: Info, className: "min-w-[220px]" },
  { name: "Folios", icon: FileText },
  { name: "Desde", icon: Calendar },
  { name: "Hasta", icon: Calendar },
  { name: "T. Faltante", icon: AlertCircle },
  { name: "Ubicación", icon: MapPin },
];

const parseFecha = (fecha) => fecha ? new Date(fecha).toLocaleDateString() : "";
const ubicacionTopografica = (fila) => {
  const { Estante, Cuerpo, Balda } = fila || {};
  const partes = [];
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

const StatItem = ({ label, value, color, icon: Icon }) => (
  <div className="flex items-center gap-2">
    <div className={`w-10 h-10 bg-${color}-100 rounded-full flex items-center justify-center`}>
      <Icon className={`w-5 h-5 text-${color}-600`} />
    </div>
    <div>
      <div className="text-sm text-slate-600">{label}</div>
      <div className={`font-bold text-lg text-${color}-700`}>{value}</div>
    </div>
  </div>
);

const TableHeaderCell = ({ name, icon: Icon, className = "" }) => (
  <th className={`px-3 py-3 text-left font-semibold text-slate-800 border-b border-slate-200 text-sm ${className}`}>
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-slate-600" />
      {name}
    </div>
  </th>
);

const FilaResultado = ({ r, onSelect }) => {
  const tieneTomoFaltante = r.tomo_faltante && r.tomo_faltante !== "-";
  
  const celdas = [
    { valor: r.voucherBuscado, align: "left" },
    { valor: r.id, align: "left", clickable: true },
    { valor: r.n_caja || "-", align: "center" },
    { valor: r.n_tomo || "-", align: "center" },
    { valor: r.descripcion || "-", align: "left" },
    { valor: r.n_folios || "-", align: "center" },
    { valor: r.desde || "-", align: "center" },
    { valor: r.hasta || "-", align: "center" },
    { 
      valor: r.tomo_faltante || "-", 
      align: "center",
    },
    { valor: r.ubicacion || "-", align: "left" },
  ];

  return (
    <tr className={`text-sm border-b border-slate-100 ${tieneTomoFaltante ? "bg-red-50 hover:bg-red-100" : "hover:bg-slate-50"}`}>
      {celdas.map(({ valor, align, clickable }, i) => (
        <td
          key={i}
          className={`px-3 py-3 ${align === "center" ? "text-center" : "text-left"} 
            ${(i === 1 || i === 9) ? "font-mono text-sm" : ""}
            ${tieneTomoFaltante ? "text-red-700 font-medium" : "text-slate-800"}`}
          title={i === 4 ? valor : undefined}
        >
          {clickable && r.id ? (
            <button
              onClick={() => onSelect(r._original)}
              className={`text-blue-600 hover:underline text-sm font-medium hover:text-blue-800 transition-colors ${tieneTomoFaltante ? "hover:text-red-900" : ""}`}
            >
              {valor}
            </button>
          ) : i === 8 && tieneTomoFaltante ? ( // Celda de T. Faltante con icono
            <span className="flex items-center justify-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {valor}
            </span>
          ) : (
            <span>{valor}</span>
          )}
        </td>
      ))}
    </tr>
  );
};

const StatsResumen = ({ stats, resultados }) => {
  const statItems = [
    { label: "Total", value: stats.total, color: "blue", icon: FileText },
    { label: "Encontrados", value: stats.encontrados, color: "green", icon: CheckCircle },
    { label: "No encontrados", value: stats.noEncontrados, color: "yellow", icon: XCircle },
    { label: "Inválidos", value: stats.invalidos, color: "red", icon: AlertCircle },
    { label: "Resultados", value: resultados.length, color: "indigo", icon: Archive },
  ];

  return (
    <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg p-4 mb-3">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statItems.map((item) => (
          <StatItem key={item.label} {...item} />
        ))}
      </div>
    </div>
  );
};

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
        .eq("Unidad_Organica", "CONTABILIDAD")
        .gte("Fecha_Final", `${anio}-01-01`)
        .lte("Fecha_Inicial", `${anio}-12-31`);

      if (error) throw error;

      return (data || []).flatMap((fila) => {
        const desc = (fila.Descripcion || "").toUpperCase();

        const enRango = [...desc.matchAll(/(\d+)\s*(?:-|AL)\s*(\d+)/gi)].some(
          ([, ini, fin]) => correlativo >= +ini.replace(/^0+/, "") && correlativo <= +fin.replace(/^0+/, "")
        );

        const esSuelto = (desc.match(/\d+/g) || [])
          .map((n) => +n.replace(/^0+/, ""))
          .includes(correlativo);

        if (!enRango && !esSuelto) return [];

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
          ubicacion: ubicacionTopografica(fila),
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
          return { voucherBuscado: v, valido: false };
        }
        const hallados = await buscarVoucherEnBD(norm);
        if (hallados.length) {
          encontrados++;
          return hallados;
        } else {
          noEncontrados++;
          return { voucherBuscado: norm.normalizado, valido: true };
        }
      }))
    ).flat();

    setState((s) => ({
      ...s,
      voucher: "",
      resultados,
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
        const vouchers = data.flat().slice(1).filter(Boolean);
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
    const headers = [
      "Voucher Buscado", "ID", "N° Caja", "N° Tomo", "Descripción",
      "N° Folios", "Desde", "Hasta", "Tomo Faltante", "Ubicación"
    ];
    const ws = XLSX.utils.aoa_to_sheet([
      headers,
      ...state.resultados.map((r) => [
        r.voucherBuscado, r.id, r.n_caja, r.n_tomo, r.descripcion,
        r.n_folios, r.desde, r.hasta, r.tomo_faltante, r.ubicacion
      ])
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Resultados");
    XLSX.writeFile(wb, "resultados_vouchers.xlsx");
  }, [state.resultados]);

  return { 
    state, 
    setState, 
    fileInputRef, 
    buscarVoucher, 
    procesarExcel, 
    exportar 
  };
};

export default function BusquedaVoucher() {
  const { state, setState, fileInputRef, buscarVoucher, procesarExcel, exportar } = useVoucherSearch();
  const { stats, resultados, selectedDoc, cargando, procesandoListado, voucher } = state;
  const isLoading = cargando || procesandoListado;

  const ejemplosVoucher = useMemo(() => ["001201612694", "6500000107-2017", "3100001245-2018"], []);

  return (
    <CrudLayout title="Búsqueda de Voucher" icon={Search}>
      <div className="flex flex-col lg:flex-row gap-4 mb-4">
        <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg p-4 text-base text-blue-800 flex items-start gap-3">            
          <Info className="w-5 h-5 mt-0.5 text-blue-600 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <p className="font-semibold text-blue-900">¿Cómo buscar?</p>
            <p>Ingresa número de voucher-año, separados por coma o carga un archivo Excel, con el formato siguiente:</p>
            <div className="flex gap-2 flex-wrap">
              {ejemplosVoucher.map((ej) => (
                <code key={ej} className="bg-blue-100 px-2 py-1 rounded text-sm font-mono border border-blue-200">{ej}</code>
              ))}
            </div>
          </div>
        </div>    
        
        {stats && (
          <div className="lg:w-2/4">
            <StatsResumen stats={stats} resultados={resultados} />
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="text"
          value={voucher}
          onChange={(e) => setState((s) => ({ ...s, voucher: e.target.value }))}
          onKeyDown={(e) => e.key === "Enter" && !isLoading && buscarVoucher()}
          placeholder="Ej: 001201612694, 3040-2016, 6500000107-2017..."
          className="flex-1 px-4 py-3 border border-slate-300 rounded-lg text-base focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          disabled={isLoading}
        />
        <div className="flex gap-3">
          <button
            onClick={buscarVoucher}
            disabled={isLoading || !voucher.trim()}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg text-base font-medium transition-colors min-w-[100px] justify-center"
          >
            {cargando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            <span className="hidden sm:inline">{cargando ? "Buscando..." : "Buscar"}</span>
          </button>
          <label className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 disabled:bg-gray-200 text-slate-700 px-4 py-3 rounded-lg cursor-pointer text-base font-medium transition-colors">
            <Upload className="w-5 h-5" />
            <span className="hidden sm:inline">Excel</span>
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

      {procesandoListado && (
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-4 mb-5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-yellow-600" />
            </div>
            <div>
              <div className="font-semibold text-yellow-900 text-base">Procesando archivo Excel</div>
              <div className="text-yellow-800 text-sm">Analizando vouchers del archivo cargado...</div>
            </div>
          </div>
        </div>
      )}      

      {cargando ? (
        <SparkleLoader />
      ) : resultados.length === 0 ? (
        <EmptyState title="Sin resultados" message="Busca un voucher o carga un listado para comenzar." />
      ) : (
        <div className="bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden">
          <div className="overflow-auto max-h-[65vh] border-b border-slate-200">
            <table className="w-full border-collapse text-base min-w-[900px]">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100 sticky top-0 z-10">
                <tr>
                  {TABLE_HEADERS.map((header) => (
                    <TableHeaderCell key={header.name} {...header} />
                  ))}
                </tr>
              </thead>
              <tbody>
                {resultados.map((r, i) => ( <FilaResultado key={i} r={r} onSelect={(doc) => setState((s) => ({ ...s, selectedDoc: doc }))}/>))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <Archive className="w-5 h-5 text-slate-600" />
              <span className="text-base text-slate-700 font-medium">
                {resultados.length} resultado{resultados.length !== 1 ? "s" : ""}
              </span>
            </div>
            <button
              onClick={exportar}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-base font-medium transition-colors shadow-sm hover:shadow-md"
            >
              <Download className="w-5 h-5" />
              <span className="hidden sm:inline">Exportar Excel</span>
            </button>
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