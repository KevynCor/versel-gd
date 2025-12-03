import React, { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../../utils/supabaseClient";

// --- 1. UI COMPONENTS ---
import { CrudLayout } from "../../components/layout/CrudLayout";
import { Toast } from "../../components/ui/Toast";
import { StatCard } from "../../components/ui/StatCard";
import { DataTable } from "../../components/data/DataTable";
import { Pagination } from "../../components/data/Pagination";

// --- 2. MODULES & ICONS ---
import { EstadoBadge} from "./components/Shared";
import CargoPrestamoPDF from './components/CargoPrestamoPDF';
import NuevaSolicitud from "./components/ModalNuevaSolicitud";
import ModalDetalleSolicitud from "./components/ModalDetalleSolicitud";
import ModalAtenderSolicitud from "./components/ModalAtenderSolicitud";
import ModalRechazarSolicitud from "./components/ModalRechazarSolicitud";
import ModalDevolucionSolicitud from "./components/ModalDevolucionSolicitud";

import { FileText, Plus, Clock, AlertTriangle, FileCheck, ClipboardCheck, X, Search, Filter, RefreshCw, Eye, Printer, ChevronDown, Check, Ban, RotateCcw
} from "lucide-react";

// Modal Genérico Wrapper
const ModalWrapper = ({ isOpen, onClose, title, icon: Icon, children, size = "xl" }) => {
  if (!isOpen) return null;
  const sizes = { md: "max-w-2xl", lg: "max-w-4xl", xl: "max-w-6xl" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`bg-white rounded-xl shadow-2xl w-full ${sizes[size] || sizes.xl} max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200 border border-slate-100`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
          <div className="flex items-center gap-3">
            {Icon && <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm"><Icon size={20} className="text-blue-600"/></div>}
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
            <X size={20} />
          </button>
        </div>
        <div className="p-0 overflow-y-auto bg-slate-50/30 flex-1 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// PÁGINA PRINCIPAL: DASHBOARD
// ==========================================

export default function ServiciosArchivisticos() {
  // --- STATE ---
  const [state, setState] = useState({
    loading: true,
    refreshing: false,
    mensaje: null,
    currentUser: null,
    solicitudes: [],
    modalOpen: null, // 'NEW'|'PENDING_LIST'|'LOANS_LIST'|'DETAIL'|'ATTEND'|'REJECT'|'RETURN'
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [page, setPage] = useState(0); 
  const [pageSize, setPageSize] = useState(10);
  
  // State para detalle y PDF
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [detailDocs, setDetailDocs] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [printData, setPrintData] = useState(null);

  // --- DATA FETCHING ---
  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setState(s => ({ ...s, refreshing: true }));
      else setState(s => ({ ...s, loading: true }));

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const [userData, requestsData] = await Promise.all([
        supabase.from("usuarios").select("*").eq("email", user.email).single(),
        supabase.from("solicitudes_archivisticas")
          .select(`*, solicitante:solicitante_id(nombre_completo, sub_gerencia)`)
          .order("fecha_solicitud", { ascending: false })
      ]);

      if (userData.error) throw userData.error;
      
      setState(s => ({
        ...s,
        loading: false,
        refreshing: false,
        currentUser: userData.data,
        solicitudes: requestsData.data || []
      }));

    } catch (error) {
      console.error(error);
      setState(s => ({ ...s, loading: false, mensaje: { mensaje: "Error cargando datos", tipo: "error" } }));
    }
  }, []);

  const fetchFullDetails = useCallback(async (solicitudId) => {
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
        setState(s => ({ ...s, mensaje: { mensaje: "Error al cargar detalles", tipo: "error" } }));
        return [];
    } finally {
        setLoadingDetails(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { setPage(0); }, [searchTerm, statusFilter, pageSize]);

  // --- ACTIONS ---
  const showMessage = (msg, tipo) => setState(s => ({ ...s, mensaje: { mensaje: msg, tipo } }));
  const handleReload = () => loadData(true);
  
  // Handler Genérico para abrir acciones
  const handleAction = async (actionType, solicitud) => {
    setSelectedSolicitud(solicitud);
    setState(s => ({ ...s, modalOpen: actionType }));
    
    // Si es detalle, precargamos documentos
    if (actionType === 'DETAIL') {
        const docs = await fetchFullDetails(solicitud.id);
        setDetailDocs(docs);
    }
  };

  const handlePrint = useCallback(async (solicitud) => {
    const docs = await fetchFullDetails(solicitud.id);
    if (docs.length > 0) setPrintData({ solicitud, documentos: docs });
    else showMessage("Sin documentos para imprimir", "warning");
  }, [fetchFullDetails]);

  // --- FILTROS Y MÉTRICAS POR ROL ---
  const permissions = useMemo(() => {
    const role = state.currentUser?.rol || '';
    return { canManage: ['Admin', 'Supervisor', 'Archivero'].includes(role) };
  }, [state.currentUser]);

  const filteredSolicitudes = useMemo(() => {
    let data = state.solicitudes;
    // Filtro estricto por rol para la tabla
    if (!permissions.canManage) {
        data = data.filter(s => s.solicitante_id === state.currentUser?.id);
    }
    return data.filter(item => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = 
            (item.nombre_solicitante?.toLowerCase() || "").includes(term) ||
            (item.motivo_solicitud?.toLowerCase() || "").includes(term) ||
            (item.numero_solicitud?.toString() || "").includes(term) ||
            (item.codigo_solicitud?.toLowerCase() || "").includes(term);

        const matchesStatus = statusFilter === "TODOS" || item.estado === statusFilter;
        return matchesSearch && matchesStatus;
    });
  }, [state.solicitudes, searchTerm, statusFilter, permissions.canManage, state.currentUser]);

  const currentItems = filteredSolicitudes.slice(page * pageSize, (page + 1) * pageSize);
  
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(state.solicitudes.map(s => s.estado).filter(Boolean));
    return ["TODOS", ...Array.from(statuses)];
  }, [state.solicitudes]);

  // AJUSTE: Métricas basadas en la lista filtrada por rol (baseList)
  const metrics = useMemo(() => {
    const list = state.solicitudes;
    // Si es Admin, ve todo. Si es Usuario, solo lo suyo.
    const baseList = permissions.canManage ? list : list.filter(s => s.solicitante_id === state.currentUser?.id);
    
    return {
      total: baseList.length,
      pendientes: baseList.filter(s => s.estado === 'PENDIENTE').length,
      activos: baseList.filter(s => ['PRESTADO', 'EN_PROCESO'].includes(s.estado)).length,
      vencidos: baseList.filter(s => s.estado === 'PRESTADO' && new Date(s.fecha_devolucion_prevista) < new Date()).length
    };
  }, [state.solicitudes, permissions.canManage, state.currentUser]);

  // --- COLUMNAS DATATABLE ---
  const columns = useMemo(() => [
    {
        label: "Código", key: "codigo", sortValue: (sol) => sol.numero_solicitud,
        render: (sol) => (
            <span className="text-xs font-mono font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md inline-block w-fit">
                {sol.numero_solicitud || sol.codigo_solicitud || 'S/N'}
            </span>
        )
    },
    {
        label: "Solicitante", key: "solicitante", sortValue: (sol) => sol.nombre_solicitante,
        render: (sol) => (
            <div className="min-w-[180px]">
                <div className="font-bold text-slate-700 text-sm">{sol.nombre_solicitante}</div>
                <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[180px]">{sol.sub_gerencia}</div>
            </div>
        )
    },
    {
        label: "Motivo / Fecha", key: "contexto", sortValue: (sol) => sol.fecha_solicitud,
        render: (sol) => (
            <div className="min-w-[200px]">
                <div className="text-sm text-slate-600 line-clamp-1 mb-1" title={sol.motivo_solicitud}>{sol.motivo_solicitud}</div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Clock size={12} /> {new Date(sol.fecha_solicitud).toLocaleDateString()}
                </div>
            </div>
        )
    },
    {
        label: "Estado", key: "estado", sortValue: (sol) => sol.estado,
        render: (sol) => (<div className="w-32 flex justify-center"><EstadoBadge estado={sol.estado} /></div>)
    }
  ], []);

  // AJUSTE: Renderizado de Acciones condicionales por Estado y Rol
  const renderActions = useCallback((sol) => (
    <div className="flex items-center justify-end gap-1">
        
        {/* CASO 1: PENDIENTE (Solo Admin puede gestionar) */}
        {sol.estado === 'PENDIENTE' && permissions.canManage && (
            <>
                <button onClick={() => handleAction('ATTEND', sol)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Atender Solicitud">
                    <Check size={18} />
                </button>
                <button onClick={() => handleAction('REJECT', sol)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Rechazar Solicitud">
                    <Ban size={18} />
                </button>
            </>
        )}

        {/* CASO 2: PRÉSTAMO ACTIVO (Solo Admin puede devolver) */}
        {(sol.estado === 'PRESTADO' || sol.estado === 'EN_PROCESO') && permissions.canManage && (
            <button onClick={() => handleAction('RETURN', sol)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Registrar Devolución">
                <RotateCcw size={18} />
            </button>
        )}

        {/* CASO GENERAL: Ver Detalle (Para todos) */}
        <button onClick={() => handleAction('DETAIL', sol)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Ver Detalles">
            <Eye size={18} />
        </button>

        {/* CASO GENERAL: Imprimir (Si no es pendiente) */}
        {sol.estado !== 'PENDIENTE' && (
            <button onClick={() => handlePrint(sol)} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors" title="Imprimir Cargo">
                <Printer size={18} />
            </button>
        )}
    </div>
  ), [permissions.canManage, handlePrint]);

  // --- RENDER ---
  return (
    <CrudLayout title="Servicios Archivísticos" icon={ClipboardCheck} description="Gestión centralizada de expedientes, préstamos y consultas.">
      {state.mensaje && <Toast {...state.mensaje} onClose={() => setState(s => ({ ...s, mensaje: null }))} />}
      {printData && <CargoPrestamoPDF isReady={true} solicitud={printData.solicitud} documentos={printData.documentos} onAfterPrint={() => setPrintData(null)} />}

      {/* MÉTRICAS (Datos filtrados por rol automáticamente en useMemo) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <StatCard title={permissions.canManage ? "Total Solicitudes" : "Mis Solicitudes"} value={metrics.total} icon={FileText} color="blue" />
        <StatCard 
            title="Por Atender" 
            value={metrics.pendientes} 
            icon={Clock} 
            color="amber" 
            onClick={permissions.canManage ? () => setState(s => ({...s, modalOpen: 'PENDING_LIST'})) : undefined} 
            className={permissions.canManage ? "cursor-pointer hover:ring-2 ring-amber-100 transition-all" : ""} 
        />
        <StatCard 
            title="Préstamos Activos" 
            value={metrics.activos} 
            icon={FileCheck} 
            color="emerald" 
            onClick={permissions.canManage ? () => setState(s => ({...s, modalOpen: 'LOANS_LIST'})) : undefined} 
            className={permissions.canManage ? "cursor-pointer hover:ring-2 ring-emerald-100 transition-all" : ""} 
        />
        <StatCard title="Vencidos" value={metrics.vencidos} icon={AlertTriangle} color="red" />
      </div>

      {/* DASHBOARD CONTENT */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        
        {/* TOOLBAR */}
        <div className="p-5 border-b border-slate-100 bg-white flex flex-col lg:flex-row gap-4 justify-between items-center">
          {/* Filters */}
          <div className="flex items-center gap-3 w-full lg:w-auto flex-1">
            <div className="relative w-full lg:w-96 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
              <input type="text" placeholder="Buscar por código, solicitante o motivo..." className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="relative sm:w-48 hidden sm:block">
                <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select className="w-full pl-9 pr-8 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none appearance-none cursor-pointer" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    {uniqueStatuses.map(s => (<option key={s} value={s}>{s === "TODOS" ? "Todos los estados" : s.replace('_', ' ')}</option>))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
            </div>
          </div>

          {/* Actions (Globales) */}
          <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
            <button onClick={handleReload} disabled={state.refreshing} className={`p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all ${state.refreshing ? 'animate-spin' : ''}`} title="Actualizar datos"><RefreshCw size={18} /></button>
            <button onClick={() => setState(s => ({...s, modalOpen: 'NEW'}))} className="flex items-center gap-2 px-5 py-2.5 bg-blue-700 text-white hover:bg-blue-800 rounded-lg shadow-md hover:shadow-lg transition-all text-sm font-bold transform active:scale-95">
              <Plus size={18} /> <span className="hidden sm:inline">Nueva Solicitud</span>
            </button>
          </div>
        </div>

        {/* INFO BAR & TABLE */}
        <div className="px-6 py-3 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center text-xs text-slate-500">
          <span className="font-medium">Mostrando <strong className="text-slate-800">{filteredSolicitudes.length}</strong> registros</span>
          <span>Última actualización: {new Date().toLocaleTimeString()}</span>
        </div>
        <div className="flex-1 overflow-hidden flex flex-col">
            <div className="overflow-x-auto flex-1 w-full">
                 <DataTable 
                    columns={columns} 
                    data={currentItems} 
                    renderActions={renderActions} 
                    emptyMessage={state.solicitudes.length === 0 ? "El historial está vacío." : "No se encontraron coincidencias."} 
                 />
            </div>
            {filteredSolicitudes.length > 0 && (
                <div className="border-t border-slate-100 bg-white p-2">
                    <Pagination page={page} total={filteredSolicitudes.length} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(0); }} />
                </div>
            )}
        </div>
      </div>

      {/* ========================================== */}
      {/* GESTIÓN DE MODALES                         */}
      {/* ========================================== */}

      {/* 1. Modal Creación */}
      <ModalWrapper isOpen={state.modalOpen === 'NEW'} onClose={() => setState(s => ({ ...s, modalOpen: null }))} title="Registrar Nueva Solicitud" icon={Plus}>
        <div className="p-6"><NuevaSolicitud currentUser={state.currentUser} onGuardar={() => { setState(s => ({ ...s, modalOpen: null })); handleReload(); }} onMensaje={showMessage} /></div>
      </ModalWrapper>

      {/* 3. Modales de Acción Específica (Desde Tabla) */}
      
      {/* Ver Detalle */}
      <ModalDetalleSolicitud 
        isOpen={state.modalOpen === 'DETAIL'}
        onClose={() => { setState(s => ({...s, modalOpen: null})); setSelectedSolicitud(null); }}
        solicitud={selectedSolicitud}
        documentos={detailDocs}
        loading={loadingDetails}
      />

      {/* Atender (Admin) */}
      <ModalAtenderSolicitud 
        isOpen={state.modalOpen === 'ATTEND'}
        onClose={() => { setState(s => ({...s, modalOpen: null})); setSelectedSolicitud(null); }}
        solicitud={selectedSolicitud}
        currentUser={state.currentUser}
        onSuccess={handleReload}
        onMensaje={showMessage}
      />

      {/* Rechazar (Admin) */}
      <ModalRechazarSolicitud 
        isOpen={state.modalOpen === 'REJECT'}
        onClose={() => { setState(s => ({...s, modalOpen: null})); setSelectedSolicitud(null); }}
        solicitud={selectedSolicitud}
        currentUser={state.currentUser}
        onSuccess={handleReload}
        onMensaje={showMessage}
      />

      {/* Devolver (Admin) */}
      <ModalDevolucionSolicitud 
        isOpen={state.modalOpen === 'RETURN'}
        onClose={() => { setState(s => ({...s, modalOpen: null})); setSelectedSolicitud(null); }}
        solicitud={selectedSolicitud}
        currentUser={state.currentUser}
        onSuccess={handleReload}
        onMensaje={showMessage}
      />

    </CrudLayout>
  );
}