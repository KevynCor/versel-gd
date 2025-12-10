import React, { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../../utils/supabaseClient";

// --- UI & LAYOUT ---
import { CrudLayout } from "../../components/layout/CrudLayout";
import { Toast } from "../../components/ui/Toast";
import { DataTable } from "../../components/data/DataTable";
import { Pagination } from "../../components/data/Pagination";
import { SearchBar } from "../../components/controls/SearchBar";
import { SparkleLoader } from "../../components/ui/SparkleLoader";
import { EstadoBadge } from "../../components/data/Shared";

// --- MODALES ---
import CargoPrestamoPDF from './components/CargoPrestamoPDF';
import NuevaSolicitud from "./components/ModalNuevaSolicitud";
import ModalDetalleSolicitud from "./components/ModalDetalleSolicitud";
import ModalAtenderSolicitud from "./components/ModalAtenderSolicitud";
import ModalRechazarSolicitud from "./components/ModalRechazarSolicitud";
import ModalDevolucionSolicitud from "./components/ModalDevolucionSolicitud";

// --- ICONOS ---
import { 
  Plus, Check, Ban, RotateCcw, Eye, Printer, 
  FileText, Clock, AlertCircle, X, LayoutList,
  UserCheck, Calendar, ArrowRightLeft, CheckCircle2
} from "lucide-react";

// -----------------------------------------------------------------------------
// 1. SUB-COMPONENTES UI (Minimalistas & Reutilizables)
// -----------------------------------------------------------------------------

// Wrapper de Modal Genérico
const ModalManager = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200 border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition-colors"><X size={20} /></button>
        </div>
        <div className="p-0 overflow-y-auto bg-slate-50/30 flex-1 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

// Tarjeta de Métrica Interactiva
const MetricCard = ({ label, value, icon: Icon, active, onClick, colorClass }) => (
  <button 
    onClick={onClick}
    className={`
      flex items-center gap-4 p-4 rounded-xl border transition-all text-left w-full
      ${active ? 'bg-white border-blue-300 ring-2 ring-blue-100 shadow-md transform scale-[1.02]' : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'}
    `}
  >
    <div className={`p-3 rounded-full ${colorClass} bg-opacity-10`}>
      <Icon size={24} className={colorClass.replace("bg-", "text-").replace("10", "600")} />
    </div>
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-slate-800 leading-none mt-1">{value}</p>
    </div>
  </button>
);

// -----------------------------------------------------------------------------
// 2. COMPONENTE PRINCIPAL
// -----------------------------------------------------------------------------

export default function ServiciosArchivisticos() {
  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ solicitudes: [], currentUser: null });
  const [mensaje, setMensaje] = useState(null);
  
  // UX Filters
  const [filterStatus, setFilterStatus] = useState("TODOS"); // 'PENDIENTE', 'ACTIVOS', 'TODOS'
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize] = useState(8);

  // Modals & Actions
  const [activeModal, setActiveModal] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailDocs, setDetailDocs] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [printData, setPrintData] = useState(null);

  // --- DATA LOADING ---
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const [userData, requestsResult, allUsersResult] = await Promise.all([
        supabase.from("usuarios").select("*").eq("email", user.email).single(),
        supabase.from("solicitudes_archivisticas")
          .select(`
            *, 
            solicitante:solicitante_id(nombre_completo, sub_gerencia),
            atendedor:atendido_por_id(nombre_completo) 
          `)
          .order("fecha_solicitud", { ascending: false }),
        supabase.from("usuarios").select("*")
      ]);

      setData({
        currentUser: userData.data,
        solicitudes: requestsResult.data || [],
        usuarios: allUsersResult.data || []
      });
    } catch (error) {
      console.error(error);
      setMensaje({ mensaje: "Error cargando datos", tipo: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDetails = async (id) => {
    setLoadingDetails(true);
    try {
        const { data } = await supabase.from("solicitudes_documentos").select(`*, idoc:Inventario_documental!documento_id (Numero_Caja, Serie_Documental, Descripcion)`).eq("solicitud_id", id);
        setDetailDocs(data || []);
    } catch (e) { console.error(e); } 
    finally { setLoadingDetails(false); }
  };

  useEffect(() => { loadData(); }, [loadData]);

  // --- FILTERS & METRICS ---
  const permissions = useMemo(() => {
    const role = data.currentUser?.rol || '';
    return { canManage: ['Admin', 'Supervisor', 'Archivero'].includes(role) };
  }, [data.currentUser]);

  const filteredData = useMemo(() => {
    let list = data.solicitudes;

    if (!permissions.canManage) {
      list = list.filter(s => s.solicitante_id === data.currentUser?.id);
    }

    if (filterStatus === 'PENDIENTE') list = list.filter(s => s.estado === 'PENDIENTE');
    else if (filterStatus === 'ACTIVOS') list = list.filter(s => ['EN_PRESTAMO', 'EN_PROCESO'].includes(s.estado));
    // 'TODOS' incluye historial y cancelados

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(s => 
        (s.nombre_solicitante?.toLowerCase() || "").includes(term) ||
        (s.numero_solicitud?.toString() || "").includes(term)
      );
    }
    return list;
  }, [data.solicitudes, permissions.canManage, data.currentUser, filterStatus, searchTerm]);

  const metrics = useMemo(() => {
    const baseList = permissions.canManage ? data.solicitudes : data.solicitudes.filter(s => s.solicitante_id === data.currentUser?.id);
    return {
      total: baseList.length,
      pendientes: baseList.filter(s => s.estado === 'PENDIENTE').length,
      activos: baseList.filter(s => ['EN_PRESTAMO', 'EN_PROCESO'].includes(s.estado)).length,
      vencidos: baseList.filter(s => s.estado === 'EN_PRESTAMO' && new Date(s.fecha_devolucion_prevista) < new Date()).length
    }
  }, [data.solicitudes, permissions.canManage, data.currentUser]);

  // --- HANDLERS ---
  const openModal = async (type, item = null) => {
    setSelectedItem(item);
    setActiveModal(type);
    if (type === 'DETAIL' && item) fetchDetails(item.id);
  };

  const handlePrint = async (solicitud) => {
    const { data: docs } = await supabase.from("solicitudes_documentos").select(`*, idoc:Inventario_documental!documento_id (*)`).eq("solicitud_id", solicitud.id);
    if (docs?.length) setPrintData({ solicitud, documentos: docs });
    else setMensaje({ mensaje: "Sin documentos para imprimir", tipo: "warning" });
  };

  const handleSuccess = () => {
    loadData();
    setActiveModal(null);
    setMensaje({ mensaje: "Operación realizada con éxito", tipo: "success" });
  };

  // --- COLUMNAS TABLA ---
  const columns = useMemo(() => [
    {
      label: "Solicitud", key: "info",
      render: (s) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                #{s.numero_solicitud || s.codigo_solicitud || 'S/N'}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock size={10}/> {new Date(s.fecha_solicitud).toLocaleDateString()}
            </span>
          </div>
          <div className="font-bold text-slate-700 text-sm mt-1">{s.nombre_solicitante}</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wide truncate max-w-[150px]">{s.sub_gerencia}</div>
        </div>
      )
    },
    {
        label: "Atención / Entrega", key: "atencion",
        render: (s) => (
            <div className="flex flex-col gap-1 min-w-[140px]">
                <div className="flex items-center gap-2 text-sm">
                    <UserCheck size={14} className={s.atendedor ? "text-emerald-500" : "text-slate-300"} />
                    <span className={`font-medium ${s.atendedor ? "text-slate-700" : "text-slate-400 italic"}`}>
                        {s.atendedor?.nombre_completo || "Sin asignar"}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar size={12} className={s.fecha_atencion ? "text-blue-500" : "text-slate-300"} />
                    <span>
                        {s.fecha_atencion 
                            ? new Date(s.fecha_atencion).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) 
                            : "--/--"}
                    </span>
                </div>
            </div>
        )
    },
    { label: "Estado", key: "estado", render: (s) => <EstadoBadge estado={s.estado} /> },
  ], []);

  const renderActions = useCallback((s) => (
    <div className="flex justify-end gap-1">
      {/* Botones de acción condicionales */}
      {s.estado === 'PENDIENTE' && permissions.canManage && (
        <>
          <button onClick={() => openModal('ATTEND', s)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors tooltip" title="Atender">
            <Check size={18} />
          </button>
          <button onClick={() => openModal('REJECT', s)} className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors tooltip" title="Rechazar">
            <Ban size={18} />
          </button>
        </>
      )}

      {['EN_PRESTAMO', 'EN_PROCESO'].includes(s.estado) && permissions.canManage && (
        <button onClick={() => openModal('RETURN', s)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors tooltip" title="Registrar Devolución">
          <RotateCcw size={18} />
        </button>
      )}

      <button onClick={() => openModal('DETAIL', s)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors tooltip" title="Ver Detalle">
        <Eye size={18} />
      </button>
      
      {s.estado !== 'PENDIENTE' && (
        <button onClick={() => handlePrint(s)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors tooltip" title="Imprimir Cargo">
          <Printer size={18} />
        </button>
      )}
    </div>
  ), [permissions.canManage]);

  return (
    <CrudLayout title="Servicios Archivísticos" icon={LayoutList} description="Gestión de expediente y préstamos.">
      {mensaje && <Toast {...mensaje} onClose={() => setMensaje(null)} />}
      {printData && <CargoPrestamoPDF isReady={true} {...printData} onAfterPrint={() => setPrintData(null)} />}

      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
            <h2 className="text-xl font-bold text-slate-800">Panel de Solicitudes</h2>
            <p className="text-sm text-slate-500">Administra los requerimientos documentales.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
            <div className="flex-1 sm:w-64">
                <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Buscar solicitud..." />
            </div>
            <button 
                onClick={() => openModal('NEW')} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm transition-all active:scale-95"
            >
                <Plus size={16} /> <span className="hidden sm:inline">Nueva Solicitud</span>
            </button>
        </div>
      </div>

      {/* 2. Metrics Grid (Funcionan como Filtros Rápidos) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard 
            label="Pendientes" 
            value={metrics.pendientes} 
            icon={Clock} 
            active={filterStatus === 'PENDIENTE'} 
            onClick={() => { setFilterStatus('PENDIENTE'); setPage(0); }}
            colorClass="bg-amber-100 text-amber-600"
        />
        <MetricCard 
            label="En Préstamo" 
            value={metrics.activos} 
            icon={ArrowRightLeft} 
            active={filterStatus === 'ACTIVOS'} 
            onClick={() => { setFilterStatus('ACTIVOS'); setPage(0); }}
            colorClass="bg-blue-100 text-blue-600"
        />
        <MetricCard 
            label="Vencidos" 
            value={metrics.vencidos} 
            icon={AlertCircle} 
            active={false}
            onClick={() => {}} // Informativo
            colorClass="bg-red-100 text-red-600"
        />
        <MetricCard 
            label="Total Histórico" 
            value={metrics.total} 
            icon={CheckCircle2} 
            active={filterStatus === 'TODOS'} 
            onClick={() => { setFilterStatus('TODOS'); setPage(0); }}
            colorClass="bg-slate-100 text-slate-600"
        />
      </div>

      {/* 3. Main Content: Table */}
      {loading ? <SparkleLoader /> : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[400px]">
            <div className="px-6 py-3 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center text-xs text-slate-500">
                <span className="font-medium">
                    {filterStatus === 'TODOS' ? 'Todas las solicitudes' : filterStatus === 'PENDIENTE' ? 'Solicitudes Pendientes' : 'Solicitudes Activas'}
                </span>
                <span className="font-mono">Total: {filteredData.length}</span>
            </div>

            <div className="flex-1 overflow-x-auto">
                <DataTable 
                    columns={columns} 
                    data={filteredData.slice(page * pageSize, (page + 1) * pageSize)} 
                    renderActions={renderActions}
                    emptyMessage="No hay solicitudes en esta categoría."
                />
            </div>
            
            {filteredData.length > 0 && (
                <div className="p-3 border-t border-slate-100 bg-slate-50">
                    <Pagination 
                        page={page} 
                        total={filteredData.length} 
                        pageSize={pageSize} 
                        onPageChange={setPage} 
                    />
                </div>
            )}
        </div>
      )}

      {/* --- MODALES --- */}
      
      {activeModal === 'NEW' && (
        <ModalManager isOpen={true} onClose={() => setActiveModal(null)} title="Registrar Solicitud">
            <div className="p-6">
                <NuevaSolicitud 
                    currentUser={data.currentUser} 
                    usuarios={data.usuarios} 
                    onGuardar={async (d) => { 
                        try { await supabase.from('solicitudes_archivisticas').insert([d]); handleSuccess(); } 
                        catch { setMensaje({mensaje: "Error al guardar", tipo: "error"}); }
                    }} 
                    onMensaje={(m, t) => setMensaje({mensaje: m, tipo: t})} 
                />
            </div>
        </ModalManager>
      )}

      <ModalDetalleSolicitud isOpen={activeModal === 'DETAIL'} onClose={() => setActiveModal(null)} solicitud={selectedItem} documentos={detailDocs} loading={loadingDetails} />
      <ModalAtenderSolicitud isOpen={activeModal === 'ATTEND'} onClose={() => setActiveModal(null)} solicitud={selectedItem} currentUser={data.currentUser} onSuccess={handleSuccess} onMensaje={(m, t) => setMensaje({mensaje: m, tipo: t})} />
      <ModalRechazarSolicitud isOpen={activeModal === 'REJECT'} onClose={() => setActiveModal(null)} solicitud={selectedItem} currentUser={data.currentUser} onSuccess={handleSuccess} onMensaje={(m, t) => setMensaje({mensaje: m, tipo: t})} />
      <ModalDevolucionSolicitud isOpen={activeModal === 'RETURN'} onClose={() => setActiveModal(null)} solicitud={selectedItem} currentUser={data.currentUser} onSuccess={handleSuccess} onMensaje={(m, t) => setMensaje({mensaje: m, tipo: t})} />

    </CrudLayout>
  );
}