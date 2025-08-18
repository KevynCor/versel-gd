import React, { useState, useRef } from "react";
import { supabase } from "../utils/supabaseClient";
import { CrudLayout } from "../components/layout/CrudLayout";
import { SparkleLoader } from "../components/ui/SparkleLoader";
import { EmptyState } from "../components/ui/EmptyState";
import ModalDetalleDocumento from "../components/form/ModalDetalle";
import { Search, Upload, Download, Loader2 } from "lucide-react";
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
const FilaResultado = ({ r, onSelect }) => (
  <tr className="hover:bg-slate-50 text-xs sm:text-sm">
    {[
      r.voucherBuscado,
      r.id,
      r.n_caja || "-",
      r.n_tomo || "-",
      r.descripcion || "-",
      r.n_folios || "-",
      r.desde || "-",
      r.hasta || "-",
      r.tomo_faltante || "-",
      r.ubicacion || "-",
    ].map((val, i) => (
      <td
        key={i}
        className={`border border-slate-200 px-2 py-1.5 ${
          i > 1 && i < 9 ? "text-center" : ""
        } ${i === 1 || i === 9 ? "font-mono text-xs" : ""}`}
      >
        {i === 1 && r.id ? (
          <button
            onClick={() => onSelect(r._original)}
            className="text-blue-600 hover:underline"
          >
            {val}
          </button>
        ) : (
          val
        )}
      </td>
    ))}
  </tr>
);

const StatsResumen = ({ stats, resultados }) => (
  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm mb-4 grid grid-cols-2 sm:flex sm:justify-between gap-2">
    <span>
      <strong>Total:</strong> {stats.total}
    </span>
    <span className="text-green-700">
      <strong>Encontrados:</strong> {stats.encontrados}
    </span>
    <span className="text-yellow-700">
      <strong>No encontrados:</strong> {stats.noEncontrados}
    </span>
    <span className="text-red-600">
      <strong>Inválidos:</strong> {stats.invalidos}
    </span>
    <span>
      <strong>Resultados:</strong>{" "}
      <strong className="text-indigo-700">{resultados.length}</strong>
    </span>
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

    let encontrados = 0,
      noEncontrados = 0,
      invalidos = 0;
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
    const lista = state.voucher
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
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
      "Voucher Buscado",
      "ID",
      "N° Caja",
      "N° Tomo",
      "Descripción",
      "N° Folios",
      "Desde",
      "Hasta",
      "Tomo Faltante",
      "Ubicación",
    ];
    const ws = XLSX.utils.aoa_to_sheet([
      headers,
      ...state.resultados.map((r) => [
        r.voucherBuscado,
        r.id,
        r.n_caja,
        r.n_tomo,
        r.descripcion,
        r.n_folios,
        r.desde,
        r.hasta,
        r.tomo_faltante,
        r.ubicacion,
      ]),
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Resultados");
    XLSX.writeFile(wb, "resultados_vouchers.xlsx");
  };

  return { state, setState, fileInputRef, buscarVoucher, procesarExcel, exportar };
};

/* ----------------- Componente principal ----------------- */
export default function BusquedaVoucher() {
  const { state, setState, fileInputRef, buscarVoucher, procesarExcel, exportar } =
    useVoucherSearch();
  const { stats, resultados, selectedDoc } = state;

  return (
    <CrudLayout title="Búsqueda de Voucher" icon={Search}>
      {/* Instrucciones */}
      <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-3 text-sm mb-4 flex items-start gap-2">
        <Search className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div>
          Ingrese vouchers-año separados por coma:{" "}
          <code className="bg-blue-100 px-1 rounded text-xs">
            3040-2016, 6500000107-2017, 4200000107-2018
          </code>
        </div>
      </div>

      {/* Formulario */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          value={state.voucher}
          onChange={(e) => setState((s) => ({ ...s, voucher: e.target.value }))}
          onKeyDown={(e) => e.key === "Enter" && buscarVoucher()}
          placeholder="Ej: 001201612694, 3040-2016, 6500000107-2017..."
          className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
          disabled={state.cargando || state.procesandoListado}
        />
        <div className="flex gap-3">
          <button
            onClick={buscarVoucher}
            disabled={state.cargando || state.procesandoListado}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg disabled:opacity-60"
          >
            {state.cargando ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
            {state.cargando ? "Buscando..." : "Buscar"}
          </button>
          <label className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-lg cursor-pointer">
            <Upload className="w-5 h-5" /> Excel
            <input
              type="file"
              accept=".xls,.xlsx"
              onChange={procesarExcel}
              disabled={state.cargando || state.procesandoListado}
              className="hidden"
              ref={fileInputRef}
            />
          </label>
        </div>
      </div>

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
        <div className="space-y-4">
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto border border-slate-200 rounded-xl">
            <table className="w-full border-collapse text-xs sm:text-sm">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  {[
                    "Voucher Buscado",
                    "ID",
                    "Caja",
                    "Tomo",
                    "Descripción",
                    "Folios",
                    "Desde",
                    "Hasta",
                    "T. Faltante",
                    "Ubicación",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-2 py-2.5 text-left font-semibold text-slate-700 border-b"
                    >
                      {h}
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
          <div className="flex justify-end">
            <button
              onClick={exportar}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg"
            >
              <Download className="w-5 h-5" /> Exportar a Excel
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
