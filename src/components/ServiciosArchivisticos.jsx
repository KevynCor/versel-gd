import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../utils/supabaseClient";
import { CrudLayout } from "../components/layout/CrudLayout";
import { Toast } from "../components/ui/Toast";
import { SparkleLoader } from "../components/ui/SparkleLoader";
import { StatCard } from "../components/ui/StatCard";
import { DigitalSignature } from "../components/ui/DigitalSignature";
import { InputField } from "../components/ui/InputField";
import { TextareaField } from "../components/ui/TextareaField";
import { SearchBar } from "../components/controls/SearchBar";
import {
  FileText, Plus, Clock, CheckCircle, AlertTriangle, Download,
  FilePlus, Signature, X, Eye, Trash2, Edit3, Search, User, UserPlus,
  Calendar, Building, Phone, Mail, FileCheck, MapPin, RotateCcw, Package
} from "lucide-react";

// Componente Modal reutilizable
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
            <button 
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// Componente para mostrar información de usuario
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
          disabled 
            ? 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed' 
            : 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
        }`}
        readOnly={disabled}
      />
    </div>
  </div>
);

// Componente para documentos seleccionados
const SelectedDocument = ({ doc, onRemove, onUpdateObservation }) => (
  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-200 p-4">
    <div className="flex justify-between items-start gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <FileCheck className="h-4 w-4 text-indigo-600" />
          <h4 className="font-semibold text-gray-800">{doc.Descripcion}</h4>
        </div>
        <p className="text-sm text-gray-600 mb-2">
          {doc.Serie_Documental} • {doc.Unidad_Organica}
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
          <MapPin className="h-3 w-3" />
          <span>Ubicación: {doc.ubicacion_topografica}</span>
        </div>
        <textarea
          className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
          placeholder="Agregar observaciones para este documento..."
          rows="2"
          value={doc.observaciones_documento || ''}
          onChange={(e) => onUpdateObservation(doc.id, e.target.value)}
        />
      </div>
      <button 
        onClick={() => onRemove(doc.id)} 
        className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
        title="Remover documento"
      >
        <X size={16} />
      </button>
    </div>
  </div>
);

// Componente principal
export default function ServiciosArchivisticos() {
  // Estados principales
  const [activeTab, setActiveTab] = useState("nueva");
  const [solicitudes, setSolicitudes] = useState([]);
  const [documentosInventario, setDocumentosInventario] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Estados para formulario
  const [formData, setFormData] = useState({
    nombre_solicitante: "",
    entidad: "Electro Sur Este S.A.A.",
    sub_gerencia: "",
    email: "",
    movil: "",
    motivo_solicitud: "",
    organo_responsable: "",
    descripcion_documentos: "",
    modalidad_servicio: "prestamo_original",
    fecha_devolucion_prevista: ""
  });

  // Estados para documentos y búsquedas
  const [documentosSeleccionados, setDocumentosSeleccionados] = useState([]);
  const [busquedaDoc, setBusquedaDoc] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [busquedaSolicitante, setBusquedaSolicitante] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Estados para nuevo solicitante
  const [showNuevoSolicitante, setShowNuevoSolicitante] = useState(false);
  const [nuevoSolicitante, setNuevoSolicitante] = useState({
    nombre_completo: "",
    email: "",
    movil: "",
    sub_gerencia: "",
    entidad: "Electro Sur Este S.A.A."
  });

  // Estados para modales
  const [firmaTemp, setFirmaTemp] = useState(null);
  const [showView, setShowView] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showDevolucion, setShowDevolucion] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [viewDocs, setViewDocs] = useState([]);
  const [editForm, setEditForm] = useState({
    motivo_solicitud: "",
    descripcion_documentos: "",
    organo_responsable: "",
    estado: "pendiente",
    fecha_devolucion_prevista: ""
  });

  // Estados para devoluciones
  const [documentosDevolucion, setDocumentosDevolucion] = useState([]);
  const [firmaDevolucion, setFirmaDevolucion] = useState(null);
  const [observacionesDevolucion, setObservacionesDevolucion] = useState("");

  // Cargar datos iniciales
  useEffect(() => {
    const initData = async () => {
      await Promise.all([
        cargarDatos(),
        obtenerUsuarioActual(),
        cargarUsuarios()
      ]);
    };
    initData();
  }, []);

  // Funciones de carga de datos
  const obtenerUsuarioActual = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("usuarios")
          .select("*")
          .eq("email", user.email)
          .single();

        if (data) {
          setCurrentUser(data);
          setFormData(prev => ({
            ...prev,
            nombre_solicitante: data.nombre_completo,
            email: data.email,
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
    const { data } = await supabase
      .from("usuarios")
      .select("*")
      .order("nombre_completo");
    setUsuarios(data || []);
  };

  // Utilidades
  const mostrarMensaje = useCallback((mensaje, tipo) => {
    setMensaje({ mensaje, tipo });
  }, []);

  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      pendiente: "bg-amber-100 text-amber-800 border-amber-300",
      aprobada: "bg-blue-100 text-blue-800 border-blue-300",
      entregada: "bg-emerald-100 text-emerald-800 border-emerald-300",
      devuelta: "bg-gray-100 text-gray-800 border-gray-300",
      vencida: "bg-red-100 text-red-800 border-red-300",
      rechazada: "bg-red-100 text-red-800 border-red-300"
    };
    return `px-3 py-1 text-xs font-medium rounded-full border ${badges[estado] || badges.pendiente}`;
  };

  // Manejadores de formulario
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

  // Gestión de documentos
  const agregarDocumento = (doc) => {
    if (documentosSeleccionados.some(d => d.id === doc.id)) {
      mostrarMensaje("El documento ya está en la lista", "warning");
      return;
    }
    
    const nuevoDoc = {
      ...doc,
      numero_orden: documentosSeleccionados.length + 1,
      ubicacion_topografica: `E${doc.Estante || 1}-B${doc.Balda || 1}`,
      observaciones_documento: ""
    };
    
    setDocumentosSeleccionados(prev => [...prev, nuevoDoc]);
    mostrarMensaje("Documento agregado correctamente", "success");
    setBusquedaDoc("");
  };

  const removerDocumento = (docId) => {
    setDocumentosSeleccionados(prev =>
      prev.filter(d => d.id !== docId)
        .map((d, i) => ({ ...d, numero_orden: i + 1 }))
    );
  };

  const actualizarObservacionDoc = (docId, observacion) => {
    setDocumentosSeleccionados(prev =>
      prev.map(d => d.id === docId ? { ...d, observaciones_documento: observacion } : d)
    );
  };

  // Gestión de nuevo solicitante
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

      const { data: existe } = await supabase
        .from("usuarios")
        .select("*")
        .eq("email", email)
        .single();

      if (existe) {
        mostrarMensaje("Ya existe un usuario con ese correo", "warning");
        return;
      }

      const { data, error } = await supabase
        .from("usuarios")
        .insert(nuevoSolicitante)
        .select()
        .single();

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

  // Guardar solicitud
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
        numero_orden: doc.numero_orden,
        ubicacion_topografica: doc.ubicacion_topografica,
        observaciones_documento: doc.observaciones_documento
      }));

      const { error: errorDocumentos } = await supabase
        .from("solicitudes_documentos")
        .insert(documentosData);

      if (errorDocumentos) throw errorDocumentos;

      mostrarMensaje("Solicitud creada exitosamente", "success");
      
      // Reset form
      setFormData({
        nombre_solicitante: currentUser?.nombre_completo || "",
        entidad: "Electro Sur Este S.A.A.",
        sub_gerencia: currentUser?.sub_gerencia || "",
        email: currentUser?.email || "",
        movil: currentUser?.movil || "",
        motivo_solicitud: "",
        organo_responsable: "",
        descripcion_documentos: "",
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

  // Funciones de modales
  const verSolicitud = async (solicitud) => {
    try {
      setSelectedSolicitud(solicitud);
      const { data: docs, error } = await supabase
        .from("solicitudes_documentos")
        .select("*")
        .eq("solicitud_id", solicitud.id)
        .order("numero_orden", { ascending: true });

      if (error) throw error;

      const enriquecidos = (docs || []).map(d => ({
        ...d,
        info: documentosInventario.find(x => x.id === d.documento_id) || null
      }));
      
      setViewDocs(enriquecidos);
      setShowView(true);
    } catch (error) {
      mostrarMensaje("No se pudo cargar el detalle: " + error.message, "error");
    }
  };

  // Función para abrir modal de devolución
  const abrirDevolucion = async (solicitud) => {
    try {
      setSelectedSolicitud(solicitud);
      
      // Cargar documentos de la solicitud con estado de devolución
      const { data: docs, error } = await supabase
        .from("solicitudes_documentos")
        .select(`
          *,
          devoluciones:devoluciones_documentos(
            id,
            fecha_devolucion,
            cantidad_devuelta,
            observaciones
          )
        `)
        .eq("solicitud_id", solicitud.id)
        .order("numero_orden", { ascending: true });

      if (error) throw error;

      const documentosConInfo = (docs || []).map(d => {
        const info = documentosInventario.find(x => x.id === d.documento_id) || null;
        const totalDevuelto = (d.devoluciones || []).reduce((sum, dev) => sum + (dev.cantidad_devuelta || 0), 0);
        const cantidadPrestada = d.cantidad_prestada || 1;
        const pendientePorDevolver = cantidadPrestada - totalDevuelto;
        
        return {
          ...d,
          info,
          totalDevuelto,
          cantidadPrestada,
          pendientePorDevolver,
          cantidadADevolver: pendientePorDevolver > 0 ? pendientePorDevolver : 0
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

  // Función para actualizar cantidad a devolver
  const actualizarCantidadDevolucion = (docId, cantidad) => {
    setDocumentosDevolucion(prev =>
      prev.map(doc => 
        doc.id === docId 
          ? { 
              ...doc, 
              cantidadADevolver: Math.min(Math.max(0, parseInt(cantidad) || 0), doc.pendientePorDevolver)
            }
          : doc
      )
    );
  };

  // Función para procesar devolución
  const procesarDevolucion = async () => {
    try {
      if (!selectedSolicitud) return;

      const documentosADevolver = documentosDevolucion.filter(doc => doc.cantidadADevolver > 0);
      
      if (documentosADevolver.length === 0) {
        mostrarMensaje("Debe seleccionar al menos un documento para devolver", "error");
        return;
      }

      if (!firmaDevolucion) {
        mostrarMensaje("Debe proporcionar su firma para la devolución", "error");
        return;
      }

      setLoading(true);

      // Crear registros de devolución
      const devolucionesData = documentosADevolver.map(doc => ({
        solicitud_id: selectedSolicitud.id,
        documento_id: doc.documento_id,
        solicitud_documento_id: doc.id,
        cantidad_devuelta: doc.cantidadADevolver,
        fecha_devolucion: new Date().toISOString(),
        observaciones: observacionesDevolucion,
        firma_receptor: firmaDevolucion,
        usuario_receptor_id: currentUser?.id
      }));

      const { error: errorDevoluciones } = await supabase
        .from("devoluciones_documentos")
        .insert(devolucionesData);

      if (errorDevoluciones) throw errorDevoluciones;

      // Verificar si todos los documentos han sido devueltos completamente
      const { data: todosDocumentos, error: errorVerificar } = await supabase
        .from("solicitudes_documentos")
        .select(`
          *,
          devoluciones:devoluciones_documentos(cantidad_devuelta)
        `)
        .eq("solicitud_id", selectedSolicitud.id);

      if (errorVerificar) throw errorVerificar;

      let todosDevueltos = true;
      todosDocumentos.forEach(doc => {
        const cantidadPrestada = doc.cantidad_prestada || 1;
        const totalDevuelto = (doc.devoluciones || []).reduce((sum, dev) => sum + (dev.cantidad_devuelta || 0), 0);
        if (totalDevuelto < cantidadPrestada) {
          todosDevueltos = false;
        }
      });

      // Actualizar estado de la solicitud si corresponde
      let nuevoEstado = selectedSolicitud.estado;
      if (todosDevueltos && selectedSolicitud.estado === "entregada") {
        nuevoEstado = "devuelta";
        
        const { error: errorActualizacion } = await supabase
          .from("solicitudes_archivisticas")
          .update({
            estado: "devuelta",
            fecha_devolucion_real: new Date().toISOString(),
            updated_by: currentUser?.id,
            updated_at: new Date().toISOString()
          })
          .eq("id", selectedSolicitud.id);

        if (errorActualizacion) throw errorActualizacion;
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
      mostrarMensaje("Error al procesar devolución: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const abrirEditar = (solicitud) => {
    setSelectedSolicitud(solicitud);
    setEditForm({
      motivo_solicitud: solicitud.motivo_solicitud || "",
      descripcion_documentos: solicitud.descripcion_documentos || "",
      organo_responsable: solicitud.organo_responsable || "",
      estado: solicitud.estado || "pendiente",
      fecha_devolucion_prevista: solicitud.fecha_devolucion_prevista
        ? new Date(solicitud.fecha_devolucion_prevista).toISOString().slice(0, 10)
        : ""
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
      
      await supabase
        .from("solicitudes_documentos")
        .delete()
        .eq("solicitud_id", selectedSolicitud.id);
      
      const { error } = await supabase
        .from("solicitudes_archivisticas")
        .delete()
        .eq("id", selectedSolicitud.id);

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

  // Filtros
  const documentosFiltrados = documentosInventario.filter(doc =>
    (doc.Descripcion || "").toLowerCase().includes(busquedaDoc.toLowerCase()) ||
    (doc.Serie_Documental || "").toLowerCase().includes(busquedaDoc.toLowerCase()) ||
    (doc.Unidad_Organica || "").toLowerCase().includes(busquedaDoc.toLowerCase())
  );

  const usuariosFiltrados = usuarios.filter(usuario =>
    usuario.nombre_completo.toLowerCase().includes(busquedaSolicitante.toLowerCase()) ||
    usuario.email.toLowerCase().includes(busquedaSolicitante.toLowerCase()) ||
    (usuario.sub_gerencia || "").toLowerCase().includes(busquedaSolicitante.toLowerCase()) ||
    (usuario.entidad || "").toLowerCase().includes(busquedaSolicitante.toLowerCase())
  );

  // Estadísticas
  const stats = {
    pendientes: solicitudes.filter(s => s.estado === "pendiente").length,
    entregadas: solicitudes.filter(s => s.estado === "entregada").length,
    vencidas: solicitudes.filter(s => {
      if (s.estado !== "entregada" || !s.fecha_devolucion_prevista) return false;
      return new Date(s.fecha_devolucion_prevista) < new Date();
    }).length,
    total: solicitudes.length
  };

  const tabs = [
    { id: "nueva", label: "Nueva Solicitud", icon: Plus },
    { id: "pendientes", label: `Pendientes (${stats.pendientes})`, icon: Clock },
    { id: "historial", label: "Historial", icon: Download }
  ];

  return (
    <>
      {mensaje && <Toast {...mensaje} onClose={() => setMensaje(null)} />}

      <CrudLayout title="Servicios Archivísticos" icon={FileText}>
        {/* Estadísticas con diseño mejorado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Pendientes" 
            value={stats.pendientes} 
            icon={Clock}
            color="from-amber-500 to-orange-600" 
          />
          <StatCard 
            title="Entregadas" 
            value={stats.entregadas} 
            icon={CheckCircle}
            color="from-emerald-500 to-green-600" 
          />
          <StatCard 
            title="Vencidas" 
            value={stats.vencidas} 
            icon={AlertTriangle}
            color="from-red-500 to-rose-600"
          />
          <StatCard 
            title="Total" 
            value={stats.total} 
            icon={FileText}
            color="from-indigo-500 to-purple-600"
          />
        </div>

        {/* Pestañas con diseño moderno */}
        <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 font-medium border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? "border-indigo-600 text-indigo-700 bg-indigo-50" 
                  : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300"
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-12">
            <SparkleLoader />
          </div>
        ) : (
          <>
            {/* Nueva Solicitud */}
            {activeTab === "nueva" && (
              <div className="bg-white rounded-2xl shadow-lg border p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-indigo-100 rounded-xl">
                    <FilePlus className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Nueva Solicitud de Servicios Archivísticos
                  </h2>
                </div>

                {/* Sección: Información del Solicitante */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <User className="h-5 w-5 text-indigo-600" />
                    Información del Solicitante
                  </h3>
                  
                  <div className="bg-gray-50 rounded-xl p-6">
                    {/* Buscador de solicitante mejorado */}
                    <div className="mb-6 relative">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Buscar Solicitante
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          value={busquedaSolicitante}
                          onChange={(e) => {
                            setBusquedaSolicitante(e.target.value);
                            setShowUserDropdown(e.target.value.length > 0);
                          }}
                          placeholder="Escriba nombre, correo o área..."
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      
                      {showUserDropdown && busquedaSolicitante && (
                        <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-60 overflow-y-auto">
                          {usuariosFiltrados.length > 0 ? (
                            usuariosFiltrados.map(user => (
                              <div
                                key={user.id}
                                className="px-4 py-3 hover:bg-indigo-50 cursor-pointer border-b last:border-b-0"
                                onClick={() => seleccionarSolicitante(user)}
                              >
                                <div className="font-medium text-gray-900">{user.nombre_completo}</div>
                                <div className="text-sm text-gray-600">{user.email}</div>
                                <div className="text-xs text-gray-500">
                                  {user.sub_gerencia} • {user.entidad}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-center text-gray-500">
                              No se encontraron resultados
                            </div>
                          )}
                          <button
                            className="w-full px-4 py-3 text-indigo-600 hover:bg-indigo-50 border-t flex items-center gap-2 justify-center"
                            onClick={() => {
                              setShowNuevoSolicitante(true);
                              setShowUserDropdown(false);
                            }}
                          >
                            <UserPlus size={16} />
                            Registrar nuevo solicitante
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Información del usuario (4 campos bloqueados) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <UserInfo 
                        label="Nombre Completo"
                        value={formData.nombre_solicitante}
                        icon={User}
                        disabled={true}
                      />
                      <UserInfo 
                        label="Correo Electrónico"
                        value={formData.email}
                        icon={Mail}
                        disabled={true}
                      />
                      <UserInfo 
                        label="Sub Gerencia"
                        value={formData.sub_gerencia}
                        icon={Building}
                        disabled={true}
                      />
                      <UserInfo 
                        label="Teléfono"
                        value={formData.movil}
                        icon={Phone}
                        disabled={true}
                      />
                    </div>
                  </div>
                </div>

                {/* Sección: Detalles de la Solicitud */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    Detalles de la Solicitud
                  </h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Motivo de la Solicitud *
                      </label>
                      <textarea
                        value={formData.motivo_solicitud}
                        onChange={(e) => handleInputChange("motivo_solicitud", e.target.value)}
                        placeholder="Describa el propósito y justificación de su solicitud..."
                        rows="4"
                        className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Órgano Responsable
                        </label>
                        <input
                          type="text"
                          value={formData.organo_responsable}
                          onChange={(e) => handleInputChange("organo_responsable", e.target.value)}
                          placeholder="Área o departamento responsable"
                          className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Modalidad del Servicio
                        </label>
                        <select
                          value={formData.modalidad_servicio}
                          onChange={(e) => handleInputChange("modalidad_servicio", e.target.value)}
                          className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="prestamo_original">Préstamo de Original</option>
                          <option value="copia_simple">Copia Simple</option>
                          <option value="copia_certificada">Copia Certificada</option>
                          <option value="consulta_sala">Consulta en Sala</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Descripción General de Documentos
                        </label>
                        <textarea
                          value={formData.descripcion_documentos}
                          onChange={(e) => handleInputChange("descripcion_documentos", e.target.value)}
                          placeholder="Describa brevemente el tipo de documentos solicitados..."
                          rows="4"
                          className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          <Calendar className="inline h-4 w-4 mr-1" />
                          Fecha de Devolución Prevista
                        </label>
                        <input
                          type="date"
                          value={formData.fecha_devolucion_prevista}
                          onChange={(e) => handleInputChange("fecha_devolucion_prevista", e.target.value)}
                          className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sección: Selección de Documentos */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FileCheck className="h-5 w-5 text-indigo-600" />
                    Selección de Documentos
                  </h3>
                  
                  <div className="bg-gray-50 rounded-xl p-6">
                    <SearchBar 
                      value={busquedaDoc}
                      onChange={setBusquedaDoc}
                      placeholder="Buscar documentos por descripción, serie documental o unidad orgánica..." 
                    />
                    
                    {busquedaDoc && (
                      <div className="mt-4 bg-white border border-gray-200 rounded-xl max-h-64 overflow-y-auto">
                        {documentosFiltrados.length > 0 ? (
                          documentosFiltrados.map((doc) => (
                            <div key={doc.id} className="flex justify-between items-center px-4 py-3 border-b last:border-b-0 hover:bg-gray-50">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-800">{doc.Descripcion}</h4>
                                <p className="text-sm text-gray-600">
                                  Serie: {doc.Serie_Documental}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Unidad: {doc.Unidad_Organica} • E{doc.Estante}-B{doc.Balda}
                                </p>
                              </div>
                              <button 
                                onClick={() => agregarDocumento(doc)}
                                className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                              >
                                Agregar
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-6 text-center text-gray-500">
                            No se encontraron documentos con ese criterio
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Documentos seleccionados */}
                  {documentosSeleccionados.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-semibold text-gray-800 mb-4">
                        Documentos Seleccionados ({documentosSeleccionados.length})
                      </h4>
                      <div className="space-y-4">
                        {documentosSeleccionados.map((doc) => (
                          <SelectedDocument
                            key={doc.id}
                            doc={doc}
                            onRemove={removerDocumento}
                            onUpdateObservation={actualizarObservacionDoc}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sección: Firma Digital */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Signature className="h-5 w-5 text-indigo-600" />
                    Firma Digital del Solicitante
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-6">
                    <DigitalSignature value={firmaTemp} onChange={setFirmaTemp} />
                    <p className="text-sm text-gray-600 mt-3">
                      Su firma digital es requerida para procesar la solicitud
                    </p>
                  </div>
                </div>

                {/* Botón de envío */}
                <div className="flex justify-end pt-6 border-t border-gray-200">
                  <button 
                    onClick={guardarSolicitud}
                    disabled={loading}
                    className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {loading ? "Procesando..." : "Enviar Solicitud"}
                  </button>
                </div>
              </div>
            )}

            {/* Solicitudes Pendientes */}
            {activeTab === "pendientes" && (
              <div className="bg-white rounded-2xl shadow-lg border p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-amber-100 rounded-xl">
                    <Clock className="h-6 w-6 text-amber-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Solicitudes Pendientes</h2>
                </div>
                
                {solicitudes.filter(s => s.estado === "pendiente").length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Clock className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay solicitudes pendientes</h3>
                    <p className="text-gray-500">Todas las solicitudes han sido procesadas</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {solicitudes.filter(s => s.estado === "pendiente").map(solicitud => (
                      <div key={solicitud.id} className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800 mb-2">{solicitud.motivo_solicitud}</h3>
                            <div className="space-y-1 text-sm text-gray-600">
                              <p><strong>Solicitante:</strong> {solicitud.nombre_solicitante}</p>
                              <p><strong>Fecha:</strong> {formatearFecha(solicitud.fecha_solicitud)}</p>
                              <p><strong>Sub Gerencia:</strong> {solicitud.sub_gerencia}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <span className={getEstadoBadge(solicitud.estado)}>{solicitud.estado}</span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => verSolicitud(solicitud)}
                                className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                                title="Ver detalle"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => abrirEditar(solicitud)}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Edit3 size={16} />
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

            {/* Historial */}
            {activeTab === "historial" && (
              <div className="bg-white rounded-2xl shadow-lg border p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-indigo-100 rounded-xl">
                    <Download className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Historial de Solicitudes</h2>
                </div>
                
                {solicitudes.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <FileText className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay solicitudes registradas</h3>
                    <p className="text-gray-500">Comience creando una nueva solicitud</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="text-left p-4 font-semibold text-gray-700">Solicitante</th>
                          <th className="text-left p-4 font-semibold text-gray-700">Motivo</th>
                          <th className="text-left p-4 font-semibold text-gray-700">Estado</th>
                          <th className="text-left p-4 font-semibold text-gray-700">Fecha</th>
                          <th className="text-left p-4 font-semibold text-gray-700">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {solicitudes.map(solicitud => (
                          <tr key={solicitud.id} className="border-b hover:bg-gray-50 transition-colors">
                            <td className="p-4">
                              <div>
                                <div className="font-medium text-gray-800">{solicitud.nombre_solicitante}</div>
                                <div className="text-xs text-gray-500">{solicitud.sub_gerencia}</div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="max-w-xs truncate" title={solicitud.motivo_solicitud}>
                                {solicitud.motivo_solicitud}
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={getEstadoBadge(solicitud.estado)}>
                                {solicitud.estado}
                              </span>
                            </td>
                            <td className="p-4 text-gray-600">
                              {formatearFecha(solicitud.fecha_solicitud)}
                            </td>
                            <td className="p-4">
                              <div className="flex gap-1">
                                <button
                                  onClick={() => verSolicitud(solicitud)}
                                  className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                                  title="Ver detalle"
                                >
                                  <Eye size={16} />
                                </button>
                                <button
                                  onClick={() => abrirEditar(solicitud)}
                                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="Editar"
                                >
                                  <Edit3 size={16} />
                                </button>
                                {(solicitud.modalidad_servicio === "prestamo_original" && 
                                  solicitud.estado === "entregada") && (
                                  <button
                                    onClick={() => abrirDevolucion(solicitud)}
                                    className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                    title="Procesar devolución"
                                  >
                                    <RotateCcw size={16} />
                                  </button>
                                )}
                                <button
                                  onClick={() => setSelectedSolicitud(solicitud) || setShowDelete(true)}
                                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                  title="Eliminar"
                                >
                                  <Trash2 size={16} />
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

      {/* Modal: Nuevo Solicitante */}
      <Modal
        isOpen={showNuevoSolicitante}
        onClose={() => setShowNuevoSolicitante(false)}
        title="Registrar Nuevo Solicitante"
        size="md"
      >
        <div className="space-y-4">
          <InputField 
            label="Nombre Completo"
            value={nuevoSolicitante.nombre_completo}
            onChange={(field, value) => setNuevoSolicitante(prev => ({ ...prev, nombre_completo: value }))}
            required
          />
          <InputField 
            label="Correo Electrónico"
            type="email"
            value={nuevoSolicitante.email}
            onChange={(field, value) => setNuevoSolicitante(prev => ({ ...prev, email: value }))}
            required
          />
          <InputField 
            label="Teléfono Móvil"
            value={nuevoSolicitante.movil}
            onChange={(field, value) => setNuevoSolicitante(prev => ({ ...prev, movil: value }))}
          />
          <InputField 
            label="Sub Gerencia"
            value={nuevoSolicitante.sub_gerencia}
            onChange={(field, value) => setNuevoSolicitante(prev => ({ ...prev, sub_gerencia: value }))}
          />
          <InputField 
            label="Entidad"
            value={nuevoSolicitante.entidad}
            onChange={(field, value) => setNuevoSolicitante(prev => ({ ...prev, entidad: value }))}
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button 
            onClick={() => setShowNuevoSolicitante(false)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={guardarNuevoSolicitante}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Registrar
          </button>
        </div>
      </Modal>

      {/* Modal: Ver Solicitud */}
      <Modal
        isOpen={showView}
        onClose={() => setShowView(false)}
        title="Detalle de Solicitud"
        size="lg"
      >
        {selectedSolicitud && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-semibold text-gray-700">Solicitante</label>
                <p className="mt-1 text-gray-900">{selectedSolicitud.nombre_solicitante}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Estado</label>
                <p className="mt-1">
                  <span className={getEstadoBadge(selectedSolicitud.estado)}>
                    {selectedSolicitud.estado}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Fecha de Solicitud</label>
                <p className="mt-1 text-gray-900">{formatearFecha(selectedSolicitud.fecha_solicitud)}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Sub Gerencia</label>
                <p className="mt-1 text-gray-900">{selectedSolicitud.sub_gerencia}</p>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-semibold text-gray-700">Motivo de la Solicitud</label>
              <p className="mt-1 text-gray-900 whitespace-pre-wrap">{selectedSolicitud.motivo_solicitud}</p>
            </div>
            
            {selectedSolicitud.descripcion_documentos && (
              <div>
                <label className="text-sm font-semibold text-gray-700">Descripción de Documentos</label>
                <p className="mt-1 text-gray-900 whitespace-pre-wrap">{selectedSolicitud.descripcion_documentos}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-semibold text-gray-700">Documentos Solicitados</label>
              <div className="mt-2 bg-gray-50 rounded-lg max-h-64 overflow-y-auto">
                {viewDocs.length === 0 ? (
                  <p className="p-4 text-gray-500 text-center">Sin documentos vinculados</p>
                ) : (
                  <div className="divide-y">
                    {viewDocs.map(doc => (
                      <div key={doc.id} className="p-4">
                        <h4 className="font-medium text-gray-800">
                          {doc.info?.Descripcion || `Documento #${doc.documento_id}`}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {doc.info?.Serie_Documental} • {doc.info?.Unidad_Organica}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Ubicación: {doc.ubicacion_topografica}
                        </p>
                        {doc.observaciones_documento && (
                          <p className="text-sm text-gray-700 mt-2 bg-white p-2 rounded">
                            <strong>Observaciones:</strong> {doc.observaciones_documento}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Editar Solicitud */}
      <Modal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        title="Editar Solicitud"
        size="md"
      >
        <div className="space-y-4">
          <TextareaField 
            label="Motivo de la Solicitud"
            value={editForm.motivo_solicitud}
            onChange={(v) => setEditForm(prev => ({ ...prev, motivo_solicitud: v }))}
            required 
          />
          <TextareaField 
            label="Descripción de Documentos"
            value={editForm.descripcion_documentos}
            onChange={(v) => setEditForm(prev => ({ ...prev, descripcion_documentos: v }))} 
          />
          <InputField 
            label="Órgano Responsable"
            value={editForm.organo_responsable}
            onChange={(field, value) => setEditForm(prev => ({ ...prev, organo_responsable: value }))} 
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Estado</label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={editForm.estado}
                onChange={(e) => setEditForm(prev => ({ ...prev, estado: e.target.value }))}
              >
                <option value="pendiente">Pendiente</option>
                <option value="aprobada">Aprobada</option>
                <option value="entregada">Entregada</option>
                <option value="devuelta">Devuelta</option>
                <option value="rechazada">Rechazada</option>
              </select>
            </div>
            
            <InputField 
              label="Fecha de Devolución Prevista"
              type="date"
              value={editForm.fecha_devolucion_prevista}
              onChange={(field, value) => setEditForm(prev => ({ ...prev, fecha_devolucion_prevista: value }))} 
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button 
            onClick={() => setShowEdit(false)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={guardarEdicion}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </Modal>

      {/* Modal: Confirmar Eliminación */}
      <Modal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        title="Confirmar Eliminación"
        size="sm"
      >
        {selectedSolicitud && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <p className="text-gray-700">
                ¿Está seguro de que desea eliminar la solicitud de{" "}
                <span className="font-semibold">{selectedSolicitud.nombre_solicitante}</span>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="flex justify-center gap-3">
              <button 
                onClick={() => setShowDelete(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmarEliminar}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}