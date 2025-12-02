import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from "../../../utils/supabaseClient"; 
import { 
    History, Printer, Eye, Calendar, User, FileText, 
    CheckCircle2, X, Building2, LayoutList, Loader2,
    Hash, MapPin, Search, Filter, AlertTriangle, ChevronDown, ChevronUp,
    Clock, ArrowUpRight, UserCheck
} from "lucide-react";
import CargoPrestamoPDF from './CargoPrestamoPDF';
import { EstadoBadge } from "../ServiciosArchivisticos";
import { MODALIDADES, InfoBlock } from "./Shared";

// Importación de Componentes de Datos
import { DataTable } from "../../../components/data/DataTable";
import { Pagination } from "../../../components/data/Pagination";


// --- SUB-COMPONENTES UI (Patrón DocuFlow) ---
// 1. Sección Colapsable: Oculta detalles densos hasta que se necesitan
const CollapsibleSection = ({ title, icon: Icon, count, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-4 transition-all">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-5 py-3 bg-slate-50/50 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
                <div className="flex items-center gap-2 font-bold text-slate-700 text-sm">
                    {Icon && <Icon size={16} className="text-blue-500"/>} 
                    {title} 
                    {count !== undefined && <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs">{count}</span>}
                </div>
                {isOpen ? <ChevronUp size={16} className="text-slate-400"/> : <ChevronDown size={16} className="text-slate-400"/>}
            </button>
            
            {/* Contenido con animación simple de montaje */}
            {isOpen && (
                <div className="border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
                    {children}
                </div>
            )}
        </div>
    );
};

// 2. Modal Genérico
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
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 hover:text-slate-600">
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

// 3. Contenido del Modal de Detalle (Actualizado con Responsable)
const DetailContent = ({ solicitud, documentos, loading }) => {

    //  Obtenemos el registro de devolución (asumimos el primero o único vigente)
    const devolucionData = solicitud.devoluciones_documentos?.[0] || solicitud.devoluciones?.[0];
    const nombreReceptor = devolucionData?.usuario?.nombre_completo || devolucionData?.usuarios?.nombre_completo || "Responsable de Atención";

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 size={40} className="text-blue-500 animate-spin mb-4"/>
                <p className="text-slate-400 text-sm font-medium">Recuperando información...</p>
            </div>
        );
    }

    if (!solicitud) return null;

    return (
        <div className="p-6 bg-slate-50 min-h-full">
            {/* Panel Principal: Datos Críticos */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Bloque Izquierdo: Identidad Solicitante */}
                    <div className="flex-1 space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg mt-1">
                                <User size={20} />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Solicitante</h4>
                                <p className="text-lg font-bold text-slate-800">{solicitud.nombre_solicitante}</p>
                                <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-500 bg-slate-100 w-fit px-2 py-0.5 rounded">
                                    <Building2 size={12} />
                                    {solicitud.sub_gerencia}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bloque Derecho: Contexto, Fechas y Responsable */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                         <InfoBlock label="Fecha Solicitud">
                            <div className="flex items-center gap-1.5 font-medium text-slate-700">
                                <Calendar size={14} className="text-slate-400"/>
                                {new Date(solicitud.fecha_solicitud).toLocaleDateString()}
                            </div>
                        </InfoBlock>
                        
                        <InfoBlock label="Modalidad">
                            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded inline-block border border-slate-200">
                                {MODALIDADES.find(m => m.value === solicitud.modalidad_servicio)?.label || solicitud.modalidad_servicio}
                            </span>
                        </InfoBlock>

                        {/* Nuevo campo: Responsable Atiende */}
                        <InfoBlock label="Responsable Atención">
                            <div className="flex items-center gap-1.5 font-medium text-slate-700">
                                <UserCheck size={14} className="text-emerald-500"/>
                                <span className="truncate" title={nombreReceptor }>
                                    {nombreReceptor  || "Pendiente"}
                                </span>
                            </div>
                        </InfoBlock>
                    </div>
                </div>

                {/* Motivo y Observaciones (Expandido) */}
                <div className="mt-6 pt-6 border-t border-slate-100 grid gap-4">
                     <InfoBlock label="Motivo del Requerimiento">
                        <p className="text-sm text-slate-600 leading-relaxed">
                            {solicitud.motivo_solicitud || "Sin motivo especificado."}
                        </p>
                    </InfoBlock>
                    
                    {solicitud.observaciones_archivo && (
                         <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg flex gap-3">
                            <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                            <div>
                                <h5 className="text-xs font-bold text-amber-700 uppercase mb-1">Observación Archivística</h5>
                                <p className="text-sm text-amber-900 leading-relaxed">
                                    {solicitud.observaciones_archivo}
                                </p>
                            </div>
                         </div>
                    )}
                </div>
            </div>

            {/* Lista de Documentos Colapsable */}
            <CollapsibleSection 
                title="Documentos Solicitados" 
                icon={LayoutList} 
                count={documentos.length}
                defaultOpen={true}
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                            <tr>
                                <th className="p-3 pl-5 border-b border-slate-100">Ubicación</th>
                                <th className="p-3 border-b border-slate-100">Descripción / Serie</th>
                                <th className="p-3 border-b border-slate-100 text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {documentos.map((doc, i) => (
                                <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="p-3 pl-5 align-top">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                                Caja {doc.idoc?.Numero_Caja || '?'}
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                Tomo {doc.idoc?.Numero_Tomo || '-'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-3 align-top">
                                        <p className="font-medium text-slate-700 text-xs line-clamp-2 mb-1">
                                            {doc.idoc?.id || doc.documento_id} - {doc.idoc?.Descripcion || ''}
                                        </p>
                                        <span className="text-[10px] text-blue-600 font-medium">
                                            {doc.idoc?.Serie_Documental || ''}
                                        </span>
                                    </td>
                                    <td className="p-3 align-top text-center">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border ${
                                            doc.estado_individual === 'DEVUELTO' 
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                : 'bg-slate-100 text-slate-500 border-slate-200'
                                        }`}>
                                            {doc.estado_individual}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CollapsibleSection>
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

    // Estados de UI
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("TODOS");
    const [page, setPage] = useState(0); 
    const [pageSize, setPageSize] = useState(10);

    // Reinicio de paginación
    useEffect(() => {
        setPage(0);
    }, [searchTerm, statusFilter, pageSize]);

    // Filtrado
    const filteredSolicitudes = useMemo(() => {
        return solicitudes.filter(item => {
            const term = searchTerm.toLowerCase();
            const matchesSearch = 
                (item.nombre_solicitante?.toLowerCase() || "").includes(term) ||
                (item.motivo_solicitud?.toLowerCase() || "").includes(term) ||
                (item.numero_solicitud?.toString() || "").includes(term);

            const matchesStatus = statusFilter === "TODOS" || item.estado === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [solicitudes, searchTerm, statusFilter]);

    // Paginación
    const currentItems = filteredSolicitudes.slice(page * pageSize, (page + 1) * pageSize);

    // Datos auxiliares
    const uniqueStatuses = useMemo(() => {
        const statuses = new Set(solicitudes.map(s => s.estado).filter(Boolean));
        return ["TODOS", ...Array.from(statuses)];
    }, [solicitudes]);

    // Lógica Data Fetching
    const fetchFullData = useCallback(async (solicitudId) => {
        setLoadingDetails(true);
        try {
            const { data, error } = await supabase
                .from("solicitudes_documentos")
                .select(`*, idoc:Inventario_documental!documento_id (Numero_Caja, Numero_Tomo, Serie_Documental, Unidad_Organica, Descripcion)`)
                .eq("solicitud_id", solicitudId);
            
            if (error) throw error;
            return data;
        } catch (e) {
            console.error(e);
            if (onMensaje) onMensaje("Error: " + e.message, "error");
            return [];
        } finally {
            setLoadingDetails(false);
        }
    }, [onMensaje]);

    // Handlers
    const handleVerDetalle = useCallback(async (solicitud) => {
        setSelectedSolicitud(solicitud);
        setShowDetailModal(true);
        const docs = await fetchFullData(solicitud.id);
        setDetailDocs(docs);
    }, [fetchFullData]);

    const handlePrint = useCallback(async (solicitud) => {
        const docs = await fetchFullData(solicitud.id);
        if (docs.length > 0) setPrintData({ solicitud, documentos: docs });
        else if (onMensaje) onMensaje("Sin documentos para imprimir", "warning");
    }, [fetchFullData, onMensaje]);

    // Columnas DataTable (Simplificadas visualmente)
    const columns = useMemo(() => [
        {
            label: "ID / Código",
            key: "codigo",
            render: (sol) => (
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        <Hash size={14} />
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-700">
                        {sol.numero_solicitud || sol.id.substring(0,6)}
                    </span>
                </div>
            )
        },
        {
            label: "Solicitante",
            key: "solicitante",
            render: (sol) => (
                <div className="min-w-[180px]">
                    <div className="font-bold text-slate-700 text-sm">{sol.nombre_solicitante}</div>
                    <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[180px]">
                        {sol.sub_gerencia}
                    </div>
                </div>
            )
        },
        {
            label: "Motivo / Fecha",
            key: "contexto",
            render: (sol) => (
                <div className="min-w-[200px]">
                    <div className="text-sm text-slate-600 line-clamp-1 mb-1" title={sol.motivo_solicitud}>
                        {sol.motivo_solicitud}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Clock size={12} />
                        {new Date(sol.fecha_solicitud).toLocaleDateString()}
                    </div>
                </div>
            )
        },
        {
            label: "Estado",
            key: "estado",
            render: (sol) => (
                <div className="w-32 flex justify-center">
                    <EstadoBadge estado={sol.estado} />
                </div>
            )
        }
    ], []);

    const renderActions = useCallback((sol) => (
        <div className="flex items-center justify-end gap-1">
            <button onClick={() => handleVerDetalle(sol)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip-trigger" title="Ver Detalles">
                <Eye size={18} />
            </button>
            <button onClick={() => handlePrint(sol)} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors tooltip-trigger" title="Imprimir Cargo">
                <Printer size={18} />
            </button>
        </div>
    ), [handleVerDetalle, handlePrint]);

    return (
        <div className="space-y-6">
            {printData && <CargoPrestamoPDF isReady={true} solicitud={printData.solicitud} documentos={printData.documentos} onAfterPrint={() => setPrintData(null)} />}

            {/* Header Unificado: Título + Filtros (Optimización de Espacio) */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                        <History size={24} className="text-blue-600"/> 
                        Historial
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 font-medium">Registro histórico de movimientos</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <div className="relative group flex-1 sm:min-w-[240px]">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Buscar solicitud..." 
                            className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="relative sm:w-48">
                        <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select 
                            className="w-full pl-9 pr-8 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none appearance-none cursor-pointer"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            {uniqueStatuses.map(s => (
                                <option key={s} value={s}>{s === "TODOS" ? "Todos los estados" : s.replace('_', ' ')}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                    </div>
                </div>
            </div>

            {/* Tabla Principal (KPIs Eliminados) */}
            <div className="bg-white shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                <div className="overflow-x-auto flex-1 w-full">
                    <DataTable
                        columns={columns}
                        data={currentItems}
                        renderActions={renderActions}
                        emptyMessage={solicitudes.length === 0 ? "El historial está vacío." : "No se encontraron coincidencias."}
                    />
                </div>
                {filteredSolicitudes.length > 0 && (
                    <div>
                        <Pagination
                            page={page}
                            total={filteredSolicitudes.length}
                            pageSize={pageSize}
                            onPageChange={setPage}
                            onPageSizeChange={(s) => { setPageSize(s); setPage(0); }}
                        />
                    </div>
                )}
            </div>

            {/* Modal de Detalle Optimizado */}
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