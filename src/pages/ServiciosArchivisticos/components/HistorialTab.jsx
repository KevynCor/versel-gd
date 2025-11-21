import React from 'react';
import { Download, Printer, Eye } from "lucide-react";
import { EstadoBadge } from "../ServiciosArchivisticos";

export default function HistorialTab({ solicitudes, onImprimir }) {
    return (
        <div className="bg-white rounded-2xl shadow-lg border p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><Download className="text-gray-600"/> Historial de Solicitudes</h2>
            <div className="space-y-3">
                {solicitudes.map(sol => (
                    <div key={sol.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex justify-between items-center">
                         <div>
                             <h3 className="font-semibold text-gray-800">{sol.motivo_solicitud}</h3>
                             <p className="text-xs text-gray-500">{new Date(sol.fecha_solicitud).toLocaleDateString()} • Solicitante: {sol.nombre_solicitante}</p>
                         </div>
                         <div className="flex items-center gap-2">
                             <EstadoBadge estado={sol.estado} />
                             <button onClick={() => onImprimir(sol)} className="p-2 bg-white border rounded hover:bg-gray-100"><Printer size={16}/></button>
                         </div>
                    </div>
                ))}
            </div>
        </div>
    );
}