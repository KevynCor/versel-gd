import React, { useState, useEffect, useRef } from 'react';
import { supabase } from "../../../utils/supabaseClient";
import { 
    FileCheck, RotateCcw, Printer, AlertTriangle, User, Calendar, 
    Building2, CheckSquare, FileText, CheckCircle2, Clock,
    Box, Book, MapPin, Archive, Layers
} from "lucide-react";
import { Modal, EstadoBadge } from "../ServiciosArchivisticos"; 
import { DigitalSignature } from "../../../components/ui/DigitalSignature";
import { TextareaField } from "../../../components/ui/TextareaField";
import CargoPrestamoPDF from './CargoPrestamoPDF';

// 1. FUNCIONES AUXILIARES
// MANTENER SOLO ESTA FUNCIÓN AUXILIAR
const getDiasVencimiento = (fecha) => {
    if (!fecha) return null;
    const hoy = new Date();
    const vencimiento = new Date(fecha);
    const diffTime = vencimiento - hoy;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays;
};

// AGREGAR ESTAS FUNCIONES QUE SE USAN EN EL MODAL
const getDocData = (doc) => {
    const inventoryData = doc.idoc || {};
    return {
        caja: doc.caja || inventoryData.Numero_Caja || '-',
        tomo: doc.numero_tomo || inventoryData.Numero_Tomo || '-',
        folios: doc.numero_folios || inventoryData.Numero_Folios || '-',
        unidad: doc.unidad || inventoryData.Unidad_Organica || '-',
        ubicacion: doc.ubicacion_topografica || [
            inventoryData.Ambiente, 
            inventoryData.Estante && `E${inventoryData.Estante}`, 
            inventoryData.Cuerpo && `C${inventoryData.Cuerpo}`, 
            inventoryData.Balda && `B${inventoryData.Balda}`
        ].filter(Boolean).join("-") || 'No asignada'
    };
};

const getDocIcon = (doc) => {
    const tipo = doc.idoc ? doc.idoc.Tipo_Unidad_Conservacion : null;
    if (tipo === 'ARCHIVADOR') return <Archive size={18} />;
    if (tipo === 'EMPASTADO') return <Book size={18} />;
    return <FileText size={18} />;
};

// 2. COMPONENTE PRINCIPAL (PrestamosActivosTab)
export default function PrestamosActivosTab({ solicitudes, currentUser, onReload, onMensaje }) {
    const [selectedSolicitud, setSelectedSolicitud] = useState(null);
    const [docsDevolucion, setDocsDevolucion] = useState([]);
    const [showDevolucionModal, setShowDevolucionModal] = useState(false);
    const [firmaReceptor, setFirmaReceptor] = useState(null);
    const [obsGeneral, setObsGeneral] = useState("");
    const [processing, setProcessing] = useState(false);
    
    // --- ESTADOS DE IMPRESIÓN ---
    const [docsParaImprimir, setDocsParaImprimir] = useState([]);
    const [isPrintReady, setIsPrintReady] = useState(false);

    // --- FUNCIÓN DE CARGA DE DATOS PARA IMPRESIÓN ---
    const handleImprimirCargo = async (solicitud) => {
        onMensaje("Preparando vista previa de impresión...", "info");
        
        try {
            const { data: docs, error } = await supabase
                .from("solicitudes_documentos")
                .select(`
                    *, 
                    devoluciones:devoluciones_documentos(*),
                    idoc:Inventario_documental!documento_id (
                        "Numero_Caja", 
                        "Numero_Tomo", 
                        "Numero_Folios", 
                        "Tipo_Unidad_Conservacion",
                        "Ambiente",
                        "Estante",
                        "Cuerpo",
                        "Balda"
                    )
                `)
                .eq("solicitud_id", solicitud.id)
                .order("numero_orden", { ascending: true });
            
            if (error) throw error;
            
            // Establecer los datos y la bandera que activará el useEffect en CargoPrestamoPDF
            setSelectedSolicitud(solicitud);
            setDocsParaImprimir(docs || []);
            setIsPrintReady(true); 

        } catch (error) {
            console.error('Error al cargar datos para imprimir:', error);
            onMensaje("Error al generar cargo: " + error.message, "error");
            setIsPrintReady(false);
        }
    };

    // --- CALLBACK PARA DEPUÉS DE IMPRIMIR O CANCELAR ---
    const handlePrintComplete = () => {
        // Limpiamos el estado para que el componente PDF deje de renderizarse/intentar imprimir
        setIsPrintReady(false);
        setDocsParaImprimir([]);
    };

    // FUNCIONES DE DEVOLUCIÓN (Mantenidas intactas)
    const handleDevolucionClick = async (solicitud) => {
        setSelectedSolicitud(solicitud);
        try {
            const { data } = await supabase
                .from("solicitudes_documentos")
                .select(`
                    *, 
                    devoluciones:devoluciones_documentos(*),
                    idoc:Inventario_documental!documento_id (
                        "Numero_Caja", "Numero_Tomo", "Numero_Folios", "Tipo_Unidad_Conservacion",
                        "Ambiente", "Estante", "Cuerpo", "Balda"
                    )
                `)
                .eq("solicitud_id", solicitud.id);
            
            if (!data) throw new Error("No se encontraron documentos.");

            const docsPrep = data.map(d => ({
                ...d,
                ya_devuelto: d.devoluciones && d.devoluciones.length > 0,
                selected_return: false, 
                obs_item: ""
            }));
            
            setDocsDevolucion(docsPrep);
            setFirmaReceptor(null);
            setObsGeneral("");
            setShowDevolucionModal(true);
        } catch (e) { 
            console.error(e);
            onMensaje("Error cargando documentos: " + e.message, "error"); 
        }
    };

    const procesarDevolucion = async () => {
        const itemsADevolver = docsDevolucion.filter(d => d.selected_return && !d.ya_devuelto);
        if (itemsADevolver.length === 0) return onMensaje("Seleccione al menos un documento.", "error");
        if (!firmaReceptor) return onMensaje("Firma obligatoria.", "error");

        setProcessing(true);
        try {
            const insertData = itemsADevolver.map(doc => ({
                solicitud_id: selectedSolicitud.id,
                documento_id: doc.documento_id,
                solicitud_documento_id: doc.id,
                fecha_devolucion: new Date().toISOString(),
                observaciones: doc.obs_item || obsGeneral,
                firma_receptor: firmaReceptor,
                usuario_receptor_id: currentUser.id
            }));
            
            const { error: errIns } = await supabase.from("devoluciones_documentos").insert(insertData);
            if (errIns) throw errIns;

            const totalDocs = docsDevolucion.length;
            const totalDevueltosPrevio = docsDevolucion.filter(d => d.ya_devuelto).length;
            const totalAhora = itemsADevolver.length;
            const todosListos = (totalDevueltosPrevio + totalAhora) === totalDocs;

            const { error: errUpd } = await supabase.from("solicitudes_archivisticas").update({
                estado: todosListos ? 'devuelta' : 'devolucion parcial',
                fecha_devolucion_real: todosListos ? new Date().toISOString() : null,
                updated_by: currentUser.id
            }).eq("id", selectedSolicitud.id);

            if (errUpd) throw errUpd;

            onMensaje(todosListos ? "Préstamo finalizado." : "Devolución parcial registrada.", "success");
            setShowDevolucionModal(false);
            onReload();
        } catch (e) { 
            onMensaje("Error: " + e.message, "error"); 
        } finally {
            setProcessing(false);
        }
    };

    const toggleAll = () => {
        const docsPendientes = docsDevolucion.filter(d => !d.ya_devuelto);
        if (docsPendientes.length === 0) return;
        const allSelected = docsPendientes.every(d => d.selected_return);
        setDocsDevolucion(prev => prev.map(d => !d.ya_devuelto ? { ...d, selected_return: !allSelected } : d));
    };

    // RENDER PRINCIPAL
    return (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 animate-fade-in">
            
            {/* CORREGIDO AQUÍ: Se usa isPrintReady en lugar de isReady */}
            {selectedSolicitud && isPrintReady && (
                <CargoPrestamoPDF
                    isReady={isPrintReady}
                    solicitud={selectedSolicitud}
                    documentos={docsParaImprimir}
                    onAfterPrint={handlePrintComplete}
                />
            )}
            
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                    <FileCheck className="text-emerald-600"/> Préstamos Activos
                    <span className="bg-emerald-100 text-emerald-800 text-sm px-2 py-0.5 rounded-full font-bold">{solicitudes.length}</span>
                </h2>
            </div>

            {solicitudes.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl bg-white">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileCheck size={32} className="text-slate-300"/>
                    </div>
                    <p className="text-slate-500 font-medium">No hay préstamos activos actualmente.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {solicitudes.map(sol => {
                        const diasRestantes = getDiasVencimiento(sol.fecha_devolucion_prevista);
                        const esVencido = diasRestantes < 0;
                        const esUrgente = diasRestantes >= 0 && diasRestantes <= 2;

                        return (
                            <div key={sol.id} className={`bg-white border rounded-xl p-5 flex flex-col lg:flex-row justify-between items-start gap-5 shadow-sm hover:shadow-md transition-all duration-200 group relative overflow-hidden ${esVencido ? 'border-red-200' : esUrgente ? 'border-amber-200' : 'border-slate-200'}`}>
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${esVencido ? 'bg-red-500' : esUrgente ? 'bg-amber-400' : 'bg-emerald-500'}`}></div>
                                
                                <div className="flex-1 space-y-3 pl-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="bg-slate-100 text-slate-700 text-xs font-mono font-bold px-2 py-0.5 rounded border border-slate-200">
                                            #{sol.numero_solicitud || sol.id.slice(0,8)}
                                        </span>
                                        <EstadoBadge estado={sol.estado} />
                                        {esVencido ? (
                                            <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                                                <AlertTriangle size={12}/> Vencido hace {Math.abs(diasRestantes)} días
                                            </span>
                                        ) : (
                                            <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded ${esUrgente ? 'text-amber-700 bg-amber-50' : 'text-slate-500 bg-slate-50'}`}>
                                                <Clock size={12}/> Vence en {diasRestantes} días
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <h3 className="text-base text-slate-800 mb-1 leading-tight whitespace-pre-line line-clamp-1 group-hover:line-clamp-none transition-all duration-200">
                                            {sol.motivo_solicitud}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500 mt-2">
                                            <div className="flex items-center gap-1.5"><User size={14} className="text-slate-400"/><span className="font-medium text-slate-700">{sol.nombre_solicitante}</span></div>
                                            <div className="flex items-center gap-1.5"><Building2 size={14} className="text-slate-400"/><span>{sol.sub_gerencia}</span></div>
                                            <div className="flex items-center gap-1.5"><Calendar size={14} className="text-slate-400"/><span>Devolución: {new Date(sol.fecha_devolucion_prevista).toLocaleDateString()}</span></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-row lg:flex-col gap-2 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                                    <button onClick={() => handleDevolucionClick(sol)} className="flex-1 lg:w-40 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all">
                                        <RotateCcw size={16}/> Devolución
                                    </button>
                                    <button onClick={() => handleImprimirCargo(sol)} className="flex-1 lg:w-40 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-bold flex items-center justify-center gap-2 transition-all">
                                        <Printer size={16}/> Cargo
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Modal isOpen={showDevolucionModal} onClose={() => setShowDevolucionModal(false)} title="Registrar Devolución de Documentos" size="xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="flex flex-col h-full">
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4">
                            <div className="flex justify-between items-center">
                                <h4 className="font-bold text-blue-900 text-sm flex items-center gap-2"><CheckSquare size={16}/> Selección de Documentos</h4>
                                {docsDevolucion.some(d => !d.ya_devuelto) && (
                                    <button onClick={toggleAll} className="text-xs font-bold text-blue-700 hover:underline">Seleccionar Todos</button>
                                )}
                            </div>
                            <p className="text-xs text-blue-700 mt-1">Marque los documentos físicos que está recibiendo.</p>
                        </div>
                        <div className="flex-1 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm min-h-[300px] flex flex-col">
                            <div className="divide-y divide-slate-100 overflow-y-auto flex-1 max-h-[400px] custom-scrollbar">
                                {docsDevolucion.map((doc) => {
                                    const docData = getDocData(doc); 
                                    return (
                                        <div key={doc.id} className={`p-3 transition-colors group ${doc.ya_devuelto ? 'bg-slate-50 opacity-75' : 'hover:bg-slate-50'}`}>
                                            <label className={`flex items-start gap-3 ${doc.ya_devuelto ? 'cursor-default' : 'cursor-pointer'}`}>
                                                <div className="pt-1 shrink-0">
                                                    <input type="checkbox" className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                                                        disabled={doc.ya_devuelto} checked={doc.selected_return || doc.ya_devuelto} 
                                                        onChange={e => { if(!doc.ya_devuelto) setDocsDevolucion(prev => prev.map(p => p.id === doc.id ? {...p, selected_return: e.target.checked} : p)); }} 
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0 space-y-2">
                                                    <div>
                                                        <div className="flex justify-between gap-2">
                                                            <p className={`text-sm font-bold leading-tight line-clamp-1 ${doc.ya_devuelto ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{doc.descripcion}</p>
                                                            {doc.ya_devuelto && <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase self-start shrink-0">Devuelto</span>}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-0.5"><span className="text-[10px] text-slate-400 font-mono">ID: {doc.documento_id}</span></div>
                                                    </div>
                                                    <div className="grid grid-cols-12 gap-x-2 gap-y-1.5 text-[10px] text-slate-600 bg-slate-50/50 items-center">
                                                        <div className="col-span-4 md:col-span-2 flex items-center gap-1.5"><Box size={12} className="text-slate-400 shrink-0"/><span>Caja: <strong>{docData.caja}</strong></span></div>
                                                        <div className="col-span-4 md:col-span-2 flex items-center gap-1.5"><Book size={12} className="text-slate-400 shrink-0"/><span>Tomo: <strong>{docData.tomo}</strong></span></div>
                                                        <div className="col-span-4 md:col-span-2 flex items-center gap-1.5"><FileText size={12} className="text-slate-400 shrink-0"/><span>Folios: <strong>{docData.folios}</strong></span></div>
                                                        <div className="col-span-12 md:col-span-5 flex items-center gap-1.5 text-blue-600 font-medium bg-blue-50/50 px-1.5 py-0.5 rounded"><MapPin size={12} className="shrink-0"/><span>{docData.ubicacion}</span></div>
                                                    </div>
                                                </div>
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-6">
                        <div className="space-y-4">
                            <TextareaField label="Observaciones de la Devolución" placeholder="Estado de conservación, notas adicionales..." value={obsGeneral} onChange={setObsGeneral} rows={3}/>
                            <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm flex flex-col gap-2 min-h-[300px]">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Firma Receptor (Archivo) *</label>
                                <div className="flex-1 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 overflow-hidden relative">
                                    <div className="absolute inset-0">
                                        <DigitalSignature value={firmaReceptor} onChange={setFirmaReceptor} title="Firma Receptor" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2 mt-auto">
                            <button onClick={() => setShowDevolucionModal(false)} className="flex-1 py-3 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-sm font-bold transition-colors" disabled={processing}>Cancelar</button>
                            <button onClick={procesarDevolucion} disabled={processing} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-70 flex items-center justify-center gap-2">
                                {processing ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Procesando...</> : <><CheckCircle2 size={18} /> Confirmar Devolución</>}
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}