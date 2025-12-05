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
  UserCheck, Calendar // Nuevos iconos importados
} from "lucide-react";

// -----------------------------------------------------------------------------
// 1. SUB-COMPONENTES UI
// -----------------------------------------------------------------------------

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

const CompactMetric = ({ label, value, icon: Icon, active, onClick }) => (
  <button 
    onClick={onClick}
    disabled={!onClick}
    className={`
      flex items-center gap-3 p-3 rounded-lg border transition-all text-left flex-1
      ${active ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' : 'bg-white border-slate-200 hover:border-slate-300'}
    `}
  >
    <div className={`p-2 rounded-full ${active ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
      <Icon size={18} />
    </div>
    <div>
      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{label}</p>
      <p className="text-lg font-bold text-slate-700 leading-none">{value}</p>
    </div>
  </button>
);

const TabItem = ({ label, active, onClick, count }) => (
  <button
    onClick={onClick}
    className={`
      pb-3 px-1 text-sm font-medium transition-all relative
      ${active ? 'text-blue-700 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}
    `}
  >
    {label}
    {count > 0 && <span className="ml-2 bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">{count}</span>}
  </button>
);

// -----------------------------------------------------------------------------
// 2. COMPONENTE PRINCIPAL
// -----------------------------------------------------------------------------

export default function ServiciosArchivisticos() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ solicitudes: [], currentUser: null });
  const [mensaje, setMensaje] = useState(null);
  
  const [activeTab, setActiveTab] = useState("PENDIENTES");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize] = useState(8);

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
          `) // Se agrega relación con atendedor
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

  // --- FILTROS ---
  const permissions = useMemo(() => {
    const role = data.currentUser?.rol || '';
    return { canManage: ['Admin', 'Supervisor', 'Archivero'].includes(role) };
  }, [data.currentUser]);

  const filteredData = useMemo(() => {
    let list = data.solicitudes;

    if (!permissions.canManage) {
      list = list.filter(s => s.solicitante_id === data.currentUser?.id);
    }

    if (activeTab === 'PENDIENTES') list = list.filter(s => s.estado === 'PENDIENTE');
    else if (activeTab === 'EN_CURSO') list = list.filter(s => ['EN_PRESTAMO', 'EN_PROCESO'].includes(s.estado));
    else if (activeTab === 'HISTORIAL') list = list.filter(s => ['ATENTIDO', 'RECHAZADO', 'ANULADO', 'CANCELADO'].includes(s.estado));

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(s => 
        (s.nombre_solicitante?.toLowerCase() || "").includes(term) ||
        (s.numero_solicitud?.toString() || "").includes(term)
      );
    }
    return list;
  }, [data.solicitudes, permissions.canManage, data.currentUser, activeTab, searchTerm]);

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

  // --- COLUMNAS (Actualizadas) ---
  const columns = useMemo(() => [
    {
      label: "Solicitud", key: "info",
      render: (s) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                #{s.numero_solicitud || s.codigo_solicitud || 'S/N'}
            </span>
            <span className="text-xs text-slate-400">{new Date(s.fecha_solicitud).toLocaleDateString()}</span>
          </div>
          <div className="font-bold text-slate-700 text-sm mt-1">{s.nombre_solicitante}</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wide truncate max-w-[150px]">{s.sub_gerencia}</div>
        </div>
      )
    },
    // COLUMNA NUEVA: Atención (Reemplaza a Motivo)
    {
        label: "Atención / Entrega", key: "atencion",
        render: (s) => (
            <div className="flex flex-col gap-1 min-w-[140px]">
                {/* Quién atendió */}
                <div className="flex items-center gap-2 text-sm">
                    <UserCheck size={14} className={s.atendedor ? "text-emerald-500" : "text-slate-300"} />
                    <span className={`font-medium ${s.atendedor ? "text-slate-700" : "text-slate-400 italic"}`}>
                        {s.atendedor?.nombre_completo || "Sin asignar"}
                    </span>
                </div>
                {/* Cuándo se entregó/atendió */}
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar size={12} className={s.fecha_entrega ? "text-blue-500" : "text-slate-300"} />
                    <span>
                        {s.fecha_entrega 
                            ? new Date(s.fecha_entrega).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) 
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
      {s.estado === 'PENDIENTE' && permissions.canManage && (
        <>
          <button onClick={() => openModal('ATTEND', s)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded tooltip-trigger" title="Atender">
            <Check size={16} />
          </button>
          <button onClick={() => openModal('REJECT', s)} className="p-1.5 text-red-500 hover:bg-red-50 rounded tooltip-trigger" title="Rechazar">
            <Ban size={16} />
          </button>
        </>
      )}

      {['EN_PRESTAMO', 'EN_PROCESO'].includes(s.estado) && permissions.canManage && (
        <button onClick={() => openModal('RETURN', s)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded tooltip-trigger" title="Registrar Devolución">
          <RotateCcw size={16} />
        </button>
      )}

      <button onClick={() => openModal('DETAIL', s)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded" title="Ver Detalle">
        <Eye size={16} />
      </button>
      
      {s.estado !== 'PENDIENTE' && (
        <button onClick={() => handlePrint(s)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded" title="Imprimir Cargo">
          <Printer size={16} />
        </button>
      )}
    </div>
  ), [permissions.canManage]);

  return (
    <CrudLayout title="Servicios Archivísticos" icon={LayoutList} description="Gestión de expediente y préstamos.">
      {mensaje && <Toast {...mensaje} onClose={() => setMensaje(null)} />}
      {printData && <CargoPrestamoPDF isReady={true} {...printData} onAfterPrint={() => setPrintData(null)} />}

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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <CompactMetric 
            label="Pendientes" 
            value={data.solicitudes.filter(s => s.estado === 'PENDIENTE').length} 
            icon={Clock} 
            active={activeTab === 'PENDIENTES'} 
            onClick={() => setActiveTab('PENDIENTES')}
        />
        <CompactMetric 
            label="En Préstamo" 
            value={data.solicitudes.filter(s => ['EN_PRESTAMO', 'EN_PROCESO'].includes(s.estado)).length} 
            icon={FileText} 
            active={activeTab === 'EN_CURSO'} 
            onClick={() => setActiveTab('EN_CURSO')}
        />
        <CompactMetric 
            label="Vencidos" 
            value={data.solicitudes.filter(s => s.estado === 'EN_PRESTAMO' && new Date(s.fecha_devolucion_prevista) < new Date()).length} 
            icon={AlertCircle} 
        />
        <CompactMetric 
            label="Total Histórico" 
            value={data.solicitudes.length} 
            icon={LayoutList} 
            active={activeTab === 'TODOS'} 
            onClick={() => setActiveTab('TODOS')}
        />
      </div>

      <div className="flex gap-6 border-b border-slate-200 mb-4 px-2 overflow-x-auto no-scrollbar">
        <TabItem label="Pendientes de Atención" active={activeTab === 'PENDIENTES'} onClick={() => { setActiveTab('PENDIENTES'); setPage(0); }} count={0} />
        <TabItem label="Préstamos Activos" active={activeTab === 'EN_CURSO'} onClick={() => { setActiveTab('EN_CURSO'); setPage(0); }} count={0} />
        <TabItem label="Historial Completo" active={activeTab === 'HISTORIAL'} onClick={() => { setActiveTab('HISTORIAL'); setPage(0); }} count={0} />
        <TabItem label="Todos los Registros" active={activeTab === 'TODOS'} onClick={() => { setActiveTab('TODOS'); setPage(0); }} count={0} />
      </div>

      {loading ? <SparkleLoader /> : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[400px]">
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

      {activeModal === 'NEW' && (
        <ModalManager isOpen={true} onClose={() => setActiveModal(null)} title="Registrar Solicitud">
            <div className="p-6"><NuevaSolicitud currentUser={data.currentUser} usuarios={data.usuarios} onGuardar={async (d) => { try { await supabase.from('solicitudes_archivisticas').insert([d]); handleSuccess(); } catch { setMensaje({mensaje: "Error", tipo: "error"}); }}} onMensaje={(m, t) => setMensaje({mensaje: m, tipo: t})} /></div>
        </ModalManager>
      )}

      <ModalDetalleSolicitud isOpen={activeModal === 'DETAIL'} onClose={() => setActiveModal(null)} solicitud={selectedItem} documentos={detailDocs} loading={loadingDetails} />
      <ModalAtenderSolicitud isOpen={activeModal === 'ATTEND'} onClose={() => setActiveModal(null)} solicitud={selectedItem} currentUser={data.currentUser} onSuccess={handleSuccess} onMensaje={(m, t) => setMensaje({mensaje: m, tipo: t})} />
      <ModalRechazarSolicitud isOpen={activeModal === 'REJECT'} onClose={() => setActiveModal(null)} solicitud={selectedItem} currentUser={data.currentUser} onSuccess={handleSuccess} onMensaje={(m, t) => setMensaje({mensaje: m, tipo: t})} />
      <ModalDevolucionSolicitud isOpen={activeModal === 'RETURN'} onClose={() => setActiveModal(null)} solicitud={selectedItem} currentUser={data.currentUser} onSuccess={handleSuccess} onMensaje={(m, t) => setMensaje({mensaje: m, tipo: t})} />

    </CrudLayout>
  );
}