import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from "../../../utils/supabaseClient"; 
import { 
    Clock, Check, Search, Trash2, FileText, X, Scan, 
    RefreshCw, Ban, User, Calendar, Building2, CheckCircle, 
    Box, ChevronDown, AlertCircle, PackageCheck, MapPin, 
    Hash, BookOpen, PlusSquare, Loader2, Save, Users, Settings,
    RotateCcw, Printer, FileCheck, Archive
} from "lucide-react";

// Componentes de UI/Flujo
import { DigitalSignature } from "../../../components/ui/DigitalSignature";
import { TextareaField } from "../../../components/ui/TextareaField";
import CargoPrestamoPDF from './CargoPrestamoPDF';

// --- CONSTANTES Y UTILIDADES ---

// Función auxiliar para cálculo de fechas (Lógica original conservada)
const getDiasVencimiento = (fecha) => {
    if (!fecha) return null;
    const hoy = new Date();
    const fechaVenc = new Date(fecha);
    fechaVenc.setHours(23, 59, 59, 999);
    const diffTime = fechaVenc - hoy;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
};

// 1. Modal Genérico (Idéntico a PendientesTab)
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

// 2. Fila de Préstamo (Adaptación de RequestRow con lógica de semáforo)
const LoanRow = React.memo(({ solicitud, onDevolucion, onPrint }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Lógica de Vencimiento (Semáforo)
    const diasRestantes = getDiasVencimiento(solicitud.fecha_devolucion_prevista);
    const esVencido = diasRestantes !== null && diasRestantes < 0;
    const esUrgente = diasRestantes !== null && diasRestantes >= 0 && diasRestantes <= 2;
    
    const iconColorClass = esVencido 
        ? 'text-red-500 bg-red-50' 
        : esUrgente 
            ? 'text-amber-500 bg-amber-50' 
            : 'text-emerald-500 bg-emerald-50';

    const estadoTexto = esVencido 
        ? `VENCIDO hace ${Math.abs(diasRestantes)} día(s)` 
        : (diasRestantes !== null ? `Vence en ${diasRestantes} día(s)` : 'Fecha abierta');

    return (
        <div className={`bg-white border border-slate-200 rounded-lg shadow-sm transition-all duration-200 ${isExpanded ? 'ring-2 ring-blue-500/10 border-blue-200' : 'hover:border-blue-300'}`}>
            {/* Cabecera Compacta */}
            <div 
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${iconColorClass}`} title={estadoTexto}>
                        <Clock size={20} />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                #{solicitud.numero_solicitud || solicitud.id.substring(0,8)}
                            </span>
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${esVencido ? 'text-red-600 bg-red-100' : 'text-slate-500 bg-slate-100'}`}>
                                <Calendar size={12}/> {estadoTexto}
                            </span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm truncate" title={solicitud.nombre_solicitante}>
                            <User size={14} className="text-blue-500 inline-block mr-1.5"/> {solicitud.nombre_solicitante}
                        </h4>
                    </div>
                </div>

                {/* Acciones Principales */}
                <div className="flex items-center gap-3">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onPrint(solicitud); }}
                        className="p-2 bg-white border border-slate-300 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Imprimir Cargo"
                    >
                        <Printer size={16} />
                    </button>
                    
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDevolucion(solicitud); }}
                        className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-transform active:scale-95 whitespace-nowrap"
                        title="Registrar Devolución"
                    >
                        <RotateCcw size={14} /> Devolución
                    </button>
                    
                    <div className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown size={20} />
                    </div>
                </div>
            </div>

            {/* Detalles Expandibles */}
            {isExpanded && (
                <div className="px-4 pb-4 pt-0 border-t border-slate-100 bg-slate-50/50 rounded-b-lg animate-in slide-in-from-top-2">
                    <div className="pt-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <div className="flex items-center gap-4 text-xs">
                                <p className="font-bold text-slate-500 uppercase flex items-center gap-1">
                                    <Building2 size={12} className="text-slate-400"/> Área: <span className='text-slate-700 font-medium'>{solicitud.sub_gerencia}</span>
                                </p>
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Motivo del Préstamo</p>
                            <p className="text-sm text-slate-700 bg-white p-2.5 rounded border border-slate-200 leading-relaxed whitespace-pre-line">
                                {solicitud.motivo_solicitud}
                            </p>
                        </div>
                        <div className="space-y-3">
                            <p className="text-xs font-bold text-slate-500 uppercase">Detalles de Vencimiento</p>
                             <div className="text-sm text-slate-700 bg-white p-2.5 rounded border border-slate-200">
                                <div className="flex justify-between mb-1">
                                    <span className="text-slate-500">Fecha Préstamo:</span>
                                    <span className="font-medium">{new Date(solicitud.fecha_solicitud).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Fecha Límite:</span>
                                    <span className={`font-bold ${esVencido ? 'text-red-600' : 'text-slate-700'}`}>
                                        {solicitud.fecha_devolucion_prevista ? new Date(solicitud.fecha_devolucion_prevista).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

// 3. Panel de Items a Devolver (Reemplaza a DocumentSearchPanel en estructura)
const ItemsReturnPanel = React.memo(({ docsDevolucion, setDocsDevolucion, toggleAll }) => {
    const itemsPendientes = docsDevolucion.filter(d => !d.ya_devuelto);
    const itemsSeleccionados = docsDevolucion.filter(d => d.selected_return && !d.ya_devuelto);
    const allSelected = itemsPendientes.length > 0 && itemsPendientes.every(d => d.selected_return);

    return (
        <div className="flex-1 flex flex-col h-full">
            {/* Header de la Lista */}
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                    <Box className="text-blue-600" size={20}/>
                    <h4 className="font-bold text-slate-700 text-sm uppercase">
                        Items en Poder del Usuario
                    </h4>
                </div>
                {itemsPendientes.length > 0 && (
                    <button 
                        onClick={toggleAll}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                    >
                        {allSelected ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                    </button>
                )}
            </div>

            {/* Lista de Items */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {docsDevolucion.length === 0 ? (
                    <div className="text-center py-10 px-4 border-2 border-dashed border-slate-200 rounded-lg">
                        <Loader2 size={32} className="text-slate-300 mx-auto mb-2 animate-spin"/>
                        <p className="text-xs text-slate-400">Cargando inventario del préstamo...</p>
                    </div>
                ) : (
                    docsDevolucion.map((doc) => {
                         const isActionable = !doc.ya_devuelto;
                         const isSelected = doc.selected_return;
                         
                         return (
                            <div 
                                key={doc.id} 
                                onClick={() => isActionable && setDocsDevolucion(prev => prev.map(p => p.id === doc.id ? {...p, selected_return: !p.selected_return} : p))}
                                className={`p-3 rounded-lg border transition-all cursor-pointer relative group flex items-start gap-3
                                    ${!isActionable ? 'bg-slate-50 border-slate-100 opacity-60' : 
                                      isSelected ? 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-200' : 'bg-white border-slate-200 hover:border-blue-300'}
                                `}
                            >
                                <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors
                                    ${!isActionable ? 'border-slate-300 bg-slate-200' : 
                                      isSelected ? 'bg-emerald-500 border-emerald-600 text-white' : 'border-slate-300 bg-white'}
                                `}>
                                    {isSelected && <Check size={12} strokeWidth={4} />}
                                    {!isActionable && <CheckCircle size={14} className="text-slate-500"/>}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className={`font-bold text-xs line-clamp-2 mb-1 ${!isActionable ? 'text-slate-500 line-through' : 'text-slate-700'}`}>
                                        {doc.idoc?.Descripcion || "Sin descripción"}
                                    </p>
                                    <div className="flex flex-wrap gap-x-3 text-[10px] text-slate-500 font-mono">
                                        <span className="flex items-center gap-1"><Hash size={10}/> ID: {doc.documento_id}</span>
                                        <span className="flex items-center gap-1"><MapPin size={10}/> Amb: {doc.idoc?.Ambiente || '-'}</span>
                                    </div>
                                    {doc.ya_devuelto && (
                                        <span className="absolute top-2 right-2 text-[9px] font-bold bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                            Devuelto
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
            
            {/* Resumen Footer */}
            <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-500 flex justify-between font-medium">
                <span>Total Items: {docsDevolucion.length}</span>
                <span>Pendientes: {itemsPendientes.length}</span>
            </div>
        </div>
    );
});

// 4. Panel de Configuración de Devolución (Equivalente a AtencionConfigPanel)
const DevolucionConfigPanel = React.memo(({ firmaReceptor, setFirmaReceptor, obsGeneral, setObsGeneral, procesarDevolucion, processing, itemsSeleccionadosCount }) => {
    const [activeTab, setActiveTab] = useState('signature'); // Pestañas: Firma, Observaciones

    const tabs = useMemo(() => [
        { id: 'signature', label: 'Validación Receptor', icon: CheckCircle },
        { id: 'obs', label: 'Observaciones', icon: FileText },
    ], []);

    return (
        <div className="flex-1 flex flex-col">
            
            {/* Pestañas de Navegación */}
            <div className="flex border-b border-slate-200 mb-4 flex-shrink-0">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`py-2 px-4 text-sm font-bold flex items-center gap-2 transition-colors ${
                            activeTab === tab.id
                                ? 'text-emerald-600 border-b-2 border-emerald-600'
                                : 'text-slate-500 hover:text-emerald-600'
                        }`}
                    >
                        <tab.icon size={16}/> {tab.label}
                        {tab.id === 'signature' && !firmaReceptor && <AlertCircle size={14} className='text-red-500 ml-1'/>}
                    </button>
                ))}
            </div>

            {/* Contenido de Pestañas */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
                
                {/* Info Panel Fijo */}
                <div className={`p-4 rounded-xl border ${itemsSeleccionadosCount > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'} transition-colors`}>
                    <p className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-1">
                        <Archive size={18} className={itemsSeleccionadosCount > 0 ? "text-emerald-600" : "text-slate-400"}/> 
                        {itemsSeleccionadosCount} Documentos a Devolver
                    </p>
                    <p className="text-xs text-slate-500 ml-6">
                        Seleccione los documentos físicos que está recibiendo.
                    </p>
                </div>

                {activeTab === 'signature' && (
                    <div className="space-y-4">
                        <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm flex flex-col gap-2 min-h-[420px]">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Firma del Archivero (Receptor) *</label>
                            <div className="flex-1 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 overflow-hidden relative">
                                <div className="absolute inset-0">
                                    <DigitalSignature value={firmaReceptor} onChange={setFirmaReceptor} />
                                </div>
                            </div>
                            {!firmaReceptor && <p className="text-red-500 text-xs font-medium flex items-center gap-1"><AlertCircle size={12}/> La firma es obligatoria para procesar la devolución.</p>}
                        </div>
                    </div>
                )}

                {activeTab === 'obs' && (
                    <div className="space-y-4">
                        <TextareaField 
                            label="Observaciones de Recepción"
                            placeholder="Estado de conservación, incidencias, notas..."
                            value={obsGeneral} 
                            onChange={setObsGeneral}
                            rows={6}
                        />
                    </div>
                )}
            </div>

            {/* Footer de Acciones */}
            <div className="flex flex-col gap-3 pt-4 border-t border-slate-100 mt-auto flex-shrink-0">
                <button 
                    onClick={procesarDevolucion} 
                    disabled={processing || itemsSeleccionadosCount === 0 || !firmaReceptor} 
                    className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-lg shadow-emerald-700/20 transition-all flex items-center justify-center gap-2"
                >
                    {processing ? <Loader2 size={18} className="animate-spin"/> : <CheckCircle size={18} />}
                    {processing ? "Procesando..." : `Confirmar Devolución`}
                </button>
            </div>
        </div>
    );
});

// 5. Componente Principal
export default function PrestamosActivosTab({ solicitudes = [], currentUser, onReload, onMensaje }) {
    
    // Estados principales
    const [selectedSolicitud, setSelectedSolicitud] = useState(null);
    const [docsDevolucion, setDocsDevolucion] = useState([]);
    
    // Modales
    const [showDevolucionModal, setShowDevolucionModal] = useState(false);
    
    // Estado de flujo de devolución
    const [firmaReceptor, setFirmaReceptor] = useState(null);
    const [obsGeneral, setObsGeneral] = useState("");
    const [processing, setProcessing] = useState(false);
    
    // Impresión
    const [printData, setPrintData] = useState(null);

    // --- HANDLERS ---

    const handleDevolucionClick = async (solicitud) => {
        setSelectedSolicitud(solicitud);
        setDocsDevolucion([]); 
        setShowDevolucionModal(true);
        
        try {
            // Fetch de items asociados a la solicitud
            const { data, error } = await supabase
                .from("solicitudes_documentos")
                .select(`*, devoluciones:devoluciones_documentos(*), idoc:Inventario_documental!documento_id (Descripcion, Ambiente, Numero_Caja)`)
                .eq("solicitud_id", solicitud.id);
            
            if(error) throw error;

            const docsPrep = data.map(d => ({
                ...d,
                ya_devuelto: d.devoluciones && d.devoluciones.length > 0,
                selected_return: false 
            }));
            
            setDocsDevolucion(docsPrep);
            setFirmaReceptor(null);
            setObsGeneral("");
        } catch (e) { 
            if(onMensaje) onMensaje("Error cargando documentos: " + e.message, "error"); 
            setShowDevolucionModal(false);
        }
    };

    const toggleAll = useCallback(() => {
        const itemsPendientes = docsDevolucion.filter(d => !d.ya_devuelto);
        const hayPendientesNoSeleccionados = itemsPendientes.some(d => !d.selected_return);
        
        setDocsDevolucion(prev => prev.map(d => 
            !d.ya_devuelto ? { ...d, selected_return: hayPendientesNoSeleccionados } : d
        ));
    }, [docsDevolucion]);

    const procesarDevolucion = async () => {
        const itemsPendientes = docsDevolucion.filter(d => !d.ya_devuelto);
        const itemsAProcesar = docsDevolucion.filter(d => d.selected_return && !d.ya_devuelto);
        
        if (itemsAProcesar.length === 0) return onMensaje("Seleccione al menos un documento para devolver.", "error");
        if (!firmaReceptor) return onMensaje("La firma del archivero es obligatoria.", "error");

        setProcessing(true);
        try {
            const insertData = itemsAProcesar.map(doc => ({
                solicitud_id: selectedSolicitud.id,
                documento_id: doc.documento_id,
                solicitud_documento_id: doc.id,
                observaciones: obsGeneral,
                firma_receptor: firmaReceptor,
                usuario_receptor_id: currentUser.id,
                estado_fisico_documento: "Bueno" // Default o podría agregarse selector en UI
            }));
            
            const { error } = await supabase.from("devoluciones_documentos").insert(insertData);
            if (error) throw error;

            // Verificar si todos los items han sido devueltos para cerrar la solicitud
            const allReturnedNow = itemsPendientes.length === itemsAProcesar.length;
            if (allReturnedNow) {
                 await supabase
                    .from("solicitudes_archivisticas")
                    .update({ 
                        estado: 'DEVUELTO_TOTAL',
                        updated_at: new Date().toISOString()
                     })
                    .eq("id", selectedSolicitud.id);
            }
            
            onMensaje("Devolución registrada correctamente.", "success");
            setShowDevolucionModal(false);
            if(onReload) onReload();
        } catch (e) { 
            console.error(e);
            onMensaje(e.message || "Error al procesar devolución", "error"); 
        } finally { 
            setProcessing(false); 
        }
    };

    const handlePrint = async (solicitud) => {
        try {
            const { data } = await supabase
                .from("solicitudes_documentos")
                .select(`*, idoc:Inventario_documental!documento_id(*)`)
                .eq("solicitud_id", solicitud.id);
            setPrintData({ solicitud, documentos: data });
        } catch (e) {
            if(onMensaje) onMensaje("Error al preparar impresión", "error");
        }
    };

    // RENDER
    return (
        <div>
            
            {/* Componente PDF Invisible (se monta solo cuando hay datos para imprimir) */}
            {printData && (
                 <CargoPrestamoPDF 
                    isReady={true} 
                    solicitud={printData.solicitud} 
                    documentos={printData.documentos} 
                    onAfterPrint={() => setPrintData(null)} 
                 />
             )}

            {/* 1. Header y Contador */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                    <FileCheck size={20} className="text-emerald-600"/> Préstamos Activos
                </h2>
                <span className="text-sm bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-extrabold">
                    {solicitudes.length} En Curso
                </span>
            </div>

            {/* 2. Lista Maestra */}
            <div className="space-y-3 min-h-[300px]">
                {solicitudes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-white">
                        <CheckCircle size={48} className="text-slate-200 mb-2"/>
                        <p className="text-sm font-medium">No hay préstamos activos en este momento.</p>
                    </div>
                ) : (
                    solicitudes.map(sol => (
                        <LoanRow 
                            key={sol.id} 
                            solicitud={sol} 
                            onDevolucion={handleDevolucionClick} 
                            onPrint={handlePrint}
                        />
                    ))
                )}
            </div>

            {/* 3. Modal Workspace de Devolución */}
            <Modal isOpen={showDevolucionModal} onClose={() => setShowDevolucionModal(false)} title="Workspace: Recepción de Devoluciones" size="lg">
                <div className="flex flex-col lg:flex-row h-full min-h-[500px]">
                    
                    {/* COLUMNA IZQUIERDA: Items del Préstamo */}
                    <div className="w-full lg:w-5/12 bg-slate-50 border-r border-slate-200 flex flex-col p-5">
                        <ItemsReturnPanel 
                            docsDevolucion={docsDevolucion}
                            setDocsDevolucion={setDocsDevolucion}
                            toggleAll={toggleAll}
                        />
                    </div>

                    {/* COLUMNA DERECHA: Configuración y Firma */}
                    <div className="w-full lg:w-7/12 p-6 flex flex-col">
                        <DevolucionConfigPanel 
                            firmaReceptor={firmaReceptor}
                            setFirmaReceptor={setFirmaReceptor}
                            obsGeneral={obsGeneral}
                            setObsGeneral={setObsGeneral}
                            procesarDevolucion={procesarDevolucion}
                            processing={processing}
                            itemsSeleccionadosCount={docsDevolucion.filter(d => d.selected_return && !d.ya_devuelto).length}
                        />
                    </div>
                </div>
            </Modal>

        </div>
    );
}