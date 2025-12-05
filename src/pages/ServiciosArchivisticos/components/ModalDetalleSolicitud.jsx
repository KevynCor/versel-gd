import React, { useState, useMemo } from 'react';
import { 
  X, User, Building2, Calendar, FileText, 
  MapPin, Box, Clock, CheckCircle2, AlertCircle,
  ArrowRightLeft, History, RefreshCw, ScanLine, Copy, 
  Hash, ChevronDown, ChevronUp, MoreHorizontal 
} from "lucide-react";
import { MODALIDADES } from "../../../components/data/Shared"; 

// --- 1. Componentes UI Atómicos (Minimalistas) ---

/** * Tarjeta de Métrica: Muestra solo el número y etiqueta esencial.
 * Diseño limpio sin bordes pesados.
 */
const StatCard = ({ label, value, icon: Icon, color = "blue" }) => (
    <div className="flex flex-col p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors group cursor-default">
        <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
            <Icon size={14} className={`text-${color}-500 opacity-60 group-hover:opacity-100 transition-opacity`} />
        </div>
        <p className="text-xl font-bold text-slate-700 leading-none">{value}</p>
    </div>
);

/**
 * Botón de Pestaña: Estilo 'underlined' para menor carga visual que botones tipo caja.
 */
const TabButton = ({ active, onClick, label, icon: Icon }) => (
    <button 
        onClick={onClick}
        className={`
            flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 relative
            ${active 
                ? 'border-blue-600 text-blue-700' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }
        `}
    >
        <Icon size={16} className={active ? "text-blue-600" : "text-slate-400"} /> 
        {label}
    </button>
);

/**
 * Fila de Información Clave-Valor para el Resumen
 */
const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0">
        <div className="p-2 bg-slate-50 rounded-full text-slate-400 shrink-0">
            <Icon size={16} />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 mb-0.5">{label}</p>
            <p className="text-sm font-medium text-slate-800 truncate" title={typeof value === 'string' ? value : ''}>{value || "-"}</p>
        </div>
    </div>
);

// --- 2. Componentes Complejos (Con Lógica de UI) ---

/**
 * Ítem de Documento Expansible (Diseño Progresivo)
 * Estado por defecto: Compacto (ID + Descripción + Estado)
 * Estado expandido: Detalles técnicos (Ubicación, Caja, Serie, Folios, Fechas)
 */
const DocumentListItem = ({ doc, isPrestamoOriginal }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const isReturned = !!doc.fecha_devolucion;
    const isDelivered = !!doc.fecha_entrega && !isReturned;
    
    let statusConfig = { text: "Pendiente", color: "bg-slate-100 text-slate-500" };
    if (isReturned) statusConfig = { text: "Devuelto", color: "bg-emerald-50 text-emerald-700 border-emerald-100" };
    else if (isDelivered) statusConfig = { text: isPrestamoOriginal ? "En Poder" : "Atendido", color: "bg-amber-50 text-amber-700 border-amber-100" };

    return (
        <div className={`border border-slate-100 rounded-lg transition-all duration-200 ${isExpanded ? 'bg-white shadow-md border-slate-200 ring-1 ring-slate-200 z-10' : 'bg-white hover:border-slate-300'}`}>
            {/* Cabecera Compacta - Siempre visible */}
            <div 
                className="p-3 flex items-center gap-3 cursor-pointer" 
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {/* Icono de Estado Visual */}
                <div className={`shrink-0 p-2 rounded-full ${isReturned ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                    {isReturned ? <CheckCircle2 size={18}/> : <FileText size={18}/>}
                </div>

                {/* Información Principal */}
                <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <div className="sm:col-span-2 flex items-center gap-1">
                        <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded flex items-center w-fit">
                            <Hash size={10} className="mr-1"/> {doc.documento_id}
                        </span>
                    </div>
                    <div className="sm:col-span-8">
                        <p className="text-sm font-bold text-slate-700 truncate">{doc.descripcion || "Sin descripción"}</p>
                    </div>
                    <div className="sm:col-span-2 text-right">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border ${statusConfig.color}`}>
                            {statusConfig.text}
                        </span>
                    </div>
                </div>

                {/* Botón Expansor */}
                <div className="shrink-0 text-slate-400">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
            </div>

            {/* Detalles - Revelación Progresiva */}
            {isExpanded && (
                <div className="px-4 pb-4 pt-0 border-t border-slate-50 mt-2 animate-in slide-in-from-top-1">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
                        <div>
                            <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Ubicación</p>
                            <div className="flex items-center gap-1 text-xs text-slate-600">
                                <MapPin size={12}/> {doc.ubicacion_topografica || 'S/D'}
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Contenedor</p>
                            <div className="flex items-center gap-1 text-xs text-slate-600">
                                <Box size={12}/> {doc.caja ? `Caja ${doc.caja}` : '-'}
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Serie</p>
                            <p className="text-xs text-slate-600 truncate" title={doc.serie}>{doc.serie || '-'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Volumen</p>
                            <p className="text-xs text-slate-600">{doc.numero_folios ? `${doc.numero_folios} Folios` : '-'}</p>
                        </div>
                    </div>
                    
                    {/* Fechas específicas del documento */}
                    {(doc.fecha_entrega || doc.fecha_devolucion) && (
                        <div className="mt-3 pt-3 border-t border-slate-50 flex gap-4 text-[10px] text-slate-400">
                            {doc.fecha_entrega && <span>Entregado: {new Date(doc.fecha_entrega).toLocaleDateString()}</span>}
                            {doc.fecha_devolucion && <span>Devuelto: {new Date(doc.fecha_devolucion).toLocaleDateString()}</span>}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const TimelineStep = ({ title, date, user, isLast = false, statusColor = "slate" }) => {
    const colors = {
        slate: { dot: "bg-slate-200", line: "border-slate-200" },
        blue: { dot: "bg-blue-500", line: "border-blue-200" },
        emerald: { dot: "bg-emerald-500", line: "border-emerald-200" },
        amber: { dot: "bg-amber-500", line: "border-amber-200" },
    };
    const current = colors[statusColor] || colors.slate;

    return (
        <div className={`relative pl-8 ${!isLast ? 'pb-8 border-l-2 ' + current.line : ''} ml-2`}>
            <div className={`absolute -left-[9px] top-0 w-5 h-5 rounded-full border-4 border-white shadow-sm ${current.dot}`}></div>
            <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-0.5">{title}</p>
                <p className="text-sm font-bold text-slate-800">{date || "Pendiente"}</p>
                {user && <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><User size={10}/> {user}</p>}
            </div>
        </div>
    );
};

// --- 3. Componente Principal ---

export default function DetalleSolicitudModal({ isOpen, onClose, solicitud, documentos, loading }) {
    const [activeTab, setActiveTab] = useState('documentos');

    // Cálculos optimizados
    const stats = useMemo(() => {
        if (!documentos) return { total: 0, devueltos: 0, pendientes: 0 };
        return {
            total: documentos.length,
            devueltos: documentos.filter(d => d.fecha_devolucion).length,
            entregados: documentos.filter(d => d.fecha_entrega && !d.fecha_devolucion).length
        };
    }, [documentos]);

    if (!isOpen) return null;

    // Variables derivadas
    const modalidadLabel = MODALIDADES.find(m => m.value === solicitud?.modalidad_servicio)?.label || solicitud?.modalidad_servicio;
    const isPrestamoOriginal = solicitud?.modalidad_servicio === 'PRESTAMO_ORIGINAL';
    
    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            
            <div className="bg-white w-full h-full sm:h-auto sm:max-h-[85vh] sm:rounded-2xl sm:shadow-2xl sm:max-w-4xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                
                {/* 1. Header Minimalista */}
                <div className="flex items-start justify-between px-5 pt-5 pb-2 bg-white shrink-0">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded">Solicitud</span>
                            <span className="text-sm text-slate-400 flex items-center gap-1">
                                <Clock size={12}/> {formatDate(solicitud?.created_at)}
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                            #{solicitud?.numero_solicitud || solicitud?.codigo_solicitud || "S/N"}
                        </h2>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {/* Actualización visible pero discreta */}
                        <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded-full mr-2">
                            <RefreshCw size={10}/> Act: {formatDate(solicitud?.updated_at)}
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <>
                        {/* 2. Panel Compacto de Métricas */}
                        <div className="px-5 pb-2 bg-white grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
                            <StatCard label="Total Items" value={stats.total} icon={FileText} color="slate" />
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

                        {/* 3. Navegación por Pestañas (Sticky) */}
                        <div className="px-5 mt-2 border-b border-slate-100 flex gap-4 shrink-0 overflow-x-auto no-scrollbar">
                            <TabButton active={activeTab === 'documentos'} onClick={() => setActiveTab('documentos')} icon={FileText} label="Documentos" />
                            <TabButton active={activeTab === 'resumen'} onClick={() => setActiveTab('resumen')} icon={User} label="Resumen" />
                            <TabButton active={activeTab === 'trazabilidad'} onClick={() => setActiveTab('trazabilidad')} icon={History} label="Trazabilidad" />
                        </div>

                        {/* 4. Contenido Principal Enfocado */}
                        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-5 custom-scrollbar">
                            
                            {activeTab === 'documentos' && (
                                <div className="space-y-3 max-w-3xl mx-auto">
                                    {documentos?.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-slate-400 opacity-60">
                                            <FileText size={48} strokeWidth={1} />
                                            <p className="mt-2 text-sm">No hay documentos asociados.</p>
                                        </div>
                                    ) : (
                                        documentos.map((doc, i) => (
                                            <DocumentListItem 
                                                key={doc.id || i} 
                                                doc={doc} 
                                                isPrestamoOriginal={isPrestamoOriginal} 
                                            />
                                        ))
                                    )}
                                </div>
                            )}

                            {activeTab === 'resumen' && (
                                <div className="max-w-2xl mx-auto space-y-6">
                                    {solicitud?.observaciones_archivo && (
                                        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg shadow-sm">
                                            <div className="flex items-start gap-3">
                                                <AlertCircle size={20} className="text-amber-600 mt-0.5" />
                                                <div>
                                                    <h4 className="text-sm font-bold text-amber-800">Nota de Atención</h4>
                                                    <p className="text-sm text-amber-700 mt-1">{solicitud.observaciones_archivo}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                                        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 font-bold text-slate-700 text-sm">
                                            Datos del Solicitante
                                        </div>
                                        <div className="p-4">
                                            <InfoRow icon={User} label="Solicitado por" value={solicitud?.nombre_solicitante} />
                                            <InfoRow icon={Building2} label="Área / Subgerencia" value={solicitud?.sub_gerencia || solicitud?.unidad_organica} />
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                                        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 font-bold text-slate-700 text-sm">
                                            Detalle del Requerimiento
                                        </div>
                                        <div className="p-4">
                                            <p className="text-sm text-slate-600 leading-relaxed">
                                                {solicitud?.motivo_solicitud || "Sin motivo especificado."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'trazabilidad' && (
                                <div className="max-w-xl mx-auto py-4">
                                    <TimelineStep 
                                        title="Solicitud Creada" 
                                        date={formatDate(solicitud?.fecha_solicitud)} 
                                        statusColor="blue"
                                    />
                                    
                                    <TimelineStep 
                                        title={isPrestamoOriginal ? "Atención / Préstamo" : "Atención / Ejecución"}
                                        date={formatDate(solicitud?.fecha_entrega)} 
                                        user={solicitud?.usuario_atencion?.nombre_completo}
                                        statusColor={solicitud?.fecha_entrega ? "emerald" : "slate"}
                                        isLast={!isPrestamoOriginal} 
                                    />

                                    {isPrestamoOriginal && (
                                        <>
                                            <TimelineStep 
                                                title="Devolución Prevista" 
                                                date={formatDate(solicitud?.fecha_devolucion_prevista)} 
                                                statusColor="amber"
                                            />
                                            <TimelineStep 
                                                title="Devolución Real" 
                                                date={formatDate(solicitud?.fecha_devolucion_real)} 
                                                statusColor={solicitud?.fecha_devolucion_real ? "emerald" : "slate"}
                                                isLast={true}
                                            />
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}