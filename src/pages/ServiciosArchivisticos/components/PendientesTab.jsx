import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from "../../../utils/supabaseClient"; 
import { 
    Clock, Check, Search, Trash2, FileText, X, Scan, 
    RefreshCw, Ban, User, Calendar, Building2, CheckCircle, 
    Box, ChevronDown, AlertCircle, PackageCheck, MapPin, 
    Hash, BookOpen, PlusSquare, Loader2, Save, Users, Settings
} from "lucide-react";

// Componentes de UI/Flujo (Asumidos o definidos - *NO INCLUIDOS PARA BREVEDAD*)
import QRScanner from "../../../components/ui/QRScanner"; 
import { DigitalSignature } from "../../../components/ui/DigitalSignature";
import { TextareaField } from "../../../components/ui/TextareaField";
// import { EstadoBadge } from "../ServiciosArchivisticos"; // Se elimina para simplificación visual

// --- CONSTANTES ---
const MODALIDADES = [
    { value: "PRESTAMO_ORIGINAL", label: "Préstamo de Original" },
    { value: "CONSULTA_SALA", label: "Consulta en Sala" },
    { value: "COPIA_CERTIFICADA", label: "Copia Certificada" },
    { value: "COPIA_SIMPLE", label: "Copia Simple" },
    { value: "REPROGRAFIA", label: "Reprografía" },
    { value: "DIGITALIZACION", label: "Digitalización" },
    { value: "OTROS", label: "Otros" }
];

// 1. Modal Genérico (Añadido al scope para ser autocontenido)
const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
    if (!isOpen) return null;
    const sizes = { sm: "max-w-md", md: "max-w-2xl", lg: "max-w-5xl", xl: "max-w-7xl" };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative bg-white w-full ${sizes[size]} rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden`}>
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
                    <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-0 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/30">
                    {children}
                </div>
            </div>
        </div>
    );
};

// 2. Fila de Solicitud (Diseño Progresivo con acordeón)
const RequestRow = React.memo(({ solicitud, onProcess, onReject }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Simplificación Visual: Uso de icono + color en lugar de badge
    const iconColorClass = solicitud.modalidad_servicio === 'PRESTAMO_ORIGINAL' ? 
                           'text-red-500 bg-red-50' : 
                           'text-blue-500 bg-blue-50';
    
    const formatModalidad = (modalidad) => {
        const entry = MODALIDADES.find(m => m.value === modalidad);
        return entry ? entry.label : modalidad?.replace('_', ' ') || 'No especificado';
    };

    return (
        <div className={`bg-white border border-slate-200 rounded-lg shadow-sm transition-all duration-200 ${isExpanded ? 'ring-2 ring-blue-500/10 border-blue-200' : 'hover:border-blue-300'}`}>
            {/* Cabecera Compacta: Ítems esenciales */}
            <div 
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${iconColorClass}`} title={formatModalidad(solicitud.modalidad_servicio)}>
                        <FileText size={20} /> {/* Icono único para simplificación */}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            {/* Simplificación Visual: Oculta el ID largo, muestra el Nº de Solicitud (crítico) */}
                            <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                #{solicitud.numero_solicitud || solicitud.id.substring(0,8)}
                            </span>
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                <Calendar size={12}/> {new Date(solicitud.fecha_solicitud).toLocaleDateString()}
                            </span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm truncate" title={solicitud.nombre_solicitante}>
                            <User size={14} className="text-blue-500 inline-block mr-1.5"/> {solicitud.nombre_solicitante}
                        </h4>
                    </div>
                </div>

                {/* Priorización de Datos: Muestra acción principal (Atender) y botón de expansión */}
                <div className="flex items-center gap-4">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onProcess(solicitud); }}
                        className="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-transform active:scale-95 whitespace-nowrap"
                        title="Iniciar atención de la solicitud"
                    >
                        <Check size={14} /> Atender
                    </button>
                    {/* Botón Expansión */}
                    <div className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown size={20} />
                    </div>
                </div>
            </div>

            {/* Detalles Expandibles (Acordeón) */}
            {isExpanded && (
                <div className="px-4 pb-4 pt-0 border-t border-slate-100 bg-slate-50/50 rounded-b-lg animate-in slide-in-from-top-2">
                    <div className="pt-3 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                        <div className="md:col-span-2 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs">
                                <p className="font-bold text-slate-500 uppercase flex items-center gap-1 min-w-0">
                                    <Building2 size={12} className="text-slate-400 shrink-0"/> 
                                    <span className="whitespace-nowrap">Sección:</span>
                                    <span className='text-slate-700 font-medium truncate block'>{solicitud.sub_gerencia}</span>
                                </p>
                                <p className="font-bold text-slate-500 uppercase flex items-center gap-1 min-w-0">
                                    <Users size={12} className="text-slate-400 shrink-0"/> 
                                    <span className="whitespace-nowrap">Contacto:</span>
                                    <span className='text-slate-700 font-medium truncate block'>{solicitud.movil || solicitud.email}</span>
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Motivo del Requerimiento</p>
                                <p className="text-sm text-slate-700 bg-white p-3 rounded border border-slate-200 leading-relaxed break-words">
                                    {solicitud.motivo_solicitud}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col justify-end gap-2 mt-2 md:mt-0">
                            <span className="text-xs font-bold text-slate-500 uppercase mb-1 md:block hidden">Acciones Adicionales</span>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onReject(solicitud); }}
                                className="w-full py-2.5 bg-white border border-slate-300 text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-colors active:scale-95"
                            >
                                <Ban size={16} /> Rechazar Solicitud
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});


// 3. Document Search & Item (Simplificación en el Modal)
const DocumentSearchPanel = React.memo(({ busquedaDoc, setBusquedaDoc, buscandoDocs, resultadosBusqueda, agregarDocumento, agregarTodoEnBloque, setShowScanner }) => (
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
            <button
                onClick={() => setShowScanner(true)}
                className="p-2.5 bg-slate-100 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl border border-slate-200 transition-colors"
                title="Escanear QR"
            >
                <Scan size={20}/>
            </button>
        </div>

        {/* Dropdown de Resultados */}
        {resultadosBusqueda.length > 0 && (
            <div className="absolute z-10 top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-1">
                {/* Opción Agregar Todo (Agrupación de opciones avanzadas) */}
                {resultadosBusqueda.length > 1 && (
                    <div 
                        onClick={agregarTodoEnBloque}
                        className="p-3 bg-blue-50 hover:bg-blue-100 cursor-pointer border-b border-blue-100 text-xs flex items-center gap-2 font-bold text-blue-700 sticky top-0 backdrop-blur-sm"
                    >
                        <PlusSquare size={14} /> Agregar los {resultadosBusqueda.length} documentos encontrados
                    </div>
                )}
                {resultadosBusqueda.map(doc => (
                    <div 
                        key={doc.id} 
                        onClick={() => agregarDocumento(doc)} 
                        className="p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0"
                    >
                        <p className="font-bold text-xs text-slate-700 truncate">{doc.Descripcion}</p>
                        {/* Simplificación Visual: Mostrar solo ID y Ubicación Topográfica (críticos para archivo) */}
                        <div className="flex justify-between items-center mt-1">
                            <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1"><Hash size={10}/> ID: {doc.id}</span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1 rounded font-mono"><MapPin size={10} className='inline-block mr-0.5'/> Caja: {doc.Numero_Caja}</span>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
));

// 4. Panel de Configuración de Atención (Uso de TABS)
const AtencionConfigPanel = React.memo(({ modalidadTemp, setModalidadTemp, requiresSignature, firma, setFirma, observacionesAtencion, setObservacionesAtencion, guardarBorrador, guardandoBorrador, finalizarAtencion, processing, documentosSeleccionados }) => {
    const [activeTab, setActiveTab] = useState('signature'); // Pestañas: Firma/Observaciones, Datos de Control

    const tabs = useMemo(() => [
        { id: 'signature', label: requiresSignature ? 'Firma Requerida' : 'Observaciones', icon: requiresSignature ? Save : FileText },
        { id: 'control', label: 'Datos de Control', icon: Settings },
    ], [requiresSignature]);

    return (
        <div className="flex-1 flex flex-col">
            
            {/* Pestañas de Navegación (Diseño Progresivo / Agrupación) */}
            <div className="flex border-b border-slate-200 mb-4 flex-shrink-0">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`py-2 px-4 text-sm font-bold flex items-center gap-2 transition-colors ${
                            activeTab === tab.id
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-slate-500 hover:text-blue-600'
                        }`}
                    >
                        <tab.icon size={16}/> {tab.label}
                        {requiresSignature && tab.id === 'signature' && !firma && <AlertCircle size={14} className='text-red-500 ml-1'/>}
                    </button>
                ))}
            </div>

            {/* Selector de Modalidad (Información Crítica - Siempre visible) */}
            <div className="mb-4">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                    Modalidad de Servicio
                </label>
                <div className="relative">
                    <select
                        value={modalidadTemp || ''}
                        onChange={(e) => setModalidadTemp(e.target.value)}
                        className={`w-full py-2.5 pl-3 pr-10 border rounded-lg text-sm transition-all focus:ring-2 ${requiresSignature ? 'border-amber-400 focus:border-amber-500 bg-amber-50/30' : 'border-slate-300 focus:border-blue-500 bg-white'}`}
                    >
                        {MODALIDADES.map(mod => (
                            <option key={mod.value} value={mod.value}>{mod.label}</option>
                        ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-3.5 text-slate-400 pointer-events-none"/>
                    {requiresSignature && (
                        <div className='absolute right-10 top-3 text-xs font-bold text-amber-700 flex items-center gap-1'>
                            <AlertCircle size={14}/> Requiere Firma
                        </div>
                    )}
                </div>
            </div>
            
            {/* Contenido de las Pestañas (Diseño Progresivo) */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">

                {activeTab === 'signature' && (
                    <div className="space-y-4">
                        {/* Firma (CONDICIONAL - Primera vista si es préstamo) */}
                        {requiresSignature ? (
                            <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm flex flex-col gap-2 flex-1 min-h-[420px]">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Firma Digital del Solicitante *</label>
                                <div className="flex-1 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 overflow-hidden relative">
                                    <div className="absolute inset-0">
                                        <DigitalSignature value={firma} onChange={setFirma} />
                                    </div>
                                </div>
                                {!firma && <p className="text-red-500 text-xs font-medium flex items-center gap-1"><AlertCircle size={12}/> La firma es obligatoria para Préstamo de Original.</p>}
                            </div>
                        ) : (
                            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                                <p className="text-sm text-emerald-800 font-medium flex items-center gap-2">
                                    <CheckCircle size={18} className="shrink-0"/> Esta modalidad no requiere firma digital.
                                </p>
                            </div>
                        )}
                        
                        {/* Observaciones (Siempre visible en esta pestaña) */}
                        <TextareaField 
                            label="Observaciones de Entrega"
                            placeholder="Añada notas sobre el estado de los documentos..."
                            value={observacionesAtencion} 
                            onChange={setObservacionesAtencion}
                            rows={3}
                        />
                    </div>
                )}
                
                {activeTab === 'control' && (
                    <div className="space-y-4">
                        {/* Datos de Control Adicionales (Ejemplo de campos ocultos) */}
                        <div className="p-4 bg-white rounded-xl border border-slate-200">
                             <h4 className='text-xs font-bold text-slate-500 mb-3 uppercase flex items-center gap-1'><Settings size={14}/> Configuración de Registro</h4>
                             <p className='text-xs text-slate-500 mb-2'>Estos campos son opcionales y solo para registro interno.</p>
                             {/* Aquí irían campos como: Contratista, N° Entregable, etc. si fueran necesarios para esta vista */}
                             <div className="grid grid-cols-2 gap-4">
                                {/* Simulación de TextareaField, ya que TextareaField solo pide value/onChange */}
                                <input type='text' placeholder='Contratista (Opcional)' className='p-2 border border-slate-200 rounded-lg text-sm'/>
                                <input type='text' placeholder='N° Entregable (Opcional)' className='p-2 border border-slate-200 rounded-lg text-sm'/>
                             </div>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Footer de Acciones (Priorización de Datos: Dos acciones principales) */}
            <div className="flex flex-col gap-3 pt-4 border-t border-slate-100 mt-auto flex-shrink-0">
                {/* Botón Finalizar / Entregar (PRIMARIO) */}
                <button 
                    onClick={finalizarAtencion} 
                    disabled={processing || documentosSeleccionados.length === 0 || (requiresSignature && !firma)} 
                    className="w-full py-3.5 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-lg shadow-blue-700/20 transition-all flex items-center justify-center gap-2"
                >
                    {processing ? <Loader2 size={18} className="animate-spin"/> : <CheckCircle size={18} />}
                    {processing ? "Procesando..." : `Finalizar Entrega`}
                </button>
                
                {/* Botón Guardar Borrador (SECUNDARIO, menos destacado) */}
                <button 
                    onClick={guardarBorrador} 
                    disabled={guardandoBorrador || (!documentosSeleccionados.length && !firma && !observacionesAtencion)}
                    className="w-full py-2.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {guardandoBorrador ? <RefreshCw size={16} className="animate-spin"/> : <Save size={16} />}
                    Guardar Borrador
                </button>
            </div>
        </div>
    );
});


// 5. Componente Principal reorganizado
export default function PendientesTab({ solicitudes, currentUser, onReload, onMensaje }) {
    
    // ... (Inicio de Lógica del Componente Principal) ...
    const [selectedSolicitud, setSelectedSolicitud] = useState(null);
    const [showProcessModal, setShowProcessModal] = useState(false);     
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showScanner, setShowScanner] = useState(false);

    const [busquedaDoc, setBusquedaDoc] = useState("");
    const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
    const [buscandoDocs, setBuscandoDocs] = useState(false);
    
    const [documentosSeleccionados, setDocumentosSeleccionados] = useState([]);
    const [firma, setFirma] = useState(null);
    const [observacionesAtencion, setObservacionesAtencion] = useState("");
    
    const [processing, setProcessing] = useState(false);
    const [guardandoBorrador, setGuardandoBorrador] = useState(false);
    const [motivoRechazo, setMotivoRechazo] = useState("");
    
    const [modalidadTemp, setModalidadTemp] = useState(null); 
    
    const formatUbicacionTopografica = useCallback((doc) => {
        return [
            doc.Ambiente,
            doc.Estante && `E${doc.Estante}`,
            doc.Cuerpo && `C${doc.Cuerpo}`,
            doc.Balda && `B${doc.Balda}`
        ].filter(Boolean).join('-');
    }, []);
    
    // Se inserta la lógica de búsqueda para que el código sea funcional.
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
    
    // Handlers Individuales Guardar Borrador  
    const cargarBorrador = async (solicitudId) => {
        try {
            const { data } = await supabase
                .from('atenciones_temporales')
                .select('*')
                .eq('solicitud_id', solicitudId)
                .single();
            
            if (data) {
                if (data.documentos_json) setDocumentosSeleccionados(data.documentos_json);
                if (data.firma_temp) setFirma(data.firma_temp);
                if (data.observaciones_temp) setObservacionesAtencion(data.observaciones_temp);
                onMensaje("Borrador recuperado. Puede continuar.", "success");
            }
        } catch (error) {
            // No action: No draft found is expected
        }
    };
    
    const guardarBorrador = async () => {
        if (!selectedSolicitud) return;
        
        setGuardandoBorrador(true);
        try {
            const { error } = await supabase
                .from('atenciones_temporales')
                .upsert({
                    solicitud_id: selectedSolicitud.id,
                    documentos_json: documentosSeleccionados, 
                    firma_temp: firma,
                    observaciones_temp: observacionesAtencion,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'solicitud_id' }); 
            
            if (error) throw error;
            onMensaje("Progreso guardado. Borrador actualizado.", "success");
        } catch (error) {
            console.error(error);
            onMensaje("Error al guardar borrador: " + error.message, "error");
        } finally {
            setGuardandoBorrador(false);
        }
    };

    const agregarDocumento = (doc) => { 
        if (documentosSeleccionados.some(d => d.id === doc.id)) return onMensaje("Este documento ya está en la lista.", "warning");
        const nuevoDoc = { 
            ...doc, 
            numero_orden: documentosSeleccionados.length + 1,
            ubicacion_topografica: formatUbicacionTopografica(doc)
        };
        setDocumentosSeleccionados(prev => [...prev, nuevoDoc]);
        setBusquedaDoc(""); 
        setResultadosBusqueda([]); 
    };
    const eliminarDocumento = (id) => { setDocumentosSeleccionados(prev => prev.filter(d => d.id !== id)); };
    const agregarTodoEnBloque = () => { 
                const existingIds = new Set(documentosSeleccionados.map(d => d.id));
        let newDocs = [...documentosSeleccionados];
        let newCount = newDocs.length;
        let addedCount = 0;

        resultadosBusqueda.forEach(doc => {
            if (!existingIds.has(doc.id)) {
                newCount++;
                const nuevoDoc = { 
                    ...doc, 
                    numero_orden: newCount,
                    ubicacion_topografica: formatUbicacionTopografica(doc)
                };
                newDocs.push(nuevoDoc);
                addedCount++;
            }
        });

        setDocumentosSeleccionados(newDocs);
        setBusquedaDoc(""); 
        setResultadosBusqueda([]);
        if (addedCount > 0) {
            onMensaje(`${addedCount} documentos añadidos a la canasta.`, "success");
        } else {
            onMensaje("Todos los documentos ya estaban en la canasta.", "warning");
        }
     };
    const limpiarCanasta = () => { 
        if (documentosSeleccionados.length > 0) {
            setDocumentosSeleccionados([]);
            onMensaje("Canasta de entrega vaciada.", "info");
        }
     };
    const iniciarAtencion = async (solicitud) => { 
        setSelectedSolicitud(solicitud);
        setModalidadTemp(solicitud.modalidad_servicio); 
        
        setDocumentosSeleccionados([]);
        setFirma(null);
        setBusquedaDoc("");
        setResultadosBusqueda([]);
        setObservacionesAtencion("");
        
        setShowProcessModal(true);
        
        await cargarBorrador(solicitud.id);
     };
    const handleScanResult = useCallback(async (code) => { 
        setShowScanner(false);
        setBuscandoDocs(true);
        try {
            const { data } = await supabase
                .from("Inventario_documental")
                .select(`id, Numero_Caja, Numero_Tomo, Numero_Folios, Ambiente, Estante, Cuerpo, Balda, Descripcion, Serie_Documental, Unidad_Organica`)
                .eq("id", code)
                .single();

            if (data) {
                agregarDocumento(data);
                onMensaje(`Documento escaneado: ${data.Descripcion}`, "success");
            } else {
                onMensaje(`Código ${code}: Documento no encontrado.`, "info");
            }
        } catch (err) {
             onMensaje(`Error al buscar el código escaneado.`, "error");
        } finally {
            setBuscandoDocs(false);
        }
     }, [agregarDocumento, onMensaje]);

    const handleRechazarClick = (solicitud) => { 
        setSelectedSolicitud(solicitud);
        setMotivoRechazo("");
        setShowRejectModal(true);
     };

    const confirmarRechazo = async () => { 
        if (!motivoRechazo.trim()) return onMensaje("Debe ingresar un motivo para el rechazo.", "error");
        
        setProcessing(true);
        try {
            const { error } = await supabase
                .from("solicitudes_archivisticas")
                .update({
                    estado: 'RECHAZADO',
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

    const finalizarAtencion = async () => { 
        // Validaciones previas
        if (!currentUser?.id || !selectedSolicitud?.id) {
            return onMensaje("Error: Sesión no válida o solicitud no seleccionada.", "error");
        }

        const isPrestamo = modalidadTemp === 'PRESTAMO_ORIGINAL';
        
        if (documentosSeleccionados.length === 0) {
            return onMensaje("Seleccione al menos un documento para atender.", "error");
        }
        
        if (isPrestamo && !firma) {
            return onMensaje("La firma es obligatoria para préstamos de originales.", "error");
        }

        setProcessing(true);
        
        // Determinar valores
        const nuevoEstado = isPrestamo ? 'PRESTADO' : 'ATENDIDO';
        const firmaData = isPrestamo ? firma : null;
        
        try {
            // 1. Ejecutar RPC (Transacción en Base de Datos)
            // Nota: Asegúrate que 'documentosSeleccionados' sea un array de objetos, ej: [{id: 'uuid'}, ...]
            const { error: rpcError } = await supabase.rpc('atender_solicitud_transaction', {
                p_solicitud_id: selectedSolicitud.id,
                p_firma: firmaData,
                p_observaciones: observacionesAtencion || "Entrega de documentos finalizada",
                p_usuario_id: currentUser.id, 
                p_documentos: documentosSeleccionados 
            });

            if (rpcError) throw rpcError;

            // 2. Actualizar la cabecera de la solicitud (solicitudes_archivisticas)
            // Esto se hace fuera del RPC según tu código original, aunque idealmente debería ir dentro del RPC para atomicidad total.
            const { error: updateError } = await supabase
                .from("solicitudes_archivisticas")
                .update({ 
                    estado: nuevoEstado, 
                    modalidad_servicio: modalidadTemp,
                    updated_by: currentUser.id,
                    updated_at: new Date() // Buena práctica actualizar el timestamp
                })
                .eq("id", selectedSolicitud.id);
            
            if (updateError) throw updateError;            

            // 3. Limpieza de borradores
            await supabase
                .from('atenciones_temporales')
                .delete()
                .eq('solicitud_id', selectedSolicitud.id);

            // Feedback al usuario
            onMensaje(`Solicitud procesada correctamente. Estado: ${nuevoEstado}.`, "success");
            setShowProcessModal(false);
            if (onReload) onReload(); 

        } catch (e) { 
            console.error("Error al procesar la transacción:", e);
            // Mostrar mensaje técnico solo si es necesario, si no un mensaje genérico
            onMensaje(`No se pudo procesar la solicitud: ${e.message || e.details || "Error desconocido"}`, "error"); 
        } finally { 
            setProcessing(false); 
        }
    };

    const requiresSignature = modalidadTemp === 'PRESTAMO_ORIGINAL';
    
    // RENDER: Se mantiene la estructura principal (Header y Lista)
    return (
        <div className="space-y-6">
            
            {/* 1. Header y Contador (Simplificación Visual) */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                    <Clock size={20} className="text-amber-600"/> Solicitudes Pendientes
                </h2>
                {/* KPI Crítico */}
                <span className="text-sm bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-extrabold">
                    {solicitudes.length} Pendientes
                </span>
            </div>

            {/* 2. Lista Maestra (Acordeón DocuFlow) */}
            <div className="space-y-3 min-h-[300px]">
                {solicitudes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-white">
                        <CheckCircle size={48} className="text-slate-200 mb-2"/>
                        <p className="text-sm font-medium">Todo al día. No hay solicitudes pendientes.</p>
                    </div>
                ) : (
                    solicitudes.map(sol => (
                        <RequestRow 
                            key={sol.id} 
                            solicitud={sol} 
                            onProcess={iniciarAtencion} 
                            onReject={handleRechazarClick} 
                        />
                    ))
                )}
            </div>

            {/* 3. Modal Workspace de Entrega (Diseño Progresivo / Modal Complejo) */}
            <Modal isOpen={showProcessModal} onClose={() => setShowProcessModal(false)} title="Workspace: Despacho de Documentos" size="lg">
                <div className="flex flex-col lg:flex-row h-full min-h-[500px]">
                    
                    {/* COLUMNA IZQUIERDA: Canasta de Entrega (Oculta campos innecesarios) */}
                    <div className="w-full lg:w-5/12 bg-slate-50 border-r border-slate-200 flex flex-col p-5">
                         <DocumentSearchPanel 
                            busquedaDoc={busquedaDoc} 
                            setBusquedaDoc={setBusquedaDoc} 
                            buscandoDocs={buscandoDocs} 
                            resultadosBusqueda={resultadosBusqueda} 
                            agregarDocumento={agregarDocumento} 
                            agregarTodoEnBloque={agregarTodoEnBloque} 
                            setShowScanner={setShowScanner}
                        />

                        {/* Canasta */}
                        <div className="flex items-center justify-between mb-4 mt-4 pt-4 border-t border-slate-200">
                            <div className="flex items-center gap-2">
                                <PackageCheck className="text-blue-600" size={20}/>
                                <h4 className="font-bold text-slate-700 text-sm uppercase">Items ({documentosSeleccionados.length})</h4>
                            </div>
                            {/* Botón Vaciar Canasta (Acción secundaria) */}
                            {documentosSeleccionados.length > 0 && (
                                <button
                                    onClick={limpiarCanasta}
                                    className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
                                >
                                    <Trash2 size={14} /> Vaciar
                                </button>
                            )}
                        </div>
                        
                        {/* Lista de Items (Compacta) */}
                        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                            {documentosSeleccionados.length === 0 ? (
                                <div className="text-center py-10 px-4 border-2 border-dashed border-slate-200 rounded-lg">
                                    <Box size={32} className="text-slate-300 mx-auto mb-2"/>
                                    <p className="text-xs text-slate-400">Busque y seleccione documentos para añadirlos a la entrega.</p>
                                </div>
                            ) : (
                                documentosSeleccionados.map((doc) => (
                                    <div key={doc.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm relative group">
                                        <button 
                                            onClick={() => eliminarDocumento(doc.id)} 
                                            className="absolute top-2 right-2 text-slate-300 hover:text-red-500 transition-colors"
                                        >
                                            <X size={14}/> {/* Ícono más minimalista para eliminar */}
                                        </button>
                                        <div className="pr-6">
                                            <p className="font-bold text-xs text-slate-700 line-clamp-2 mb-1">{doc.Descripcion}</p>
                                            {/* Simplificación Visual: Reducción de 4 badges a 2 líneas de info esencial */}
                                            <div className="flex flex-wrap gap-x-3 text-[10px] text-slate-500 font-mono">
                                                <span className="flex items-center gap-1"><Hash size={10}/> ID: {doc.id}</span>
                                                <span className="flex items-center gap-1"><MapPin size={10}/> Ubi: {doc.ubicacion_topografica}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* COLUMNA DERECHA: Configuración (Ahora usa pestañas) */}
                    <div className="w-full lg:w-7/12 p-6 flex flex-col">
                        <AtencionConfigPanel 
                            modalidadTemp={modalidadTemp}
                            setModalidadTemp={setModalidadTemp}
                            requiresSignature={requiresSignature}
                            firma={firma}
                            setFirma={setFirma}
                            observacionesAtencion={observacionesAtencion}
                            setObservacionesAtencion={setObservacionesAtencion}
                            guardarBorrador={guardarBorrador}
                            guardandoBorrador={guardandoBorrador}
                            finalizarAtencion={finalizarAtencion}
                            processing={processing}
                            documentosSeleccionados={documentosSeleccionados}
                        />
                    </div>
                </div>
            </Modal>

            {/* 4. Modal de Rechazo (Simple - Se mantiene) */}
            <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} title="Rechazar Solicitud" size="sm">
                <div className="p-4 space-y-4">
                    <div className="bg-red-50 p-3 rounded-lg flex items-start gap-3">
                        <AlertCircle className="text-red-600 mt-0.5" size={18}/>
                        <p className="text-xs text-red-800">
                            Esta acción notificará al usuario y cerrará la solicitud. No se puede deshacer.
                        </p>
                    </div>
                    <TextareaField 
                        label="Motivo del rechazo *"
                        value={motivoRechazo} 
                        onChange={setMotivoRechazo} 
                        rows={3}
                        placeholder="Ej: Documento no encontrado, falta autorización..."
                    />
                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700">Cancelar</button>
                        <button onClick={confirmarRechazo} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg shadow-sm">Confirmar Rechazo</button>
                    </div>
                </div>
            </Modal>

            <QRScanner 
                isOpen={showScanner} 
                onClose={() => setShowScanner(false)} 
                onScan={handleScanResult} 
            />
        </div>
    );
}