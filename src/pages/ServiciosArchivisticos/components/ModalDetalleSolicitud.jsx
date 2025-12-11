import React, { useState, useMemo } from 'react';
import { 
  X, User, Building2, Calendar, FileText, 
  MapPin, Box, Clock, CheckCircle2, AlertCircle,
  ArrowRightLeft, History, RefreshCw, ScanLine, Copy, 
  Hash, ChevronDown, ChevronUp 
} from "lucide-react";
import { MODALIDADES, EstadoBadge, formatFechaHora } from "../../../components/data/Shared"; 

// -----------------------------------------------------------------------------
// 1. SUB-COMPONENTES UI (Locales para este Modal)
// -----------------------------------------------------------------------------

const StatCard = ({ label, value, icon: Icon, color = "blue" }) => (
    <div className="flex flex-col p-3 bg-slate-50 rounded-lg border border-slate-100/50 hover:bg-slate-100 transition-colors group cursor-default min-w-0">
        <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{label}</span>
            <Icon size={14} className={`text-${color}-500 opacity-60 group-hover:opacity-100 transition-opacity shrink-0`} />
        </div>
        <p className="text-base sm:text-lg font-bold text-slate-700 leading-none truncate">{value}</p>
    </div>
);

const CollapsibleSection = ({ title, icon: Icon, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all duration-300">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-3 sm:p-4 bg-white hover:bg-slate-50 transition-colors text-left"
            >
                <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md shrink-0">
                        <Icon size={16} />
                    </div>
                    <span className="text-sm font-bold text-slate-700 truncate">{title}</span>
                </div>
                {isOpen ? <ChevronUp size={16} className="text-slate-400 shrink-0"/> : <ChevronDown size={16} className="text-slate-400 shrink-0"/>}
            </button>
            
            {isOpen && (
                <div className="p-3 sm:p-4 pt-0 border-t border-slate-100 animate-in slide-in-from-top-2">
                    {children}
                </div>
            )}
        </div>
    );
};

const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3 py-2 sm:py-3 border-b border-slate-50 last:border-0">
        <Icon size={16} className="text-slate-400 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
            <p className="text-[10px] sm:text-xs text-slate-400 mb-0.5 uppercase tracking-wide">{label}</p>
            <p className="text-sm font-medium text-slate-800 break-words leading-snug">{value || "-"}</p>
        </div>
    </div>
);

// --- 2. FILA DE DOCUMENTO (Visualización Unificada) ---

const DocumentRow = ({ doc, isPrestamoOriginal }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const isReturned = !!doc.fecha_devolucion;
    const isDelivered = !!doc.fecha_entrega && !isReturned;
    
    // Configuración visual del estado del item (Calculado localmente)
    let status = { label: "Pendiente", bg: "bg-slate-100", text: "text-slate-500", iconBg: "bg-slate-100" };
    
    if (isReturned) {
        status = { label: "Devuelto", bg: "bg-emerald-50", text: "text-emerald-700", iconBg: "bg-emerald-100 text-emerald-600" };
    } else if (isDelivered) {
        status = { 
            label: isPrestamoOriginal ? "En Poder" : "Atendido", 
            bg: "bg-amber-50", 
            text: "text-amber-700",
            iconBg: "bg-amber-100 text-amber-600"
        };
    }

    return (
        <div className={`transition-colors duration-200 border-b border-slate-100 last:border-0 ${isExpanded ? 'bg-blue-50/30' : 'hover:bg-slate-50'}`}>
            {/* Cabecera (Siempre visible) */}
            <div 
                className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4 cursor-pointer select-none active:bg-slate-100" 
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${status.iconBg}`}>
                    {isReturned ? <CheckCircle2 size={16} /> : <FileText size={16} className={isDelivered ? "" : "text-slate-400"} />}
                </div>

                <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-2 items-center">
                    {/* ID e Info Principal */}
                    <div className="sm:col-span-10 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                         <span className="select-text font-mono text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded flex items-center w-fit shadow-sm">
                            <Hash size={10} className="mr-1 opacity-50"/> {doc.documento_id}
                        </span>
                        <p className="text-sm font-bold text-slate-800 truncate" title={doc.descripcion}>
                            {doc.descripcion || "Sin descripción"}
                        </p>
                    </div>

                    {/* Badge Estado Item */}
                    <div className="sm:col-span-2 flex sm:justify-end">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border border-transparent ${status.bg} ${status.text}`}>
                            {status.label}
                        </span>
                    </div>
                </div>

                <div className="shrink-0 text-slate-400 pl-1">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
            </div>

            {/* Detalles (Expandible) */}
            {isExpanded && (
                <div className="px-4 pb-4 sm:pl-16 sm:pr-6 sm:pb-5 animate-in slide-in-from-top-1 fade-in">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-white rounded-lg border border-slate-200/60 shadow-sm">
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Ubicación</p>
                            <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium truncate">
                                <MapPin size={12} className="text-blue-500 shrink-0"/> 
                                <span className="truncate" title={doc.ubicacion_topografica}>{doc.ubicacion_topografica || 'S/D'}</span>
                            </div>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Caja</p>
                            <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                                <Box size={12} className="text-blue-500 shrink-0"/> {doc.caja ? `Caja ${doc.caja}` : '-'}
                            </div>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Serie</p>
                            <p className="text-xs text-slate-700 font-medium truncate" title={doc.serie}>{doc.serie || '-'}</p>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Volumen</p>
                            <p className="text-xs text-slate-700 font-medium truncate">{doc.numero_folios ? `${doc.numero_folios} Fols` : '-'} {doc.numero_tomo ? `| ${doc.numero_tomo} T` : ''}</p>
                        </div>
                    </div>
                    
                    {(doc.fecha_entrega || doc.fecha_devolucion) && (
                        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 mt-3 text-xs pl-1">
                            {doc.fecha_entrega && (
                                <span className="flex items-center gap-1.5 text-slate-600 bg-slate-50 px-2 py-1 rounded w-fit">
                                    <Clock size={12} className="text-blue-500"/> Entregado: <span className="font-mono font-medium">{formatFechaHora(doc.fecha_entrega)}</span>
                                </span>
                            )}
                            {doc.fecha_devolucion && (
                                <span className="flex items-center gap-1.5 text-slate-600 bg-emerald-50 px-2 py-1 rounded w-fit">
                                    <CheckCircle2 size={12} className="text-emerald-500"/> Devuelto: <span className="font-mono font-medium">{formatFechaHora(doc.fecha_devolucion)}</span>
                                </span>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const TimelineStep = ({ title, date, user, isLast = false, statusColor = "slate" }) => {
    const colors = {
        slate: { dot: "bg-slate-200", line: "border-slate-200", text: "text-slate-500" },
        blue: { dot: "bg-blue-500", line: "border-blue-200", text: "text-blue-600" },
        emerald: { dot: "bg-emerald-500", line: "border-emerald-200", text: "text-emerald-600" },
        amber: { dot: "bg-amber-500", line: "border-amber-200", text: "text-amber-600" },
        red:     { dot: "bg-red-500", line: "border-red-200", text: "text-red-600" },
    };
    const current = colors[statusColor] || colors.slate;

    return (
        <div className={`relative pl-6 sm:pl-8 ${!isLast ? 'pb-6 sm:pb-8 border-l-2 ' + current.line : ''} ml-1 sm:ml-2`}>
            <div className={`absolute -left-[7px] sm:-left-[9px] top-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-4 border-white shadow-sm transition-colors ${current.dot}`}></div>
            <div className="bg-white rounded-lg p-3 border border-slate-100 shadow-sm -mt-2">
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wide mb-0.5">{title}</p>
                <p className={`text-sm font-bold ${current.text}`}>{date || "Pendiente"}</p>
                {user && <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><User size={10}/> {user}</p>}
            </div>
        </div>
    );
};

// -----------------------------------------------------------------------------
// 3. COMPONENTE PRINCIPAL (MODAL)
// -----------------------------------------------------------------------------

export default function DetalleSolicitudModal({ isOpen, onClose, solicitud, documentos, loading }) {
    
    // KPIs calculados al vuelo
    const stats = useMemo(() => {
        if (!documentos) return { total: 0, devueltos: 0, entregados: 0 };
        return {
            total: documentos.length,
            devueltos: documentos.filter(d => d.fecha_devolucion).length,
            entregados: documentos.filter(d => d.fecha_entrega && !d.fecha_devolucion).length
        };
    }, [documentos]);

    if (!isOpen) return null;

    const modalidadLabel = MODALIDADES.find(m => m.value === solicitud?.modalidad_servicio)?.label || solicitud?.modalidad_servicio;
    const isPrestamoOriginal = solicitud?.modalidad_servicio === 'PRESTAMO_ORIGINAL';
    
    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            
            <div className="bg-white w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:rounded-2xl sm:shadow-2xl sm:max-w-3xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200">
                
                {/* 1. Encabezado */}
                <div className="flex items-start justify-between px-4 sm:px-6 pt-4 sm:pt-6 pb-4 bg-white border-b border-slate-100 shrink-0 z-10">
                    <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            {/* REUTILIZACIÓN DE COMPONENTE: EstadoBadge */}
                            <EstadoBadge estado={solicitud?.estado} />
                            
                            <span className="text-xs text-slate-400 flex items-center gap-1 font-medium bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                                <Clock size={10}/> {formatFechaHora(solicitud?.created_at)}
                            </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight leading-none truncate">
                            #{solicitud?.numero_solicitud || solicitud?.codigo_solicitud || "S/N"}
                        </h2>
                    </div>
                    
                    <button 
                        onClick={onClose} 
                        className="p-2 -mr-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors shrink-0"
                    >
                        <X size={24} strokeWidth={1.5} />
                    </button>
                </div>

                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="text-sm font-medium animate-pulse">Cargando...</p>
                    </div>
                ) : (
                    // 2. Cuerpo con Scroll
                    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-6 custom-scrollbar space-y-5 sm:space-y-6">
                        
                        {/* A. Métricas */}
                        <div className={`grid gap-2 sm:gap-3 ${isPrestamoOriginal ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-3'}`}>
                            <StatCard label="Total" value={stats.total} icon={FileText} color="slate" />
                            <StatCard 
                                label={isPrestamoOriginal ? "En Préstamo" : "Procesados"} 
                                value={stats.entregados} 
                                icon={isPrestamoOriginal ? ArrowRightLeft : (solicitud?.modalidad_servicio === 'DIGITALIZACION' ? ScanLine : Copy)} 
                                color="amber" 
                            />
                            {isPrestamoOriginal && (
                                <StatCard label="Devueltos" value={stats.devueltos} icon={CheckCircle2} color="emerald" />
                            )}
                            <StatCard label="Modalidad" value={modalidadLabel} icon={Building2} color="blue" />
                        </div>

                        {/* B. Trazabilidad (Acordeón desplegado por defecto) */}
                        <CollapsibleSection title="Ciclo de Vida y Trazabilidad" icon={History} defaultOpen={true}>
                            <div className="max-w-lg mx-auto py-2">
                                <TimelineStep 
                                    title="Solicitud Creada" 
                                    date={formatFechaHora(solicitud?.fecha_solicitud)} 
                                    statusColor="blue"
                                />
                                
                                <TimelineStep 
                                    title={isPrestamoOriginal ? "Atención / Préstamo" : "Atención / Ejecución"}
                                    date={formatFechaHora(solicitud?.fecha_atencion)} 
                                    user={solicitud?.usuario_atencion?.nombre_completo}
                                    statusColor={solicitud?.fecha_atencion ? "emerald" : "slate"}
                                    isLast={!isPrestamoOriginal} 
                                />

                                {isPrestamoOriginal && (
                                    <>
                                        <TimelineStep 
                                            title="Devolución Prevista" 
                                            date={formatFechaHora(solicitud?.fecha_devolucion_prevista)} 
                                            statusColor="amber"
                                        />
                                        <TimelineStep 
                                            title="Devolución Real" 
                                            date={formatFechaHora(solicitud?.fecha_devolucion_real)} 
                                            statusColor={solicitud?.fecha_devolucion_real ? "emerald" : "slate"}
                                            isLast={true}
                                        />
                                    </>
                                )}
                            </div>
                        </CollapsibleSection>

                        {/* C. Contexto (Acordeón cerrado por defecto) */}
                        <CollapsibleSection title="Detalles del Requerimiento" icon={User}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 pt-2">
                                <div className="space-y-1">
                                    <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2 pb-1 border-b border-blue-100/50">Solicitante</h4>
                                    <InfoRow icon={User} label="Nombre Completo" value={solicitud?.nombre_solicitante} />
                                    <InfoRow icon={Building2} label="Área / Subgerencia" value={solicitud?.sub_gerencia || solicitud?.unidad_organica} />
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2 pb-1 border-b border-blue-100/50">Contexto</h4>
                                    <div className="bg-slate-50 p-3 sm:p-4 rounded-lg border border-slate-100 mb-4">
                                        <p className="text-[10px] text-slate-400 mb-1 font-bold uppercase">Motivo</p>
                                        <p className="text-sm font-medium text-slate-700 leading-relaxed italic">"{solicitud?.motivo_solicitud || "No especificado"}"</p>
                                    </div>
                                    {solicitud?.observaciones_archivo && (
                                        <div className="flex gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                                            <AlertCircle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-[10px] font-bold text-amber-700 uppercase">Nota de Atención</p>
                                                <p className="text-xs text-amber-800 mt-0.5">{solicitud.observaciones_archivo}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CollapsibleSection>

                        {/* D. Documentos (Bloque Unificado - Siempre visible) */}
                        <div>
                            <div className="flex items-center justify-between mb-3 px-1">
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                                    <FileText size={16} className="text-blue-600"/> Documentos Asociados
                                </h3>
                                <span className="text-xs font-medium text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                                    {documentos?.length || 0}
                                </span>
                            </div>
                            
                            {documentos?.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-400 opacity-60 bg-white rounded-xl border border-dashed border-slate-200">
                                    <FileText size={48} strokeWidth={1} />
                                    <p className="mt-2 text-sm font-medium">No hay documentos registrados.</p>
                                </div>
                            ) : (
                                // CONTENEDOR UNIFICADO
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                    {documentos.map((doc, i) => (
                                        <DocumentRow 
                                            key={doc.id || i} 
                                            doc={doc} 
                                            isPrestamoOriginal={isPrestamoOriginal} 
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                )}
                
                {/* 3. Footer */}
                <div className="px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 shrink-0">
                    <span>Última actualización: {formatFechaHora(solicitud?.updated_at)}</span>
                    <span className="flex items-center gap-1"><RefreshCw size={10} className="animate-spin-slow"/> Sincronizado</span>
                </div>

            </div>
        </div>
    );
}