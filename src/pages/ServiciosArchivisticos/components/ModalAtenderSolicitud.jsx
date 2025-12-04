import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from "../../../utils/supabaseClient";
import { 
    X, Search, Trash2, FileText, Scan, RefreshCw, CheckCircle, 
    Box, ChevronDown, AlertCircle, PackageCheck, MapPin, 
    Hash, PlusSquare, Loader2, Save, Settings, Book
} from "lucide-react";
import QRScanner from "../../../components/ui/QRScanner"; 
import Busqueda from "../../Busqueda/Busqueda";
import { DigitalSignature } from "../../../components/ui/DigitalSignature";
import { TextareaField } from "../../../components/ui/TextareaField";
import { MODALIDADES} from "../../../components/data/Shared";

// --- SUB-COMPONENTES (Internos para modularidad) ---
const DocumentSearchPanel = ({ busquedaDoc, setBusquedaDoc, buscandoDocs, resultadosBusqueda, agregarDocumento, agregarTodoEnBloque, setShowScanner, setShowBusqueda }) => (
    <div className="relative mb-1">
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Buscar Documento (Código / Descripción)</label>
        <div className="flex gap-2">
            <div className="relative flex-1">
                <input
                    type="text"
                    placeholder="Escriba código o descripción..."
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    value={busquedaDoc}
                    onChange={e => setBusquedaDoc(e.target.value)}
                    autoFocus
                />
                <Search className="absolute left-3 top-3 text-slate-400" size={16} />
                {buscandoDocs && <RefreshCw className="absolute right-3 top-3 text-blue-500 animate-spin" size={16} />}
            </div>
            <button onClick={() => setShowBusqueda(true)} className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-xl border border-blue-200 transition-colors" title="Búsqueda Avanzada">
                <Search size={20}/>
            </button>
            <button onClick={() => setShowScanner(true)} className="p-2.5 bg-slate-100 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl border border-slate-200 transition-colors" title="Escanear QR">
                <Scan size={20}/>
            </button>
        </div>
        {resultadosBusqueda.length > 0 && (
            <div className="absolute z-10 top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-1">
                {resultadosBusqueda.length > 1 && (
                    <div onClick={agregarTodoEnBloque} className="p-3 bg-blue-50 hover:bg-blue-100 cursor-pointer border-b border-blue-100 text-xs flex items-center gap-2 font-bold text-blue-700 sticky top-0 backdrop-blur-sm">
                        <PlusSquare size={14} /> Agregar los {resultadosBusqueda.length} documentos encontrados
                    </div>
                )}
                {resultadosBusqueda.map(doc => (
                    <div key={doc.id} onClick={() => agregarDocumento(doc)} className="p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0">
                        <p className="font-bold text-xs text-slate-700 truncate">{doc.Descripcion}</p>
                        <div className="flex justify-between items-center mt-1">
                            <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1"><Hash size={10}/> ID: {doc.id}</span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1 rounded font-mono inline-flex items-center gap-2">
                                <span className="inline-flex items-center gap-1"><Box size={10}/> Caja: {doc.Numero_Caja}</span>
                                <span className="inline-flex items-center gap-1"><Book size={10}/> Tomo: {doc.Numero_Tomo}</span>
                                <span className="inline-flex items-center gap-1"><FileText size={10}/> Folios: {doc.Numero_Folios}</span>
                                <span className="inline-flex items-center gap-1"><MapPin size={10}/> {[doc.Ambiente, doc.Estante && `-E${doc.Estante}`, doc.Cuerpo && `-C${doc.Cuerpo}`, doc.Balda && `-B${doc.Balda}`]}</span>
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
);

// Componente AtencionConfigPanel
const AtencionConfigPanel = ({ 
    modalidadTemp, setModalidadTemp, requiresSignature, firma, setFirma, 
    observacionesAtencion, setObservacionesAtencion, guardarBorrador, 
    guardandoBorrador, finalizarAtencion, processing, documentosSeleccionados,
    solicitud 
}) => {
    const [activeTab, setActiveTab] = useState('signature'); // Nota: Considera iniciar en 'control' si quieres que vean la modalidad primero
    const tabs = useMemo(() => [
        { id: 'signature', label: requiresSignature ? 'Firma Requerida' : 'Observaciones', icon: requiresSignature ? Save : FileText },
        { id: 'control', label: 'Detalle Solicitud', icon: Book },
    ], [requiresSignature]);

    return (
        <div className="flex-1 flex flex-col">
            {/* TABS DE NAVEGACIÓN */}
            <div className="flex border-b border-slate-200 mb-4 flex-shrink-0">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`py-2 px-4 text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === tab.id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-blue-600'}`}>
                        <tab.icon size={16}/> {tab.label}
                        {requiresSignature && tab.id === 'signature' && !firma && <AlertCircle size={14} className='text-red-500 ml-1'/>}
                    </button>
                ))}
            </div>

            {/* CONTENIDO DE LOS TABS */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
                
                {/* --- TAB 1: FIRMA / OBSERVACIONES --- */}
                {activeTab === 'signature' && (
                    <div className="space-y-4">
                        {requiresSignature ? (
                            <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm flex flex-col gap-2 flex-1 min-h-[420px]">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Firma Digital del Solicitante *</label>
                                <div className="flex-1 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 overflow-hidden relative">
                                    <div className="absolute inset-0"><DigitalSignature value={firma} onChange={setFirma} /></div>
                                </div>
                                {!firma && <p className="text-red-500 text-xs font-medium flex items-center gap-1"><AlertCircle size={12}/> La firma es obligatoria para Préstamo de Original.</p>}
                            </div>
                        ) : (
                            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                                <p className="text-sm text-emerald-800 font-medium flex items-center gap-2"><CheckCircle size={18} className="shrink-0"/> Esta modalidad no requiere firma digital.</p>
                            </div>
                        )}
                        <TextareaField label="Observaciones de Entrega" placeholder="Añada notas..." value={observacionesAtencion} onChange={setObservacionesAtencion} rows={3} />
                    </div>
                )}
                
                {/* --- TAB 2: CONTROL Y DATOS DE SOLICITUD --- */}
                {activeTab === 'control' && (
                    <div className="space-y-4">

                        {/* RESUMEN DE SOLICITUD (Ahora incluye MODALIDAD) */}
                        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                            <h4 className='text-xs font-bold text-slate-500 mb-3 uppercase flex items-center gap-1 border-b border-slate-100 pb-2'>
                                <FileText size={14}/> Resumen de Solicitud
                            </h4>
                            <div className="space-y-3">
                                {/* Solicitante */}
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                        Solicitante
                                    </label>
                                    <p className="text-sm font-medium text-slate-800 break-words">
                                        {solicitud?.nombre_solicitante || solicitud?.profiles?.nombre_completo || "Usuario no identificado"}
                                    </p>
                                </div>
                                {/* Motivo */}
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Motivo</label>
                                    <div className="text-sm text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 whitespace-pre-line">
                                        {solicitud?.motivo_solicitud || "Sin motivo especificado"}
                                    </div>
                                </div>
                                {/* Fecha y Hora */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Fecha Solicitud</label>
                                        <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                            <Book size={14} className="text-slate-400"/>
                                            {solicitud?.created_at 
                                                ? new Date(solicitud.created_at).toLocaleDateString() 
                                                : '--/--/----'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Hora</label>
                                        <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                            <RefreshCw size={14} className="text-slate-400"/>
                                            {solicitud?.created_at 
                                                ? new Date(solicitud.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) 
                                                : '--:--'}
                                        </p>
                                    </div>
                                </div>
                                {/* MODALIDAD EN MODO VISTA */}
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                        Modalidad de Servicio
                                    </label>

                                    <div className={`text-sm font-medium p-2.5 rounded-lg border 
                                        ${requiresSignature 
                                            ? 'border-amber-400 bg-amber-50/50 text-amber-800' 
                                            : 'border-slate-200 bg-slate-50 text-slate-700'
                                        }`}
                                    >
                                        {MODALIDADES.find(m => m.value === modalidadTemp)?.label || 'No definido'}
                                    </div>

                                    {requiresSignature && (
                                        <div className="text-[11px] font-bold text-amber-700 flex items-center gap-1 mt-1">
                                            <AlertCircle size={14}/> Requiere Firma
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="flex flex-col gap-3 pt-4 border-t border-slate-100 mt-auto flex-shrink-0">
                <button onClick={finalizarAtencion} disabled={processing || documentosSeleccionados.length === 0 || (requiresSignature && !firma)} className="w-full py-3.5 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-lg shadow-blue-700/20 transition-all flex items-center justify-center gap-2">
                    {processing ? <Loader2 size={18} className="animate-spin"/> : <CheckCircle size={18} />} {processing ? "Procesando..." : `Finalizar Entrega`}
                </button>
                <button onClick={guardarBorrador} disabled={guardandoBorrador || (!documentosSeleccionados.length && !firma && !observacionesAtencion)} className="w-full py-2.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    {guardandoBorrador ? <RefreshCw size={16} className="animate-spin"/> : <Save size={16} />} Guardar Borrador
                </button>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL DEL MODAL ---

export default function ModalAtenderSolicitud({ isOpen, onClose, solicitud, currentUser, onSuccess, onMensaje }) {
    const [busquedaDoc, setBusquedaDoc] = useState("");
    const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
    const [buscandoDocs, setBuscandoDocs] = useState(false);
    const [documentosSeleccionados, setDocumentosSeleccionados] = useState([]);
    const [firma, setFirma] = useState(null);
    const [observacionesAtencion, setObservacionesAtencion] = useState("");
    const [processing, setProcessing] = useState(false);
    const [guardandoBorrador, setGuardandoBorrador] = useState(false);
    const [modalidadTemp, setModalidadTemp] = useState(null); 
    const [showScanner, setShowScanner] = useState(false);
    const [showBusqueda, setShowBusqueda] = useState(false);

    // Inicialización y carga de borrador
    useEffect(() => {
        if (isOpen && solicitud) {
            setModalidadTemp(solicitud.modalidad_servicio);
            setDocumentosSeleccionados([]);
            setFirma(null);
            setBusquedaDoc("");
            setResultadosBusqueda([]);
            setObservacionesAtencion("");
            cargarBorrador(solicitud.id);
        }
    }, [isOpen, solicitud]);

    // Lógica de Búsqueda
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (busquedaDoc.length < 2) {
                setResultadosBusqueda([]);
                return;
            }
            setBuscandoDocs(true);
            try {
                const { data, error } = await supabase.rpc('buscar_documentos_archivisticos', { busqueda: busquedaDoc });
                if (error) {
                    const { data: simpleData } = await supabase.from("Inventario_documental").select("*").ilike('Descripcion', `%${busquedaDoc}%`).limit(20);
                    setResultadosBusqueda(simpleData || []);
                } else {
                    setResultadosBusqueda(data || []);
                }
            } catch (error) {
                console.error(error);
                setResultadosBusqueda([]);
            } finally {
                setBuscandoDocs(false);
            }
        }, 400);
        return () => clearTimeout(delayDebounceFn);
    }, [busquedaDoc]);

    const formatUbicacionTopografica = useCallback((doc) => {
        return [doc.Ambiente, doc.Estante && `E${doc.Estante}`, doc.Cuerpo && `C${doc.Cuerpo}`, doc.Balda && `B${doc.Balda}`].filter(Boolean).join('-');
    }, []);

    const cargarBorrador = async (solicitudId) => {
        try {
            const { data } = await supabase.from('atenciones_temporales').select('*').eq('solicitud_id', solicitudId).single();
            if (data) {
                if (data.documentos_json) setDocumentosSeleccionados(data.documentos_json);
                if (data.firma_temp) setFirma(data.firma_temp);
                if (data.observaciones_temp) setObservacionesAtencion(data.observaciones_temp);
                onMensaje("Borrador recuperado.", "success");
            }
        } catch (error) { /* No action */ }
    };

    const guardarBorrador = async () => {
        if (!solicitud) return;
        setGuardandoBorrador(true);
        try {
            const { error } = await supabase.from('atenciones_temporales').upsert({
                solicitud_id: solicitud.id,
                documentos_json: documentosSeleccionados, 
                firma_temp: firma,
                observaciones_temp: observacionesAtencion,
                updated_at: new Date().toISOString()
            }, { onConflict: 'solicitud_id' }); 
            if (error) throw error;
            onMensaje("Borrador actualizado.", "success");
        } catch (error) {
            onMensaje("Error al guardar borrador: " + error.message, "error");
        } finally {
            setGuardandoBorrador(false);
        }
    };

    const finalizarAtencion = async () => { 
        if (!currentUser?.id || !solicitud?.id) return onMensaje("Error: Sesión no válida.", "error");
        
        const isPrestamo = modalidadTemp === 'PRESTAMO_ORIGINAL';
        
        if (documentosSeleccionados.length === 0) return onMensaje("Seleccione al menos un documento.", "error");
        if (isPrestamo && !firma) return onMensaje("La firma es obligatoria para préstamos.", "error");

        setProcessing(true);
        const documentosLimpios = documentosSeleccionados.map(doc => ({
            ...doc,
            Numero_Folios: doc.Numero_Folios && String(doc.Numero_Folios).trim() !== "" ? doc.Numero_Folios : null,
            Numero_Tomo: doc.Numero_Tomo && String(doc.Numero_Tomo).trim() !== "" ? doc.Numero_Tomo : null,
            numero_orden: doc.numero_orden && String(doc.numero_orden).trim() !== "" ? doc.numero_orden : null
        }));

        const nuevoEstadoSolicitud = isPrestamo ? 'EN_PRESTAMO' : 'EN_PROCESO';
        const nuevoEstadoDocumento = isPrestamo ? 'EN_PRESTAMO' : 'EN_SERVICIO_ARCHIVISTICO';
        const firmaData = isPrestamo ? firma : null;
        
        try {
            const { error: rpcError } = await supabase.rpc('atender_solicitud_transaction', {
                p_solicitud_id: solicitud.id,
                p_firma: firmaData,
                p_observaciones: observacionesAtencion || "Entrega de documentos finalizada",
                p_usuario_id: currentUser.id, 
                p_documentos: documentosLimpios,
                p_estado_solicitud: nuevoEstadoSolicitud,
                p_estado_documento: nuevoEstadoDocumento 
            });

            if (rpcError) throw rpcError;

            onMensaje(`Solicitud procesada correctamente.`, "success");
            onSuccess(); 
            onClose();
        } catch (e) { 
            console.error(e);
            onMensaje(`Error: ${e.message}`, "error"); 
        } finally { 
            setProcessing(false); 
        }
    };

    const agregarDocumento = (doc) => { 
        if (documentosSeleccionados.some(d => d.id === doc.id)) return onMensaje("Este documento ya está en la lista.", "warning");
        const nuevoDoc = { ...doc, numero_orden: documentosSeleccionados.length + 1, ubicacion_topografica: formatUbicacionTopografica(doc) };
        setDocumentosSeleccionados(prev => [...prev, nuevoDoc]);
        setBusquedaDoc(""); setResultadosBusqueda([]); 
    };
    const eliminarDocumento = (id) => { setDocumentosSeleccionados(prev => prev.filter(d => d.id !== id)); };
    const agregarTodoEnBloque = () => { 
        const existingIds = new Set(documentosSeleccionados.map(d => d.id));
        let newDocs = [...documentosSeleccionados];
        let addedCount = 0;
        resultadosBusqueda.forEach(doc => {
            if (!existingIds.has(doc.id)) {
                newDocs.push({ ...doc, numero_orden: newDocs.length + 1, ubicacion_topografica: formatUbicacionTopografica(doc) });
                addedCount++;
            }
        });
        setDocumentosSeleccionados(newDocs); setBusquedaDoc(""); setResultadosBusqueda([]);
        onMensaje(addedCount > 0 ? `${addedCount} documentos añadidos.` : "Documentos ya en lista.", addedCount > 0 ? "success" : "warning");
    };
    const handleScanResult = async (code) => { 
        setShowScanner(false); setBuscandoDocs(true);
        try {
            const { data } = await supabase.from("Inventario_documental").select(`id, Numero_Caja, Numero_Tomo, Numero_Folios, Ambiente, Estante, Cuerpo, Balda, Descripcion, Serie_Documental, Unidad_Organica`).eq("id", code).single();
            if (data) { agregarDocumento(data); onMensaje(`Documento escaneado.`, "success"); } 
            else { onMensaje(`Código no encontrado.`, "info"); }
        } catch (err) { onMensaje(`Error en búsqueda.`, "error"); } finally { setBuscandoDocs(false); }
    };

    if (!isOpen) return null;

    const requiresSignature = modalidadTemp === 'PRESTAMO_ORIGINAL';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white w-full max-w-7xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
                    <h3 className="font-bold text-slate-800 text-lg">Workspace: Despacho de Documentos</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full text-slate-400"><X size={20} /></button>
                </div>
                <div className="p-0 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/30">
                    <div className="flex flex-col lg:flex-row h-full min-h-[500px]">
                        {/* COLUMNA IZQUIERDA: Canasta */}
                        <div className="w-full bg-slate-50 border-r border-slate-200 flex flex-col p-5">
                             <DocumentSearchPanel 
                                busquedaDoc={busquedaDoc} setBusquedaDoc={setBusquedaDoc} buscandoDocs={buscandoDocs} 
                                resultadosBusqueda={resultadosBusqueda} agregarDocumento={agregarDocumento} 
                                agregarTodoEnBloque={agregarTodoEnBloque} setShowScanner={setShowScanner}
                                setShowBusqueda={setShowBusqueda}
                            />
                            <div className="flex items-center justify-between mb-4 mt-4 pt-4 border-t border-slate-200">
                                <div className="flex items-center gap-2">
                                    <PackageCheck className="text-blue-600" size={20}/>
                                    <h4 className="font-bold text-slate-700 text-sm uppercase">Items ({documentosSeleccionados.length})</h4>
                                </div>
                                {documentosSeleccionados.length > 0 && (
                                    <button onClick={() => setDocumentosSeleccionados([])} className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1"><Trash2 size={14} /> Vaciar</button>
                                )}
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                {documentosSeleccionados.length === 0 ? (
                                    <div className="text-center py-10 px-4 border-2 border-dashed border-slate-200 rounded-lg">
                                        <Box size={32} className="text-slate-300 mx-auto mb-2"/><p className="text-xs text-slate-400">Busque y seleccione documentos.</p>
                                    </div>
                                ) : (
                                    documentosSeleccionados.map((doc) => (
                                        <div key={doc.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm relative group">
                                            <button onClick={() => eliminarDocumento(doc.id)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500"><X size={14}/></button>
                                            <div className="pr-6">
                                                <p className="font-bold text-xs text-slate-700 line-clamp-2 mb-1">{doc.Descripcion}</p>
                                                <div className="flex flex-wrap gap-x-3 text-[10px] text-slate-500 font-mono">
                                                    <span className="flex items-center gap-1"><Hash size={12}/> ID: {doc.id}</span>                                                    
                                                    <span className="flex items-center gap-1"><Box size={12}/>Caja: {doc.Numero_Caja}</span>
                                                    <span className="flex items-center gap-1"><Book size={12}/>Tomo: {doc.Numero_Tomo}</span>
                                                    <span className="flex items-center gap-1"><FileText size={12}/>Folios: {doc.Numero_Folios}</span>
                                                    <span className="flex items-center gap-1"><MapPin size={12}/>Ubi: {doc.ubicacion_topografica}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                        {/* COLUMNA DERECHA: Configuración */}
                        <div className="w-full p-6 pt-3 flex flex-col">
                            <AtencionConfigPanel 
                                modalidadTemp={modalidadTemp} setModalidadTemp={setModalidadTemp} requiresSignature={requiresSignature}
                                firma={firma} setFirma={setFirma} observacionesAtencion={observacionesAtencion} setObservacionesAtencion={setObservacionesAtencion}
                                guardarBorrador={guardarBorrador} guardandoBorrador={guardandoBorrador} finalizarAtencion={finalizarAtencion}
                                processing={processing} documentosSeleccionados={documentosSeleccionados}
                                solicitud={solicitud}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <QRScanner isOpen={showScanner} onClose={() => setShowScanner(false)} onScan={handleScanResult} />

            {/* MODAL DE BÚSQUEDA AVANZADA */}
            {showBusqueda && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative bg-white w-full max-w-6xl h-[85vh] rounded-xl shadow-2xl overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center px-4 py-3 border-b bg-slate-50">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2"><Search size={18}/> Búsqueda Avanzada</h3>
                            <button onClick={() => setShowBusqueda(false)} className="p-1 hover:bg-slate-200 rounded-full text-slate-500">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto bg-slate-50 p-4">
                            {/* Renderizamos el componente importado */}
                            <Busqueda />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}