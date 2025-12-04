import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from "../../../utils/supabaseClient"; 
import { 
    X, Check, Loader2, Box, CheckCircle, AlertCircle, 
    Archive, FileText, MapPin, Hash, Book, MessageSquare 
} from "lucide-react";
import { DigitalSignature } from "../../../components/ui/DigitalSignature";
import { TextareaField } from "../../../components/ui/TextareaField";
// Importación de Shared.jsx para estilos y etiquetas estandarizados
import { ESTADO_DOC_STYLE, getEstadoDocumentoLabel } from "../../../components/data/Shared";

// --- SUB-COMPONENTES INTERNOS ---

const ItemsReturnPanel = ({ docsDevolucion, setDocsDevolucion, toggleAll, loading }) => {
    const itemsPendientes = docsDevolucion.filter(d => !d.ya_devuelto);
    const allSelected = itemsPendientes.length > 0 && itemsPendientes.every(d => d.selected_return);

    // Función para actualizar observación individual sin afectar la selección
    const handleIndividualObservation = (id, value) => {
        setDocsDevolucion(prev => prev.map(d => d.id === id ? { ...d, observacion_individual: value } : d));
    };

    return (
        <div className="flex-1 flex flex-col h-full">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                    <Box className="text-blue-600" size={20}/>
                    <h4 className="font-bold text-slate-700 text-sm uppercase">Items en Poder del Usuario</h4>
                </div>
                {itemsPendientes.length > 0 && (
                    <button onClick={toggleAll} className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors">
                        {allSelected ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {loading ? (
                    <div className="text-center py-10 px-4 border-2 border-dashed border-slate-200 rounded-lg">
                        <Loader2 size={32} className="text-slate-300 mx-auto mb-2 animate-spin"/>
                        <p className="text-xs text-slate-400">Cargando inventario...</p>
                    </div>
                ) : docsDevolucion.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 py-10">No se encontraron documentos.</p>
                ) : (
                    docsDevolucion.map((doc) => {
                          const isActionable = !doc.ya_devuelto;
                          const isSelected = doc.selected_return;
                          
                          // Lógica de estilos usando Shared.jsx
                          const estadoDoc = doc.idoc?.Estado_Documento;
                          const estadoStyle = ESTADO_DOC_STYLE[estadoDoc] || ESTADO_DOC_STYLE.DEFAULT;
                          const estadoLabel = getEstadoDocumentoLabel(estadoDoc);

                          return (
                            <div key={doc.id} 
                                onClick={() => isActionable && setDocsDevolucion(prev => prev.map(p => p.id === doc.id ? {...p, selected_return: !p.selected_return} : p))}
                                className={`p-3 rounded-lg border transition-all cursor-pointer relative group flex flex-col gap-3 ${!isActionable ? 'bg-slate-50 border-slate-100 opacity-60' : isSelected ? 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-200' : 'bg-white border-slate-200 hover:border-blue-300'}`}
                            >
                                <div className="flex items-start gap-3 w-full">
                                    <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${!isActionable ? 'border-slate-300 bg-slate-200' : isSelected ? 'bg-emerald-500 border-emerald-600 text-white' : 'border-slate-300 bg-white'}`}>
                                        {isSelected && <Check size={12} strokeWidth={4} />}
                                        {!isActionable && <CheckCircle size={14} className="text-slate-500"/>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <p className={`font-bold text-xs line-clamp-2 mb-1 ${!isActionable ? 'text-slate-500 line-through' : 'text-slate-700'}`}>{doc.idoc?.Descripcion || "Sin descripción"}</p>
                                            
                                            {/* Badge de Estado Estandarizado */}
                                            {isActionable && estadoDoc && (
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded border font-extrabold uppercase ml-2 shrink-0 tracking-wider ${estadoStyle}`}>
                                                    {estadoLabel}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-x-3 text-[10px] text-slate-500 font-mono">
                                            <span className="flex items-center gap-1"><Hash size={10}/> ID: {doc.documento_id}</span>
                                            <span className="flex items-center gap-1"><Box size={12}/>Caja: {doc.caja}</span>
                                            <span className="flex items-center gap-1"><Book size={12}/>Tomo: {doc.numero_tomo}</span>
                                            <span className="flex items-center gap-1"><MapPin size={12}/>{doc.ubicacion_topografica  || '-'}</span>
                                        </div>
                                        {doc.ya_devuelto && <span className="absolute top-2 right-2 text-[9px] font-bold bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-wider">Devuelto</span>}
                                    </div>
                                </div>
                                
                                {/* CAMPO DE OBSERVACIÓN INDIVIDUAL */}
                                {isSelected && isActionable && (
                                    <div className="w-full pl-8 animate-in slide-in-from-top-1 fade-in duration-200">
                                        <div className="relative">
                                            <MessageSquare size={12} className="absolute left-2.5 top-2.5 text-slate-400"/>
                                            <input 
                                                type="text" 
                                                placeholder="Observación individual (Opcional)" 
                                                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                                value={doc.observacion_individual || ""}
                                                onClick={(e) => e.stopPropagation()} 
                                                onChange={(e) => handleIndividualObservation(doc.id, e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-500 flex justify-between font-medium">
                <span>Total Items: {docsDevolucion.length}</span>
                <span>Pendientes: {itemsPendientes.length}</span>
            </div>
        </div>
    );
};

const DevolucionConfigPanel = ({ 
    firmaReceptor, setFirmaReceptor, obsGeneral, setObsGeneral, 
    procesarDevolucion, processing, itemsSeleccionadosCount, 
    isPrestamoOriginal 
}) => {
    const [activeTab, setActiveTab] = useState('signature');
    
    useEffect(() => {
        if (!isPrestamoOriginal) {
            setActiveTab('obs');
        } else {
            setActiveTab('signature');
        }
    }, [isPrestamoOriginal]);

    const tabs = useMemo(() => {
        const t = [];
        if (isPrestamoOriginal) {
            t.push({ id: 'signature', label: 'Validación Receptor', icon: CheckCircle });
        }
        t.push({ id: 'obs', label: 'Observaciones Generales', icon: FileText });
        return t;
    }, [isPrestamoOriginal]);

    return (
        <div className="flex-1 flex flex-col">
            <div className="flex border-b border-slate-200 mb-2 flex-shrink-0">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`py-2 px-4 text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === tab.id ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-500 hover:text-emerald-600'}`}>
                        <tab.icon size={16}/> {tab.label}
                        {tab.id === 'signature' && isPrestamoOriginal && !firmaReceptor && <AlertCircle size={14} className='text-red-500 ml-1'/>}
                    </button>
                ))}
            </div>
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
                <div className={`p-4 rounded-xl border ${itemsSeleccionadosCount > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'} transition-colors`}>
                    <p className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-1">
                        <Archive size={18} className={itemsSeleccionadosCount > 0 ? "text-emerald-600" : "text-slate-400"}/> {itemsSeleccionadosCount} Documentos a Devolver
                    </p>
                    <p className="text-xs text-slate-500 ml-6">Al confirmar, el estado cambiará a <strong>DISPONIBLE</strong>.</p>
                </div>

                {activeTab === 'signature' && isPrestamoOriginal && (
                    <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm flex flex-col gap-2 min-h-[390px]">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Firma (Receptor) *</label>
                        <div className="flex-1 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 overflow-hidden relative">
                            <div className="absolute inset-0"><DigitalSignature value={firmaReceptor} onChange={setFirmaReceptor} /></div>
                        </div>
                        {!firmaReceptor && <p className="text-red-500 text-xs font-medium flex items-center gap-1"><AlertCircle size={12}/> La firma es obligatoria para Préstamos Originales.</p>}
                    </div>
                )}

                {activeTab === 'obs' && (
                    <>
                        {!isPrestamoOriginal && (
                             <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg mb-2">
                                <p className="text-xs text-blue-700 flex items-center gap-2">
                                    <CheckCircle size={14}/> No se requiere firma para esta modalidad.
                                </p>
                             </div>
                        )}
                        <TextareaField label="Observaciones Generales (Opcional)" placeholder="Estado general del lote, incidencias..." value={obsGeneral} onChange={setObsGeneral} rows={6} />
                    </>
                )}
            </div>
            <div className="flex flex-col gap-3 pt-3 border-t border-slate-100 mt-auto flex-shrink-0">
                <button 
                    onClick={procesarDevolucion} 
                    disabled={processing || itemsSeleccionadosCount === 0 || (isPrestamoOriginal && !firmaReceptor)} 
                    className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-lg shadow-emerald-700/20 transition-all flex items-center justify-center gap-2"
                >
                    {processing ? <Loader2 size={18} className="animate-spin"/> : <CheckCircle size={18} />} {processing ? "Procesando..." : `Confirmar Devolución`}
                </button>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL DEL MODAL ---

export default function ModalDevolucion({ isOpen, onClose, solicitud, currentUser, onSuccess, onMensaje }) {
    const [docsDevolucion, setDocsDevolucion] = useState([]);
    const [loadingData, setLoadingData] = useState(false);
    const [firmaReceptor, setFirmaReceptor] = useState(null);
    const [obsGeneral, setObsGeneral] = useState("");
    const [processing, setProcessing] = useState(false);

    // Determinar si es préstamo original
    const isPrestamoOriginal = useMemo(() => {
        return solicitud?.modalidad_servicio === 'PRESTAMO_ORIGINAL';
    }, [solicitud]);

    // Cargar items cuando se abre el modal
    useEffect(() => {
        if (isOpen && solicitud) {
            const fetchDocs = async () => {
                setLoadingData(true);
                try {
                    const { data, error } = await supabase
                        .from("solicitudes_documentos")
                        .select(`*, devoluciones:devoluciones_documentos(*), idoc:Inventario_documental!documento_id (Descripcion, Ambiente, Numero_Caja, Estado_Documento)`)
                        .eq("solicitud_id", solicitud.id);
                    
                    if (error) throw error;

                    const docsPrep = data.map(d => ({
                        ...d,
                        ya_devuelto: d.devoluciones && d.devoluciones.length > 0,
                        selected_return: false,
                        observacion_individual: ""
                    }));
                    
                    setDocsDevolucion(docsPrep);
                    setFirmaReceptor(null);
                    setObsGeneral("");
                } catch (e) {
                    onMensaje("Error cargando documentos: " + e.message, "error");
                    onClose();
                } finally {
                    setLoadingData(false);
                }
            };
            fetchDocs();
        }
    }, [isOpen, solicitud]);

    const toggleAll = useCallback(() => {
        const itemsPendientes = docsDevolucion.filter(d => !d.ya_devuelto);
        const hayPendientesNoSeleccionados = itemsPendientes.some(d => !d.selected_return);
        setDocsDevolucion(prev => prev.map(d => !d.ya_devuelto ? { ...d, selected_return: hayPendientesNoSeleccionados } : d));
    }, [docsDevolucion]);

    const procesarDevolucion = async () => {
        const itemsPendientes = docsDevolucion.filter(d => !d.ya_devuelto);
        const itemsAProcesar = docsDevolucion.filter(d => d.selected_return && !d.ya_devuelto);
        
        if (itemsAProcesar.length === 0) return onMensaje("Seleccione al menos un documento para devolver.", "error");
        
        if (isPrestamoOriginal && !firmaReceptor) {
            return onMensaje("La firma del archivero es obligatoria para Préstamos Originales.", "error");
        }

        setProcessing(true);
        try {
            // 1. Insertar en tabla de devoluciones
            const insertData = itemsAProcesar.map(doc => {
                const obsIndividual = doc.observacion_individual && doc.observacion_individual.trim() !== "" 
                    ? doc.observacion_individual.trim() 
                    : "Sin observaciones.";

                return {
                    solicitud_id: solicitud.id,
                    documento_id: doc.documento_id,
                    solicitud_documento_id: doc.id,
                    observaciones: obsIndividual,
                    firma_receptor: isPrestamoOriginal ? firmaReceptor : null,
                    usuario_receptor_id: currentUser.id,
                    estado_fisico_documento: "Bueno"
                };
            });
            
            const { error: insertError } = await supabase.from("devoluciones_documentos").insert(insertData);
            if (insertError) throw insertError;

            // 2. Liberar documentos en el Inventario
            const documentIdsToUpdate = itemsAProcesar.map(d => d.documento_id);
            if (documentIdsToUpdate.length > 0) {
                const { error: updateError } = await supabase
                    .from("Inventario_documental")
                    .update({ 
                        Estado_Documento: 'DISPONIBLE',
                        updated_at: new Date().toISOString()
                    })
                    .in('id', documentIdsToUpdate);
                
                if (updateError) throw updateError;
            }

            // 3. Actualizar estado de la solicitud
            if (itemsPendientes.length === itemsAProcesar.length) {
                 await supabase.from("solicitudes_archivisticas").update({ estado: 'ATENTIDO', updated_at: new Date().toISOString() }).eq("id", solicitud.id);
            }
            
            onMensaje("Devolución registrada correctamente.", "success");
            onSuccess();
            onClose();
        } catch (e) { 
            console.error(e);
            onMensaje(e.message || "Error al procesar devolución", "error"); 
        } finally { 
            setProcessing(false); 
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white w-full max-w-7xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
                    <h3 className="font-bold text-slate-800 text-lg">Workspace: Recepción de Devoluciones</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
                <div className="p-0 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/30">
                    <div className="flex flex-col lg:flex-row h-full min-h-[500px]">
                        <div className="w-full bg-slate-50 border-r border-slate-200 flex flex-col p-5">
                            <ItemsReturnPanel docsDevolucion={docsDevolucion} setDocsDevolucion={setDocsDevolucion} toggleAll={toggleAll} loading={loadingData} />
                        </div>
                        <div className="w-full p-5 pt-1 flex flex-col">
                            <DevolucionConfigPanel 
                                firmaReceptor={firmaReceptor} 
                                setFirmaReceptor={setFirmaReceptor} 
                                obsGeneral={obsGeneral} 
                                setObsGeneral={setObsGeneral} 
                                procesarDevolucion={procesarDevolucion} 
                                processing={processing} 
                                itemsSeleccionadosCount={docsDevolucion.filter(d => d.selected_return && !d.ya_devuelto).length} 
                                isPrestamoOriginal={isPrestamoOriginal} 
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}