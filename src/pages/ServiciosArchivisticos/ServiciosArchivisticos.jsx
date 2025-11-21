import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { supabase } from "../../utils/supabaseClient";
import { CrudLayout } from "../../components/layout/CrudLayout";
import { Toast } from "../../components/ui/Toast";
import { SparkleLoader } from "../../components/ui/SparkleLoader";
import { StatCard } from "../../components/ui/StatCard";
import { FileText, Plus, Clock, AlertTriangle, Download, FileCheck, Printer, X } from "lucide-react";
import { useReactToPrint } from 'react-to-print';

// Importamos los componentes de las pestañas
import NuevaSolicitudTab from "./components/NuevaSolicitudTab";
import PendientesTab from "./components/PendientesTab";
import PrestamosActivosTab from "./components/PrestamosActivosTab";
import HistorialTab from "./components/HistorialTab";

// --- Componentes UI Reutilizables ---

export const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
  if (!isOpen) return null;
  const sizeClasses = { sm: "max-w-md", md: "max-w-2xl", lg: "max-w-4xl", xl: "max-w-6xl" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white w-full ${sizeClasses[size]} rounded-2xl shadow-2xl border max-h-[90vh] overflow-y-auto`}>
        <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export const EstadoBadge = ({ estado }) => {
  const badges = {
    pendiente: "bg-amber-100 text-amber-800 border-amber-300",
    aprobada: "bg-blue-100 text-blue-800 border-blue-300",
    entregada: "bg-emerald-100 text-emerald-800 border-emerald-300",
    devuelta: "bg-gray-100 text-gray-800 border-gray-300",
    vencida: "bg-red-100 text-red-800 border-red-300",
    rechazada: "bg-red-100 text-red-800 border-red-300",
    devolucion_parcial: "bg-yellow-100 text-yellow-800 border-yellow-300",
    cancelado: "bg-gray-100 text-gray-800 border-gray-300"
  };
  return <span className={`px-3 py-1 text-xs font-medium rounded-full border uppercase ${badges[estado] || badges.pendiente}`}>{estado}</span>;
};

// Componente para el PDF (Interno)
const ReportePDF = React.forwardRef(({ solicitud, documentos }, ref) => {
    const getModalidadTexto = (modalidad) => {
        const modalidades = { prestamo_original: "Préstamo de Original", copia_simple: "Copia Simple", copia_certificada: "Copia Certificada", consulta_sala: "Consulta en Sala" };
        return modalidades[modalidad] || modalidad;
    };
    const formatUbicacion = (doc) => doc.ubicacion_topografica || (doc.info ? `E${doc.info.Estante || ''}-C${doc.info.Cuerpo || ''}-B${doc.info.Balda || ''}` : 'Sin ubicación');

    return (
        <div ref={ref} className="p-8 bg-white w-full text-sm">
            <div className="text-center mb-6 border-b-2 border-gray-800 pb-2">
                <h1 className="text-xl font-bold">Electro Sur Este S.A.A.</h1>
                <h2 className="text-lg text-gray-600">Servicios Archivísticos - Comprobante</h2>
            </div>
            <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="border p-3 rounded bg-gray-50">
                    <h3 className="font-bold border-b mb-2">Solicitante</h3>
                    <p><strong>Nombre:</strong> {solicitud.nombre_solicitante}</p>
                    <p><strong>Área:</strong> {solicitud.sub_gerencia}</p>
                    <p><strong>Email:</strong> {solicitud.email}</p>
                </div>
                <div className="border p-3 rounded bg-gray-50">
                    <h3 className="font-bold border-b mb-2">Solicitud</h3>
                    <p><strong>N°:</strong> {solicitud.id}</p>
                    <p><strong>Fecha:</strong> {new Date(solicitud.fecha_solicitud).toLocaleDateString()}</p>
                    <p><strong>Modalidad:</strong> {getModalidadTexto(solicitud.modalidad_servicio)}</p>
                </div>
            </div>
            <div className="mb-6">
                <h3 className="font-bold mb-2">Documentos</h3>
                <table className="w-full border-collapse border text-xs">
                    <thead><tr className="bg-gray-100"><th className="border p-1">Código</th><th className="border p-1">Descripción</th><th className="border p-1">Ubicación</th></tr></thead>
                    <tbody>
                        {documentos.map((d, i) => (
                            <tr key={i}><td className="border p-1">{d.documento_id}</td><td className="border p-1">{d.descripcion}</td><td className="border p-1">{formatUbicacion(d)}</td></tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-12 text-center">
                 <div>{solicitud.firma_solicitante_solicitud && <img src={solicitud.firma_solicitante_solicitud} className="h-16 mx-auto object-contain" alt="Firma" />}<div className="border-t border-gray-400 mt-2">Firma Solicitante</div></div>
                 <div>{solicitud.firma_archivo_central && <img src={solicitud.firma_archivo_central} className="h-16 mx-auto object-contain" alt="Firma" />}<div className="border-t border-gray-400 mt-2">Firma Archivo Central</div></div>
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

  const canCreateRequest = useMemo(() => {
      if (!currentUser) return false;
      const allowedRoles = ['usuario', 'admin', 'archivo_central'];
      return allowedRoles.includes(currentUser.rol);
  }, [currentUser]);

  useEffect(() => {
      if (currentUser && !canCreateRequest && activeTab === 'nueva') {
          setActiveTab('pendientes');
      }
  }, [currentUser, canCreateRequest, activeTab]);

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
            estado: 'pendiente'
        });

        if (error) throw error;

        mostrarMensaje("Solicitud creada correctamente. Pase a la pestaña 'Pendientes' para la atención.", "success");
        cargarDatos();
        setActiveTab("pendientes");
    } catch (error) {
        mostrarMensaje(error.message, "error");
    } finally {
        setLoading(false);
    }
  };

  const tabs = [
    ...(canCreateRequest ? [{ id: "nueva", label: "Nueva Solicitud", icon: Plus }] : []),
    { id: "pendientes", label: `Pendientes (${solicitudes.filter(s => s.estado === "pendiente").length})`, icon: Clock },
    { id: "prestamos", label: "Préstamos Activos", icon: FileCheck },
    { id: "historial", label: "Historial", icon: Download }
  ];

  return (
    <>
      {mensaje && <Toast {...mensaje} onClose={() => setMensaje(null)} />}
      <div style={{ display: "none" }}>
        <div ref={reporteRef}>
            {selectedSolicitudPrint && <ReportePDF solicitud={selectedSolicitudPrint} documentos={docsPrint} />}
        </div>
      </div>

      <CrudLayout title="Servicios Archivísticos" icon={FileText}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard title="Total Solicitudes" value={solicitudes.length} icon={FileText} color="from-blue-500 to-indigo-600" />
            <StatCard title="Pendientes" value={solicitudes.filter(s => s.estado === 'pendiente').length} icon={Clock} color="from-amber-500 to-orange-600" />
            <StatCard title="Activos" value={solicitudes.filter(s => ['entregada', 'devolucion parcial'].includes(s.estado)).length} icon={FileCheck} color="from-green-500 to-emerald-600" />
            <StatCard title="Vencidos" value={solicitudes.filter(s => ['entregada', 'devolucion parcial'].includes(s.estado) && new Date(s.fecha_devolucion_prevista) < new Date()).length} icon={AlertTriangle} color="from-red-500 to-rose-600" />
        </div>

        <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} 
                className={`flex items-center gap-2 px-6 py-3 font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id ? "border-indigo-600 text-indigo-700 bg-indigo-50" : "border-transparent text-gray-600 hover:text-gray-800"}`}>
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </div>

        {loading ? <div className="py-12"><SparkleLoader /></div> : (
          <>
            {activeTab === "nueva" && canCreateRequest && (
                <NuevaSolicitudTab 
                    currentUser={currentUser} 
                    usuarios={usuarios} 
                    onGuardar={guardarSolicitud} 
                    onMensaje={mostrarMensaje} 
                />
            )}
            {activeTab === "pendientes" && (
                <PendientesTab 
                    solicitudes={solicitudes.filter(s => s.estado === 'pendiente')} 
                    currentUser={currentUser}
                    documentosInventario={documentosInventario} // <-- CORRECCIÓN AQUÍ: Se pasa la prop necesaria
                    onReload={cargarDatos}
                    onMensaje={mostrarMensaje}
                    onImprimir={imprimirSolicitud}
                />
            )}
            {activeTab === "prestamos" && (
                <PrestamosActivosTab 
                    solicitudes={solicitudes.filter(s => ['entregada', 'devolucion parcial'].includes(s.estado))}
                    currentUser={currentUser}
                    documentosInventario={documentosInventario} 
                    onReload={cargarDatos}
                    onMensaje={mostrarMensaje}
                    onImprimir={imprimirSolicitud}
                />
            )}
            {activeTab === "historial" && (
                <HistorialTab 
                    solicitudes={solicitudes.filter(s => ['devuelta', 'rechazada', 'cancelado'].includes(s.estado))}
                    onImprimir={imprimirSolicitud}
                />
            )}
          </>
        )}
      </CrudLayout>
    </>
  );
}