import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { supabase } from "../../utils/supabaseClient";
import { CrudLayout } from "../../components/layout/CrudLayout";
import { Toast } from "../../components/ui/Toast";
import { SparkleLoader } from "../../components/ui/SparkleLoader";
import { StatCard } from "../../components/ui/StatCard";
import { FileText, Plus, Clock, AlertTriangle, Download, FileCheck, Printer, X, BarChart3, LayoutGrid, List } from "lucide-react";
import { useReactToPrint } from 'react-to-print';

// Importamos los componentes de las pestañas
import NuevaSolicitudTab from "./components/NuevaSolicitudTab";
import PendientesTab from "./components/PendientesTab";
import PrestamosActivosTab from "./components/PrestamosActivosTab";
import HistorialTab from "./components/HistorialTab";

// --- Componentes UI Reutilizables Internos ---

// Modal con Estilo Corporativo y Responsivo
export const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
  if (!isOpen) return null;
  
  const sizeClasses = { 
    sm: "max-w-md", 
    md: "max-w-2xl", 
    lg: "max-w-4xl", 
    xl: "max-w-6xl" 
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-900/75 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      <div className={`relative bg-white w-full ${sizeClasses[size]} rounded-xl shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col animate-fadeIn`}>
        {/* Header del Modal */}
        <div className="sticky top-0 bg-slate-50 border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4 rounded-t-xl flex items-center justify-between z-10">
          <h3 className="text-base sm:text-lg font-extrabold text-slate-800 tracking-tight line-clamp-1">
            {title}
          </h3>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Contenido Scrollable */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

// Badge de Estado Normalizado
export const EstadoBadge = ({ estado }) => {
  const styles = {
    Pendiente: "bg-amber-50 text-amber-700 border-amber-200",
    Aprobado: "bg-blue-50 text-blue-700 border-blue-200",
    Entregado: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Devuelto: "bg-slate-100 text-slate-600 border-slate-200",
    Vencido: "bg-red-50 text-red-700 border-red-200",
    Rechazado: "bg-red-50 text-red-700 border-red-200",
    Parcial: "bg-yellow-50 text-yellow-700 border-yellow-200",
    Cancelado: "bg-gray-100 text-gray-500 border-gray-200"
  };

  return (
    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border uppercase tracking-wide ${styles[estado] || styles.Pendiente}`}>
      {estado?.replace('_', ' ')}
    </span>
  );
};

// Componente para el PDF
const ReportePDF = React.forwardRef(({ solicitud, documentos }, ref) => {
    const getModalidadTexto = (modalidad) => {
        const modalidades = { prestamo_original: "Préstamo de Original", copia_simple: "Copia Simple", copia_certificada: "Copia Certificada", consulta_sala: "Consulta en Sala" };
        return modalidades[modalidad] || modalidad;
    };
    const formatUbicacion = (doc) => doc.ubicacion_topografica || (doc.info ? `E${doc.info.Estante || ''}-C${doc.info.Cuerpo || ''}-B${doc.info.Balda || ''}` : 'Sin ubicación');

    return (
        <div ref={ref} className="p-10 bg-white w-full text-sm font-serif text-black">
            <div className="text-center mb-8 border-b-2 border-black pb-4">
                <h1 className="text-2xl font-bold uppercase tracking-wider">Electro Sur Este S.A.A.</h1>
                <h2 className="text-base text-gray-600 mt-1">Unidad de Archivo Central - Comprobante de Atención</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="border border-gray-300 p-4 rounded">
                    <h3 className="font-bold border-b border-gray-300 mb-3 pb-1 uppercase text-xs">Datos del Solicitante</h3>
                    <div className="space-y-1">
                        <p><span className="font-bold">Nombre:</span> {solicitud.nombre_solicitante}</p>
                        <p><span className="font-bold">Área/Oficina:</span> {solicitud.sub_gerencia}</p>
                        <p><span className="font-bold">Email:</span> {solicitud.email}</p>
                    </div>
                </div>
                <div className="border border-gray-300 p-4 rounded">
                    <h3 className="font-bold border-b border-gray-300 mb-3 pb-1 uppercase text-xs">Detalle de la Solicitud</h3>
                    <div className="space-y-1">
                        <p><span className="font-bold">N° Ticket:</span> {solicitud.numero_solicitud || solicitud.id.slice(0, 8)}</p>
                        <p><span className="font-bold">Fecha:</span> {new Date(solicitud.fecha_solicitud).toLocaleDateString()} {new Date(solicitud.fecha_solicitud).toLocaleTimeString()}</p>
                        <p><span className="font-bold">Modalidad:</span> {getModalidadTexto(solicitud.modalidad_servicio)}</p>
                    </div>
                </div>
            </div>
            
            <div className="mb-8">
                <h3 className="font-bold mb-2 uppercase text-xs border-b border-black pb-1">Documentos Solicitados</h3>
                <table className="w-full border-collapse border border-gray-300 text-xs">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="border border-gray-300 p-2 text-left">Código</th>
                            <th className="border border-gray-300 p-2 text-left">Descripción del Documento</th>
                            <th className="border border-gray-300 p-2 text-center">Ubicación Topográfica</th>
                        </tr>
                    </thead>
                    <tbody>
                        {documentos.map((d, i) => (
                            <tr key={i}>
                                <td className="border border-gray-300 p-2 font-mono">{d.documento_id}</td>
                                <td className="border border-gray-300 p-2">{d.descripcion}</td>
                                <td className="border border-gray-300 p-2 text-center">{formatUbicacion(d)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div className="mt-16 grid grid-cols-2 gap-16 text-center">
                 <div className="flex flex-col items-center">
                    <div className="h-20 w-full flex items-end justify-center mb-2">
                        {solicitud.firma_solicitante_solicitud && <img src={solicitud.firma_solicitante_solicitud} className="h-16 object-contain" alt="Firma" />}
                    </div>
                    <div className="border-t border-black w-3/4 pt-2 font-bold text-xs">Firma del Solicitante</div>
                 </div>
                 <div className="flex flex-col items-center">
                    <div className="h-20 w-full flex items-end justify-center mb-2">
                        {solicitud.firma_archivo_central && <img src={solicitud.firma_archivo_central} className="h-16 object-contain" alt="Firma" />}
                    </div>
                    <div className="border-t border-black w-3/4 pt-2 font-bold text-xs">Visto Bueno Archivo Central</div>
                 </div>
            </div>
            
            <div className="absolute bottom-10 left-0 w-full text-center text-[10px] text-gray-400">
                Generado automáticamente por el Sistema de Gestión Documental - DocuFlow
            </div>
        </div>
    );
});
ReportePDF.displayName = 'ReportePDF';

// --- Componente Principal ---

export default function ServiciosArchivisticos() {
  const [activeTab, setActiveTab] = useState("nueva");
  const [solicitudes, setSolicitudes] = useState([]);
  const [documentosInventario, setDocumentosInventario] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Estado para impresión PDF
  const [selectedSolicitudPrint, setSelectedSolicitudPrint] = useState(null);
  const [docsPrint, setDocsPrint] = useState([]);
  const [isPrintReady, setIsPrintReady] = useState(false);
  const reporteRef = useRef();

  // --- LÓGICA DE ROLES MEJORADA ---

  // 1. Roles que pueden GESTIONAR (Ver pendientes, préstamos y todo el historial)
  // Incluye: Admin, Supervisor, Archivero
  const canManage = useMemo(() => {
      if (!currentUser) return false;
      const managementRoles = ['Admin', 'Supervisor', 'Archivero']; 
      return managementRoles.includes(currentUser.rol);
  }, [currentUser]);

  // 2. Roles que pueden CREAR solicitudes (Ver pestaña "Nueva Solicitud")
  // Incluye: Admin, Supervisor, Usuario. EXCLUYE: Archivero (según requerimiento)
  const canCreate = useMemo(() => {
      if (!currentUser) return false;
      const creatorRoles = ['Admin', 'Supervisor', 'Usuario'];
      return creatorRoles.includes(currentUser.rol);
  }, [currentUser]);


  // --- REDIRECCIÓN DE SEGURIDAD ---
  // Si un rol entra a una pestaña que no le corresponde, lo movemos
  useEffect(() => {
      if (!currentUser) return;

      // CASO 1: Archivero entra por defecto a 'nueva' -> lo mandamos a 'pendientes'
      if (!canCreate && activeTab === 'nueva') {
          if (canManage) setActiveTab('pendientes');
          else setActiveTab('historial');
      }

      // CASO 2: Usuario intenta entrar a 'pendientes' o 'prestamos' -> lo mandamos a 'nueva'
      if (!canManage && ['pendientes', 'prestamos'].includes(activeTab)) {
          setActiveTab('nueva');
      }
  }, [currentUser, canCreate, canManage, activeTab]);

  const mostrarMensaje = useCallback((msg, tipo) => setMensaje({ mensaje: msg, tipo }), []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [solicitudesRes, inventarioRes, userRes] = await Promise.all([
        supabase.from("vista_solicitudes_completa").select("*").order("fecha_solicitud", { ascending: false }),
        supabase.from("Inventario_documental").select("*").order("Descripcion"),
        supabase.auth.getUser()
      ]);

      if (solicitudesRes.error) throw solicitudesRes.error;
      setSolicitudes(solicitudesRes.data || []);
      setDocumentosInventario(inventarioRes.data || []);

      if (userRes.data.user) {
          const { data: userData } = await supabase.from("usuarios").select("*").eq("email", userRes.data.user.email).single();
          setCurrentUser(userData);
      }
      
      const { data: usersData } = await supabase.from("usuarios").select("*");
      setUsuarios(usersData || []);

    } catch (error) {
      mostrarMensaje("Error cargando datos: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  const handlePrint = useReactToPrint({
    contentRef: reporteRef,
    documentTitle: `Solicitud_${selectedSolicitudPrint?.id}`,
    onAfterPrint: () => setIsPrintReady(false),
  });

  const imprimirSolicitud = async (solicitud) => {
    try {
        const { data: docs } = await supabase.from("solicitudes_documentos").select("*").eq("solicitud_id", solicitud.id);
        const docsWithInfo = docs.map(d => ({ ...d, info: documentosInventario.find(inv => inv.id === d.documento_id) }));
        setSelectedSolicitudPrint(solicitud);
        setDocsPrint(docsWithInfo);
        setIsPrintReady(true);
        setTimeout(() => handlePrint(), 500);
    } catch (e) { mostrarMensaje("Error al preparar impresión", "error"); }
  };

  const guardarSolicitud = async ({ formData }) => {
    try {
        setLoading(true);
        const { error } = await supabase.from("solicitudes_archivisticas").insert({
            ...formData,
            solicitante_id: currentUser.id,
            created_by: currentUser.id,
            estado: 'Pendiente'
        });

        if (error) throw error;

        mostrarMensaje("Solicitud creada correctamente.", "success");
        cargarDatos();
        
        // Redirección post-guardado inteligente
        if (canManage) {
             setActiveTab("pendientes");
        } else {
             setActiveTab("historial");
        }
        
    } catch (error) {
        mostrarMensaje(error.message, "error");
    } finally {
        setLoading(false);
    }
  };

  // Definir tabs disponibles dinámicamente según permisos
  const tabs = [
    // Nueva Solicitud: Solo Admin, Supervisor, Usuario
    ...(canCreate ? [{ id: "nueva", label: "Nueva Solicitud", icon: Plus }] : []),
    
    // Pendientes y Préstamos: Solo Admin, Supervisor, Archivero
    ...(canManage ? [
        { id: "pendientes", label: `Pendientes`, count: solicitudes.filter(s => s.estado === "Pendiente").length, icon: Clock },
        { id: "prestamos", label: "Préstamos Activos", icon: FileCheck }
    ] : []),
    
    // Historial: Disponible para TODOS
    { id: "historial", label: "Historial", icon: Download }
  ];

  return (
    <>
      {mensaje && <Toast {...mensaje} onClose={() => setMensaje(null)} />}
      
      {/* Contenedor Oculto para Impresión */}
      <div style={{ display: "none" }}>
        <div ref={reporteRef}>
            {selectedSolicitudPrint && <ReportePDF solicitud={selectedSolicitudPrint} documentos={docsPrint} />}
        </div>
      </div>

      <CrudLayout 
        title="Servicios Archivísticos" 
        icon={FileText}
        description="Gestión integral de solicitudes, préstamos y consultas documentales."
      >
        {/* Panel de Estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard 
                title="Mis Solicitudes" 
                // Todos ven sus propias solicitudes, pero Staff ve el total global si lo desea (aquí simplificamos a 'mis solicitudes' para el usuario base)
                value={solicitudes.filter(s => s.solicitante_id === currentUser?.id).length} 
                icon={FileText} 
                color="indigo" 
            />
            {/* Solo mostramos métricas de gestión a quienes pueden gestionar */}
            {canManage && (
                <>
                    <StatCard 
                        title="Pendientes Atención" 
                        value={solicitudes.filter(s => s.estado === 'Pendiente').length} 
                        icon={Clock} 
                        color="yellow" 
                    />
                    <StatCard 
                        title="Préstamos Activos" 
                        value={solicitudes.filter(s => ['Entregado', 'Parcial'].includes(s.estado)).length} 
                        icon={FileCheck} 
                        color="green" 
                    />
                    <StatCard 
                        title="Préstamos Vencidos" 
                        value={solicitudes.filter(s => ['Entregado', 'Parcial'].includes(s.estado) && new Date(s.fecha_devolucion_prevista) < new Date()).length} 
                        icon={AlertTriangle} 
                        color="red" 
                    />
                </>
            )}
        </div>

        {/* --- NAVEGACIÓN --- */}
        <div className="mb-6">
            {/* VISTA MÓVIL */}
            <div className="grid grid-cols-2 gap-2 sm:hidden">
                {tabs.map(tab => (
                    <button 
                        key={tab.id} 
                        onClick={() => setActiveTab(tab.id)} 
                        className={`
                            flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200
                            ${activeTab === tab.id 
                                ? "bg-blue-700 text-white border-blue-800 shadow-md transform scale-[1.02]" 
                                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                            }
                        `}
                    >
                        <div className={`p-1.5 rounded-full mb-1 ${activeTab === tab.id ? "bg-white/20" : "bg-slate-100"}`}>
                            <tab.icon size={20} className={activeTab === tab.id ? "text-white" : "text-slate-500"} />
                        </div>
                        <span className="text-xs font-bold">{tab.label}</span>
                        {tab.count !== undefined && tab.count > 0 && (
                            <span className={`mt-1 text-[10px] px-1.5 rounded-full font-bold ${activeTab === tab.id ? "bg-white text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* VISTA DESKTOP */}
            <div className="hidden sm:flex border-b border-slate-200 bg-white rounded-t-xl px-2 pt-2 shadow-sm overflow-x-auto">
                {tabs.map(tab => (
                    <button 
                        key={tab.id} 
                        onClick={() => setActiveTab(tab.id)} 
                        className={`
                            flex items-center gap-2 px-6 py-3.5 text-sm font-bold transition-all relative rounded-t-lg whitespace-nowrap group
                            ${activeTab === tab.id 
                                ? "text-blue-700 bg-blue-50/50 border-b-2 border-blue-700" 
                                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 border-b-2 border-transparent"
                            }
                        `}
                    >
                        <tab.icon size={18} className={`transition-colors ${activeTab === tab.id ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"}`} /> 
                        {tab.label}
                        {tab.count !== undefined && tab.count > 0 && (
                            <span className="ml-1.5 bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-full font-extrabold">
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>
        </div>

        {/* Contenido de las Pestañas */}
        {loading ? (
            <SparkleLoader />
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl sm:rounded-tr-xl sm:rounded-b-xl shadow-sm p-4 sm:p-6 min-h-[400px]">
            <div className="animate-fadeIn">
                {/* 1. NUEVA SOLICITUD */}
                {activeTab === "nueva" && canCreate && (
                    <NuevaSolicitudTab 
                        currentUser={currentUser} 
                        usuarios={usuarios} 
                        onGuardar={guardarSolicitud} 
                        onMensaje={mostrarMensaje} 
                    />
                )}

                {/* 2. PENDIENTES */}
                {activeTab === "pendientes" && canManage && (
                    <PendientesTab 
                        solicitudes={solicitudes.filter(s => s.estado === 'Pendiente')} 
                        currentUser={currentUser}
                        documentosInventario={documentosInventario}
                        onReload={cargarDatos}
                        onMensaje={mostrarMensaje}
                        onImprimir={imprimirSolicitud}
                    />
                )}

                {/* 3. PRESTAMOS */}
                {activeTab === "prestamos" && canManage && (
                    <PrestamosActivosTab 
                        solicitudes={solicitudes.filter(s => ['Entregado', 'Parcial'].includes(s.estado))}
                        currentUser={currentUser}
                        documentosInventario={documentosInventario} 
                        onReload={cargarDatos}
                        onMensaje={mostrarMensaje}
                        onImprimir={imprimirSolicitud}
                    />
                )}

                {/* 4. HISTORIAL */}
                {activeTab === "historial" && (
                    <HistorialTab 
                        solicitudes={
                            // LÓGICA DE FILTRADO DE DATOS (REQUERIMIENTO CLAVE)
                            canManage
                                // Si es GESTOR (Admin/Archivero): Ve historial general (finalizados), no necesita ver sus propias solicitudes activas aquí porque las ve en los otros tabs.
                                ? solicitudes.filter(s => ['Devuelto', 'Rechazado', 'Cancelado'].includes(s.estado))
                                // Si es USUARIO: Ve TODO su historial personal, sin importar el estado.
                                : solicitudes.filter(s => s.solicitante_id === currentUser?.id)
                        }
                        onImprimir={imprimirSolicitud}
                    />
                )}
            </div>
          </div>
        )}
      </CrudLayout>
    </>
  );
}