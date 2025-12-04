import React, { useState } from 'react';
import { 
  X, User, Building2, Calendar, UserCheck, 
  AlertTriangle, LayoutList, ChevronUp, ChevronDown, 
  Loader2 
} from "lucide-react";
import { MODALIDADES, InfoBlock } from "../../../components/data/Shared"; 

// Componente interno para secciones colapsables
const CollapsibleSection = ({ title, icon: Icon, count, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-4 transition-all">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full px-5 py-3 bg-slate-50/50 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2 font-bold text-slate-700 text-sm">
                    {Icon && <Icon size={16} className="text-blue-500"/>} {title} 
                    {count !== undefined && <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs">{count}</span>}
                </div>
                {isOpen ? <ChevronUp size={16} className="text-slate-400"/> : <ChevronDown size={16} className="text-slate-400"/>}
            </button>
            {isOpen && <div className="border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">{children}</div>}
        </div>
    );
};

export default function DetalleSolicitudModal({ isOpen, onClose, solicitud, documentos, loading }) {
    if (!isOpen) return null;

    // Recuperar datos de devolución si existen
    const devolucionData = solicitud?.devoluciones_documentos?.[0] || solicitud?.devoluciones?.[0];
    const nombreReceptor = devolucionData?.usuario?.nombre_completo || devolucionData?.usuarios?.nombre_completo || "Responsable de Atención";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200 border border-slate-100">
                
                {/* Header del Modal */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                            <LayoutList size={20} className="text-blue-600"/>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 tracking-tight">
                            {solicitud ? `Detalle Solicitud #${solicitud.numero_solicitud || solicitud.codigo_solicitud}` : 'Detalles'}
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                        <X size={20} />
                    </button>
                </div>

                {/* Contenido Scrollable */}
                <div className="p-0 overflow-y-auto bg-slate-50/30 flex-1 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 size={40} className="text-blue-500 animate-spin mb-4"/>
                            <p className="text-slate-400 text-sm">Cargando información...</p>
                        </div>
                    ) : solicitud ? (
                        <div className="p-6 bg-slate-50 min-h-full">
                            {/* Tarjeta de Información General */}
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg mt-1"><User size={20} /></div>
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Solicitante</h4>
                                                <p className="text-lg font-bold text-slate-800">{solicitud.nombre_solicitante}</p>
                                                <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-500 bg-slate-100 w-fit px-2 py-0.5 rounded">
                                                    <Building2 size={12} /> {solicitud.sub_gerencia}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
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
                                        <InfoBlock label="Responsable Atención">
                                            <div className="flex items-center gap-1.5 font-medium text-slate-700">
                                                <UserCheck size={14} className="text-emerald-500"/>
                                                <span className="truncate" title={nombreReceptor}>{nombreReceptor || "Pendiente"}</span>
                                            </div>
                                        </InfoBlock>
                                    </div>
                                </div>
                                <div className="mt-6 pt-6 border-t border-slate-100 grid gap-4">
                                    <InfoBlock label="Motivo del Requerimiento">
                                        <p className="text-sm text-slate-600 leading-relaxed">{solicitud.motivo_solicitud || "Sin motivo especificado."}</p>
                                    </InfoBlock>
                                    {solicitud.observaciones_archivo && (
                                        <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg flex gap-3">
                                            <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                            <div>
                                                <h5 className="text-xs font-bold text-amber-700 uppercase mb-1">Observación Archivística</h5>
                                                <p className="text-sm text-amber-900 leading-relaxed">{solicitud.observaciones_archivo}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Lista de Documentos */}
                            <CollapsibleSection title="Documentos Solicitados" icon={LayoutList} count={documentos.length} defaultOpen={true}>
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
                    ) : null}
                </div>
            </div>
        </div>
    );
}