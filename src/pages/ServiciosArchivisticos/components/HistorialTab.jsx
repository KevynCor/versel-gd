import React, { useState } from 'react';
import { History, Printer, Calendar, User, FileText, Search } from "lucide-react";
import { supabase } from "../../../utils/supabaseClient";
import CargoPrestamoPDF from './CargoPrestamoPDF';
import { EstadoBadge } from "../ServiciosArchivisticos";

export default function HistorialTab({ solicitudes, onMensaje }) {
    // Estados para impresión
    const [selectedSolicitud, setSelectedSolicitud] = useState(null);
    const [docsParaImprimir, setDocsParaImprimir] = useState([]);
    const [isPrintReady, setIsPrintReady] = useState(false);

    // Función para cargar datos e imprimir
    const handleImprimirCargo = async (solicitud) => {
        if (onMensaje) {
            onMensaje("Preparando vista previa de impresión...", "info");
        }
        
        // Controlar overflow del body
        document.body.style.overflow = 'hidden';
        
        try {
            const { data: docs, error } = await supabase
                .from("solicitudes_documentos")
                .select(`
                    *, 
                    devoluciones:devoluciones_documentos(*),
                    idoc:Inventario_documental!documento_id (
                        "Numero_Caja", 
                        "Numero_Tomo", 
                        "Numero_Folios", 
                        "Tipo_Unidad_Conservacion",
                        "Ambiente",
                        "Estante",
                        "Cuerpo",
                        "Balda",
                        "Serie_Documental",
                        "Unidad_Organica"
                    )
                `)
                .eq("solicitud_id", solicitud.id)
                .order("numero_orden", { ascending: true });
            
            if (error) throw error;
            
            // Establecer los datos para renderizar el PDF
            setSelectedSolicitud(solicitud);
            setDocsParaImprimir(docs || []);
            setIsPrintReady(true);

        } catch (error) {
            console.error('Error al cargar datos para imprimir:', error);
            if (onMensaje) {
                onMensaje("Error al generar cargo: " + error.message, "error");
            }
            setIsPrintReady(false);
            document.body.style.overflow = '';
        }
    };

    // Callback después de imprimir
    const handlePrintComplete = () => {
        setIsPrintReady(false);
        setDocsParaImprimir([]);
        setSelectedSolicitud(null);
        document.body.style.overflow = '';
    };

    return (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 animate-fade-in">
            
            {/* COMPONENTE PDF PARA IMPRESIÓN */}
            {selectedSolicitud && isPrintReady && (
                <CargoPrestamoPDF
                    isReady={isPrintReady}
                    solicitud={selectedSolicitud}
                    documentos={docsParaImprimir}
                    onAfterPrint={handlePrintComplete}
                />
            )}

            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                    <History className="text-slate-500"/> Historial de Solicitudes
                    {solicitudes.length > 0 && (
                        <span className="bg-slate-200 text-slate-600 text-sm px-2 py-0.5 rounded-full font-bold">
                            {solicitudes.length}
                        </span>
                    )}
                </h2>
            </div>

            {solicitudes.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl bg-white">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search size={32} className="text-slate-300"/>
                    </div>
                    <h3 className="text-lg font-bold text-slate-700">No hay historial disponible</h3>
                    <p className="text-slate-500 font-medium text-sm mt-1">
                        Las solicitudes finalizadas, rechazadas o canceladas aparecerán aquí.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {solicitudes.map(sol => (
                        <div 
                            key={sol.id} 
                            className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm hover:shadow-md transition-all duration-200 group"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 border border-slate-200 font-bold">
                                        #{sol.numero_solicitud || sol.id.slice(0,8)}
                                    </span>
                                    <EstadoBadge estado={sol.estado} />
                                </div>
                                
                                <h3 className="text-sm font-bold text-slate-800 mb-1 line-clamp-1 group-hover:text-blue-700 transition-colors">
                                    {sol.motivo_solicitud}
                                </h3>
                                
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                                    <div className="flex items-center gap-1">
                                        <Calendar size={12}/>
                                        {new Date(sol.fecha_solicitud).toLocaleDateString('es-ES', {
                                            year: 'numeric', month: 'short', day: 'numeric'
                                        })}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <User size={12}/>
                                        <span className="truncate max-w-[150px]" title={sol.nombre_solicitante}>
                                            {sol.nombre_solicitante}
                                        </span>
                                    </div>
                                    {sol.fecha_devolucion_real && (
                                        <div className="flex items-center gap-1 text-emerald-600 font-medium">
                                            <FileText size={12}/>
                                            Devuelto: {new Date(sol.fecha_devolucion_real).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0 mt-1 sm:mt-0">
                                <button 
                                    onClick={() => handleImprimirCargo(sol)} 
                                    className="flex-1 sm:flex-none px-4 py-2 bg-white border border-slate-300 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                                    title="Imprimir Comprobante / Cargo"
                                >
                                    <Printer size={16} />
                                    <span className="sm:hidden">Imprimir</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}