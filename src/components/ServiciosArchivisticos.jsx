import React, { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, FileText, ListChecks, Search, Signature, CheckCircle2, TriangleAlert, Loader2, Download, CalendarClock, Hash, Mail, Phone, Building2 } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { format } from "date-fns";

// Supabase client
import { supabase } from "../utils/supabaseClient";

// UI base (usando tu stack Tailwind + componentes minimalistas locales)
import { Toast } from "../components/ui/Toast";
import { SparkleLoader } from "../components/ui/SparkleLoader";
import { StatCard } from "../components/ui/StatCard";
import { CrudLayout } from "../components/layout/CrudLayout";

/**
 * Página integral para gestionar "Servicios Archivísticos" basada en el formato PDF:
 *  - I. Datos del solicitante
 *  - II. Detalle de documentos solicitados (desde Inventario_documental)
 *  - III. Devolución (se completa al cierre del préstamo)
 *  - IV. Solicitud del servicio (modalidad, motivo, descripción)
 *  - V. Atención de la solicitud (firma Archivo Central)
 *  - VI. Conformidad del servicio (firma del Solicitante)
 *
 * Flujo UX en 3 pasos (wizard):
 *  1) Solicitud (datos + modalidad + motivo + descripción + firma del solicitante)
 *  2) Selección de documentos (buscador sobre Inventario_documental + añadir/retirar)
 *  3) Confirmación (resumen + fecha devolución prevista + crear préstamo y guardar solicitud)
 *
 * Requiere: bucket de Storage "firmas" en Supabase.
 */

const initialSolicitante = {
  entidad: "Electro Sur Este S.A.A.",
  unidad: "",
  nombre: "",
  email: "",
  movil: "",
};

const initialServicio = {
  modalidad: "prestamo", // prestamo | consulta
  motivo: "",
  descripcion: "",
};

const PAGE_SIZE = 10;

export default function ServiciosArchivisticos() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // I. Datos del solicitante + IV. Solicitud del servicio
  const [solicitante, setSolicitante] = useState(initialSolicitante);
  const [servicio, setServicio] = useState(initialServicio);

  // Firma del solicitante y del archivo
  const sigSolicRef = useRef(null);
  const [firmaSolicUrl, setFirmaSolicUrl] = useState("");
  const [firmaArchivoUrl, setFirmaArchivoUrl] = useState("");

  // II. Detalle de documentos solicitados (desde Inventario_documental)
  const [q, setQ] = useState("");
  const [filtros, setFiltros] = useState({ unidad: "", sigla: "", serie: "", caja: "", desde: "", hasta: "" });
  const [inventario, setInventario] = useState([]);
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);

  // Selección del detalle
  const [seleccion, setSeleccion] = useState([]); // array de documentos (filas de Inventario)

  // Confirmación
  const [fechaDevolucionPrevista, setFechaDevolucionPrevista] = useState("");

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalRows / PAGE_SIZE)), [totalRows]);

  const showToast = (mensaje, tipo = "success") => setToast({ mensaje, tipo });

  // ---------- Utilidades ----------
  const formatUbicacion = (row) => {
    const { Estante, Cuerpo, Balda } = row;
    const se = row["Estante"] ?? row.estante;
    const cu = row["Cuerpo"] ?? row.cuerpo;
    const ba = row["Balda"] ?? row.balda;
    if (se == null && cu == null && ba == null) return "—";
    return `E${se ?? "?"}-C${cu ?? "?"}-B${ba ?? "?"}`;
  };

  const numberFmt = (n) => {
    if (n === null || n === undefined || isNaN(Number(n))) return "—";
    return Number(n).toLocaleString();
  };

  const limpiarFirmaSolic = () => sigSolicRef.current?.clear();

  const capturarFirmaSolic = async () => {
    if (!sigSolicRef.current || sigSolicRef.current.isEmpty()) {
      showToast("Dibuja tu firma antes de guardar", "error");
      return null;
    }
    const dataUrl = sigSolicRef.current.getTrimmedCanvas().toDataURL("image/png");
    const file = await (await fetch(dataUrl)).blob();
    const filename = `solicitudes/${crypto.randomUUID()}.png`;
    const { error } = await supabase.storage.from("firmas").upload(filename, file, { upsert: false, contentType: "image/png" });
    if (error) {
      showToast("No se pudo guardar la firma (Storage)", "error");
      return null;
    }
    const { data } = supabase.storage.from("firmas").getPublicUrl(filename);
    setFirmaSolicUrl(data.publicUrl);
    showToast("Firma capturada", "success");
    return data.publicUrl;
  };

  const addSeleccion = (row) => {
    if (seleccion.find((r) => r.id === row.id)) return;
    setSeleccion((prev) => [...prev, row]);
  };

  const removeSeleccion = (id) => setSeleccion((prev) => prev.filter((r) => r.id !== id));

  // ---------- Carga de inventario con RPC optimizado ----------
  const cargarInventario = async () => {
    setLoading(true);
    try {
      // Intentamos usar la función RPC si existe: buscar_inventario
      const params = {
        p_q: q?.trim() || null,
        p_unidad: filtros.unidad || null,
        p_sigla: filtros.sigla || null,
        p_serie: filtros.serie || null,
        p_caja: filtros.caja || null,
        p_desde: filtros.desde || null,
        p_hasta: filtros.hasta || null,
        p_limit: PAGE_SIZE,
        p_offset: (page - 1) * PAGE_SIZE,
      };
      let { data, error } = await supabase.rpc("buscar_inventario", params);

      // Si la RPC no existe aún, fallback a un select básico con filtros
      if (error && error.message?.toLowerCase().includes("function buscar_inventario")) {
        const qb = supabase.from("Inventario_documental").select("*", { count: "exact" }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
        if (filtros.unidad) qb.ilike("Unidad_Organica", `%${filtros.unidad}%`);
        if (filtros.sigla) qb.ilike("Sigla", `%${filtros.sigla}%`);
        if (filtros.serie) qb.ilike("Serie_Documental", `%${filtros.serie}%`);
        if (filtros.caja) qb.ilike("Numero_Caja", `%${filtros.caja}%`);
        if (filtros.desde) qb.gte("Fecha_Inicial", filtros.desde);
        if (filtros.hasta) qb.lte("Fecha_Final", filtros.hasta);
        if (q) qb.textSearch("Descripcion", q, { type: "websearch", config: "spanish" });
        const res = await qb;
        if (res.error) throw res.error;
        setInventario(res.data || []);
        setTotalRows(res.count || 0);
      } else if (error) {
        throw error;
      } else {
        setInventario(data?.rows || []);
        setTotalRows(data?.total || 0);
      }
    } catch (e) {
      console.error(e);
      showToast("Error cargando inventario", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step === 2) cargarInventario();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, page]);

  // ---------- Guardado completo (Solicitud + Detalle + Prestamo) ----------
  const guardarYGenerarPrestamo = async () => {
    if (!fechaDevolucionPrevista) {
      showToast("Define una fecha de devolución prevista", "error");
      return;
    }
    if (!firmaSolicUrl) {
      const saved = await capturarFirmaSolic();
      if (!saved) return;
    }
    if (seleccion.length === 0) {
      showToast("Agrega al menos un documento al detalle", "error");
      return;
    }

    setLoading(true);
    try {
      // 1) Crear la solicitud (usa RPC para numeración correlativa y consistencia)
      const solPayload = {
        p_entidad: solicitante.entidad || null,
        p_unidad: solicitante.unidad || null,
        p_nombre: solicitante.nombre || null,
        p_email: solicitante.email || null,
        p_movil: solicitante.movil || null,
        p_modalidad: servicio.modalidad,
        p_motivo: servicio.motivo || null,
        p_descripcion: servicio.descripcion || null,
        p_firma_solicitante_url: firmaSolicUrl || null,
      };

      const { data: solData, error: solErr } = await supabase.rpc("crear_solicitud_archivistica", solPayload);
      if (solErr) throw solErr;
      const solicitudId = solData?.id;

      // 2) Insertar detalle (documentos seleccionados)
      const detalleRows = seleccion.map((d) => ({ solicitud_id: solicitudId, documento_id: d.id, n_folios: d["Numero_Folios"] ?? d.numero_folios, ubicacion_topografica: formatUbicacion(d) }));
      const { error: detErr } = await supabase.from("solicitudes_detalle").insert(detalleRows);
      if (detErr) throw detErr;

      // 3) Generar préstamo desde la solicitud (RPC centraliza integridad y estados)
      const { data: prData, error: prErr } = await supabase.rpc("registrar_prestamo_desde_solicitud", {
        p_solicitud_id: solicitudId,
        p_fecha_devolucion_prevista: fechaDevolucionPrevista,
      });
      if (prErr) throw prErr;

      showToast(`Solicitud #${solData?.numero_solicitud} y préstamo creados`, "success");
      setStep(1);
      setSolicitante(initialSolicitante);
      setServicio(initialServicio);
      setSeleccion([]);
      setFirmaSolicUrl("");
      setFechaDevolucionPrevista("");
      limpiarFirmaSolic();
    } catch (e) {
      console.error(e);
      showToast("No se pudo completar el proceso", "error");
    } finally {
      setLoading(false);
    }
  };

  // ---------- UI ----------
  const Stepper = () => (
    <div className="flex items-center justify-between mb-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex-1 flex items-center">
          <div className={`flex items-center gap-2 ${i <= step ? "text-indigo-600" : "text-slate-400"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${i <= step ? "border-indigo-600" : "border-slate-300"}`}>
              {i === 1 ? <FileText size={16} /> : i === 2 ? <ListChecks size={16} /> : <CheckCircle2 size={16} />}
            </div>
            <span className="font-medium hidden sm:inline">
              {i === 1 ? "Solicitud" : i === 2 ? "Seleccionar documentos" : "Confirmar"}
            </span>
          </div>
          {i < 3 && <div className={`flex-1 h-px mx-2 ${i < step ? "bg-indigo-600" : "bg-slate-200"}`} />}
        </div>
      ))}
    </div>
  );

  return (
    <>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <CrudLayout title="Servicios Archivísticos" icon={BookOpen}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard title="Documentos seleccionados" value={seleccion.length} icon={ListChecks} color="from-blue-600 to-blue-700" subtitle="Detalle de la solicitud" />
          <StatCard title="Coincidencias" value={numberFmt(totalRows)} icon={Search} color="from-emerald-600 to-emerald-700" subtitle="Inventario consultado" />
          <StatCard title="Modalidad" value={servicio.modalidad === "prestamo" ? "Préstamo" : "Consulta"} icon={CalendarClock} color="from-indigo-600 to-purple-700" subtitle="Tipo de servicio" />
          <StatCard title="Devolución prev." value={fechaDevolucionPrevista ? format(new Date(fechaDevolucionPrevista), "yyyy-MM-dd") : "—"} icon={CalendarClock} color="from-amber-600 to-orange-700" subtitle="Definida en confirmación" />
        </div>

        <Stepper />

        {/* Paso 1: Solicitud */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border bg-white/50">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Hash size={16}/> I. Datos del solicitante</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Entidad</label>
                    <input className="mt-1 w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring" value={solicitante.entidad} onChange={(e)=>setSolicitante({...solicitante, entidad: e.target.value})}/>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Sub Gerencia/Oficina/Unidad</label>
                    <input className="mt-1 w-full border rounded-xl px-3 py-2" value={solicitante.unidad} onChange={(e)=>setSolicitante({...solicitante, unidad: e.target.value})}/>
                  </div>
                  <div>
                    <label className="text-sm font-medium flex items-center gap-2"><Building2 size={14}/>Nombre del solicitante</label>
                    <input className="mt-1 w-full border rounded-xl px-3 py-2" value={solicitante.nombre} onChange={(e)=>setSolicitante({...solicitante, nombre: e.target.value})}/>
                  </div>
                  <div>
                    <label className="text-sm font-medium flex items-center gap-2"><Mail size={14}/>E-mail</label>
                    <input type="email" className="mt-1 w-full border rounded-xl px-3 py-2" value={solicitante.email} onChange={(e)=>setSolicitante({...solicitante, email: e.target.value})}/>
                  </div>
                  <div>
                    <label className="text-sm font-medium flex items-center gap-2"><Phone size={14}/>Móvil</label>
                    <input className="mt-1 w-full border rounded-xl px-3 py-2" value={solicitante.movil} onChange={(e)=>setSolicitante({...solicitante, movil: e.target.value})}/>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Fecha de solicitud</label>
                    <input className="mt-1 w-full border rounded-xl px-3 py-2" value={format(new Date(), "yyyy-MM-dd HH:mm")} disabled/>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl border bg-white/50">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><FileText size={16}/> IV. Solicitud del servicio</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Modalidad</label>
                    <select className="mt-1 w-full border rounded-xl px-3 py-2" value={servicio.modalidad} onChange={(e)=>setServicio({...servicio, modalidad: e.target.value})}>
                      <option value="prestamo">Préstamo de documento original</option>
                      <option value="consulta">Consulta en sala</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Motivo de la solicitud</label>
                    <input className="mt-1 w-full border rounded-xl px-3 py-2" value={servicio.motivo} onChange={(e)=>setServicio({...servicio, motivo: e.target.value})}/>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium">Descripción de documentos solicitados</label>
                    <textarea rows={4} className="mt-1 w-full border rounded-xl px-3 py-2" value={servicio.descripcion} onChange={(e)=>setServicio({...servicio, descripcion: e.target.value})} placeholder="Ej.: Préstamo de todos documentos emitidos por la Gerencia de Planeamiento, año 2019…"/>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2"><Signature size={16}/> VI. Firma del solicitante</h4>
                  <div className="border rounded-2xl p-3 bg-white">
                    <SignatureCanvas ref={sigSolicRef} penColor="#111827" canvasProps={{ className: "w-full h-40" }} />
                    <div className="flex gap-2 mt-2">
                      <button type="button" className="px-3 py-2 rounded-xl border" onClick={limpiarFirmaSolic}>Limpiar</button>
                      <button type="button" className="px-3 py-2 rounded-xl bg-indigo-600 text-white" onClick={capturarFirmaSolic}>Guardar firma</button>
                    </div>
                    {firmaSolicUrl && (
                      <p className="text-sm text-emerald-700 mt-2">Firma guardada ✓</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 rounded-xl border" onClick={() => setStep(1)}>Anterior</button>
              <button className="px-4 py-2 rounded-xl bg-indigo-600 text-white" onClick={() => setStep(2)}>Siguiente</button>
            </div>
          </div>
        )}

        {/* Paso 2: Seleccionar documentos */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-2">
              <div className="lg:col-span-2 flex items-center gap-2">
                <div className="flex items-center flex-1 border rounded-xl px-3 py-2 bg-white"><Search size={16} className="mr-2"/> <input className="flex-1 outline-none" placeholder="Buscar en descripción…" value={q} onChange={(e)=>setQ(e.target.value)}/></div>
                <button className="px-4 py-2 rounded-xl bg-slate-800 text-white" onClick={()=>{setPage(1); cargarInventario();}}>Buscar</button>
              </div>
              <input className="border rounded-xl px-3 py-2" placeholder="Unidad Orgánica" value={filtros.unidad} onChange={(e)=>setFiltros({...filtros, unidad: e.target.value})} />
              <input className="border rounded-xl px-3 py-2" placeholder="Sigla" value={filtros.sigla} onChange={(e)=>setFiltros({...filtros, sigla: e.target.value})} />
              <input className="border rounded-xl px-3 py-2" placeholder="Serie Documental" value={filtros.serie} onChange={(e)=>setFiltros({...filtros, serie: e.target.value})} />
              <input className="border rounded-xl px-3 py-2" placeholder="N° Caja" value={filtros.caja} onChange={(e)=>setFiltros({...filtros, caja: e.target.value})} />
              <input type="date" className="border rounded-xl px-3 py-2" value={filtros.desde} onChange={(e)=>setFiltros({...filtros, desde: e.target.value})} />
              <input type="date" className="border rounded-xl px-3 py-2" value={filtros.hasta} onChange={(e)=>setFiltros({...filtros, hasta: e.target.value})} />
            </div>

            <div className="rounded-2xl border overflow-hidden bg-white">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-left">
                      <th className="px-3 py-2">ID</th>
                      <th className="px-3 py-2">Unidad Orgánica</th>
                      <th className="px-3 py-2">Sigla</th>
                      <th className="px-3 py-2">Serie</th>
                      <th className="px-3 py-2">Descripción</th>
                      <th className="px-3 py-2">N° Folios</th>
                      <th className="px-3 py-2">Ubicación</th>
                      <th className="px-3 py-2">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={8} className="p-6 text-center"><Loader2 className="inline animate-spin"/> Cargando…</td></tr>
                    ) : inventario.length === 0 ? (
                      <tr><td colSpan={8} className="p-6 text-center text-slate-500">Sin resultados</td></tr>
                    ) : (
                      inventario.map((row) => (
                        <tr key={row.id} className="border-t">
                          <td className="px-3 py-2 font-mono text-xs">{row.id}</td>
                          <td className="px-3 py-2">{row["Unidad_Organica"] ?? row.unidad_organica ?? "—"}</td>
                          <td className="px-3 py-2">{row["Sigla"] ?? row.sigla ?? "—"}</td>
                          <td className="px-3 py-2">{row["Serie_Documental"] ?? row.serie_documental ?? "—"}</td>
                          <td className="px-3 py-2 max-w-[420px] truncate" title={row["Descripcion"] ?? row.descripcion ?? ""}>{row["Descripcion"] ?? row.descripcion ?? "—"}</td>
                          <td className="px-3 py-2">{numberFmt(row["Numero_Folios"] ?? row.numero_folios)}</td>
                          <td className="px-3 py-2">{formatUbicacion(row)}</td>
                          <td className="px-3 py-2">
                            <button className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white" onClick={()=>addSeleccion(row)}>Agregar</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between px-3 py-2 border-t bg-slate-50">
                <span className="text-sm text-slate-600">{numberFmt(totalRows)} registros</span>
                <div className="flex items-center gap-2">
                  <button disabled={page<=1} onClick={()=>setPage((p)=>Math.max(1, p-1))} className="px-3 py-1.5 rounded-lg border disabled:opacity-50">Prev</button>
                  <span className="text-sm">{page}/{totalPages}</span>
                  <button disabled={page>=totalPages} onClick={()=>setPage((p)=>Math.min(totalPages, p+1))} className="px-3 py-1.5 rounded-lg border disabled:opacity-50">Next</button>
                </div>
              </div>
            </div>

            {/* Selección actual */}
            <div className="rounded-2xl border p-3 bg-white">
              <h4 className="font-semibold mb-2">II. Detalle de documentos solicitados</h4>
              {seleccion.length === 0 ? (
                <p className="text-sm text-slate-500">Aún no has agregado documentos.</p>
              ) : (
                <ul className="divide-y">
                  {seleccion.map((d) => (
                    <li key={d.id} className="py-2 flex items-start justify-between gap-3">
                      <div className="text-sm">
                        <div className="font-medium">{d["Serie_Documental"] ?? d.serie_documental ?? "—"} · <span className="text-slate-500">{d["Descripcion"] ?? d.descripcion ?? "Sin descripción"}</span></div>
                        <div className="text-xs text-slate-500">Folios: {numberFmt(d["Numero_Folios"] ?? d.numero_folios)} · Ubicación: {formatUbicacion(d)}</div>
                      </div>
                      <button className="px-2 py-1 rounded-lg border text-slate-600" onClick={()=>removeSeleccion(d.id)}>Quitar</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-between">
              <button className="px-4 py-2 rounded-xl border" onClick={() => setStep(1)}>Anterior</button>
              <button className="px-4 py-2 rounded-xl bg-indigo-600 text-white" onClick={() => setStep(3)}>Siguiente</button>
            </div>
          </div>
        )}

        {/* Paso 3: Confirmación */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-2xl border p-4 bg-white">
                <h4 className="font-semibold mb-3">Resumen de solicitud</h4>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div><dt className="text-slate-500">Entidad</dt><dd className="font-medium">{solicitante.entidad||"—"}</dd></div>
                  <div><dt className="text-slate-500">Unidad</dt><dd className="font-medium">{solicitante.unidad||"—"}</dd></div>
                  <div><dt className="text-slate-500">Solicitante</dt><dd className="font-medium">{solicitante.nombre||"—"}</dd></div>
                  <div><dt className="text-slate-500">Email</dt><dd className="font-medium">{solicitante.email||"—"}</dd></div>
                  <div><dt className="text-slate-500">Móvil</dt><dd className="font-medium">{solicitante.movil||"—"}</dd></div>
                  <div><dt className="text-slate-500">Modalidad</dt><dd className="font-medium">{servicio.modalidad === "prestamo" ? "Préstamo" : "Consulta"}</dd></div>
                  <div className="sm:col-span-2"><dt className="text-slate-500">Motivo</dt><dd className="font-medium">{servicio.motivo||"—"}</dd></div>
                  <div className="sm:col-span-2"><dt className="text-slate-500">Descripción</dt><dd className="font-medium">{servicio.descripcion||"—"}</dd></div>
                </dl>
              </div>

              <div className="rounded-2xl border p-4 bg-white">
                <h4 className="font-semibold mb-3 flex items-center gap-2"><CalendarClock size={16}/> Plazo de préstamo</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Fecha de devolución prevista</label>
                    <input type="datetime-local" className="mt-1 w-full border rounded-xl px-3 py-2" value={fechaDevolucionPrevista} onChange={(e)=>setFechaDevolucionPrevista(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Firmas</label>
                    <div className="text-xs text-slate-600 mt-1">Se usará la firma del solicitante capturada en el Paso 1. La firma del Archivo se registrará al momento de la atención.</div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-500">Al confirmar, se guardará la solicitud, su detalle, y se generará el préstamo con su relación de documentos.</div>
              </div>
            </div>

            <div className="rounded-2xl border p-4 bg-white">
              <h4 className="font-semibold mb-2">II. Detalle (resumen)</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50"><tr>
                    <th className="px-3 py-2 text-left">Serie · Descripción</th>
                    <th className="px-3 py-2 text-left">N° Folios</th>
                    <th className="px-3 py-2 text-left">Ubicación</th>
                  </tr></thead>
                  <tbody>
                    {seleccion.map((d)=> (
                      <tr key={d.id} className="border-t">
                        <td className="px-3 py-2">{(d["Serie_Documental"] ?? d.serie_documental) || "—"} · <span className="text-slate-500">{(d["Descripcion"] ?? d.descripcion) || "—"}</span></td>
                        <td className="px-3 py-2">{numberFmt(d["Numero_Folios"] ?? d.numero_folios)}</td>
                        <td className="px-3 py-2">{formatUbicacion(d)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between">
              <button className="px-4 py-2 rounded-xl border" onClick={() => setStep(2)}>Anterior</button>
              <button className="px-4 py-2 rounded-xl bg-emerald-600 text-white" onClick={guardarYGenerarPrestamo} disabled={loading}>
                {loading ? <span className="inline-flex items-center gap-2"><Loader2 className="animate-spin"/> Procesando…</span> : "Confirmar y generar préstamo"}
              </button>
            </div>
          </div>
        )}
      </CrudLayout>
    </>
  );
}
