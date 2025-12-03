import React, { useState } from 'react';
import { supabase } from "../../../utils/supabaseClient";
import { X, AlertCircle } from "lucide-react";
import { TextareaField } from "../../../components/ui/TextareaField"; // Asumiendo ruta

export default function ModalRechazarSolicitud({ isOpen, onClose, solicitud, currentUser, onSuccess, onMensaje }) {
    const [motivoRechazo, setMotivoRechazo] = useState("");
    const [processing, setProcessing] = useState(false);

    if (!isOpen) return null;

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
                .eq("id", solicitud.id);

            if (error) throw error;

            onMensaje("La solicitud ha sido rechazada.", "success");
            onSuccess(); // Recargar lista
            onClose();   // Cerrar modal
            setMotivoRechazo(""); // Limpiar campo
        } catch (e) {
            console.error(e);
            onMensaje("Error al rechazar: " + e.message, "error");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white w-full max-w-md rounded-xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-slate-800 text-lg">Rechazar Solicitud</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full text-slate-400">
                        <X size={20} />
                    </button>
                </div>
                
                {/* Body */}
                <div className="p-6 space-y-4">
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
                        <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700">Cancelar</button>
                        <button 
                            onClick={confirmarRechazo} 
                            disabled={processing}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-bold rounded-lg shadow-sm"
                        >
                            {processing ? "Procesando..." : "Confirmar Rechazo"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}