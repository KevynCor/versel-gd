import React, { useState, useRef } from "react";
import { supabase } from "../utils/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Info, Loader2, Upload, X, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// --- Utilidad para normalizar un voucher ---
const normalizarVoucher = (input) => {
  if (!input) return null;
  input = input.toString().trim();
  const matchClasico = input.match(/^(\d+)-(\d{4})$/);
  if (matchClasico) {
    const correlativo = +matchClasico[1];
    const anio = +matchClasico[2];
    return { correlativo, anio, normalizado: `${correlativo}-${anio}` };
  }
  if (/^\d{12,13}$/.test(input)) {
    const anio = +input.slice(3, 7);
    const correlativo = +input.slice(7).replace(/^0+/, "");
    if (!isNaN(correlativo) && !isNaN(anio)) return { correlativo, anio, normalizado: `${correlativo}-${anio}` };
  }
  const matchAnioFinal = input.match(/^(\d+)(\d{4})$/);
  if (matchAnioFinal) {
    const correlativo = +matchAnioFinal[1].replace(/^0+/, "");
    const anio = +matchAnioFinal[2];
    if (!isNaN(correlativo) && !isNaN(anio)) return { correlativo, anio, normalizado: `${correlativo}-${anio}` };
  }
  return null;
};

// --- Búsqueda en BD ---
const buscarVoucherEnBD = async ({ correlativo, anio, normalizado }) => {
  const { data, error } = await supabase
    .from("Inventario_documental")
    .select("*")
    .eq("Unidad_Organica", "CONTABILIDAD")
    .lte("Fecha_Inicial", `${anio}-12-31`)
    .gte("Fecha_Final", `${anio}-01-01`);
  if (error) throw error;

  return data.reduce((acc, fila) => {
    const desc = (fila.Descripcion || "").toUpperCase();
    const rango = [...desc.matchAll(/(\d+)\s*(?:-|AL|al)\s*(\d+)/g)].some(([_, ini, fin]) => {
      ini = +ini.replace(/^0+/, ""); fin = +fin.replace(/^0+/, "");
      return correlativo >= ini && correlativo <= fin;
    });
    const suelto = (desc.match(/\d+/g) || []).some(n => +n.replace(/^0+/, "") === correlativo);
    if (rango || suelto) {
      acc.push({
        voucherBuscado: normalizado,
        id: fila.id || "",
        n_caja: fila.Numero_Caja,
        n_tomo: fila.Numero_Tomo,
        descripcion: fila.Descripcion,
        n_folios: fila.Numero_Folios || "",
        desde: fila.Fecha_Inicial ? new Date(fila.Fecha_Inicial).toLocaleDateString() : "",
        hasta: fila.Fecha_Final ? new Date(fila.Fecha_Final).toLocaleDateString() : "",
        tomo_faltante: fila.Tomo_Faltante || "",
        ubicacion: `E${fila.Estante || ""}-C${fila.Cuerpo || ""}-B${fila.Balda || ""}`,
        valido: true
      });
    }
    return acc;
  }, []);
};

// --- Componente Mensaje flotante ---
const MensajeFlotante = ({ mensaje, onClose }) => (
  <AnimatePresence>
    {mensaje && (
      <motion.div
        initial={{ opacity: 0, x: 50, y: -50 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        exit={{ opacity: 0, x: 50, y: -50 }}
        transition={{ duration: 0.3 }}
        className="fixed top-3 right-4 max-w-xs sm:max-w-sm md:max-w-md bg-blue-50 border border-blue-300 text-blue-800 rounded-lg shadow-lg p-4 flex items-start gap-3 z-50"
      >
        <Info className="w-6 h-6 flex-shrink-0" />
        <div className="flex-1 text-sm">{mensaje}</div>
        <button onClick={onClose} className="text-blue-600 hover:text-blue-900 flex-shrink-0">
          <X className="w-5 h-5" />
        </button>
      </motion.div>
    )}
  </AnimatePresence>
);

// --- Fila de la tabla ---
const FilaResultado = ({ r }) => {
  const baseClass = "border border-gray-200 px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm";
  const style = r.valido === false ? "text-red-600 font-bold"
    : r.encontrado === false ? "text-yellow-700 font-semibold"
    : "";
  const celdas = [
    r.voucherBuscado,
    r.id, r.n_caja, r.n_tomo, r.descripcion, r.n_folios, r.desde, r.hasta, r.tomo_faltante, r.ubicacion
  ].map((val, i) => <td key={i} className={baseClass}>{val || "-"}</td>);
  return <tr className={`${style} hover:bg-gray-50 transition`}>{celdas}</tr>;
};

export default function BusquedaVoucher() {
  const [state, setState] = useState({
    voucher: "", resultados: [], mensaje: null, cargando: false, procesandoListado: false
  });
  const fileInputRef = useRef(null);
  const setMensaje = (m) => setState(s => ({ ...s, mensaje: m }));

  const procesarVouchers = async (vouchers) => {
    setState(s => ({ ...s, cargando: true, resultados: [], mensaje: null }));
    let encontrados = 0, noEncontrados = 0, invalidos = 0;
    const resultados = [];
    for (const v of vouchers) {
      const datosNorm = normalizarVoucher(v);
      if (!datosNorm) { invalidos++; resultados.push({ voucherBuscado: v, valido: false }); continue; }
      const hallados = await buscarVoucherEnBD(datosNorm);
      if (hallados.length) { encontrados++; resultados.push(...hallados); }
      else { noEncontrados++; resultados.push({ voucherBuscado: datosNorm.normalizado, valido: true, encontrado: false }); }
    }
    setState(s => ({
      ...s,
      resultados,
      cargando: false,
      procesandoListado: false,
      mensaje: <>Vouchers: {vouchers.length}. <span className="text-green-600">Encontrados: {encontrados}. </span>
        <span className="text-yellow-700">No encontrados: {noEncontrados}. </span>
        <span className="text-red-600">Inválidos: {invalidos}.</span></>
    }));
  };

  const buscarVoucher = () => {
    const lista = state.voucher.split(",").map(v => v.trim()).filter(Boolean);
    if (!lista.length) return setMensaje("Ingrese al menos un voucher válido.");
    procesarVouchers(lista);
  };

  const procesarArchivoExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = null;
    setState(s => ({ ...s, voucher: "", procesandoListado: true, mensaje: null, resultados: [] }));
    const reader = new FileReader();
    reader.onload = async ({ target }) => {
      try {
        const ws = XLSX.read(target.result, { type: "binary" }).Sheets;
        const data = XLSX.utils.sheet_to_json(ws[Object.keys(ws)[0]], { header: 1 });
        const vouchers = data.slice(1).map(row => row[0]).filter(v => v && v.toString().trim().length > 0);
        if (!vouchers.length) return setState(s => ({ ...s, procesandoListado: false, mensaje: "El archivo no contiene vouchers válidos." }));
        procesarVouchers(vouchers);
      } catch {
        setMensaje("Error leyendo el archivo Excel.");
        setState(s => ({ ...s, procesandoListado: false }));
      }
    };
    reader.readAsBinaryString(file);
  };

  const exportarResultadosExcel = () => {
    if (!state.resultados.length) return setMensaje("No hay datos para exportar.");
    const wsData = [["Voucher Buscado", "ID", "N° Caja", "N° Tomo", "Descripción", "N° Folios", "Desde", "Hasta", "Tomo Faltante", "Ubicación Topografica"],
      ...state.resultados.map(r => [r.voucherBuscado, r.id, r.n_caja, r.n_tomo, r.descripcion, r.n_folios, r.desde, r.hasta, r.tomo_faltante, r.ubicacion])];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Resultados");
    saveAs(new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })], { type: "application/octet-stream" }), "resultados_vouchers.xlsx");
  };

  return (
    <motion.div className="bg-white border border-gray-300 rounded-3xl p-4 sm:p-6 shadow-lg max-w-full sm:max-w-5xl md:max-w-7xl mx-auto">
      <MensajeFlotante mensaje={state.mensaje} onClose={() => setMensaje(null)} />
      <motion.div className="p-2 sm:p-6 w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <motion.h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 mb-4 sm:mb-6 flex-wrap" initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <Search className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" /> Búsqueda de Voucher
        </motion.h2>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-6 flex-wrap">
          <input
            type="text" value={state.voucher} onChange={(e) => setState(s => ({ ...s, voucher: e.target.value }))}
            placeholder="Ej: 001201612694, 3040-2016, 6500000107-2017, 4200000107-2018..."
            className="border border-gray-300 rounded-xl px-3 sm:px-4 py-2 flex-1 focus:ring-2 focus:ring-blue-400 outline-none w-full sm:w-auto"
            disabled={state.cargando || state.procesandoListado} autoComplete="off"
          />
          <button onClick={buscarVoucher} disabled={state.cargando || state.procesandoListado}
            className="bg-blue-600 text-white px-4 sm:px-5 py-2 rounded-xl hover:bg-blue-700 flex items-center gap-1 sm:gap-2 disabled:opacity-50 w-full sm:w-auto justify-center">
            {state.cargando || state.procesandoListado ? <><Loader2 className="w-5 h-5 animate-spin" /> Buscando...</>
              : <><Search className="w-5 h-5" /> Buscar</>}
          </button>
          <label htmlFor="file-upload" className="flex items-center gap-1 sm:gap-2 cursor-pointer text-blue-600 hover:text-blue-700 relative group w-full sm:w-auto justify-center">
            <Upload className="w-5 h-5 sm:w-6 sm:h-6" />
            <input id="file-upload" type="file" accept=".xls,.xlsx" onChange={procesarArchivoExcel}
              disabled={state.cargando || state.procesandoListado} className="hidden" ref={fileInputRef} />
            <span className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1">
              Cargar listado Excel
            </span>
          </label>
        </div>

        {state.resultados.length > 0 && (
          <>
            <motion.div initial={{ y: 11, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className="overflow-x-auto mb-4 max-h-[400px] overflow-y-auto border border-gray-300 rounded-lg">
              <table className="w-full border-collapse bg-white shadow-md text-xs sm:text-sm">
                <thead className="bg-blue-100 sticky top-0">
                  <tr>{["Voucher Buscado", "ID", "N° Caja", "N° Tomo", "Descripción", "N° Folios", "Desde", "Hasta", "Tomo Faltante", "Ubicación Topografica"]
                    .map(h => <th key={h} className="px-2 sm:px-3 py-1 sm:py-2 text-left font-semibold border border-gray-200">{h}</th>)}</tr>
                </thead>
                <tbody>{state.resultados.map((r, i) => <FilaResultado key={i} r={r} />)}</tbody>
              </table>
            </motion.div>
            <button onClick={exportarResultadosExcel} className="bg-green-600 text-white px-4 sm:px-5 py-2 rounded-xl hover:bg-green-700 flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-center">
              <Download className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6" /> Exportar registros
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
