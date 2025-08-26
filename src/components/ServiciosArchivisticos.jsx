import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../utils/supabaseClient";
import { CrudLayout } from "../components/layout/CrudLayout";
import { Toast } from "../components/ui/Toast";
import { SparkleLoader } from "../components/ui/SparkleLoader";
import { StatCard } from "../components/ui/StatCard";
import { DigitalSignature } from "../components/ui/DigitalSignature";
import { InputField } from "../components/ui/InputField";
import { TextareaField } from "../components/ui/TextareaField";
import { SearchBar } from "../components/controls/SearchBar";
import { FileText, Plus, Clock, CheckCircle, AlertTriangle, Download, FilePlus, Signature, X, Eye, Trash2, Edit3, Search, User, UserPlus, Calendar, Building, Phone, Mail, FileCheck, MapPin, RotateCcw, CheckSquare, Square, Printer } from "lucide-react";
import { useReactToPrint } from 'react-to-print';

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

const UserInfo = ({ label, value, icon: Icon, disabled = false }) => (
  <div className={`relative ${disabled ? 'opacity-75' : ''}`}>
    <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        value={value || ''}
        disabled={disabled}
        className={`block w-full pl-10 pr-3 py-3 border rounded-xl text-sm transition-all ${
          disabled ? 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed' : 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
        }`}
        readOnly={disabled}
      />
    </div>
  </div>
);

const SelectedDocument = ({ doc, onRemove, onUpdateObservation }) => (
  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-200 p-4">
    <div className="flex justify-between items-start gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <FileCheck className="h-4 w-4 text-indigo-600" />
          <h4 className="font-semibold text-gray-800">{doc.Descripcion}</h4>
        </div>
        <p className="text-sm text-gray-600 mb-2">{doc.Unidad_Organica} • {doc.Serie_Documental}</p>
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
          <MapPin className="h-3 w-3" />
          <span>Ubicación: {doc.ubicacion_topografica} • Caja: {doc.Numero_Caja} • Folios: {doc.Numero_Folios}</span>
        </div>
        <textarea
          className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
          placeholder="Agregar observaciones para este documento..."
          rows="2"
          value={doc.observaciones_documento || ''}
          onChange={(e) => onUpdateObservation(doc.id, e.target.value)}
        />
      </div>
      <button onClick={() => onRemove(doc.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors" title="Remover documento">
        <X size={16} />
      </button>
    </div>
  </div>
);

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
        <h4 className="font-medium text-gray-800">{doc.info?.Descripcion || `Documento #${doc.documento_id}`}</h4>
        <p className="text-sm text-gray-600">
          Serie: {doc.info?.Serie_Documental || 'N/A'} • 
          Unidad: {doc.info?.Unidad_Organica || 'N/A'}
        </p>
        <p className="text-xs text-gray-500">
          Ubicación: {doc.ubicacion_topografica || 
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

// Componente para el reporte en PDF - DEFINIDO FUERA del componente principal
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

  return (
    <div ref={ref} className="p-8 bg-white">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Electro Sur Este S.A.A.</h1>
        <h2 className="text-xl text-gray-600">Servicios Archivísticos</h2>
        <div className="border-t border-b border-gray-300 py-2 mt-4">
          <h3 className="text-lg font-semibold">COMPROBANTE DE SOLICITUD</h3>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <h4 className="font-semibold text-gray-700 mb-2">Información del Solicitante</h4>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Nombre:</span> {solicitud.nombre_solicitante}</p>
            <p><span className="font-medium">Email:</span> {solicitud.email}</p>
            <p><span className="font-medium">Teléfono:</span> {solicitud.movil || 'No especificado'}</p>
            <p><span className="font-medium">Sub Gerencia:</span> {solicitud.sub_gerencia}</p>
            <p><span className="font-medium">Entidad:</span> {solicitud.entidad}</p>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-700 mb-2">Detalles de la Solicitud</h4>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">N° Solicitud:</span> {solicitud.id}</p>
            <p><span className="font-medium">Fecha:</span> {new Date(solicitud.fecha_solicitud).toLocaleDateString('es-PE')}</p>
            <p><span className="font-medium">Estado:</span> <span className="uppercase">{solicitud.estado}</span></p>
            <p><span className="font-medium">Modalidad:</span> {getModalidadTexto(solicitud.modalidad_servicio)}</p>
            {solicitud.fecha_devolucion_prevista && (
              <p><span className="font-medium">Devolución Prevista:</span> {new Date(solicitud.fecha_devolucion_prevista).toLocaleDateString('es-PE')}</p>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="font-semibold text-gray-700 mb-2">Motivo de la Solicitud</h4>
        <p className="text-sm border rounded-lg p-3 bg-gray-50">{solicitud.motivo_solicitud}</p>
      </div>

      <div className="mb-6">
        <h4 className="font-semibold text-gray-700 mb-3">Documentos Solicitados</h4>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-2 border-b">N°</th>
                <th className="text-left p-2 border-b">Descripción</th>
                <th className="text-left p-2 border-b">Serie</th>
                <th className="text-left p-2 border-b">Unidad</th>
                <th className="text-left p-2 border-b">Ubicación</th>
              </tr>
            </thead>
            <tbody>
              {documentos.map((doc, index) => (
                <tr key={doc.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="p-2 border-b">{index + 1}</td>
                  <td className="p-2 border-b">{doc.info?.Descripcion || `Documento #${doc.documento_id}`}</td>
                  <td className="p-2 border-b">{doc.info?.Serie_Documental || 'N/A'}</td>
                  <td className="p-2 border-b">{doc.info?.Unidad_Organica || 'N/A'}</td>
                  <td className="p-2 border-b">{doc.ubicacion_topografica}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {solicitud.estado === "devuelta" && solicitud.fecha_devolucion_real && (
        <div className="mb-6">
          <h4 className="font-semibold text-gray-700 mb-2">Información de Devolución</h4>
          <div className="text-sm">
            <p><span className="font-medium">Fecha de Devolución Real:</span> {new Date(solicitud.fecha_devolucion_real).toLocaleDateString('es-PE')}</p>
          </div>
        </div>
      )}

      <div className="mt-8 pt-4 border-t border-gray-300">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="font-medium mb-8">Firma del Solicitante</p>
            <div className="h-0.5 bg-gray-400 w-48 mx-auto"></div>
            <p className="text-xs mt-1">{solicitud.nombre_solicitante}</p>
          </div>
          <div className="text-center">
            <p className="font-medium mb-8">Firma del Responsable</p>
            <div className="h-0.5 bg-gray-400 w-48 mx-auto"></div>
            <p className="text-xs mt-1">Archivo Central - Electro Sur Este S.A.A.</p>
          </div>
        </div>
      </div>

      <div className="text-center mt-6 text-xs text-gray-500">
        <p>Documento generado el {new Date().toLocaleDateString('es-PE')} a las {new Date().toLocaleTimeString('es-PE')}</p>
      </div>
    </div>
  );
});

ReportePDF.displayName = 'ReportePDF';

export default function ServiciosArchivisticos() {
  const [activeTab, setActiveTab] = useState("nueva");
  const [solicitudes, setSolicitudes] = useState([]);
  const [documentosInventario, setDocumentosInventario] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    nombre_solicitante: "",
    entidad: "Electro Sur Este S.A.A.",
    sub_gerencia: "",
    email: "",
    movil: "",
    motivo_solicitud: "",
    modalidad_servicio: "prestamo_original",
    fecha_devolucion_prevista: ""
  });
  const [documentosSeleccionados, setDocumentosSeleccionados] = useState([]);
  const [busquedaDoc, setBusquedaDoc] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [busquedaSolicitante, setBusquedaSolicitante] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNuevoSolicitante, setShowNuevoSolicitante] = useState(false);
  const [nuevoSolicitante, setNuevoSolicitante] = useState({
    nombre_completo: "",
    email: "",
    movil: "",
    sub_gerencia: "",
    entidad: "Electro Sur Este S.A.A."
  });
  const [firmaTemp, setFirmaTemp] = useState(null);
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
  
  // Referencia para el componente de impresión
  const reporteRef = useRef();
  
  // Configuración CORREGIDA de react-to-print
  const handlePrint = useReactToPrint({
    content: () => reporteRef.current,
    documentTitle: `Solicitud_Archivistica_${selectedSolicitud?.id || ''}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 0.5in;
      }
      @media print {
        body { 
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .break-before {
          page-break-before: always;
        }
        .break-after {
          page-break-after: always;
        }
        .avoid-break {
          page-break-inside: avoid;
        }
        * {
          box-sizing: border-box;
        }
      }
    `,
    onAfterPrint: () => console.log("PDF impreso exitosamente"),
  });

  useEffect(() => {
    const initData = async () => {
      await Promise.all([cargarDatos(), obtenerUsuarioActual(), cargarUsuarios()]);
    };
    initData();
  }, []);

  useEffect(() => {
    if (formData.modalidad_servicio !== "prestamo_original") {
      setFormData(prev => ({ ...prev, fecha_devolucion_prevista: "" }));
    }
  }, [formData.modalidad_servicio]);

  const obtenerUsuarioActual = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from("usuarios")
          .select("*")
          .eq("correo_electronico", user.email)
          .single();

        if (error) {
          console.error("Error buscando usuario:", error);
          return;
        }

        if (data) {
          setCurrentUser(data);
          setFormData(prev => ({
            ...prev,
            nombre_solicitante: data.nombre_completo || "",
            email: data.correo_electronico || user.email,
            sub_gerencia: data.sub_gerencia || "",
            entidad: data.entidad || "Electro Sur Este S.A.A.",
            movil: data.movil || ""
          }));
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

  const cargarUsuarios = async () => {
    const { data } = await supabase.from("usuarios").select("*").order("nombre_completo");
    setUsuarios(data || []);
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

  const getEstadoBadge = (estado) => {
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
    return `px-3 py-1 text-xs font-medium rounded-full border uppercase ${badges[estado] || badges.pendiente}`;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const seleccionarSolicitante = (user) => {
    setFormData(prev => ({
      ...prev,
      nombre_solicitante: user.nombre_completo,
      email: user.email,
      sub_gerencia: user.sub_gerencia || "",
      entidad: user.entidad || "Electro Sur Este S.A.A.",
      movil: user.movil || ""
    }));
    setBusquedaSolicitante("");
    setShowUserDropdown(false);
  };

  const agregarDocumento = (doc) => {
    if (documentosSeleccionados.some(d => d.id === doc.id)) {
      mostrarMensaje("El documento ya está en la lista", "warning");
      return;
    }
    const nuevoDoc = {
      ...doc,
      numero_orden: documentosSeleccionados.length + 1,
      ubicacion_topografica: `E${doc.Estante || 1}-C${doc.Cuerpo || 1}-B${doc.Balda || 1}`,
      observaciones_documento: ""
    };
    setDocumentosSeleccionados(prev => [...prev, nuevoDoc]);
    mostrarMensaje("Documento agregado correctamente", "success");
    setBusquedaDoc("");
  };

  const removerDocumento = (docId) => {
    setDocumentosSeleccionados(prev => prev.filter(d => d.id !== docId).map((d, i) => ({ ...d, numero_orden: i + 1 })));
  };

  const actualizarObservacionDoc = (docId, observacion) => {
    setDocumentosSeleccionados(prev => prev.map(d => d.id === docId ? { ...d, observaciones_documento: observacion } : d));
  };

  const guardarNuevoSolicitante = async () => {
    try {
      const { nombre_completo, email } = nuevoSolicitante;
      if (!nombre_completo || !email) {
        mostrarMensaje("Nombre y correo son obligatorios", "error");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        mostrarMensaje("Correo no válido", "error");
        return;
      }
      const { data: existe } = await supabase.from("usuarios").select("*").eq("email", email).single();
      if (existe) {
        mostrarMensaje("Ya existe un usuario con ese correo", "warning");
        return;
      }
      const { data, error } = await supabase.from("usuarios").insert(nuevoSolicitante).select().single();
      if (error) throw error;
      setUsuarios(prev => [...prev, data]);
      seleccionarSolicitante(data);
      mostrarMensaje("Nuevo solicitante registrado", "success");
      setShowNuevoSolicitante(false);
      setNuevoSolicitante({
        nombre_completo: "",
        email: "",
        movil: "",
        sub_gerencia: "",
        entidad: "Electro Sur Este S.A.A."
      });
    } catch (error) {
      mostrarMensaje("Error al registrar solicitante: " + error.message, "error");
    }
  };

  const guardarSolicitud = async () => {
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
      setFormData({
        nombre_solicitante: currentUser?.nombre_completo || "",
        entidad: "Electro Sur Este S.A.A.",
        sub_gerencia: currentUser?.sub_gerencia || "",
        email: currentUser?.email || "",
        movil: currentUser?.movil || "",
        motivo_solicitud: "",
        modalidad_servicio: "prestamo_original",
        fecha_devolucion_prevista: ""
      });
      setDocumentosSeleccionados([]);
      setFirmaTemp(null);
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

      if (errorDevoluciones) {
        console.error("Error insertando devoluciones:", errorDevoluciones);
        throw errorDevoluciones;
      }

      const { data: todosDocumentos, error: errorVerificar } = await supabase
        .from("solicitudes_documentos")
        .select("*, devoluciones:devoluciones_documentos(*)")
        .eq("solicitud_id", selectedSolicitud.id);

      if (errorVerificar) {
        console.error("Error verificando documentos:", errorVerificar);
        throw errorVerificar;
      }

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

      if (errorActualizacion) {
        console.error("Error actualizando solicitud:", errorActualizacion);
        throw errorActualizacion;
      }

      mostrarMensaje(
        todosDevueltos 
          ? "Devolución completada. La solicitud ha sido cerrada." 
          : "Devolución parcial registrada exitosamente.", 
        "success"
      );

      setShowDevolucion(false);
      await cargarDatos();
    } catch (error) {
      console.error("Error completo:", error);
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

  const documentosFiltrados = documentosInventario.filter(doc =>
    (doc.id || "").toLowerCase().includes(busquedaDoc.toLowerCase()) ||
    (doc.Descripcion || "").toLowerCase().includes(busquedaDoc.toLowerCase()) ||
    (doc.Numero_Caja || "").toLowerCase().includes(busquedaDoc.toLowerCase())
  );

  const usuariosFiltrados = usuarios.filter(usuario =>
    usuario.nombre_completo.toLowerCase().includes(busquedaSolicitante.toLowerCase()) ||
    usuario.email.toLowerCase().includes(busquedaSolicitante.toLowerCase()) ||
    (usuario.sub_gerencia || "").toLowerCase().includes(busquedaSolicitante.toLowerCase()) ||
    (usuario.entidad || "").toLowerCase().includes(busquedaSolicitante.toLowerCase())
  );

  const stats = {
    pendientes: solicitudes.filter(s => s.estado === "pendiente").length,
    entregadas: solicitudes.filter(s => s.estado === "entregada").length,
    devolucion_parcial: solicitudes.filter(s => s.estado === "devolucion parcial").length,
    vencidas: solicitudes.filter(s => {
      if (s.estado !== "entregada" && s.estado !== "devolucion parcial") return false;
      return s.fecha_devolucion_prevista && new Date(s.fecha_devolucion_prevista) < new Date();
    }).length,
    total: solicitudes.length
  };

  const tabs = [
    { id: "nueva", label: "Nueva Solicitud", icon: Plus },
    { id: "pendientes", label: `Pendientes (${stats.pendientes})`, icon: Clock },
    { id: "prestamos", label: `Préstamos Activos (${stats.entregadas + stats.devolucion_parcial})`, icon: FileCheck },
    { id: "historial", label: "Historial", icon: Download }
  ];

  return (
    <>
      {mensaje && <Toast {...mensaje} onClose={() => setMensaje(null)} />}
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
              <div className="bg-white rounded-2xl shadow-lg border p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-indigo-100 rounded-xl"><FilePlus className="h-6 w-6 text-indigo-600" /></div>
                  <h2 className="text-2xl font-bold text-gray-800">Nueva Solicitud de Servicios Archivísticos</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><User className="h-5 w-5 text-indigo-600" />Información del Solicitante</h3>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="mb-4 relative">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Buscar Solicitante</label>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input type="text" value={busquedaSolicitante} onChange={(e) => {
                              setBusquedaSolicitante(e.target.value);
                              setShowUserDropdown(e.target.value.length > 0);
                            }} placeholder="Escriba nombre, correo o área..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                          </div>
                          {showUserDropdown && busquedaSolicitante && (
                            <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-60 overflow-y-auto">
                              {usuariosFiltrados.length > 0 ? usuariosFiltrados.map(user => (
                                <div key={user.id} className="px-4 py-2 hover:bg-indigo-50 cursor-pointer border-b last:border-b-0" onClick={() => seleccionarSolicitante(user)}>
                                  <div className="font-medium text-gray-900">{user.nombre_completo}</div>
                                  <div className="text-sm text-gray-600">{user.email}</div>
                                  <div className="text-xs text-gray-500">{user.sub_gerencia} • {user.entidad}</div>
                                </div>
                              )) : (
                                <div className="px-4 py-3 text-center text-gray-500">No se encontraron resultados</div>
                              )}
                              <button className="w-full px-4 py-2 text-indigo-600 hover:bg-indigo-50 border-t flex items-center gap-2 justify-center text-sm" onClick={() => {
                                setShowNuevoSolicitante(true);
                                setShowUserDropdown(false);
                              }}>
                                <UserPlus size={14} />Registrar nuevo solicitante
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          <UserInfo label="Nombre Completo" value={formData.nombre_solicitante} icon={User} disabled={true} />
                          <UserInfo label="Correo Electrónico" value={formData.email} icon={Mail} disabled={true} />
                          <UserInfo label="Sub Gerencia" value={formData.sub_gerencia} icon={Building} disabled={true} />
                          <UserInfo label="Teléfono" value={formData.movil} icon={Phone} disabled={true} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><Signature className="h-5 w-5 text-indigo-600" />Firma Digital</h3>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <DigitalSignature value={firmaTemp} onChange={setFirmaTemp} />
                        <p className="text-sm text-gray-600 mt-2">Su firma digital es requerida para procesar la solicitud</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><FileText className="h-5 w-5 text-indigo-600" />Detalles de la Solicitud</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Motivo de la Solicitud *</label>
                          <textarea value={formData.motivo_solicitud} onChange={(e) => handleInputChange("motivo_solicitud", e.target.value)} placeholder="Describa el propósito y justificación de su solicitud..." rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none" required />
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Modalidad del Servicio</label>
                            <select value={formData.modalidad_servicio} onChange={(e) => handleInputChange("modalidad_servicio", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                              <option value="prestamo_original">Préstamo de Original</option>
                              <option value="copia_simple">Copia Simple</option>
                              <option value="copia_certificada">Copia Certificada</option>
                              <option value="consulta_sala">Consulta en Sala</option>
                            </select>
                          </div>
                          
                          {formData.modalidad_servicio === "prestamo_original" && (
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2"><Calendar className="inline h-4 w-4 mr-1" />Fecha de Devolución Prevista</label>
                              <input type="date" value={formData.fecha_devolucion_prevista} onChange={(e) => handleInputChange("fecha_devolucion_prevista", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" min={new Date().toISOString().split('T')[0]} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><FileCheck className="h-5 w-5 text-indigo-600" />Selección de Documentos</h3>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <SearchBar value={busquedaDoc} onChange={setBusquedaDoc} placeholder="Buscar documentos por descripción, id o número de caja..." />
                        {busquedaDoc && (
                          <div className="mt-3 bg-white border border-gray-200 rounded-xl max-h-48 overflow-y-auto">
                            {documentosFiltrados.length > 0 ? documentosFiltrados.map((doc) => (
                              <div key={doc.id} className="flex justify-between items-center px-3 py-2 border-b last:border-b-0 hover:bg-gray-50">
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-800 text-sm">{doc.Descripcion}</h4>
                                  <p className="text-xs text-gray-600">Unidad: {doc.Unidad_Organica} • Caja: {doc.Numero_Caja}</p>
                                </div>
                                <button onClick={() => agregarDocumento(doc)} className="ml-2 px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs font-medium">Agregar</button>
                              </div>
                            )) : (
                              <div className="px-4 py-4 text-center text-gray-500 text-sm">No se encontraron documentos con ese criterio</div>
                            )}
                          </div>
                        )}
                      </div>
                      {documentosSeleccionados.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-semibold text-gray-800 mb-3">Documentos Seleccionados ({documentosSeleccionados.length})</h4>
                          <div className="space-y-3 max-h-64 overflow-y-auto">
                            {documentosSeleccionados.map((doc) => (
                              <SelectedDocument key={doc.id} doc={doc} onRemove={removerDocumento} onUpdateObservation={actualizarObservacionDoc} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-gray-200 mt-6">
                  <button onClick={guardarSolicitud} disabled={loading} className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
                    {loading ? "Procesando..." : "Enviar Solicitud"}
                  </button>
                </div>
              </div>
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
                            <span className={getEstadoBadge(solicitud.estado)}>{solicitud.estado}</span>
                            <div className="flex gap-1">
                              <button onClick={() => verSolicitud(solicitud)} className="p-1 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors" title="Ver detalle"><Eye size={14} /></button>
                              <button onClick={() => abrirEditar(solicitud)} className="p-1 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Editar"><Edit3 size={14} /></button>
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
                  <div className="p-3 bg-blue-100 rounded-xl"><FileCheck className="h-6 w-6 text-blue-600" /></div>
                  <h2 className="text-2xl font-bold text-gray-800">Préstamos Activos</h2>
                </div>
                {solicitudes.filter(s => s.estado === "entregada" || s.estado === "devolucion parcial").length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4"><FileCheck className="h-12 w-12 text-gray-400" /></div>
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
                              <p><strong>Fecha préstamo:</strong> {formatearFecha(solicitud.fecha_entrega)}</p>
                              <p><strong>Vencimiento:</strong> {formatearFecha(solicitud.fecha_devolucion_prevista)}</p>
                              <p><strong>Sub Gerencia:</strong> {solicitud.sub_gerencia}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <span className={getEstadoBadge(solicitud.estado)}>{solicitud.estado}</span>
                            <div className="flex gap-1">
                              <button onClick={() => verSolicitud(solicitud)} className="p-1 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors" title="Ver detalle"><Eye size={14} /></button>
                              <button onClick={() => abrirDevolucion(solicitud)} className="p-1 text-green-600 hover:bg-green-100 rounded-lg transition-colors" title="Procesar devolución"><RotateCcw size={14} /></button>
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
                  <div className="p-3 bg-indigo-100 rounded-xl"><Download className="h-6 w-6 text-indigo-600" /></div>
                  <h2 className="text-2xl font-bold text-gray-800">Historial de Solicitudes</h2>
                </div>
                {solicitudes.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4"><FileText className="h-12 w-12 text-gray-400" /></div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay solicitudes registradas</h3>
                    <p className="text-gray-500">Comience creando una nueva solicitud</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="text-left p-3 font-semibold text-gray-700">Solicitante</th>
                          <th className="text-left p-3 font-semibold text-gray-700">Motivo</th>
                          <th className="text-left p-3 font-semibold text-gray-700">Estado</th>
                          <th className="text-left p-3 font-semibold text-gray-700">Fecha</th>
                          <th className="text-left p-3 font-semibold text-gray-700">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {solicitudes.map(solicitud => (
                          <tr key={solicitud.id} className="border-b hover:bg-gray-50 transition-colors">
                            <td className="p-3">
                              <div>
                                <div className="font-medium text-gray-800 text-sm">{solicitud.nombre_solicitante}</div>
                                <div className="text-xs text-gray-500">{solicitud.sub_gerencia}</div>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="max-w-xs truncate text-sm" title={solicitud.motivo_solicitud}>{solicitud.motivo_solicitud}</div>
                            </td>
                            <td className="p-3"><span className={getEstadoBadge(solicitud.estado)}>{solicitud.estado}</span></td>
                            <td className="p-3 text-gray-600 text-sm">{formatearFecha(solicitud.fecha_solicitud)}</td>
                            <td className="p-3">
                              <div className="flex gap-1">
                                <button onClick={() => verSolicitud(solicitud)} className="p-1 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors" title="Ver detalle">
                                  <Eye size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CrudLayout>

      <Modal isOpen={showNuevoSolicitante} onClose={() => setShowNuevoSolicitante(false)} title="Registrar Nuevo Solicitante" size="md">
        <div className="space-y-3">
          <InputField label="Nombre Completo" value={nuevoSolicitante.nombre_completo} onChange={(field, value) => setNuevoSolicitante(prev => ({ ...prev, nombre_completo: value }))} required />
          <InputField label="Correo Electrónico" type="email" value={nuevoSolicitante.email} onChange={(field, value) => setNuevoSolicitante(prev => ({ ...prev, email: value }))} required />
          <InputField label="Teléfono Móvil" value={nuevoSolicitante.movil} onChange={(field, value) => setNuevoSolicitante(prev => ({ ...prev, movil: value }))} />
          <InputField label="Sub Gerencia" value={nuevoSolicitante.sub_gerencia} onChange={(field, value) => setNuevoSolicitante(prev => ({ ...prev, sub_gerencia: value }))} />
          <InputField label="Entidad" value={nuevoSolicitante.entidad} onChange={(field, value) => setNuevoSolicitante(prev => ({ ...prev, entidad: value }))} />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => setShowNuevoSolicitante(false)} className="px-3 py-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm">Cancelar</button>
          <button onClick={guardarNuevoSolicitante} className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm">Registrar</button>
        </div>
      </Modal>

      <Modal isOpen={showView} onClose={() => setShowView(false)} title="Detalle de Solicitud" size="lg">
          {selectedSolicitud && (
            <>
              <div className="flex justify-end mb-4">
                <button 
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Printer size={16} />
                  Imprimir PDF
                </button>
              </div>
              
              {/* Componente de reporte PDF - RENDERIZADO CONDICIONAL */}
              {showView && (
                <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                  <ReportePDF 
                    ref={reporteRef} 
                    solicitud={selectedSolicitud} 
                    documentos={viewDocs} 
                  />
                </div>
              )}
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="text-sm font-semibold text-gray-700">Solicitante</label><p className="mt-1 text-gray-900 text-sm">{selectedSolicitud.nombre_solicitante}</p></div>
                  <div><label className="text-sm font-semibold text-gray-700">Estado</label><p className="mt-1"><span className={getEstadoBadge(selectedSolicitud.estado)}>{selectedSolicitud.estado}</span></p></div>
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
                              <h4 className="font-medium text-gray-800 text-sm">{doc.info?.Descripcion || `Documento #${doc.documento_id}`}</h4>
                              {doc.devuelto && <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Devuelto</span>}
                            </div>
                            <p className="text-xs text-gray-600 mt-1">{doc.info?.Serie_Documental} • {doc.info?.Unidad_Organica}</p>
                            <p className="text-xs text-gray-500 mt-1">Ubicación: {doc.ubicacion_topografica}</p>
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

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Editar Solicitud" size="md">
        <div className="space-y-3">
          <TextareaField label="Motivo de la Solicitud" value={editForm.motivo_solicitud} onChange={(v) => setEditForm(prev => ({ ...prev, motivo_solicitud: v }))} required />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Estado</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm" value={editForm.estado} onChange={(e) => setEditForm(prev => ({ ...prev, estado: e.target.value }))}>
                <option value="pendiente">Pendiente</option>
                <option value="aprobada">Aprobada</option>
                <option value="entregada">Entregada</option>
                <option value="devolucion parcial">Devolución Parcial</option>
                <option value="devuelta">Devuelta</option>
                <option value="rechazada">Rechazada</option>
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