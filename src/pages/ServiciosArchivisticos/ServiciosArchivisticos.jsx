import React, { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../../utils/supabaseClient";

// 1. Componentes UI Base y Layout
import { CrudLayout } from "../../components/layout/CrudLayout";
import { Toast } from "../../components/ui/Toast";
import { SparkleLoader } from "../../components/ui/SparkleLoader";
import { StatCard } from "../../components/ui/StatCard";
import { EmptyState } from "../../components/ui/EmptyState";

// 2. Iconografía (Lucide React)
import { 
  FileText, Plus, Clock, AlertTriangle, 
  Download, FileCheck, Shield, History 
} from "lucide-react";

// 3. Pestañas de Contenido (Módulos Locales)
import NuevaSolicitudTab from "./components/NuevaSolicitudTab";
import PendientesTab from "./components/PendientesTab";
import PrestamosActivosTab from "./components/PrestamosTab";
import HistorialTab from "./components/HistorialTab";

// --- SUB-COMPONENTE DE UI: Badge de Estado ---
export const EstadoBadge = ({ estado }) => {
  const config = {
    PENDIENTE:   { style: "bg-amber-50 text-amber-700 border-amber-200", label: "Pendiente" },
    EN_PROCESO:  { style: "bg-blue-50 text-blue-700 border-blue-200", label: "En Proceso" },
    PRESTADO:    { style: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Prestado" },
    ATENDIDO:    { style: "bg-slate-100 text-slate-600 border-slate-200", label: "Atendido" },
    DEVUELTO:    { style: "bg-gray-100 text-gray-600 border-gray-200", label: "Devuelto" },
    VENCIDO:     { style: "bg-red-50 text-red-700 border-red-200", label: "Vencido" },
    RECHAZADO:   { style: "bg-red-50 text-red-700 border-red-200", label: "Rechazado" },
    ANULADO:     { style: "bg-gray-200 text-gray-500 border-gray-300", label: "Anulado" }
  };

  const current = config[estado] || config.PENDIENTE;

  return (
    <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full border uppercase tracking-wider ${current.style}`}>
      {current.label}
    </span>
  );
};

// --- COMPONENTE PRINCIPAL ---
export default function ServiciosArchivisticos() {
  // 1. Estado Unificado
  const [state, setState] = useState({
    loading: true,
    mensaje: null,
    currentUser: null,
    activeTab: "nueva",
    solicitudes: [],
    usuarios: [] // Para selectores
  });

  // 2. Helpers de UI (Toast)
  const showMessage = useCallback((msg, tipo) => {
    setState(s => ({ ...s, mensaje: { mensaje: msg, tipo } }));
  }, []);

  // 3. Lógica de Permisos (Memoizada)
  const permissions = useMemo(() => {
    const { currentUser } = state;
    if (!currentUser) return { canManage: false, canCreate: false };
    
    const rol = currentUser.rol || '';
    return {
      canManage: ['Admin', 'Supervisor', 'Archivero'].includes(rol),
      canCreate: ['Admin', 'Supervisor', 'Archivero', 'Usuario'].includes(rol)
    };
  }, [state.currentUser]);

  // 4. Data Fetching Centralizado
  const loadInitialData = useCallback(async () => {
    try {
      setState(s => ({ ...s, loading: true }));

      // A. Obtener Usuario Actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const { data: userData, error: userError } = await supabase
        .from("usuarios")
        .select("*")
        .eq("email", user.email)
        .single();
      
      if (userError) throw userError;

      // B. Cargar Datos en Paralelo
      const [usersResponse, solicitudesResponse] = await Promise.all([
        // Usuarios (para selects)
        supabase.from("usuarios").select("id, nombre_completo, email, rol, sub_gerencia, entidad"),
        // Solicitudes (con joins)
        supabase
          .from("solicitudes_archivisticas")
          .select(`
            *,
            solicitante:solicitante_id(nombre_completo, sub_gerencia, entidad, email),
            devoluciones_documentos (firma_receptor,created_at, usuario_receptor_id, usuario:usuarios!usuario_receptor_id ( nombre_completo ))
          `)
          .order("fecha_solicitud", { ascending: false })
      ]);

      if (usersResponse.error) throw usersResponse.error;
      if (solicitudesResponse.error) throw solicitudesResponse.error;

      // C. Actualizar Estado y Determinar Tab Inicial
      setState(prev => {
        // Lógica de redirección de Tab si el usuario no tiene permisos
        let initialTab = prev.activeTab;
        const canManage = ['Admin', 'Supervisor', 'Archivero'].includes(userData.rol);
        const canCreate = ['Admin', 'Supervisor', 'Usuario'].includes(userData.rol);

        if (!canCreate && initialTab === 'nueva') {
          initialTab = canManage ? 'pendientes' : 'historial';
        }
        if (!canManage && ['pendientes', 'prestamos'].includes(initialTab)) {
          initialTab = 'nueva';
        }

        return {
          ...prev,
          loading: false,
          currentUser: userData,
          usuarios: usersResponse.data || [],
          solicitudes: solicitudesResponse.data || [],
          activeTab: initialTab
        };
      });

    } catch (error) {
      console.error("Error loading data:", error);
      showMessage("Error al cargar la información del sistema", "error");
      setState(s => ({ ...s, loading: false }));
    }
  }, [showMessage]);

  // Efecto de carga inicial
  useEffect(() => { loadInitialData(); }, [loadInitialData]);

  // 5. Handlers de Acción
  const handleGuardarSolicitud = async ({ formData }) => {
    try {
      setState(s => ({ ...s, loading: true }));
      
      const { error } = await supabase.from("solicitudes_archivisticas").insert({
        ...formData,
        created_by: state.currentUser.id
        // 'estado' y fechas se manejan por default en DB o trigger
      });

      if (error) throw error;

      showMessage("Solicitud registrada exitosamente", "success");
      await loadInitialData();
      
      // Redirección post-creación
      setState(s => ({ 
        ...s, 
        activeTab: permissions.canManage ? "pendientes" : "historial" 
      }));

    } catch (error) {
      console.error(error);
      showMessage(error.message || "Error al crear la solicitud", "error");
      setState(s => ({ ...s, loading: false }));
    }
  };

  // 6. Configuración de Pestañas (Tabs)
  const tabs = useMemo(() => [
    ...(permissions.canCreate ? [{ 
      id: "nueva", 
      label: "Nueva Solicitud", 
      icon: Plus 
    }] : []),
    ...(permissions.canManage ? [
      { 
        id: "pendientes", 
        label: "Bandeja de Pendientes", 
        count: state.solicitudes.filter(s => s.estado === "PENDIENTE").length, 
        icon: Clock 
      },
      { 
        id: "prestamos", 
        label: "Control de Préstamos", 
        count: state.solicitudes.filter(s => ["PRESTADO", "EN_PROCESO"].includes(s.estado)).length, 
        icon: FileCheck 
      }
    ] : []),
    { 
      id: "historial", 
      label: "Historial General", 
      icon: History 
    }
  ], [permissions, state.solicitudes]);

  // 7. Renderizado
  return (
    <>
      <CrudLayout 
        title="Servicios Archivísticos" 
        icon={Shield}
        description="Plataforma centralizada para la gestión de solicitudes, préstamos documentales y consultas de usuarios."
      >
        {/* Notificaciones */}
        {state.mensaje && (
          <Toast 
            {...state.mensaje} 
            onClose={() => setState(s => ({ ...s, mensaje: null }))} 
          />
        )}

        {/* Dashboard de Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
           <StatCard 
             title="Mis Solicitudes" 
             value={state.solicitudes.filter(s => s.solicitante_id === state.currentUser?.id).length} 
             icon={FileText} color="blue" 
           />
           {permissions.canManage && (
             <>
               <StatCard 
                 title="Pendientes Atención" 
                 value={state.solicitudes.filter(s => s.estado === 'PENDIENTE').length} 
                 icon={Clock} color="amber" 
               />
               <StatCard 
                 title="En Préstamo Físico" 
                 value={state.solicitudes.filter(s => s.estado === 'PRESTADO').length} 
                 icon={FileCheck} color="emerald" 
               />
               <StatCard 
                 title="Préstamos Vencidos" 
                 value={state.solicitudes.filter(s => s.estado === 'PRESTADO' && new Date(s.fecha_devolucion_prevista) < new Date()).length} 
                 icon={AlertTriangle} color="red" 
               />
             </>
           )}
        </div>

        {/* Navegación por Pestañas */}
        <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2 shadow-sm overflow-x-auto mb-0">
          {tabs.map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setState(s => ({ ...s, activeTab: tab.id }))} 
              className={`
                group flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all relative whitespace-nowrap outline-none
                ${state.activeTab === tab.id 
                  ? "text-blue-700 border-b-2 border-blue-600 bg-slate-50/50" 
                  : "text-slate-500 hover:text-blue-600 hover:bg-slate-50 border-b-2 border-transparent"
                }
              `}
            >
              <tab.icon size={18} className={`transition-colors ${state.activeTab === tab.id ? "text-blue-600" : "text-slate-400 group-hover:text-blue-500"}`} /> 
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full font-extrabold ${state.activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Área de Contenido */}
        <div className="bg-white border-x border-b border-slate-200 rounded-b-xl p-6 min-h-[500px] shadow-sm relative">
          {state.loading && !state.solicitudes.length ? (
            <SparkleLoader />
          ) : (
            <div className="animate-in fade-in duration-300">
              {state.activeTab === "nueva" && permissions.canCreate && (
                <NuevaSolicitudTab 
                  currentUser={state.currentUser} 
                  usuarios={state.usuarios} 
                  onGuardar={handleGuardarSolicitud} 
                  onMensaje={showMessage} 
                />
              )}
              
              {state.activeTab === "pendientes" && permissions.canManage && (
                <PendientesTab 
                  solicitudes={state.solicitudes.filter(s => s.estado === 'PENDIENTE')} 
                  currentUser={state.currentUser}
                  onReload={loadInitialData}
                  onMensaje={showMessage}
                />
              )}
              
              {state.activeTab === "prestamos" && permissions.canManage && (
                <PrestamosActivosTab 
                  solicitudes={state.solicitudes.filter(s => ['PRESTADO', 'EN_PROCESO'].includes(s.estado))}
                  currentUser={state.currentUser}
                  onReload={loadInitialData}
                  onMensaje={showMessage}
                />
              )}
              
              {state.activeTab === "historial" && (
                <HistorialTab 
                  solicitudes={permissions.canManage 
                    ? state.solicitudes.filter(s => ['ATENDIDO', 'DEVUELTO', 'RECHAZADO', 'ANULADO'].includes(s.estado))
                    : state.solicitudes.filter(s => s.solicitante_id === state.currentUser?.id)
                  }
                  onMensaje={showMessage}
                />
              )}
            </div>
          )}
        </div>
      </CrudLayout>
    </>
  );
}