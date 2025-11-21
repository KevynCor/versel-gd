import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { supabase } from "../../utils/supabaseClient";
import { CrudLayout } from "../../components/layout/CrudLayout";
import { Toast } from "../../components/ui/Toast";
import { SparkleLoader } from "../../components/ui/SparkleLoader";
import { StatCard } from "../../components/ui/StatCard";
import { InputField } from "../../components/ui/InputField";
import { TextareaField } from "../../components/ui/TextareaField";
import { FileText, Plus, Clock, AlertTriangle, Download, FileCheck, Eye, Edit3, RotateCcw, Printer, X, CheckSquare, Square } from "lucide-react";
import { useReactToPrint } from 'react-to-print';
import { DigitalSignature } from "../../components/ui/DigitalSignature";
import SolicitudServiciosArchivisticos from "../ServiciosArchivisticos/components/SolicitudServiciosArchivisticos";

const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
  if (!isOpen) return null;
  
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl"
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white w-full ${sizeClasses[size]} rounded-2xl shadow-2xl border max-h-[90vh] overflow-y-auto`}>
        <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-800">{title}</h3>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

const DevolucionDocumentoItem = ({ doc, onToggle, onUpdateObservacion }) => (
  <div className={`border rounded-lg p-4 ${doc.devuelto ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
    <div className="flex items-start gap-3">
      <button
        onClick={() => onToggle(doc.id)}
        className={`p-1 rounded mt-1 ${doc.devuelto ? 'text-green-600 bg-green-100' : 'text-gray-400 bg-white border'}`}
      >
        {doc.devuelto ? <CheckSquare size={20} /> : <Square size={20} />}
      </button>
      <div className="flex-1">
        <h4 className="font-medium text-gray-800">{doc.documento_id}: {doc.descripcion}</h4>
        <p className="text-sm text-gray-600">
          Unidad: {doc.unidad || 'N/A'} • 
          Serie: {doc.serie || 'N/A'}
        </p>
        <p className="text-xs text-gray-500">
           Caja: {doc.caja || 'N/A'} • Ubicación: {doc.ubicacion_topografica || 
            (doc.info ? `E${doc.info.Estante || ''}-C${doc.info.Cuerpo || ''}-B${doc.info.Balda || ''}` : 'Sin ubicación')}
        </p>
        {doc.devuelto && (
          <div className="mt-3">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Observaciones de Devolución</label>
            <textarea
              value={doc.observaciones_devolucion || ''}
              onChange={(e) => onUpdateObservacion(doc.id, e.target.value)}
              placeholder="Observaciones sobre la devolución..."
              rows="2"
              className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            />
          </div>
        )}
      </div>
    </div>
  </div>
);

const ReportePDF = React.forwardRef(({ solicitud, documentos }, ref) => {
  const getModalidadTexto = (modalidad) => {
    const modalidades = {
      prestamo_original: "Préstamo de Original",
      copia_simple: "Copia Simple",
      copia_certificada: "Copia Certificada",
      consulta_sala: "Consulta en Sala"
    };
    return modalidades[modalidad] || modalidad;
  };

  const formatUbicacion = (doc) => {
    if (doc.ubicacion_topografica) return doc.ubicacion_topografica;
    if (doc.info) {
      return `E${doc.info.Estante || ''}-C${doc.info.Cuerpo || ''}-B${doc.info.Balda || ''}`;
    }
    return 'Sin ubicación';
  };

  return (
    <div ref={ref} className="p-4 bg-white max-w-none w-full">
      {/* Header Section */}
      <div className="text-center">
        <h1 className="text-xl font-bold text-gray-800 mb-1">Electro Sur Este S.A.A.</h1>
        <h2 className="text-lg text-gray-600 mb-2">Servicios Archivísticos</h2>
        <div className="border-t-2 border-b-2 border-gray-400 py-1">
          <h3 className="text-base font-semibold">COMPROBANTE DE SOLICITUD</h3>
        </div>
      </div>

      {/* Main Information Grid - 3 columns for better space utilization */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Solicitante Info */}
        <div className="border rounded-lg p-3 bg-gray-50">
          <h4 className="font-semibold text-gray-700 mb-2 text-sm border-b pb-1">Información del Solicitante</h4>
          <div className="space-y-1 text-xs">
            <p><span className="font-medium">Nombre:</span> {solicitud.nombre_solicitante}</p>
            <p><span className="font-medium">Email:</span> {solicitud.email}</p>
            <p><span className="font-medium">Teléfono:</span> {solicitud.movil || 'No especificado'}</p>
            <p><span className="font-medium">Sub Gerencia:</span> {solicitud.sub_gerencia}</p>
            <p><span className="font-medium">Área/Depto:</span> {solicitud.area_departamento || 'No especificado'}</p>
            <p><span className="font-medium">Entidad:</span> {solicitud.entidad}</p>
          </div>
        </div>

        {/* Detalles de Solicitud */}
        <div className="border rounded-lg p-3 bg-gray-50">
          <h4 className="font-semibold text-gray-700 mb-2 text-sm border-b pb-1">Detalles de la Solicitud</h4>
          <div className="space-y-1 text-xs">
            <p><span className="font-medium">N° Solicitud:</span> {solicitud.id}</p>
            <p><span className="font-medium">Fecha:</span> {new Date(solicitud.fecha_solicitud).toLocaleDateString('es-PE')}</p>
            <p><span className="font-medium">Hora:</span> {new Date(solicitud.fecha_solicitud).toLocaleTimeString('es-PE')}</p>
            <p><span className="font-medium">Estado:</span> <span className="uppercase font-bold text-xs">{solicitud.estado}</span></p>
            <p><span className="font-medium">Modalidad:</span> {getModalidadTexto(solicitud.modalidad_servicio)}</p>
            {solicitud.fecha_entrega && (
              <p><span className="font-medium">F. Entrega:</span> {new Date(solicitud.fecha_entrega).toLocaleDateString('es-PE')}</p>
            )}
            {solicitud.fecha_devolucion_prevista && (
              <p><span className="font-medium">F. Devolución:</span> {new Date(solicitud.fecha_devolucion_prevista).toLocaleDateString('es-PE')}</p>
            )}
          </div>
        </div>

        {/* Motivo - Third column */}
        <div className="border rounded-lg p-3 bg-gray-50">
          <h4 className="font-semibold text-gray-700 mb-2 text-sm border-b pb-1">Motivo de la Solicitud</h4>
          <p className="text-xs p-2 bg-white rounded border leading-relaxed">{solicitud.motivo_solicitud}</p>
        </div>
      </div>

      {/* Documents Table - Full width optimization */}
      <div className="mb-4">
        <h4 className="font-semibold text-gray-700 mb-2 text-sm border-b pb-1">Documentos Solicitados</h4>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-xs border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left py-2 px-2 border-b font-semibold w-8">N°</th>
                <th className="text-left py-2 px-2 border-b font-semibold w-16">Código</th>
                <th className="text-left py-2 px-2 border-b font-semibold">Descripción</th>
                <th className="text-left py-2 px-2 border-b font-semibold w-24">Unidad Orgánica</th>
                <th className="text-left py-2 px-2 border-b font-semibold w-12">Caja</th>                
                <th className="text-left py-2 px-2 border-b font-semibold w-20">Ubicación</th>
              </tr>
            </thead>
            <tbody>
              {documentos.map((doc, index) => (
                <tr key={doc.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="py-2 px-2 border-b text-center">{index + 1}</td>
                  <td className="py-2 px-2 border-b">{doc.documento_id || 'N/A'}</td>
                  <td className="py-2 px-2 border-b leading-tight">{doc.descripcion}</td>
                  <td className="py-2 px-2 border-b text-xs">{doc.unidad || 'N/A'}</td>
                  <td className="py-2 px-2 border-b text-center">{doc.caja || 'N/A'}</td>                  
                  <td className="py-2 px-2 border-b text-xs">{formatUbicacion(doc)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status-specific Information - Conditional rendering with better layout */}
      {solicitud.estado === "devuelta" && solicitud.fecha_devolucion_real && (
        <div className="mb-4 border rounded-lg p-3 bg-red-50">
          <h4 className="font-semibold text-gray-700 mb-2 text-sm border-b pb-1">Información de Devolución</h4>
          <div className="text-xs grid grid-cols-3 gap-4">
            <p><span className="font-medium">Fecha Devolución:</span> {new Date(solicitud.fecha_devolucion_real).toLocaleDateString('es-PE')}</p>
            <p><span className="font-medium">Hora:</span> {new Date(solicitud.fecha_devolucion_real).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</p>
            {solicitud.observaciones_devolucion && (
              <p><span className="font-medium">Observaciones:</span> {solicitud.observaciones_devolucion}</p>
            )}
          </div>
        </div>
      )}

      {solicitud.estado === "entregada" && (
        <div className="mb-4 border rounded-lg p-3 bg-yellow-50">
          <h4 className="font-semibold text-gray-700 mb-2 text-sm border-b pb-1">Información de Entrega</h4>
          <div className="text-xs grid grid-cols-2 gap-4">
            <p><span className="font-medium">Fecha Entrega:</span> {solicitud.fecha_entrega ? new Date(solicitud.fecha_entrega).toLocaleDateString('es-PE') : 'No registrada'}</p>
            {solicitud.fecha_devolucion_prevista && (
              <p><span className="font-medium">Límite Devolución:</span> {new Date(solicitud.fecha_devolucion_prevista).toLocaleDateString('es-PE')}</p>
            )}
          </div>
        </div>
      )}

      {/* Signatures Section - Horizontal layout optimized */}
      <div className="mt-6 pt-4 border-t-2 border-gray-300">
        <div className="grid grid-cols-2 gap-8">
          <div className="text-center">
            <p className="font-medium mb-2 text-sm">Firma del Solicitante</p>
            {solicitud.firma_solicitante_solicitud ? (
              <div className="mb-2 h-12 flex items-center justify-center">
                <img 
                  src={solicitud.firma_solicitante_solicitud} 
                  alt="Firma del solicitante" 
                  className="h-12 max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="h-0.5 bg-gray-400 w-32 mx-auto my-3"></div>
            )}
            <p className="text-xs font-semibold">{solicitud.nombre_solicitante}</p>
            <p className="text-xs text-gray-500">Solicitante</p>
            <p className="text-xs mt-1">{solicitud.fecha_firma_solicitante ? new Date(solicitud.fecha_firma_solicitante).toLocaleDateString('es-PE') : ''}</p>
          </div>
          
          <div className="text-center">
            <p className="font-medium mb-2 text-sm">Firma del Responsable</p>
            {solicitud.firma_responsable_entrega ? (
              <div className="mb-2 h-12 flex items-center justify-center">
                <img 
                  src={solicitud.firma_responsable_entrega} 
                  alt="Firma del responsable" 
                  className="h-12 max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="h-0.5 bg-gray-400 w-32 mx-auto my-3"></div>
            )}
            <p className="text-xs font-semibold">Archivo Central</p>
            <p className="text-xs text-gray-500">Electro Sur Este S.A.A.</p>
            <p className="text-xs mt-1">{solicitud.fecha_firma_responsable ? new Date(solicitud.fecha_firma_responsable).toLocaleDateString('es-PE') : ''}</p>
          </div>
        </div>
      </div>

      {/* Footer - Compact */}
      <div className="text-center mt-4 pt-2 border-t border-gray-300 text-xs text-gray-500">
        <p>Documento generado el {new Date().toLocaleDateString('es-PE', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        })} a las {new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</p>
        <p className="mt-1">Sistema de Gestión Archivística - Electro Sur Este S.A.A.</p>
      </div>
    </div>
  );
});

ReportePDF.displayName = 'ReportePDF';

const PrintableContent = React.forwardRef(({ solicitud, documentos }, ref) => {
  if (!solicitud || !documentos || documentos.length === 0) {
    return null;
  }

  return (
    <div ref={ref} className="p-8 bg-white">
      <ReportePDF solicitud={solicitud} documentos={documentos} />
    </div>
  );
});
PrintableContent.displayName = 'PrintableContent';

const EstadoBadge = ({ estado }) => {
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
  
  return (
    <span className={`px-3 py-1 text-xs font-medium rounded-full border uppercase ${badges[estado] || badges.pendiente}`}>
      {estado}
    </span>
  );
};

export default function ServiciosArchivisticos() {
  const [activeTab, setActiveTab] = useState("nueva");
  const [solicitudes, setSolicitudes] = useState([]);
  const [documentosInventario, setDocumentosInventario] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showView, setShowView] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showDevolucion, setShowDevolucion] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [viewDocs, setViewDocs] = useState([]);
  const [editForm, setEditForm] = useState({
    motivo_solicitud: "",
    estado: "pendiente",
    fecha_devolucion_prevista: ""
  });
  const [documentosDevolucion, setDocumentosDevolucion] = useState([]);
  const [firmaDevolucion, setFirmaDevolucion] = useState(null);
  const [observacionesDevolucion, setObservacionesDevolucion] = useState("");
  const [isPrintReady, setIsPrintReady] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  
  // Referencia corregida para react-to-print
  const reporteRef = useRef();
  
  // Configuración de impresión - VERSIÓN CORREGIDA
  const handlePrint = useReactToPrint({
    contentRef: reporteRef,
    documentTitle: `Solicitud_Archivistica_${selectedSolicitud?.id || 'documento'}`,
    pageStyle: `
      @page { 
        size: A4; 
        margin: 0.5in; 
      }
      body { font-family: Arial, sans-serif; }
    `,
    onAfterPrint: () => {
      console.log("Impresión completada");
      setIsPrintReady(false);
    },
  });

  const imprimirSolicitud = async (solicitud) => {
    try {
      console.log('Iniciando proceso de impresión para solicitud:', solicitud.id);
      
      // Cargamos los documentos si no están disponibles
      let docsParaImprimir = viewDocs;
      
      if (!viewDocs || viewDocs.length === 0 || selectedSolicitud?.id !== solicitud.id) {
        const { data: docs, error } = await supabase
          .from("solicitudes_documentos")
          .select("*, devoluciones:devoluciones_documentos(*)")
          .eq("solicitud_id", solicitud.id)
          .order("numero_orden", { ascending: true });
        
        if (error) throw error;
        
        docsParaImprimir = (docs || []).map(d => ({
          ...d,
          info: documentosInventario.find(x => x.id === d.documento_id) || null,
          devuelto: d.devoluciones && d.devoluciones.length > 0
        }));
        
        // Actualizar el estado
        setViewDocs(docsParaImprimir);
      }
      
      // Establecer la solicitud seleccionada
      setSelectedSolicitud(solicitud);
      setIsPrintReady(true);
      
      // Esperar a que React actualice y luego imprimir
      setTimeout(() => {
        if (reporteRef.current && docsParaImprimir.length > 0) {
          console.log('Referencia encontrada, iniciando impresión...');
          handlePrint();
        } else {
          console.error('No se encontró la referencia para imprimir');
          mostrarMensaje("No se pudo generar el PDF. Intente nuevamente.", "error");
          setIsPrintReady(false);
        }
      }, 500);
      
    } catch (error) {
      console.error('Error al imprimir:', error);
      mostrarMensaje("Error al generar PDF: " + error.message, "error");
      setIsPrintReady(false);
    }
  };

  useEffect(() => {
    const initData = async () => {
      await Promise.all([cargarDatos(), obtenerUsuarioActual(), cargarUsuarios()]);
    };
    initData();
  }, []);

  const obtenerUsuarioActual = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from("usuarios")
          .select("*")
          .eq("email", user.email)
          .single();

        if (error) {
          console.error("Error buscando usuario:", error);
          return;
        }

        if (data) {
          setCurrentUser(data);
        }
      }
    } catch (error) {
      console.error("Error obteniendo usuario:", error);
    }
  };

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [solicitudesRes, inventarioRes] = await Promise.all([
        supabase.from("vista_solicitudes_completa").select("*").order("fecha_solicitud", { ascending: false }),
        supabase.from("Inventario_documental").select("*").order("Descripcion")
      ]);
      if (solicitudesRes.error) throw solicitudesRes.error;
      if (inventarioRes.error) throw inventarioRes.error;
      setSolicitudes(solicitudesRes.data || []);
      setDocumentosInventario(inventarioRes.data || []);
    } catch (error) {
      mostrarMensaje("Error cargando datos: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Agrega la función para cargar usuarios
  const cargarUsuarios = async () => {
    try {
      const { data, error } = await supabase.from("usuarios").select("*").order("nombre_completo");
      if (error) throw error;
      setUsuarios(data || []);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
      mostrarMensaje("Error cargando usuarios: " + error.message, "error");
    }
  };

  const mostrarMensaje = useCallback((mensaje, tipo) => {
    setMensaje({ mensaje, tipo });
  }, []);

  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  };

  const guardarSolicitud = async ({ formData, documentosSeleccionados, firmaTemp }) => {
    try {
      const { nombre_solicitante, email, motivo_solicitud } = formData;
      if (!nombre_solicitante || !email || !motivo_solicitud) {
        mostrarMensaje("Complete los campos obligatorios", "error");
        return;
      }
      if (documentosSeleccionados.length === 0) {
        mostrarMensaje("Debe seleccionar al menos un documento", "error");
        return;
      }
      if (!firmaTemp) {
        mostrarMensaje("Debe proporcionar su firma digital", "error");
        return;
      }
      setLoading(true);
      const { data: solicitud, error: errorSolicitud } = await supabase
        .from("solicitudes_archivisticas")
        .insert({
          ...formData,
          fecha_devolucion_prevista: formData.fecha_devolucion_prevista || null,
          solicitante_id: currentUser?.id,
          created_by: currentUser?.id,
          firma_solicitante_solicitud: firmaTemp,
          fecha_firma_solicitante: new Date().toISOString(),
          estado: 'pendiente'
        })
        .select()
        .single();
      if (errorSolicitud) throw errorSolicitud;
      const documentosData = documentosSeleccionados.map(doc => ({
        solicitud_id: solicitud.id,
        documento_id: doc.id,
        descripcion: doc.Descripcion,
        serie: doc.Serie_Documental,
        caja: doc.Numero_Caja,
        numero_orden: doc.numero_orden,
        unidad: doc.Unidad_Organica,
        ubicacion_topografica: doc.ubicacion_topografica,
        observaciones_documento: doc.observaciones_documento
      }));
      const { error: errorDocumentos } = await supabase.from("solicitudes_documentos").insert(documentosData);
      if (errorDocumentos) throw errorDocumentos;
      mostrarMensaje("Solicitud creada exitosamente", "success");
      await cargarDatos();
      setActiveTab("pendientes");
    } catch (error) {
      mostrarMensaje("Error al crear solicitud: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const verSolicitud = async (solicitud) => {
    try {
      setSelectedSolicitud(solicitud);
      const { data: docs, error } = await supabase
        .from("solicitudes_documentos")
        .select("*, devoluciones:devoluciones_documentos(*)")
        .eq("solicitud_id", solicitud.id)
        .order("numero_orden", { ascending: true });
      
      if (error) throw error;
      
      const enriquecidos = (docs || []).map(d => ({
        ...d,
        info: documentosInventario.find(x => x.id === d.documento_id) || null,
        devuelto: d.devoluciones && d.devoluciones.length > 0
      }));
      
      setViewDocs(enriquecidos);
      setShowView(true);
    } catch (error) {
      mostrarMensaje("No se pudo cargar el detalle: " + error.message, "error");
    }
  };

  const abrirDevolucion = async (solicitud) => {
    try {
      setSelectedSolicitud(solicitud);
      const { data: docs, error } = await supabase
        .from("solicitudes_documentos")
        .select("*, devoluciones:devoluciones_documentos(*)")
        .eq("solicitud_id", solicitud.id)
        .order("numero_orden", { ascending: true });

      if (error) throw error;

      const documentosConInfo = (docs || []).map(d => {
        const info = documentosInventario.find(x => x.id === d.documento_id) || null;
        const devuelto = d.devoluciones && d.devoluciones.length > 0;
        return {
          ...d,
          info,
          devuelto,
          observaciones_devolucion: devuelto ? d.devoluciones[0].observaciones : ""
        };
      });

      setDocumentosDevolucion(documentosConInfo);
      setFirmaDevolucion(null);
      setObservacionesDevolucion("");
      setShowDevolucion(true);
    } catch (error) {
      mostrarMensaje("Error al cargar documentos para devolución: " + error.message, "error");
    }
  };

  const toggleDevolucionDocumento = (docId) => {
    setDocumentosDevolucion(prev => prev.map(doc => 
      doc.id === docId ? { ...doc, devuelto: !doc.devuelto } : doc
    ));
  };

  const actualizarObservacionDevolucion = (docId, observacion) => {
    setDocumentosDevolucion(prev => prev.map(doc => 
      doc.id === docId ? { ...doc, observaciones_devolucion: observacion } : doc
    ));
  };

  const procesarDevolucion = async () => {
    try {
      if (!selectedSolicitud) {
        mostrarMensaje("No hay solicitud seleccionada", "error");
        return;
      }
      
      const documentosADevolver = documentosDevolucion.filter(doc => doc.devuelto);
      if (documentosADevolver.length === 0) {
        mostrarMensaje("Debe seleccionar al menos un documento para devolver", "error");
        return;
      }

      if (!firmaDevolucion) {
        mostrarMensaje("Debe proporcionar su firma para la devolución", "error");
        return;
      }

      setLoading(true);
      const devolucionesData = documentosADevolver.map(doc => ({
        solicitud_id: selectedSolicitud.id,
        documento_id: doc.documento_id.toString(),
        solicitud_documento_id: doc.id,
        cantidad_devuelta: 1,
        fecha_devolucion: new Date().toISOString(),
        observaciones: doc.observaciones_devolucion || observacionesDevolucion,
        firma_receptor: firmaDevolucion,
        usuario_receptor_id: currentUser?.id
      }));

      const { error: errorDevoluciones } = await supabase
        .from("devoluciones_documentos")
        .insert(devolucionesData);

      if (errorDevoluciones) throw errorDevoluciones;

      const { data: todosDocumentos, error: errorVerificar } = await supabase
        .from("solicitudes_documentos")
        .select("*, devoluciones:devoluciones_documentos(*)")
        .eq("solicitud_id", selectedSolicitud.id);

      if (errorVerificar) throw errorVerificar;

      const todosDevueltos = todosDocumentos.every(doc => 
        doc.devoluciones && doc.devoluciones.length > 0
      );

      const updateData = {
        estado: todosDevueltos ? "devuelta" : "devolucion parcial",
        updated_by: currentUser?.id,
        updated_at: new Date().toISOString()
      };

      if (todosDevueltos) {
        updateData.fecha_devolucion_real = new Date().toISOString();
      }

      const { error: errorActualizacion } = await supabase
        .from("solicitudes_archivisticas")
        .update(updateData)
        .eq("id", selectedSolicitud.id);

      if (errorActualizacion) throw errorActualizacion;

      mostrarMensaje(
        todosDevueltos 
          ? "Devolución completada. La solicitud ha sido cerrada." 
          : "Devolución parcial registrada exitosamente.", 
        "success"
      );

      setShowDevolucion(false);
      await cargarDatos();
    } catch (error) {
      mostrarMensaje("Error al procesar devolución: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const abrirEditar = (solicitud) => {
    setSelectedSolicitud(solicitud);
    setEditForm({
      motivo_solicitud: solicitud.motivo_solicitud || "",
      estado: solicitud.estado || "pendiente",
      fecha_devolucion_prevista: solicitud.fecha_devolucion_prevista ? new Date(solicitud.fecha_devolucion_prevista).toISOString().slice(0, 10) : ""
    });
    setShowEdit(true);
  };

  const guardarEdicion = async () => {
    if (!selectedSolicitud) return;
    try {
      setLoading(true);
      const { error } = await supabase
        .from("solicitudes_archivisticas")
        .update({
          ...editForm,
          fecha_devolucion_prevista: editForm.fecha_devolucion_prevista || null,
          updated_by: currentUser?.id,
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedSolicitud.id);
      if (error) throw error;
      mostrarMensaje("Solicitud actualizada", "success");
      setShowEdit(false);
      setSelectedSolicitud(null);
      await cargarDatos();
    } catch (error) {
      mostrarMensaje("No se pudo actualizar: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const confirmarEliminar = async () => {
    if (!selectedSolicitud) return;
    try {
      setLoading(true);
      await supabase.from("devoluciones_documentos").delete().eq("solicitud_id", selectedSolicitud.id);
      await supabase.from("solicitudes_documentos").delete().eq("solicitud_id", selectedSolicitud.id);
      const { error } = await supabase.from("solicitudes_archivisticas").delete().eq("id", selectedSolicitud.id);
      if (error) throw error;
      mostrarMensaje("Solicitud eliminada", "success");
      setShowDelete(false);
      setSelectedSolicitud(null);
      await cargarDatos();
    } catch (error) {
      mostrarMensaje("No se pudo eliminar: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => ({
    pendientes: solicitudes.filter(s => s.estado === "pendiente").length,
    entregadas: solicitudes.filter(s => s.estado === "entregada").length,
    devolucion_parcial: solicitudes.filter(s => s.estado === "devolucion parcial").length,
    vencidas: solicitudes.filter(s => {
      if (s.estado !== "entregada" && s.estado !== "devolucion parcial") return false;
      return s.fecha_devolucion_prevista && new Date(s.fecha_devolucion_prevista) < new Date();
    }).length,
    total: solicitudes.length
  }), [solicitudes]);

  const tabs = useMemo(() => [
    { id: "nueva", label: "Nueva Solicitud", icon: Plus },
    { id: "pendientes", label: `Pendientes (${stats.pendientes})`, icon: Clock },
    { id: "prestamos", label: `Préstamos Activos (${stats.entregadas + stats.devolucion_parcial})`, icon: FileCheck },
    { id: "historial", label: "Historial", icon: Download }
  ], [stats]);

  return (
    <>
      {mensaje && <Toast {...mensaje} onClose={() => setMensaje(null)} />}      
      {/* COMPONENTE IMPRIMIBLE SIEMPRE EN EL DOM */}
      {selectedSolicitud && isPrintReady && (
        <PrintableContent
          ref={reporteRef}
          solicitud={selectedSolicitud}
          documentos={viewDocs}
        />
      )}
      <CrudLayout title="Servicios Archivísticos" icon={FileText}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatCard title="Pendientes" value={stats.pendientes} icon={Clock} color="from-amber-500 to-orange-600" />
          <StatCard title="Entregadas" value={stats.entregadas} icon={FileCheck} color="from-blue-500 to-indigo-600" />
          <StatCard title="Dev. Parcial" value={stats.devolucion_parcial} icon={AlertTriangle} color="from-yellow-500 to-amber-600" />
          <StatCard title="Vencidas" value={stats.vencidas} icon={AlertTriangle} color="from-red-500 to-rose-600" />
          <StatCard title="Total" value={stats.total} icon={FileText} color="from-indigo-500 to-purple-600" />
        </div>

        <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-6 py-3 font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id ? "border-indigo-600 text-indigo-700 bg-indigo-50" : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300"
            }`}>
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-12"><SparkleLoader /></div>
        ) : (
          <>
            {activeTab === "nueva" && (
              <SolicitudServiciosArchivisticos
                currentUser={currentUser}
                usuarios={usuarios}
                documentosInventario={documentosInventario}
                loading={loading}
                onGuardarSolicitud={guardarSolicitud}
                onMostrarMensaje={mostrarMensaje}
                onCargarDatos={cargarDatos}
              />
            )}

            {activeTab === "pendientes" && (
              <div className="bg-white rounded-2xl shadow-lg border p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-amber-100 rounded-xl"><Clock className="h-6 w-6 text-amber-600" /></div>
                  <h2 className="text-2xl font-bold text-gray-800">Solicitudes Pendientes</h2>
                </div>
                {solicitudes.filter(s => s.estado === "pendiente").length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4"><Clock className="h-12 w-12 text-gray-400" /></div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay solicitudes pendientes</h3>
                    <p className="text-gray-500">Todas las solicitudes han sido procesadas</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {solicitudes.filter(s => s.estado === "pendiente").map(solicitud => (
                      <div key={solicitud.id} className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800 mb-1 text-sm">{solicitud.motivo_solicitud}</h3>
                            <div className="space-y-1 text-xs text-gray-600">
                              <p><strong>Solicitante:</strong> {solicitud.nombre_solicitante}</p>
                              <p><strong>Fecha:</strong> {formatearFecha(solicitud.fecha_solicitud)}</p>
                              <p><strong>Sub Gerencia:</strong> {solicitud.sub_gerencia}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <EstadoBadge estado={solicitud.estado} />
                            <div className="flex gap-1">
                              <button onClick={() => verSolicitud(solicitud)} className="p-1 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors" title="Ver detalle"><Eye size={14} /></button>
                              <button onClick={() => abrirEditar(solicitud)} className="p-1 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Editar"><Edit3 size={14} /></button>
                              <button onClick={() => imprimirSolicitud(solicitud)} className="p-1 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="Imprimir PDF" disabled={loading}><Printer size={14} /></button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "prestamos" && (
              <div className="bg-white rounded-2xl shadow-lg border p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <FileCheck className="h-6 w-6 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Préstamos Activos</h2>
                </div>
                {solicitudes.filter(s => s.estado === "entregada" || s.estado === "devolucion parcial").length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <FileCheck className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay préstamos activos</h3>
                    <p className="text-gray-500">Todos los documentos han sido devueltos</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {solicitudes.filter(s => s.estado === "entregada" || s.estado === "devolucion parcial").map(solicitud => (
                      <div key={solicitud.id} className={`border rounded-xl p-4 ${
                        solicitud.estado === "devolucion parcial" ? "bg-yellow-50 border-yellow-200" : "bg-blue-50 border-blue-200"
                      }`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800 mb-1 text-sm">{solicitud.motivo_solicitud}</h3>
                            <div className="space-y-1 text-xs text-gray-600">
                              <p><strong>Solicitante:</strong> {solicitud.nombre_solicitante}</p>
                              <p><strong>Fecha préstamo:</strong> {formatearFecha(solicitud.fecha_solicitud)}</p>
                              <p><strong>Sub Gerencia:</strong> {solicitud.sub_gerencia}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <EstadoBadge estado={solicitud.estado} />
                            <div className="flex gap-1">
                              <button onClick={() => verSolicitud(solicitud)} className="p-1 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors" title="Ver detalle"><Eye size={14} /></button>
                              <button onClick={() => abrirEditar(solicitud)} className="p-1 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Editar"><Edit3 size={14} /></button>
                              <button onClick={() => abrirDevolucion(solicitud)} className="p-1 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors" title="Procesar devolución"><RotateCcw size={14} /></button>
                              <button onClick={() => imprimirSolicitud(solicitud)} className="p-1 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="Imprimir PDF" disabled={loading}><Printer size={14} /></button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "historial" && (
              <div className="bg-white rounded-2xl shadow-lg border p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gray-100 rounded-xl">
                    <Download className="h-6 w-6 text-gray-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Historial</h2>
                </div>
                {solicitudes.filter(s => s.estado === "devuelta" || s.estado === "rechazada" || s.estado === "cancelado").length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Download className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay historial de solicitudes</h3>
                    <p className="text-gray-500">No se registran solicitudes finalizadas o canceladas</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {solicitudes.filter(s => s.estado === "devuelta" || s.estado === "rechazada" || s.estado === "cancelado").map(solicitud => (
                      <div key={solicitud.id} className={`border rounded-xl p-4 ${
                        solicitud.estado === "devuelta" ? "bg-gray-50 border-gray-200" : "bg-red-50 border-red-200"
                      }`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800 mb-1 text-sm">{solicitud.motivo_solicitud}</h3>
                            <div className="space-y-1 text-xs text-gray-600">
                              <p><strong>Solicitante:</strong> {solicitud.nombre_solicitante}</p>
                              <p><strong>Fecha solicitud:</strong> {formatearFecha(solicitud.fecha_solicitud)}</p>
                              <p><strong>Sub Gerencia:</strong> {solicitud.sub_gerencia}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <EstadoBadge estado={solicitud.estado} />
                            <div className="flex gap-1">
                              <button
                                onClick={() => verSolicitud(solicitud)}
                                className="p-1 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                                title="Ver detalle"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                onClick={() => imprimirSolicitud(solicitud)}
                                className="p-1 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Imprimir PDF"
                                disabled={loading}
                              >
                                <Printer size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </>
        )}
      </CrudLayout>

      <Modal isOpen={showView} onClose={() => setShowView(false)} title="Detalle de Solicitud" size="lg">
        {selectedSolicitud && (
          <>          
            {/* CONTENIDO VISIBLE DEL MODAL */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-sm font-semibold text-gray-700">Solicitante</label><p className="mt-1 text-gray-900 text-sm">{selectedSolicitud.nombre_solicitante}</p></div>
                <div><label className="text-sm font-semibold text-gray-700">Estado</label><p className="mt-1"><EstadoBadge estado={selectedSolicitud.estado} /></p></div>
                <div><label className="text-sm font-semibold text-gray-700">Fecha de Solicitud</label><p className="mt-1 text-gray-900 text-sm">{formatearFecha(selectedSolicitud.fecha_solicitud)}</p></div>
                <div><label className="text-sm font-semibold text-gray-700">Sub Gerencia</label><p className="mt-1 text-gray-900 text-sm">{selectedSolicitud.sub_gerencia}</p></div>
              </div>
              <div><label className="text-sm font-semibold text-gray-700">Motivo de la Solicitud</label><p className="mt-1 text-gray-900 text-sm whitespace-pre-wrap">{selectedSolicitud.motivo_solicitud}</p></div>
              <div><label className="text-sm font-semibold text-gray-700">Documentos Solicitados</label>
                <div className="mt-2 bg-gray-50 rounded-lg max-h-64 overflow-y-auto">
                  {viewDocs.length === 0 ? <p className="p-3 text-gray-500 text-center text-sm">Sin documentos vinculados</p> : (
                    <div className="divide-y">
                      {viewDocs.map(doc => (
                        <div key={doc.id} className="p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-800 text-sm">{doc.descripcion}</h4>
                            {doc.devuelto && <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Devuelto</span>}
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{doc.unidad} • {doc.serie}</p>
                          <p className="text-xs text-gray-500 mt-1">Caja: {doc.caja} • Ubicación: {doc.ubicacion_topografica}</p>
                          {doc.observaciones_documento && (
                            <p className="text-xs text-gray-700 mt-2 bg-white p-2 rounded"><strong>Observaciones:</strong> {doc.observaciones_documento}</p>
                          )}
                          {doc.devuelto && doc.devoluciones && doc.devoluciones[0] && (
                            <div className="mt-2 p-2 bg-green-50 rounded">
                              <p className="text-xs text-green-800"><strong>Devolución:</strong> {formatearFecha(doc.devoluciones[0].fecha_devolucion)}</p>
                              {doc.devoluciones[0].observaciones && (
                                <p className="text-xs text-green-700 mt-1"><strong>Observaciones:</strong> {doc.devoluciones[0].observaciones}</p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </Modal>

      <Modal isOpen={showDevolucion} onClose={() => setShowDevolucion(false)} title="Procesar Devolución" size="lg">
        {selectedSolicitud && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <h4 className="font-semibold text-blue-800 text-sm mb-1">Solicitud: {selectedSolicitud.motivo_solicitud}</h4>
              <p className="text-xs text-blue-700">Solicitante: {selectedSolicitud.nombre_solicitante}</p>
              <p className="text-xs text-blue-700">Fecha préstamo: {formatearFecha(selectedSolicitud.fecha_solicitud)}</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Seleccione los documentos devueltos:</label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {documentosDevolucion.map(doc => (
                  <DevolucionDocumentoItem
                    key={doc.id}
                    doc={doc}
                    onToggle={toggleDevolucionDocumento}
                    onUpdateObservacion={actualizarObservacionDevolucion}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Observaciones Generales de Devolución</label>
              <textarea
                value={observacionesDevolucion}
                onChange={(e) => setObservacionesDevolucion(e.target.value)}
                placeholder="Observaciones generales sobre la devolución..."
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Firma del Receptor</label>
              <DigitalSignature value={firmaDevolucion} onChange={setFirmaDevolucion} />
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button onClick={() => setShowDevolucion(false)} className="px-3 py-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm">Cancelar</button>
              <button onClick={procesarDevolucion} disabled={loading} className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50">
                {loading ? "Procesando..." : "Registrar Devolución"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Estado Solicitud" size="md">
        <div className="space-y-3">
          <TextareaField label="Motivo de la Solicitud" value={editForm.motivo_solicitud} onChange={(v) => setEditForm(prev => ({ ...prev, motivo_solicitud: v }))} required />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Estado</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm" value={editForm.estado} onChange={(e) => setEditForm(prev => ({ ...prev, estado: e.target.value }))}>
                <option value="pendiente">Pendiente</option>
                {/*<option value="aprobada">Aprobada</option>*/}
                <option value="entregada">Entregada</option>
                {/*<option value="devolucion parcial">Devolución Parcial</option>
                <option value="devuelta">Devuelta</option>
                <option value="rechazada">Rechazada</option>*/}
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
            <InputField label="Fecha de Devolución Prevista" type="date" value={editForm.fecha_devolucion_prevista} onChange={(field, value) => setEditForm(prev => ({ ...prev, fecha_devolucion_prevista: value }))} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => setShowEdit(false)} className="px-3 py-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm">Cancelar</button>
          <button onClick={guardarEdicion} disabled={loading} className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm disabled:opacity-50">{loading ? "Guardando..." : "Guardar Cambios"}</button>
        </div>
      </Modal>

      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Confirmar Eliminación" size="sm">
        {selectedSolicitud && (
          <div className="space-y-3">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3"><AlertTriangle className="h-6 w-6 text-red-600" /></div>
              <p className="text-gray-700 text-sm">¿Está seguro de que desea eliminar la solicitud de <span className="font-semibold">{selectedSolicitud.nombre_solicitante}</span>?</p>
              <p className="text-xs text-gray-500 mt-1">Esta acción no se puede deshacer.</p>
            </div>
            <div className="flex justify-center gap-2">
              <button onClick={() => setShowDelete(false)} className="px-3 py-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm">Cancelar</button>
              <button onClick={confirmarEliminar} disabled={loading} className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-50">{loading ? "Eliminando..." : "Eliminar"}</button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}