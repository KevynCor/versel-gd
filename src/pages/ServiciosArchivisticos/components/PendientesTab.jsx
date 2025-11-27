import React, { useState, useMemo, useRef, useEffect } from 'react';
import { supabase } from "../../../utils/supabaseClient"; 
import { 
    Clock, Check, Search, Trash2, FileText, AlertCircle, X, Scan, PlusSquare, 
    Save, Box, RefreshCw, Ban, User, Calendar, MapPin, ShieldAlert, Building2, 
    CheckCircle, Archive, Layers, Book, Loader2 
} from "lucide-react";
import QRScanner from "../../../components/ui/QRScanner"; 
import { DigitalSignature } from "../../../components/ui/DigitalSignature";
import { TextareaField } from "../../../components/ui/TextareaField";

// import jsQR from "jsqr"; 
import { EstadoBadge } from "../ServiciosArchivisticos";

// --- COMPONENTES UI LOCALES (Estilo Corporativo) ---
const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
    if (!isOpen) return null;
    
    const sizeClasses = { 
        sm: "max-w-md", 
        md: "max-w-2xl", 
        lg: "max-w-4xl", 
        xl: "max-w-6xl" 
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-slate-900/75 backdrop-blur-sm transition-opacity" 
                onClick={onClose} 
            />
            <div className={`relative bg-white w-full ${sizeClasses[size]} rounded-xl shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col animate-fadeIn`}>
                {/* Header Corporativo */}
                <div className="sticky top-0 bg-slate-50 border-b border-slate-200 px-6 py-4 rounded-t-xl flex items-center justify-between z-10 flex-shrink-0">
                    <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">{title}</h3>
                    <button 
                        onClick={onClose} 
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                {/* Contenido Scrollable */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
export default function PendientesTab({ solicitudes, currentUser, onReload, onMensaje }) {
    const [selectedSolicitud, setSelectedSolicitud] = useState(null);
    const [showProcessModal, setShowProcessModal] = useState(false);    
    // --- ESTADOS PARA RECHAZO ---
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [motivoRechazo, setMotivoRechazo] = useState("");

    const [showScanner, setShowScanner] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [buscandoDocs, setBuscandoDocs] = useState(false);
    const [guardandoBorrador, setGuardandoBorrador] = useState(false);
    // --- ESTADOS PROCESO ---
    const [busquedaDoc, setBusquedaDoc] = useState("");
    const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
    const [documentosSeleccionados, setDocumentosSeleccionados] = useState([]);
    const [firma, setFirma] = useState(null);
    const [observacionesAtencion, setObservacionesAtencion] = useState("");

    // --- HELPER: Formatear Modalidad ---
    const formatModalidad = (modalidad) => {
        const mapa = {
            'prestamo_original': 'Préstamo de Original',
            'copia_simple': 'Copia Simple',
            'copia_certificada': 'Copia Certificada',
            'consulta_sala': 'Consulta en Sala',
            'digitalizacion': 'Digitalización'
        };
        return mapa[modalidad] || modalidad || 'No especificado';
    };

    // --- BÚSQUEDA MEJORADA ---
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (busquedaDoc.length < 2) {
                setResultadosBusqueda([]);
                return;
            }

            setBuscandoDocs(true);
            try {
                // Intento de búsqueda RPC (más eficiente o con full-text search)
                const { data, error } = await supabase
                    .rpc('buscar_documentos_archivisticos', { busqueda: busquedaDoc });

                if (error) {
                    console.warn("RPC error (fallback):", error.message);
                    // Fallback a búsqueda simple (ilike)
                    const { data: simpleData } = await supabase
                        .from("Inventario_documental")
                        .select("*")
                        .ilike('Descripcion', `%${busquedaDoc}%`)
                        .limit(20);
                    setResultadosBusqueda(simpleData || []);
                } else {
                    setResultadosBusqueda(data || []);
                }
            } catch (error) {
                console.error("Error en búsqueda:", error);
                setResultadosBusqueda([]);
            } finally {
                setBuscandoDocs(false);
            }
        }, 400);

        return () => clearTimeout(delayDebounceFn);
    }, [busquedaDoc]);

    // --- FUNCIONES ---
    
    // Función de callback pasada al QRScanner
    const handleScanResult = async (code) => {
        setBusquedaDoc(code);
        setBuscandoDocs(true);
        try {
            // Se asume que el código QR es el ID del documento
            const { data } = await supabase
                .from("Inventario_documental")
                .select("*")
                .eq("id", code)
                .single();

            if (data) {
                agregarDocumento(data);
                onMensaje(`Documento escaneado: ${data.Descripcion}`, "success");
                setBusquedaDoc(""); 
            } else {
                onMensaje(`Código: ${code}. No se encontró un documento con ese ID. Verifique resultados.`, "info");
            }
        } catch (err) {
            console.error(err);
             onMensaje(`Error al buscar el código escaneado: ${code}.`, "error");
        } finally {
            setBuscandoDocs(false);
        }
    };

    const agregarDocumento = (doc) => {
        if (documentosSeleccionados.some(d => d.id === doc.id)) {
            onMensaje("El documento ya está en la lista", "error");
            return;
        }
        const nuevoDoc = { ...doc, numero_orden: documentosSeleccionados.length + 1 };
        setDocumentosSeleccionados([...documentosSeleccionados, nuevoDoc]);
    };

    // NUEVA FUNCIÓN: Agregar todo en bloque
    const agregarTodoEnBloque = () => {
        const nuevosDocs = resultadosBusqueda.filter(
            r => !documentosSeleccionados.some(d => d.id === r.id)
        );

        if (nuevosDocs.length === 0) {
            onMensaje("Todos los documentos ya están agregados.", "info");
            return;
        }

        const docsConOrden = nuevosDocs.map((doc, index) => ({
            ...doc,
            numero_orden: documentosSeleccionados.length + index + 1
        }));

        setDocumentosSeleccionados([...documentosSeleccionados, ...docsConOrden]);
        setBusquedaDoc(""); 
        setResultadosBusqueda([]);
        onMensaje(`Se agregaron ${nuevosDocs.length} documentos.`, "success");
    };

    const eliminarDocumento = (id) => {
        setDocumentosSeleccionados(prev => prev.filter(d => d.id !== id));
    };

    // NUEVA FUNCIÓN: Eliminar TODOS los documentos
    const eliminarTodosDocumentos = () => {
        if (window.confirm("¿Estás seguro de quitar todos los documentos seleccionados?")) {
            setDocumentosSeleccionados([]);
        }
    };

    // --- LOGICA DE BORRADOR (GUARDAR/RECUPERAR) ---

    const cargarBorrador = async (solicitudId) => {
        try {
            const { data, error } = await supabase
                .from('atenciones_temporales')
                .select('*')
                .eq('solicitud_id', solicitudId)
                .single();
            
            if (data) {
                if (data.documentos_json) setDocumentosSeleccionados(data.documentos_json);
                if (data.firma_temp) setFirma(data.firma_temp);
                if (data.observaciones_temp) setObservacionesAtencion(data.observaciones_temp);
                onMensaje("Borrador recuperado exitosamente.", "success");
            }
        } catch (error) {
            // Es normal si no hay borrador
            // console.log("No hay borrador previo.");
        }
    };

    const guardarBorrador = async () => {
        if (!selectedSolicitud) return;
        
        setGuardandoBorrador(true);
        try {
            // Intentar convertir la firma a string si es necesario, aunque DigitalSignature ya debería devolver una cadena
            const firmaData = firma;

            const { error } = await supabase
                .from('atenciones_temporales')
                .upsert({
                    solicitud_id: selectedSolicitud.id,
                    documentos_json: documentosSeleccionados,
                    firma_temp: firmaData,
                    observaciones_temp: observacionesAtencion,
                    updated_at: new Date().toISOString()
                });
            
            if (error) throw error;
            onMensaje("Progreso guardado. Puede continuar más tarde.", "success");
        } catch (error) {
            console.error(error);
            onMensaje("Error al guardar borrador: " + error.message, "error");
        } finally {
            setGuardandoBorrador(false);
        }
    };

    const handleAtenderClick = async (solicitud) => {
        setSelectedSolicitud(solicitud);
        // Resetear estados
        setDocumentosSeleccionados([]);
        setFirma(null);
        setBusquedaDoc("");
        setResultadosBusqueda([]);
        setObservacionesAtencion("");
        
        setShowProcessModal(true);
        
        // Intentar cargar borrador existente
        await cargarBorrador(solicitud.id);
    };

    const confirmarAtencion = async () => {
        if (documentosSeleccionados.length === 0) return onMensaje("Seleccione al menos un documento.", "error");
        if (!firma) return onMensaje("Firma obligatoria del solicitante.", "error");

        setProcessing(true);
        try {
            // Los documentos ya contienen todos los campos del inventario (Numero_Folios, Ambiente, Estante, etc.) 
            // porque provienen del estado documentosSeleccionados.
            
            const { error: rpcError } = await supabase.rpc('atender_solicitud_transaction', {
                p_solicitud_id: selectedSolicitud.id,
                p_firma: firma,
                p_observaciones: observacionesAtencion,
                p_usuario_id: currentUser.id, // ID del usuario de Archivo Central (logged in user)
                p_documentos: documentosSeleccionados // Array JSONB completo
            });

            if (rpcError) throw rpcError;

            onMensaje("Solicitud atendida exitosamente y proceso registrado.", "success");
            setShowProcessModal(false);
            onReload(); 

        } catch (e) { 
            console.error("Error al procesar la transacción:", e);
            onMensaje("Error al procesar la entrega: " + e.message, "error"); 
        } finally { 
            setProcessing(false); 
        }
    };

    // --- LÓGICA DE RECHAZO ---
    const handleRechazarClick = (solicitud) => {
        setSelectedSolicitud(solicitud);
        setMotivoRechazo("");
        setShowRejectModal(true);
    };

    const confirmarRechazo = async () => {
        if (!motivoRechazo.trim()) {
            return onMensaje("Debe ingresar un motivo para el rechazo.", "error");
        }

        setProcessing(true);
        try {
            const { error } = await supabase
                .from("solicitudes_archivisticas")
                .update({
                    estado: 'Rechazado',
                    observaciones_archivo: motivoRechazo,
                    updated_by: currentUser.id,
                    updated_at: new Date().toISOString()
                })
                .eq("id", selectedSolicitud.id);

            if (error) throw error;

            onMensaje("La solicitud ha sido rechazada.", "success");
            setShowRejectModal(false);
            onReload();
        } catch (e) {
            console.error(e);
            onMensaje("Error al rechazar: " + e.message, "error");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 animate-fade-in">
            <h2 className="text-xl font-extrabold text-slate-800 mb-6 flex items-center gap-2">
                <Clock className="text-amber-600"/> Solicitudes Pendientes
                <span className="bg-amber-100 text-amber-800 text-sm px-2 py-0.5 rounded-full font-bold">{solicitudes.length}</span>
            </h2>
            
            {solicitudes.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl bg-white">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock size={32} className="text-slate-300"/>
                    </div>
                    <p className="text-slate-500 font-medium">No hay solicitudes pendientes por atender.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {solicitudes.map(sol => (
                        <div key={sol.id} className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col lg:flex-row justify-between items-start gap-5 shadow-sm hover:shadow-md transition-all duration-200 group relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400"></div>
                            
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="bg-slate-100 text-slate-700 text-xs font-mono font-bold px-2 py-0.5 rounded border border-slate-200">
                                        #{sol.numero_solicitud || sol.id.slice(0,8)}
                                    </span>
                                    <EstadoBadge estado={sol.estado} />
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                        <Calendar size={12} />
                                        {new Date(sol.fecha_solicitud).toLocaleString('es-ES', {dateStyle: 'medium', timeStyle: 'short'})}
                                    </span>
                                </div>
                                
                                <div>
                                    <h4 className="text-base text-slate-800 mb-1 leading-tight whitespace-pre-line line-clamp-1 group-hover:line-clamp-none transition-all duration-200">
                                        {sol.motivo_solicitud}
                                    </h4>
                                    <div className="flex items-center gap-4 text-sm text-slate-500 mt-2">
                                        <div className="flex items-center gap-1.5">
                                            <User size={14} />
                                            <span className="font-medium text-slate-700">{sol.nombre_solicitante}</span>
                                        </div>
                                        <div className="hidden sm:block w-1 h-1 bg-slate-300 rounded-full"></div>
                                        <div className="flex items-center gap-1.5">
                                            <Building2 size={14} />
                                            <span>{sol.sub_gerencia}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                                    <FileText size={12} />
                                    {formatModalidad(sol.modalidad_servicio)}
                                </div>
                            </div>

                            <div className="flex flex-row lg:flex-col gap-2 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                                <button 
                                    onClick={() => handleAtenderClick(sol)} 
                                    className="flex-1 lg:w-36 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                                >
                                    <Check size={16}/> Atender
                                </button>
                                <button 
                                    onClick={() => handleRechazarClick(sol)} 
                                    className="flex-1 lg:w-36 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-sm font-bold flex items-center justify-center gap-2 transition-all"
                                >
                                    <Ban size={16}/> Rechazar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* --- MODAL DE ATENCIÓN --- */}
            <Modal isOpen={showProcessModal} onClose={() => setShowProcessModal(false)} title="Atención de Solicitud" size="xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* COLUMNA IZQUIERDA: SELECCIÓN DE DOCUMENTOS */}
                    <div className="space-y-4 flex flex-col h-full">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start gap-3">
                            <div className="p-2 bg-blue-100 rounded-full text-blue-600"><FileText size={20}/></div>
                            <div>
                                <h4 className="font-bold text-blue-900 text-sm">Selección de Documentos</h4>
                                <p className="text-xs text-blue-700 mt-0.5">Busque y agregue los documentos físicos a entregar.</p>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="relative flex gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        placeholder="Buscar por descripción, código o caja..."
                                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all outline-none"
                                        value={busquedaDoc}
                                        onChange={(e) => setBusquedaDoc(e.target.value)}
                                    />
                                    <Search className="absolute left-3 top-3 text-slate-400" size={16} />
                                </div>
                                <button
                                    onClick={() => setShowScanner(true)}
                                    className="p-2 bg-white text-slate-600 rounded-md border border-slate-300 hover:bg-slate-100 transition-colors shadow-sm"
                                    title="Escanear código QR"
                                >
                                    <Scan size={18} />
                                </button>
                            </div>
                            
                            {buscandoDocs && <div className="mt-2 text-xs font-medium text-blue-600 flex items-center gap-2"><RefreshCw size={10} className="animate-spin"/> Buscando en inventario...</div>}

                            {/* LISTA DE RESULTADOS DE BÚSQUEDA */}
                            {resultadosBusqueda.length > 0 && !buscandoDocs && (
                                <div className="absolute z-20 w-full bg-white border border-slate-200 rounded-xl shadow-xl mt-2 max-h-64 overflow-y-auto">
                                    {/* Opción Agregar Todo */}
                                    {resultadosBusqueda.length > 1 && (
                                        <div 
                                            onClick={agregarTodoEnBloque}
                                            className="p-3 bg-blue-50 hover:bg-blue-100 cursor-pointer border-b border-blue-100 text-xs flex items-center gap-2 font-bold text-blue-700 sticky top-0 backdrop-blur-sm"
                                        >
                                            <PlusSquare size={14} /> Agregar los {resultadosBusqueda.length} resultados
                                        </div>
                                    )}

                                    {resultadosBusqueda.map(doc => (
                                        <div 
                                            key={doc.id} 
                                            onClick={() => agregarDocumento(doc)}
                                            className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 text-sm group transition-colors"
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-bold text-slate-800 line-clamp-1 group-hover:text-blue-700 transition-colors">{doc.Descripcion}</span>
                                                <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">{doc.Numero_Caja ? `Caja ${doc.Numero_Caja}` : 'S/C'}</span>
                                            </div>
                                            <div className="text-xs text-slate-500 flex flex-wrap gap-2 items-center">
                                                <span className="bg-slate-50 px-1.5 rounded border border-slate-100">{doc.id}</span>
                                                <span>•</span>
                                                <span>{doc.Unidad_Organica}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex-1 flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm min-h-[300px]">
                            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wide flex justify-between items-center">
                                <span>Lista de Entrega ({documentosSeleccionados.length})</span>
                                {documentosSeleccionados.length > 0 && (
                                    <button onClick={eliminarTodosDocumentos} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition-colors" title="Limpiar lista">
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                            <div className="divide-y divide-slate-100 overflow-y-auto flex-1 max-h-[350px]">
                                {documentosSeleccionados.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
                                        <Box size={40} className="mb-3 opacity-20"/>
                                        <p className="text-sm font-medium">No hay documentos seleccionados</p>
                                        <p className="text-xs mt-1">Use el buscador o escáner para agregar.</p>
                                    </div>
                                ) : (
                                    documentosSeleccionados.map((doc, idx) => (
                                        <div key={idx} className="p-4 hover:bg-slate-50 transition-colors group flex gap-4 items-start">
                                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg mt-0.5 shrink-0">
                                                {doc.Tipo_Unidad_Conservacion === 'ARCHIVADOR' ? <Archive size={18} /> :
                                                doc.Tipo_Unidad_Conservacion === 'EMPASTADO' ? <Book size={18} /> :
                                                <FileText size={18} />}
                                            </div>

                                            <div className="flex-1 min-w-0 space-y-2">
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800 line-clamp-1 leading-snug">{doc.Descripcion}</p>
                                                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {doc.id}</p>
                                                </div>
                                                <div className="grid grid-cols-6 gap-x-2 gap-y-1.5 text-xs text-slate-600 bg-slate-50/50 p-2 rounded border border-slate-100 items-center">
                                                    <div className="col-span-4 md:col-span-2 flex items-center gap-1.5">
                                                        <Box size={12} className="text-slate-400 shrink-0" />
                                                        <span>Caja: <strong>{doc.Numero_Caja || '-'}</strong></span>
                                                    </div>
                                                    <div className="col-span-4 md:col-span-2 flex items-center gap-1.5">
                                                        <Book size={12} className="text-slate-400 shrink-0" />
                                                        <span>Tomo: <strong>{doc.Numero_Tomo || '-'}</strong></span>
                                                    </div>
                                                    <div className="col-span-4 md:col-span-2 flex items-center gap-1.5">
                                                        <FileText size={12} className="text-slate-400 shrink-0" />
                                                        <span>Fols: <strong>{doc.Numero_Folios || '-'}</strong></span>
                                                    </div>
                                                    <div className="col-span-4 md:col-span-2 flex items-center gap-1.5">
                                                        <MapPin size={12} className="shrink-0" />
                                                        <span>
                                                            {doc.ubicacion_topografica || [doc.Ambiente, doc.Estante && `E${doc.Estante}`, doc.Cuerpo && `C${doc.Cuerpo}`, doc.Balda && `B${doc.Balda}`].filter(Boolean).join("-") || 'No asignada'}
                                                        </span>
                                                    </div>          
                                                </div>
                                            </div>
                                            <button onClick={() => eliminarDocumento(doc.id)} className="self-start p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors mt-1 shrink-0">
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                        
                        <TextareaField 
                            label="Observaciones de Entrega" 
                            placeholder="Añada notas sobre el estado de los documentos..."
                            value={observacionesAtencion} 
                            onChange={setObservacionesAtencion}
                            rows={3}
                        />
                    </div>

                    {/* COLUMNA DERECHA: FIRMA Y ACCIONES */}
                    <div className="flex flex-col h-full gap-6">
                        <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 flex items-start gap-3">
                            <div className="p-2 bg-emerald-100 rounded-full text-emerald-600"><Check size={20}/></div>
                            <div>
                                <h4 className="font-bold text-emerald-900 text-sm">Conformidad de Recepción</h4>
                                <p className="text-xs text-emerald-700 mt-0.5">Firma obligatoria del solicitante para cerrar la entrega.</p>
                            </div>
                        </div>

                        <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm flex flex-col gap-2 flex-1 min-h-[280px]">
                             <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Firma Digital *</label>
                             <div className="flex-1 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 overflow-hidden relative">
                                <div className="absolute inset-0">
                                    <DigitalSignature value={firma} onChange={setFirma} />
                                </div>
                             </div>
                        </div>

                        <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
                            <button 
                                onClick={guardarBorrador} 
                                disabled={guardandoBorrador || (!documentosSeleccionados.length && !firma && !observacionesAtencion)}
                                className="w-full py-2.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {guardandoBorrador ? <RefreshCw size={16} className="animate-spin"/> : <Save size={16} />}
                                Guardar Borrador (Continuar luego)
                            </button>

                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setShowProcessModal(false)} 
                                    className="flex-1 py-3 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-sm font-bold transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={confirmarAtencion} 
                                    disabled={processing} 
                                    className="flex-1 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    {processing ? <Loader2 size={18} className="animate-spin"/> : <CheckCircle size={18} />}
                                    {processing ? "Procesando..." : "Finalizar Entrega"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* --- MODAL DE RECHAZO (NUEVO) --- */}
            <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} title="Rechazar Solicitud" size="sm">
                <div className="p-1 space-y-6">
                    <div className="bg-red-50 text-red-800 p-4 rounded-xl text-sm border border-red-100 flex gap-3 items-start">
                        <ShieldAlert size={20} className="shrink-0 mt-0.5 text-red-600" />
                        <div>
                            <p className="font-bold mb-1">Acción Irreversible</p>
                            <p className="text-red-700 leading-relaxed">Está a punto de rechazar esta solicitud. Se notificará al usuario y el proceso se cerrará definitivamente.</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Motivo del rechazo *</label>
                        <textarea 
                            className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none outline-none transition-all min-h-[100px]" 
                            placeholder="Indique la razón (Ej: Documento no encontrado, falta de permisos...)"
                            value={motivoRechazo} 
                            onChange={(e) => setMotivoRechazo(e.target.value)} 
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button 
                            onClick={() => setShowRejectModal(false)} 
                            className="px-5 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-sm font-bold transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={confirmarRechazo} 
                            disabled={processing || !motivoRechazo.trim()} 
                            className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-bold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                        >
                            {processing ? <RefreshCw size={16} className="animate-spin"/> : <Ban size={16}/>}
                            Confirmar Rechazo
                        </button>
                    </div>
                </div>
            </Modal>

            {/* USAR EL COMPONENTE QRScanner SEPARADO */}
            <QRScanner isOpen={showScanner} onClose={() => setShowScanner(false)} onScan={handleScanResult} />
        </div>
    );
}