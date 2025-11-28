import React, { useState, useCallback } from 'react';
import { supabase } from "../../../utils/supabaseClient"; 
import { 
    History, Printer, Eye, Calendar, User, FileText, 
    CheckCircle2, X, Building2, LayoutList, Loader2,
    Hash, MapPin, Search
} from "lucide-react";
import CargoPrestamoPDF from './CargoPrestamoPDF';
import { EstadoBadge } from "../ServiciosArchivisticos";
import { MODALIDADES, InfoBlock } from "./Shared";

// --- COMPONENTES UI REUTILIZABLES (Patrón Local) ---
// 1. Modal Genérico (Idéntico a los otros tabs para consistencia visual)
const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
    if (!isOpen) return null;
    const sizes = { sm: "max-w-md", md: "max-w-2xl", lg: "max-w-5xl", xl: "max-w-7xl" };
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative bg-white w-full ${sizes[size]} rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden`}>
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        {title}
                    </h3>
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

// 2. Fila de Historial (Diseño de Tarjeta Horizontal)
const HistoryRow = React.memo(({ solicitud, onViewDetail, onPrint }) => {
    return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm hover:border-blue-300 transition-all duration-200 p-4 flex flex-col md:flex-row gap-4 items-start md:items-center w-full">
            {/* Bloque Izquierdo: Icono y Estado */}
            <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0 w-full">
                {/* Icono Principal */}
                <div className="p-3 bg-slate-100 text-slate-500 rounded-xl shrink-0">
                    <History size={20} />
                </div>                
                {/* Contenido de Texto */}
                <div className="min-w-0 flex-1">
                    {/* Meta Data (ID, Badge, Fecha) */}
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap">
                            #{solicitud.numero_solicitud || solicitud.id.substring(0,8)}
                        </span>
                        <EstadoBadge estado={solicitud.estado} />
                        <span className="text-xs text-slate-400 flex items-center gap-1 font-medium ml-1 whitespace-nowrap">
                            <Calendar size={12} className="shrink-0"/> 
                            {new Date(solicitud.fecha_solicitud).toLocaleDateString()}
                        </span>
                    </div>                    
                    {/* Título Principal */}
                    <h4 className="font-bold text-slate-800 text-sm truncate pr-2">
                        {solicitud.motivo_solicitud}
                    </h4>                    
                    {/* Footer Data (Usuario, Área, Devolución) */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1 hover:text-slate-700 truncate max-w-[150px] sm:max-w-none">
                            <User size={12} className="text-blue-400 shrink-0"/> 
                            {solicitud.nombre_solicitante}
                        </span>
                        <span className="flex items-center gap-1 hover:text-slate-700 truncate max-w-[150px] sm:max-w-none">
                            <Building2 size={12} className="text-slate-400 shrink-0"/> 
                            {solicitud.sub_gerencia}
                        </span>
                        {solicitud.fecha_devolucion_real && (
                            <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-1.5 rounded whitespace-nowrap mt-1 sm:mt-0">
                                <CheckCircle2 size={10} className="shrink-0"/> 
                                Devuelto: {new Date(solicitud.fecha_devolucion_real).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                </div>
            </div>
            {/* Bloque Derecho: Acciones */}
            <div className="flex items-center gap-2 w-full md:w-auto border-t border-slate-100 md:border-t-0 pt-3 md:pt-0 mt-1 md:mt-0">
                <button 
                    onClick={() => onViewDetail(solicitud)}
                    className="flex-1 md:flex-none py-2 px-3 bg-white border border-slate-300 text-slate-600 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm h-9 md:h-auto"
                    title="Ver detalles completos"
                >
                    <Eye size={16} className="shrink-0"/> 
                    <span className="md:hidden">Ver Detalle</span>
                </button>
                <button 
                    onClick={() => onPrint(solicitud)}
                    className="flex-1 md:flex-none py-2 px-3 bg-slate-800 text-white hover:bg-slate-700 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm h-9 md:h-auto"
                    title="Imprimir Cargo PDF"
                >
                    <Printer size={16} className="shrink-0"/> 
                    <span className="md:hidden">Imprimir</span>
                </button>
            </div>
        </div>
    );
});

// 3. Contenido del Modal de Detalle
const DetailContent = ({ solicitud, documentos, loading }) => {
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 size={40} className="text-blue-500 animate-spin mb-4"/>
                <p className="text-slate-400 text-sm font-medium">Cargando detalles de la solicitud...</p>
            </div>
        );
    }

    if (!solicitud) return null;

    return (
        <div className="p-6 bg-slate-50 min-h-full">
            {/* Cabecera Informativa */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">                    
                    {/* Columna 1: Solicitante */}
                    <InfoBlock label="Solicitante">
                        <p className="font-bold text-slate-800 text-sm">{solicitud.nombre_solicitante}</p>
                        <p className="text-xs text-slate-500">{solicitud.sub_gerencia}</p>
                    </InfoBlock>
                    {/* Columna 2: Fecha */}
                    <InfoBlock label="Fecha de Solicitud">
                        <p className="font-bold text-slate-800 text-sm">
                            {new Date(solicitud.fecha_solicitud).toLocaleString()}
                        </p>
                    </InfoBlock>
                    {/* Columna 3: Modalidad (Destacada) */}
                    <InfoBlock label="Modalidad">
                        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded inline-block border border-slate-200">
                            {MODALIDADES.find(m => m.value === solicitud.modalidad_servicio)?.label || solicitud.modalidad_servicio}
                        </span>
                    </InfoBlock>                    
                    {/* Motivo: Ocupa 2 columnas en pantallas grandes, o ancho completo si no hay observaciones */}
                    <div className={`${solicitud.observaciones_archivo ? 'lg:col-span-2' : 'lg:col-span-4'}`}>
                        <InfoBlock label="Motivo del Requerimiento">
                            <div className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap">
                                {solicitud.motivo_solicitud || "Sin motivo especificado."}
                            </div>
                        </InfoBlock>
                    </div>
                    {/* Observación: Se muestra solo si existe */}
                    {solicitud.observaciones_archivo && (
                        <div className="lg:col-span-2">
                            <InfoBlock label="Observación del Requerimiento">
                                <div className="text-sm text-slate-700 leading-relaxed bg-amber-50 p-3 rounded-lg border border-amber-100 whitespace-pre-wrap">
                                    {solicitud.observaciones_archivo}
                                </div>
                            </InfoBlock>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabla de Documentos */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
                    <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                        <LayoutList size={16} className="text-blue-500"/> Documentos Asociados ({documentos.length})
                    </h4>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                            <tr>
                                <th className="p-3 border-b border-slate-100">Ubicación</th>
                                <th className="p-3 border-b border-slate-100">Descripción / Serie</th>
                                <th className="p-3 border-b border-slate-100 text-center">Folios</th>
                                <th className="p-3 border-b border-slate-100 text-center">Estado Item</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {documentos.map((doc, i) => (
                                <tr key={i} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="p-3">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded w-fit">
                                                C: {doc.idoc?.Numero_Caja || doc.caja || '?'}
                                            </span>
                                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                <MapPin size={10}/> T: {doc.idoc?.Numero_Tomo || doc.numero_tomo || '-'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <p className="font-medium text-slate-700 text-xs line-clamp-2 mb-1" title={doc.idoc?.Descripcion || doc.descripcion}>
                                            {doc.idoc?.Descripcion || doc.descripcion}
                                        </p>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                            <span className="font-bold text-blue-600 bg-blue-50 px-1 rounded">{doc.idoc?.Unidad_Organica || doc.unidad}</span>
                                            <span>•</span>
                                            <span className="italic">{doc.idoc?.Serie_Documental || doc.serie}</span>
                                        </div>
                                    </td>
                                    <td className="p-3 text-center font-mono text-xs text-slate-600">
                                        {doc.idoc?.Numero_Folios || doc.numero_folios || '-'}
                                    </td>
                                    <td className="p-3 text-center">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border ${
                                            doc.estado_individual === 'DEVUELTO' 
                                                ? 'bg-slate-100 text-slate-500 border-slate-200' 
                                                : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                        }`}>
                                            {doc.estado_individual || 'PENDIENTE'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};


// --- COMPONENTE PRINCIPAL ---

export default function HistorialTab({ solicitudes, onMensaje }) {
    // Estados
    const [printData, setPrintData] = useState(null);
    const [selectedSolicitud, setSelectedSolicitud] = useState(null);
    const [detailDocs, setDetailDocs] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Lógica de Datos (Supabase)
    const fetchFullData = useCallback(async (solicitudId) => {
        setLoadingDetails(true);
        try {
            const { data, error } = await supabase
                .from("solicitudes_documentos")
                .select(`
                    *, 
                    idoc:Inventario_documental!documento_id (
                        Numero_Caja, Numero_Tomo, Numero_Folios, 
                        Serie_Documental, Unidad_Organica, Descripcion, 
                        Tipo_Unidad_Conservacion, Ambiente, Estante
                    )
                `)
                .eq("solicitud_id", solicitudId);
            
            if (error) throw error;
            return data;
        } catch (e) {
            console.error(e);
            if (onMensaje) onMensaje("Error al recuperar detalles: " + e.message, "error");
            return [];
        } finally {
            setLoadingDetails(false);
        }
    }, [onMensaje]);

    // Handlers
    const handleVerDetalle = async (solicitud) => {
        setSelectedSolicitud(solicitud);
        setShowDetailModal(true);
        const docs = await fetchFullData(solicitud.id);
        setDetailDocs(docs);
    };

    const handlePrint = async (solicitud) => {
        // Para imprimir necesitamos los datos completos de los documentos
        const docs = await fetchFullData(solicitud.id);
        if (docs.length > 0) {
            setPrintData({ solicitud, documentos: docs });
        } else {
            if (onMensaje) onMensaje("No se encontraron documentos para generar el cargo.", "warning");
        }
    };

    // Render
    return (
        <div className="space-y-6">
            
            {/* Componente PDF Invisible (Montaje condicional para impresión) */}
            {printData && (
                <CargoPrestamoPDF 
                    isReady={true} 
                    solicitud={printData.solicitud} 
                    documentos={printData.documentos} 
                    onAfterPrint={() => setPrintData(null)} 
                />
            )}

            {/* Header del Tab */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                    <History size={20} className="text-slate-500"/> Historial de Solicitudes
                </h2>
                <span className="text-sm bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-extrabold border border-slate-200">
                    {solicitudes.length} Registros
                </span>
            </div>

            {/* Lista de Solicitudes */}
            <div className="space-y-3 min-h-[300px]">
                {solicitudes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-white">
                        <Search size={48} className="text-slate-200 mb-2"/>
                        <p className="text-sm font-medium">No se encontraron solicitudes en el historial.</p>
                    </div>
                ) : (
                    solicitudes.map(sol => (
                        <HistoryRow 
                            key={sol.id} 
                            solicitud={sol} 
                            onViewDetail={handleVerDetalle}
                            onPrint={handlePrint}
                        />
                    ))
                )}
            </div>

            {/* Modal de Detalle */}
            <Modal 
                isOpen={showDetailModal} 
                onClose={() => { setShowDetailModal(false); setDetailDocs([]); setSelectedSolicitud(null); }} 
                title={selectedSolicitud ? `Detalle Solicitud #${selectedSolicitud.numero_solicitud}` : 'Cargando...'}
                size="lg"
            >
                <DetailContent 
                    solicitud={selectedSolicitud} 
                    documentos={detailDocs} 
                    loading={loadingDetails} 
                />
            </Modal>
        </div>
    );
}