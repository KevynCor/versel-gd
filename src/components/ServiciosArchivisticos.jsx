import React, { useState, useEffect } from "react";
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
  FilePlus, Signature, X, Eye, Trash2, Edit3, Search, toLowerCase
} from "lucide-react";

export default function ServiciosArchivisticos() {
  const [tab, setTab] = useState("nueva");
  const [solicitudes, setSolicitudes] = useState([]);
  const [documentosInventario, setDocumentosInventario] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Estados para formulario de nueva solicitud
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

  const [documentosSeleccionados, setDocumentosSeleccionados] = useState([]);
  const [busquedaDoc, setBusquedaDoc] = useState("");

  // Estados para buscador de solicitante + modal nuevo
  const [usuarios, setUsuarios] = useState([]);
  const [busquedaSolicitante, setBusquedaSolicitante] = useState("");
  const [showNuevoSolicitante, setShowNuevoSolicitante] = useState(false);
  const [nuevoSolicitante, setNuevoSolicitante] = useState({
    nombre_completo: "",
    email: "",
    movil: "",
    sub_gerencia: "",
    entidad: "Electro Sur Este S.A.A." // Valor por defecto, pero editable
  });

  const [firmaTemp, setFirmaTemp] = useState(null);

  // Estados para Ver / Editar / Eliminar
  const [showView, setShowView] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [viewDocs, setViewDocs] = useState([]);
  const [editForm, setEditForm] = useState({
    organo_responsable: "",
    estado: "pendiente",
    fecha_devolucion_prevista: ""
  });

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
    obtenerUsuarioActual();
    cargarUsuarios();
  }, []);

  const obtenerUsuarioActual = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("usuarios")
          .select("*")
          .eq("email", user.email)
          .single();

        setCurrentUser(data);
        if (data) {
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
      const { data: solicitudesData, error: errorSolicitudes } = await supabase
        .from("vista_solicitudes_completa")
        .select("*")
        .order("fecha_solicitud", { ascending: false });
      if (errorSolicitudes) throw errorSolicitudes;
      setSolicitudes(solicitudesData || []);

      const { data: inventarioData, error: errorInventario } = await supabase
        .from("Inventario_documental")
        .select("*")
        .order("Descripcion");
      if (errorInventario) throw errorInventario;
      setDocumentosInventario(inventarioData || []);
    } catch (error) {
      setMensaje({ mensaje: "Error cargando datos: " + error.message, tipo: "error" });
    } finally {
      setLoading(false);
    }
  };

  const cargarUsuarios = async () => {
    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .order("nombre_completo");
    if (!error) setUsuarios(data || []);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Seleccionar solicitante existente
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
  };

  const cancelarNuevoSolicitante = () => {
    setShowNuevoSolicitante(false);
    setNuevoSolicitante({
      nombre_completo: "",
      email: "",
      movil: "",
      sub_gerencia: "",
      entidad: "Electro Sur Este S.A.A."
    });
  };

  // Guardar nuevo solicitante en BD
  const guardarNuevoSolicitante = async () => {
    try {
      if (!nuevoSolicitante.nombre_completo || !nuevoSolicitante.email) {
        setMensaje({ mensaje: "Nombre y correo son obligatorios", tipo: "error" });
        return;
      }

      // Evitar duplicados por email
      const { data: existe, error: errorCheck } = await supabase
        .from("usuarios")
        .select("*")
        .eq("email", nuevoSolicitante.email)
        .single();
      if (errorCheck && errorCheck.code !== "PGRST116") throw errorCheck;
      if (existe) {
        setMensaje({ mensaje: "Ya existe un usuario con ese correo", tipo: "warning" });
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
      setMensaje({ mensaje: "Nuevo solicitante registrado", tipo: "success" });
      setShowNuevoSolicitante(false);
      setNuevoSolicitante({
        nombre_completo: "",
        email: "",
        movil: "",
        sub_gerencia: "",
        entidad: "Electro Sur Este S.A.A."
      });

      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nuevoSolicitante.email);
      if (!isValidEmail) {
        setMensaje({ mensaje: "Correo no válido", tipo: "error" });
        return;
      }
    } catch (e) {
      setMensaje({ mensaje: "Error al registrar solicitante: " + e.message, tipo: "error" });
    }
  };

  const agregarDocumento = (doc) => {
    if (documentosSeleccionados.some(d => d.id === doc.id)) {
      setMensaje({ mensaje: "El documento ya está en la lista", tipo: "warning" });
      return;
    }
    const nuevoDoc = {
      ...doc,
      numero_orden: documentosSeleccionados.length + 1,
      ubicacion_topografica: `E${doc.Estante || 1}-B${doc.Balda || 1}`,
      observaciones_documento: ""
    };
    setDocumentosSeleccionados(prev => [...prev, nuevoDoc]);
    setMensaje({ mensaje: "Documento agregado correctamente", tipo: "success" });
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

  const guardarSolicitud = async () => {
    try {
      if (!formData.nombre_solicitante || !formData.email || !formData.motivo_solicitud) {
        setMensaje({ mensaje: "Complete los campos obligatorios", tipo: "error" });
        return;
      }
      if (documentosSeleccionados.length === 0) {
        setMensaje({ mensaje: "Debe seleccionar al menos un documento", tipo: "error" });
        return;
      }
      if (!firmaTemp) {
        setMensaje({ mensaje: "Debe proporcionar su firma digital", tipo: "error" });
        return;
      }

      setLoading(true);

      const { data: solicitud, error: errorSolicitud } = await supabase
        .from("solicitudes_archivisticas")
        .insert({
          nombre_solicitante: formData.nombre_solicitante,
          entidad: formData.entidad,
          sub_gerencia: formData.sub_gerencia,
          email: formData.email,
          movil: formData.movil,
          motivo_solicitud: formData.motivo_solicitud,
          organo_responsable: formData.organo_responsable,
          descripcion_documentos: formData.descripcion_documentos,
          modalidad_servicio: formData.modalidad_servicio,
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

      setMensaje({ mensaje: "Solicitud creada exitosamente", tipo: "success" });

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
      setTab("pendientes");
    } catch (error) {
      setMensaje({ mensaje: "Error al crear solicitud: " + error.message, tipo: "error" });
    } finally {
      setLoading(false);
    }
  };

  const documentosFiltrados = documentosInventario.filter(doc =>
    (doc.Descripcion || "").toLowerCase().includes(busquedaDoc.toLowerCase()) ||
    (doc.Serie_Documental || "").toLowerCase().includes(busquedaDoc.toLowerCase()) ||
    (doc.Unidad_Organica || "").toLowerCase().includes(busquedaDoc.toLowerCase())
  );

  const usuariosFiltrados = usuarios.filter(usuario =>
    usuario.nombre_completo.toLowerCase().includes(busquedaSolicitante.toLowerCase()) ||
    usuario.email.toLowerCase().includes(busquedaSolicitante.toLowerCase()) ||
    usuario.sub_gerencia?.toLowerCase().includes(busquedaSolicitante.toLowerCase()) ||
    usuario.entidad?.toLowerCase().includes(busquedaSolicitante.toLowerCase())
  );

  const stats = {
    pendientes: solicitudes.filter(s => s.estado === "pendiente").length,
    entregadas: solicitudes.filter(s => s.estado === "entregada").length,
    vencidas: solicitudes.filter(s => {
      if (s.estado !== "entregada" || !s.fecha_devolucion_prevista) return false;
      return new Date(s.fecha_devolucion_prevista) < new Date();
    }).length,
    total: solicitudes.length
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      pendiente: "bg-yellow-100 text-yellow-800 border-yellow-300",
      aprobada: "bg-blue-100 text-blue-800 border-blue-300",
      entregada: "bg-green-100 text-green-800 border-green-300",
      devuelta: "bg-gray-100 text-gray-800 border-gray-300",
      vencida: "bg-red-100 text-red-800 border-red-300",
      rechazada: "bg-red-100 text-red-800 border-red-300"
    };
    return `px-2 py-1 text-xs rounded-full border ${badges[estado] || badges.pendiente}`;
  };

  const verSolicitud = async (s) => {
    try {
      setSelectedSolicitud(s);
      const { data: docs, error } = await supabase
        .from("solicitudes_documentos")
        .select("id, documento_id, numero_orden, ubicacion_topografica, observaciones_documento")
        .eq("solicitud_id", s.id)
        .order("numero_orden", { ascending: true });
      if (error) throw error;

      const enriquecidos = (docs || []).map(d => ({
        ...d,
        info: documentosInventario.find(x => x.id === d.documento_id) || null
      }));
      setViewDocs(enriquecidos);
      setShowView(true);
    } catch (e) {
      setMensaje({ mensaje: "No se pudo cargar el detalle: " + e.message, tipo: "error" });
    }
  };

  const abrirEditar = (s) => {
    setSelectedSolicitud(s);
    setEditForm({
      motivo_solicitud: s.motivo_solicitud || "",
      descripcion_documentos: s.descripcion_documentos || "",
      organo_responsable: s.organo_responsable || "",
      estado: s.estado || "pendiente",
      fecha_devolucion_prevista: s.fecha_devolucion_prevista
        ? new Date(s.fecha_devolucion_prevista).toISOString().slice(0, 10)
        : ""
    });
    setShowEdit(true);
  };

  const guardarEdicion = async () => {
    if (!selectedSolicitud) return;
    try {
      setLoading(true);
      const payload = {
        motivo_solicitud: editForm.motivo_solicitud,
        descripcion_documentos: editForm.descripcion_documentos,
        organo_responsable: editForm.organo_responsable,
        estado: editForm.estado,
        fecha_devolucion_prevista: editForm.fecha_devolucion_prevista || null,
        updated_by: currentUser?.id,
        updated_at: new Date().toISOString()
      };
      const { error } = await supabase
        .from("solicitudes_archivisticas")
        .update(payload)
        .eq("id", selectedSolicitud.id);
      if (error) throw error;
      setMensaje({ mensaje: "Solicitud actualizada", tipo: "success" });
      setShowEdit(false);
      setSelectedSolicitud(null);
      await cargarDatos();
    } catch (e) {
      setMensaje({ mensaje: "No se pudo actualizar: " + e.message, tipo: "error" });
    } finally {
      setLoading(false);
    }
  };

  const abrirEliminar = (s) => {
    setSelectedSolicitud(s);
    setShowDelete(true);
  };

  const confirmarEliminar = async () => {
    if (!selectedSolicitud) return;
    try {
      setLoading(true);
      const { error: errDocs } = await supabase
        .from("solicitudes_documentos")
        .delete()
        .eq("solicitud_id", selectedSolicitud.id);
      if (errDocs) throw errDocs;
      const { error: errSol } = await supabase
        .from("solicitudes_archivisticas")
        .delete()
        .eq("id", selectedSolicitud.id);
      if (errSol) throw errSol;
      setMensaje({ mensaje: "Solicitud eliminada", tipo: "success" });
      setShowDelete(false);
      setSelectedSolicitud(null);
      await cargarDatos();
    } catch (e) {
      setMensaje({ mensaje: "No se pudo eliminar: " + e.message, tipo: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {mensaje && <Toast {...mensaje} onClose={() => setMensaje(null)} />}

      <CrudLayout title="Servicios Archivísticos" icon={FileText}>
        {/* Estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard title="Pendientes" value={stats.pendientes} icon={Clock}
            color="from-yellow-600 to-orange-700" />
          <StatCard title="Entregadas" value={stats.entregadas} icon={CheckCircle}
            color="from-green-600 to-emerald-700" />
          <StatCard title="Vencidas" value={stats.vencidas} icon={AlertTriangle}
            color="from-red-600 to-rose-700"/>
          <StatCard title="Total" value={stats.total} icon={FileText}
            color="from-indigo-600 to-purple-700"/>
        </div>

        {/* Pestañas */}
        <div className="flex border-b border-slate-200 mb-6 flex-wrap">
          {[
            { id: "nueva", label: "Nueva Solicitud", icon: Plus },
            { id: "pendientes", label: "Pendientes", icon: Clock },
            { id: "historial", label: "Historial", icon: Download }
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 font-medium border-b-2 transition whitespace-nowrap ${
                tab === t.id ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-600 hover:text-slate-800"
              }`}>
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <SparkleLoader />
        ) : (
          <div className="space-y-6">

            {/* Nueva Solicitud */}
            {tab === "nueva" && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <FilePlus className="text-indigo-600" />
                  Nueva Solicitud de Servicios Archivísticos
                </h2>
                {/* Nombre Solicitante con búsqueda mejorada */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nombre Solicitante
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={busquedaSolicitante}
                      onChange={(e) => setBusquedaSolicitante(e.target.value)}
                      placeholder="Buscar solicitante..."
                      className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                  </div>
                  
                  {busquedaSolicitante && (
                    <div className="absolute z-20 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                      {usuariosFiltrados.length > 0 ? (
                        usuariosFiltrados.map(u => (
                          <div
                            key={u.id}
                            className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b last:border-b-0"
                            onClick={() => seleccionarSolicitante(u)}
                          >
                            <div className="font-medium text-slate-900">{u.nombre_completo}</div>
                            <div className="text-sm text-slate-500">{u.email}</div>
                            <div className="text-xs text-slate-400">{u.sub_gerencia} · {u.entidad}</div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-center text-slate-500">
                          No se encontraron resultados
                        </div>
                      )}
                      <div
                        className="px-4 py-3 text-indigo-600 hover:bg-indigo-50 cursor-pointer border-t"
                        onClick={() => setShowNuevoSolicitante(true)}
                      >
                        + Registrar nuevo solicitante
                      </div>
                    </div>
                  )}
                </div>

                {/* Campos pre-llenados */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <InputField label="Entidad" value={formData.entidad} onChange={(v) => handleInputChange("entidad", v)} />
                  <InputField label="Sub Gerencia" value={formData.sub_gerencia}  onChange={(v) => handleInputChange("sub_gerencia", v)} />
                  <InputField label="Correo" value={formData.email} onChange={(v) => handleInputChange("email", v)} required />
                  <InputField label="Móvil" value={formData.movil} onChange={(v) => handleInputChange("movil", v)} />
                </div>
                <TextareaField 
                  label="Motivo de Solicitud"
                  value={editForm.motivo_solicitud}
                  onChange={(field, value) => setEditForm(f => ({ ...f, motivo_solicitud: value }))}
                  required 
                />
                <TextareaField 
                  label="Descripción de Documentos"
                  value={editForm.descripcion_documentos}
                  onChange={(field, value) => setEditForm(f => ({ ...f, descripcion_documentos: value }))} 
                />

                {/* Buscar documentos */}
                <div className="mt-4">
                  <SearchBar 
                    value={busquedaDoc}
                    onChange={setBusquedaDoc}
                    placeholder="Buscar en inventario documental..." 
                  />
                  {busquedaDoc && (
                    <div className="border rounded-lg mt-2 max-h-40 overflow-y-auto">
                      {documentosFiltrados.map((doc) => (
                        <div key={doc.id}
                          className="flex justify-between items-center px-3 py-2 border-b hover:bg-slate-50">
                          <div>
                            <p className="font-medium">{doc.Descripcion}</p>
                            <p className="text-xs text-slate-500">
                              {doc.Serie_Documental} - {doc.Unidad_Organica}
                            </p>
                          </div>
                          <button 
                            onClick={() => agregarDocumento(doc)}
                            className="text-indigo-600 text-sm font-medium hover:text-indigo-800"
                          >
                            Agregar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Documentos seleccionados */}
                {documentosSeleccionados.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Documentos Seleccionados</h3>
                    <div className="border rounded-lg divide-y">
                      {documentosSeleccionados.map((d) => (
                        <div key={d.id} className="flex justify-between items-center px-3 py-2">
                          <div className="w-full pr-2">
                            <p className="font-medium">{d.Descripcion}</p>
                            <textarea
                              className="mt-1 text-sm border rounded p-1 w-full"
                              placeholder="Observaciones"
                              value={d.observaciones_documento}
                              onChange={(e) => actualizarObservacionDoc(d.id, e.target.value)}
                            />
                          </div>
                          <button 
                            onClick={() => removerDocumento(d.id)} 
                            className="text-red-600 hover:text-red-800 ml-2"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Firma digital */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <Signature className="text-indigo-600" /> Firma Digital del Solicitante
                  </h3>
                  <DigitalSignature value={firmaTemp} onChange={setFirmaTemp} />
                </div>

                {/* Botón guardar */}
                <div className="mt-6 flex justify-end">
                  <button 
                    onClick={guardarSolicitud}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg shadow transition-colors"
                  >
                    Guardar Solicitud
                  </button>
                </div>
              </div>
            )}

            {/* Pendientes */}
            {tab === "pendientes" && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Clock className="text-yellow-600" /> Solicitudes Pendientes
                </h2>
                {solicitudes.filter(s => s.estado === "pendiente").length === 0 ? (
                  <p className="text-slate-500">No hay solicitudes pendientes.</p>
                ) : (
                  <div className="divide-y">
                    {solicitudes.filter(s => s.estado === "pendiente").map(s => (
                      <div key={s.id} className="py-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{s.motivo_solicitud}</p>
                          <p className="text-xs text-slate-500">
                            Solicitante: {s.nombre_solicitante} - {formatearFecha(s.fecha_solicitud)}
                          </p>
                        </div>
                        <span className={getEstadoBadge(s.estado)}>{s.estado}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Historial */}
            {tab === "historial" && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Download className="text-indigo-600" /> Historial de Solicitudes
                </h2>
                {solicitudes.length === 0 ? (
                  <p className="text-slate-500">No se encontraron solicitudes registradas.</p>
                ) : (
                  <table className="w-full text-sm border rounded-lg">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="p-2 text-left">Solicitante</th>
                        <th className="p-2 text-left">Motivo</th>
                        <th className="p-2 text-left">Estado</th>
                        <th className="p-2 text-left">Fecha Solicitud</th>
                        <th className="p-2 text-left">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {solicitudes.map(s => (
                        <tr key={s.id} className="border-t">
                          <td className="p-2">{s.nombre_solicitante}</td>
                          <td className="p-2">{s.motivo_solicitud}</td>
                          <td className="p-2">
                            <span className={getEstadoBadge(s.estado)}>{s.estado}</span>
                          </td>
                          <td className="p-2">{formatearFecha(s.fecha_solicitud)}</td>
                          <td className="p-2 flex gap-2">
                            <button
                              onClick={() => verSolicitud(s)}
                              className="text-indigo-600 hover:underline flex items-center gap-1 text-xs"
                            >
                              <Eye size={14} /> Ver
                            </button>
                            <button
                              onClick={() => abrirEditar(s)}
                              className="text-slate-600 hover:underline flex items-center gap-1 text-xs"
                            >
                              <Edit3 size={14} /> Editar
                            </button>
                            <button
                              onClick={() => abrirEliminar(s)}
                              className="text-red-600 hover:underline flex items-center gap-1 text-xs"
                            >
                              <Trash2 size={14} /> Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}
      </CrudLayout>

      {/* Modal Registrar Nuevo Solicitante */}
      {showNuevoSolicitante && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold mb-4">Registrar Nuevo Solicitante</h3>
            
            <div className="space-y-3">
              <InputField 
                label="Nombre Completo"
                value={nuevoSolicitante.nombre_completo}
                onChange={(field, value) => setNuevoSolicitante(f => ({ ...f, nombre_completo: value }))}
                required
              />
              <InputField 
                label="Correo"
                value={nuevoSolicitante.email}
                onChange={(field, value)  => setNuevoSolicitante(f => ({ ...f, email: value }))}
                required
              />
              <InputField 
                label="Móvil"
                value={nuevoSolicitante.movil}
                onChange={(filed, value) => setNuevoSolicitante(f => ({ ...f, movil: value }))}
              />
              <InputField 
                label="Sub Gerencia"
                value={nuevoSolicitante.sub_gerencia}
                onChange={(filed, value) => setNuevoSolicitante(f => ({ ...f, sub_gerencia: value }))}
              />
              <InputField 
                label="Entidad"
                value={nuevoSolicitante.entidad}
                onChange={(filed, value) => setNuevoSolicitante(f => ({ ...f, entidad: value }))}
              />
            </div>

            {/* Botones */}
            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={cancelarNuevoSolicitante}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button 
                onClick={guardarNuevoSolicitante}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Ver solicitud */}
      {showView && selectedSolicitud && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40"
            onClick={() => setShowView(false)} />
          <div className="relative bg-white w-full max-w-3xl rounded-xl shadow-lg border p-4">
            <div className="flex items-center justify-between border-b pb-3 mb-3">
              <h3 className="text-lg font-semibold">Detalle de solicitud</h3>
              <button 
                className="p-2 rounded hover:bg-slate-100 transition-colors"
                onClick={() => setShowView(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Solicitante</p>
                <p className="font-medium">{selectedSolicitud.nombre_solicitante}</p>
              </div>
              <div>
                <p className="text-slate-500">Estado</p>
                <p>
                  <span className={getEstadoBadge(selectedSolicitud.estado)}>
                    {selectedSolicitud.estado}
                  </span>
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-slate-500">Motivo</p>
                <p className="font-medium">{selectedSolicitud.motivo_solicitud}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-slate-500">Descripción</p>
                <p className="font-medium whitespace-pre-wrap">
                  {selectedSolicitud.descripcion_documentos || '-'}
                </p>
              </div>
            </div>
            <h4 className="mt-4 font-semibold">Documentos solicitados</h4>
            <div className="mt-2 max-h-64 overflow-y-auto border rounded-lg divide-y">
              {viewDocs.length === 0 ? (
                <p className="p-3 text-sm text-slate-500">
                  Sin documentos vinculados.
                </p>
              ) : (
                viewDocs.map(d => (
                  <div key={d.id} className="p-3">
                    <p className="font-medium">
                      {d.info?.Descripcion || `Documento #${d.documento_id}`}
                    </p>
                    <p className="text-xs text-slate-500">
                      {d.info?.Serie_Documental} · {d.info?.Unidad_Organica}
                    </p>
                    <p className="text-xs text-slate-500">
                      Ubicación: {d.ubicacion_topografica}
                    </p>
                    {d.observaciones_documento && (
                      <p className="text-xs mt-1">
                        Obs.: {d.observaciones_documento}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button 
                className="px-4 py-2 rounded-lg border hover:bg-slate-50 transition-colors"
                onClick={() => setShowView(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar solicitud */}
      {showEdit && selectedSolicitud && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40"
            onClick={() => setShowEdit(false)} />
          <div className="relative bg-white w-full max-w-2xl rounded-xl shadow-lg border p-4">
            <div className="flex items-center justify-between border-b pb-3 mb-3">
              <h3 className="text-lg font-semibold">Editar solicitud</h3>
              <button 
                className="p-2 rounded hover:bg-slate-100 transition-colors"
                onClick={() => setShowEdit(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <TextareaField 
                label="Motivo de Solicitud"
                value={formData.motivo_solicitud}
                onChange={(e) => handleInputChange("motivo_solicitud", e.target.value)}
                required 
              />
              <TextareaField 
                label="Descripción de Documentos"
                value={formData.descripcion_documentos}
                onChange={(e) => handleInputChange("descripcion_documentos", e.target.value)} 
              />
              <InputField 
                label="Órgano Responsable"
                value={editForm.organo_responsable}
                onChange={(v) => setEditForm(f => ({
                  ...f, organo_responsable: v
                }))} 
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-600">Estado</label>
                  <select 
                    className="mt-1 w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={editForm.estado}
                    onChange={(e) => setEditForm(f => ({
                      ...f, estado: e.target.value
                    }))}>
                    <option value="pendiente">Pendiente</option>
                    <option value="aprobada">Aprobada</option>
                    <option value="entregada">Entregada</option>
                    <option value="devuelta">Devuelta</option>
                    <option value="rechazada">Rechazada</option>
                  </select>
                </div>
                <div>
                  <InputField 
                    label="Fecha devolución prevista"
                    type="date"
                    value={editForm.fecha_devolucion_prevista}
                    onChange={(v) => setEditForm(f => ({
                      ...f, fecha_devolucion_prevista: v
                    }))} 
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button 
                className="px-4 py-2 rounded-lg border hover:bg-slate-50 transition-colors"
                onClick={() => setShowEdit(false)}>
                Cancelar
              </button>
              <button 
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                onClick={guardarEdicion}>
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmar eliminación */}
      {showDelete && selectedSolicitud && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40"
            onClick={() => setShowDelete(false)} />
          <div className="relative bg-white w-full max-w-md rounded-xl shadow-lg border p-4">
            <div className="flex items-center justify-between border-b pb-3 mb-3">
              <h3 className="text-lg font-semibold">Eliminar solicitud</h3>
              <button 
                className="p-2 rounded hover:bg-slate-100 transition-colors"
                onClick={() => setShowDelete(false)}>
                <X size={18} />
              </button>
            </div>
            <p className="text-sm">
              Esta acción no se puede deshacer. ¿Deseas eliminar la solicitud de{" "}
              <span className="font-medium">
                {selectedSolicitud.nombre_solicitante}
              </span>?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button 
                className="px-4 py-2 rounded-lg border hover:bg-slate-50 transition-colors"
                onClick={() => setShowDelete(false)}>
                Cancelar
              </button>
              <button 
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                onClick={confirmarEliminar}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}