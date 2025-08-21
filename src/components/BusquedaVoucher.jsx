import React, { useState, useRef } from "react";
import { supabase } from "../utils/supabaseClient";
import { CrudLayout } from "../components/layout/CrudLayout";
import { SparkleLoader } from "../components/ui/SparkleLoader";
import { EmptyState } from "../components/ui/EmptyState";
import ModalDetalleDocumento from "../components/form/ModalDetalle";
import { Search, Upload, Download, Loader2, FileText, CheckCircle, XCircle, AlertCircle, Info, Archive, Calendar, MapPin } from "lucide-react";
import * as XLSX from "xlsx";

/* ----------------- Normalizar voucher ----------------- */
const normalizarVoucher = (input) => {
  if (!input) return null;
  input = input.toString().trim();

  const matchClasico = input.match(/^(\d+)-(\d{4})$/);
  if (matchClasico) {
    const [, corr, anio] = matchClasico;
    return { correlativo: +corr, anio: +anio, normalizado: `${corr}-${anio}` };
  }

  if (/^\d{12,13}$/.test(input)) {
    const anio = +input.slice(3, 7);
    const corr = +input.slice(7).replace(/^0+/, "");
    return { correlativo: corr, anio, normalizado: `${corr}-${anio}` };
  }

  const matchAnioFinal = input.match(/^(\d+)(\d{4})$/);
  if (matchAnioFinal) {
    const [, corr, anio] = matchAnioFinal;
    const nCorr = +corr.replace(/^0+/, "");
    return { correlativo: nCorr, anio: +anio, normalizado: `${nCorr}-${anio}` };
  }

  return null;
};

/* ----------------- Buscar en Supabase ----------------- */
const buscarVoucherEnBD = async ({ correlativo, anio }) => {
  try {
    const { data } = await supabase
      .from("Inventario_documental")
      .select("*")
      .eq("Unidad_Organica", "CONTABILIDAD")
      .gte("Fecha_Final", `${anio}-01-01`)
      .lte("Fecha_Inicial", `${anio}-12-31`);

    return (data || []).flatMap((fila) => {
      const desc = (fila.Descripcion || "").toUpperCase();

      const enRango = [...desc.matchAll(/(\d+)\s*(?:-|AL)\s*(\d+)/gi)].some(
        ([, ini, fin]) =>
          correlativo >= +ini.replace(/^0+/, "") &&
          correlativo <= +fin.replace(/^0+/, "")
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
        desde: fila.Fecha_Inicial
          ? new Date(fila.Fecha_Inicial).toLocaleDateString()
          : "",
        hasta: fila.Fecha_Final
          ? new Date(fila.Fecha_Final).toLocaleDateString()
          : "",
        tomo_faltante: fila.Tomo_Faltante || "",
        ubicacion: `E${fila.Estante || ""}-C${fila.Cuerpo || ""}-B${
          fila.Balda || ""
        }`,
        _original: fila,
      };
    });
  } catch (err) {
    console.error("Error en búsqueda:", err);
    return [];
  }
};

/* ----------------- Componentes UI ----------------- */
const FilaResultado = ({ r, onSelect }) => {
  const celdas = [
    { valor: r.voucherBuscado, align: "left" },
    { valor: r.id, align: "left", clickable: true },
    { valor: r.n_caja || "-", align: "center" },
    { valor: r.n_tomo || "-", align: "center" },
    { valor: r.descripcion || "-", align: "left" },
    { valor: r.n_folios || "-", align: "center" },
    { valor: r.desde || "-", align: "center" },
    { valor: r.hasta || "-", align: "center" },
    { valor: r.tomo_faltante || "-", align: "center" },
    { valor: r.ubicacion || "-", align: "left" },
  ];

  return (
    <tr className="hover:bg-slate-50 text-xs">
      {celdas.map(({ valor, align, clickable }, i) => (
        <td
          key={i}
          className={`border border-slate-200 px-2 py-1.5 ${
            align === "center" ? "text-center" : ""
          } ${i === 1 || i === 9 ? "font-mono text-xs" : ""} ${
            i === 4 ? "max-w-[200px] truncate" : ""
          }`}
          title={i === 4 ? valor : undefined}
        >
          {clickable && r.id ? (
            <button
              onClick={() => onSelect(r._original)}
              className="text-blue-600 hover:underline text-xs"
            >
              {valor}
            </button>
          ) : (
            valor
          )}
        </td>
      ))}
    </tr>
  );
};

const StatsResumen = ({ stats, resultados }) => (
  <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg p-3 mb-3">
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <FileText className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <div className="text-xs text-slate-500">Total</div>
          <div className="font-bold text-sm text-slate-800">{stats.total}</div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-4 h-4 text-green-600" />
        </div>
        <div>
          <div className="text-xs text-slate-500">Encontrados</div>
          <div className="font-bold text-sm text-green-700">{stats.encontrados}</div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
          <XCircle className="w-4 h-4 text-yellow-600" />
        </div>
        <div>
          <div className="text-xs text-slate-500">No encontrados</div>
          <div className="font-bold text-sm text-yellow-700">{stats.noEncontrados}</div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
          <AlertCircle className="w-4 h-4 text-red-600" />
        </div>
        <div>
          <div className="text-xs text-slate-500">Inválidos</div>
          <div className="font-bold text-sm text-red-600">{stats.invalidos}</div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
          <Archive className="w-4 h-4 text-indigo-600" />
        </div>
        <div>
          <div className="text-xs text-slate-500">Resultados</div>
          <div className="font-bold text-sm text-indigo-700">{resultados.length}</div>
        </div>
      </div>
    </div>
  </div>
);

/* ----------------- Hook custom para lógica ----------------- */
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

  const procesarVouchers = async (vouchers) => {
    setState((s) => ({ ...s, cargando: true, resultados: [], stats: null }));

    let encontrados = 0, noEncontrados = 0, invalidos = 0;
    const resultados = [];

    for (const v of vouchers) {
      const norm = normalizarVoucher(v);
      if (!norm) {
        invalidos++;
        resultados.push({ voucherBuscado: v, valido: false });
        continue;
      }
      const hallados = await buscarVoucherEnBD(norm);
      if (hallados.length) {
        encontrados++;
        resultados.push(...hallados);
      } else {
        noEncontrados++;
        resultados.push({ voucherBuscado: norm.normalizado, valido: true });
      }
    }

    setState((s) => ({
      ...s,
      voucher: "",
      resultados,
      cargando: false,
      procesandoListado: false,
      stats: { total: vouchers.length, encontrados, noEncontrados, invalidos },
    }));
  };

  const buscarVoucher = () => {
    const lista = state.voucher.split(",").map((v) => v.trim()).filter(Boolean);
    if (lista.length) procesarVouchers(lista);
  };

  const procesarExcel = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    fileInputRef.current.value = "";

    setState((s) => ({ ...s, procesandoListado: true, resultados: [] }));

    const reader = new FileReader();
    reader.onload = async ({ target }) => {
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
  };

  const exportar = () => {
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
  };

  return { state, setState, fileInputRef, buscarVoucher, procesarExcel, exportar };
};

/* ----------------- Componente principal ----------------- */
export default function BusquedaVoucher() {
  const { state, setState, fileInputRef, buscarVoucher, procesarExcel, exportar } = useVoucherSearch();
  const { stats, resultados, selectedDoc } = state;
  const isLoading = state.cargando || state.procesandoListado;

  return (
    <CrudLayout title="Búsqueda de Voucher" icon={Search}>
      {/* Instrucciones mejoradas */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 mb-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <Info className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-800 text-sm mb-1">¿Cómo buscar vouchers?</h3>
            <p className="text-blue-700 text-xs mb-2">
              Ingrese vouchers-año separados por coma o cargue un archivo Excel:
            </p>
            <div className="flex flex-wrap gap-2">
              <code className="bg-blue-100 px-2 py-1 rounded text-xs font-mono">3040-2016</code>
              <code className="bg-blue-100 px-2 py-1 rounded text-xs font-mono">6500000107-2017</code>
              <code className="bg-blue-100 px-2 py-1 rounded text-xs font-mono">001201612694</code>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <input
          type="text"
          value={state.voucher}
          onChange={(e) => setState((s) => ({ ...s, voucher: e.target.value }))}
          onKeyDown={(e) => e.key === "Enter" && !isLoading && buscarVoucher()}
          placeholder="Ej: 001201612694, 3040-2016, 6500000107-2017..."
          className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          disabled={isLoading}
        />
        <div className="flex gap-2">
          <button
            onClick={buscarVoucher}
            disabled={isLoading || !state.voucher.trim()}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-3 py-2 rounded-md text-xs font-medium transition-colors min-w-[80px] justify-center"
          >
            {state.cargando ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">
              {state.cargando ? "Buscando..." : "Buscar"}
            </span>
          </button>
          <label className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 disabled:bg-gray-200 text-slate-700 px-3 py-2 rounded-md cursor-pointer text-xs font-medium transition-colors">
            <Upload className="w-3.5 h-3.5" />
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

      {/* Estado de procesamiento */}
      {state.procesandoListado && (
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-yellow-600" />
            </div>
            <div>
              <div className="font-semibold text-yellow-800 text-sm">Procesando archivo Excel</div>
              <div className="text-yellow-700 text-xs">Analizando vouchers del archivo cargado...</div>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas */}
      {stats && <StatsResumen stats={stats} resultados={resultados} />}

      {/* Resultados */}
      {state.cargando ? (
        <SparkleLoader />
      ) : resultados.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          message="Busca un voucher o carga un listado para comenzar."
        />
      ) : (
        <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
          <div className="overflow-auto max-h-[60vh] border-b border-slate-200">
            <table className="w-full border-collapse text-xs min-w-[800px]">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100 sticky top-0 z-10">
                <tr>
                  {[
                    { name: "Voucher Buscado", icon: Search },
                    { name: "ID", icon: FileText },
                    { name: "Caja", icon: Archive },
                    { name: "Tomo", icon: FileText },
                    { name: "Descripción", icon: Info },
                    { name: "Folios", icon: FileText },
                    { name: "Desde", icon: Calendar },
                    { name: "Hasta", icon: Calendar },
                    { name: "T. Faltante", icon: AlertCircle },
                    { name: "Ubicación", icon: MapPin }
                  ].map(({ name, icon: Icon }, i) => (
                    <th
                      key={name}
                      className={`px-2 py-2 text-left font-semibold text-slate-700 border-b border-slate-200 text-xs ${
                        i === 4 ? "min-w-[200px]" : "whitespace-nowrap"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Icon className="w-3 h-3 text-slate-500" />
                        {name}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
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
          
          <div className="p-3 bg-gradient-to-r from-slate-50 to-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Archive className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-600">
                {resultados.length} resultado{resultados.length !== 1 ? "s" : ""}
              </span>
            </div>
            <button
              onClick={exportar}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors shadow-sm hover:shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exportar Excel</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal detalle */}
      {selectedDoc && (
        <ModalDetalleDocumento
          doc={selectedDoc}
          onClose={() => setState((s) => ({ ...s, selectedDoc: null }))}
        />
      )}
    </CrudLayout>
  );
}