import React, { useState } from 'react';
import { supabase } from "../../../utils/supabaseClient";
import { FileCheck, RotateCcw, Eye, Printer, AlertTriangle } from "lucide-react";
import { Modal, EstadoBadge } from "../ServiciosArchivisticos";
import { DigitalSignature } from "../../../components/ui/DigitalSignature";

export default function PrestamosActivosTab({ solicitudes, currentUser, documentosInventario, onReload, onMensaje, onImprimir }) {
    const [selectedSolicitud, setSelectedSolicitud] = useState(null);
    const [docsDevolucion, setDocsDevolucion] = useState([]);
    const [showDevolucionModal, setShowDevolucionModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [firmaReceptor, setFirmaReceptor] = useState(null);
    const [obsGeneral, setObsGeneral] = useState("");

    // Funciones auxiliares (ver detalle, cargar docs para devolución, procesar devolución)
    // ... (Lógica idéntica a la que tenías, adaptada a este componente)
    
    const handleDevolucionClick = async (solicitud) => {
        setSelectedSolicitud(solicitud);
        try {
            const { data } = await supabase.from("solicitudes_documentos").select("*, devoluciones:devoluciones_documentos(*)").eq("solicitud_id", solicitud.id);
            // Mapear para saber cuáles ya fueron devueltos
            const docsPrep = data.map(d => ({
                ...d,
                ya_devuelto: d.devoluciones && d.devoluciones.length > 0,
                selected_return: false, // Checkbox para devolver ahora
                obs_item: ""
            }));
            setDocsDevolucion(docsPrep);
            setFirmaReceptor(null);
            setObsGeneral("");
            setShowDevolucionModal(true);
        } catch (e) { onMensaje("Error cargando documentos", "error"); }
    };

    const procesarDevolucion = async () => {
        const itemsADevolver = docsDevolucion.filter(d => d.selected_return && !d.ya_devuelto);
        if (itemsADevolver.length === 0) return onMensaje("Seleccione documentos para devolver", "error");
        if (!firmaReceptor) return onMensaje("Firma requerida", "error");

        try {
             const insertData = itemsADevolver.map(doc => ({
                solicitud_id: selectedSolicitud.id,
                documento_id: doc.documento_id,
                solicitud_documento_id: doc.id,
                fecha_devolucion: new Date().toISOString(),
                observaciones: doc.obs_item || obsGeneral,
                firma_receptor: firmaReceptor,
                usuario_receptor_id: currentUser.id
            }));
            
            await supabase.from("devoluciones_documentos").insert(insertData);

            // Verificar si todos están devueltos para cerrar solicitud
            const totalDocs = docsDevolucion.length;
            const totalDevueltosPrevio = docsDevolucion.filter(d => d.ya_devuelto).length;
            const totalAhora = itemsADevolver.length;
            
            const todosListos = (totalDevueltosPrevio + totalAhora) === totalDocs;

            await supabase.from("solicitudes_archivisticas").update({
                estado: todosListos ? 'devuelta' : 'devolucion parcial',
                fecha_devolucion_real: todosListos ? new Date().toISOString() : null,
                updated_by: currentUser.id
            }).eq("id", selectedSolicitud.id);

            onMensaje("Devolución registrada", "success");
            setShowDevolucionModal(false);
            onReload();
        } catch (e) { onMensaje(e.message, "error"); }
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><FileCheck className="text-blue-600"/> Préstamos Activos</h2>
            <div className="space-y-3">
                {solicitudes.map(sol => (
                    <div key={sol.id} className={`border rounded-xl p-4 flex flex-col md:flex-row justify-between gap-4 ${sol.estado === 'devolucion parcial' ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'}`}>
                        <div>
                             <h3 className="font-semibold text-gray-900">{sol.motivo_solicitud}</h3>
                             <div className="text-xs text-gray-600 space-y-1">
                                 <p>Solicitante: <strong>{sol.nombre_solicitante}</strong></p>
                                 <p>F. Devolución Prevista: {sol.fecha_devolucion_prevista ? new Date(sol.fecha_devolucion_prevista).toLocaleDateString() : 'N/A'}</p>
                                 {new Date(sol.fecha_devolucion_prevista) < new Date() && <span className="text-red-600 font-bold flex items-center gap-1"><AlertTriangle size={12}/> Vencido</span>}
                             </div>
                        </div>
                        <div className="flex items-center gap-2">
                             <EstadoBadge estado={sol.estado} />
                             <button onClick={() => handleDevolucionClick(sol)} className="p-2 bg-orange-100 text-orange-700 rounded hover:bg-orange-200" title="Registrar Devolución"><RotateCcw size={16}/></button>
                             <button onClick={() => onImprimir(sol)} className="p-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"><Printer size={16}/></button>
                        </div>
                    </div>
                ))}
            </div>
            {/* Aquí iría el Modal de Devolución usando la misma estructura que en el código original pero con las variables de estado locales */}
             <Modal isOpen={showDevolucionModal} onClose={() => setShowDevolucionModal(false)} title="Registrar Devolución">
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">Marque los documentos que están siendo devueltos físicamente.</p>
                    <div className="max-h-60 overflow-y-auto border rounded">
                        {docsDevolucion.map(doc => (
                            <div key={doc.id} className={`p-2 border-b flex items-center gap-3 ${doc.ya_devuelto ? 'bg-gray-100 opacity-60' : ''}`}>
                                <input type="checkbox" disabled={doc.ya_devuelto} checked={doc.selected_return || doc.ya_devuelto} 
                                    onChange={e => {
                                        setDocsDevolucion(prev => prev.map(p => p.id === doc.id ? {...p, selected_return: e.target.checked} : p));
                                    }} 
                                />
                                <div className="flex-1 text-sm">
                                    <p className="font-medium">{doc.descripcion}</p>
                                    <p className="text-xs">{doc.documento_id}</p>
                                </div>
                                {doc.ya_devuelto && <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Devuelto</span>}
                            </div>
                        ))}
                    </div>
                    <div className="space-y-2">
                         <label className="text-sm font-medium">Observaciones</label>
                         <textarea className="w-full border rounded p-2 text-sm" rows="2" value={obsGeneral} onChange={e => setObsGeneral(e.target.value)}></textarea>
                         <label className="text-sm font-medium">Firma Receptor</label>
                         <DigitalSignature value={firmaReceptor} onChange={setFirmaReceptor} />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setShowDevolucionModal(false)} className="px-3 py-1 border rounded">Cancelar</button>
                        <button onClick={procesarDevolucion} className="px-3 py-1 bg-green-600 text-white rounded">Confirmar</button>
                    </div>
                </div>
             </Modal>
        </div>
    );
}