import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../utils/supabaseClient";
import { DigitalSignature } from "../ui/DigitalSignature";
import { SearchBar } from "../controls/SearchBar";
import { FilePlus, User, FileText, FileCheck, Signature, Calendar, UserPlus, Search, MapPin, X, Mail, Building, Phone, ChevronUp, ChevronDown } from "lucide-react";

const UserInfo = ({ label, value, icon: Icon, disabled = false }) => (
  <div className={`relative ${disabled ? 'opacity-90' : ''}`}>
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
      </div>
      <button onClick={() => onRemove(doc.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors" title="Remover documento">
        <X size={16} />
      </button>
    </div>
  </div>
);

const UserDetailsAccordion = ({ formData }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasDetails = formData.email || formData.sub_gerencia || formData.movil;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between p-3 text-left ${
          hasDetails ? 'bg-indigo-50 hover:bg-indigo-100' : 'bg-gray-100 hover:bg-gray-200'
        } transition-colors`}
        disabled={!hasDetails}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">
            {hasDetails ? 'Ver detalles completos' : 'Sin información adicional'}
          </span>
        </div>
        {hasDetails && (
          <div className="text-gray-500 transform transition-transform">
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        )}
      </button>

      {isExpanded && hasDetails && (
        <div className="bg-white p-4 space-y-3 border-t">
          <UserInfo label="Correo Electrónico" value={formData.email} icon={Mail} disabled={true} />
          <UserInfo label="Sub Gerencia" value={formData.sub_gerencia} icon={Building} disabled={true} />
          <UserInfo label="Teléfono" value={formData.movil} icon={Phone} disabled={true} />
        </div>
      )}
    </div>
  );
};

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

const InputField = ({ label, type = "text", value, onChange, required = false, placeholder = "" }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">{label}{required && " *"}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
      required={required}
    />
  </div>
);

const SolicitudServiciosArchivisticos = ({
  currentUser,
  usuarios,
  documentosInventario,
  loading,
  onGuardarSolicitud,
  onMostrarMensaje,
  onCargarDatos
}) => {
  const [formData, setFormData] = useState({
    nombre_solicitante: currentUser?.nombre_completo || "",
    entidad: currentUser?.entidad || "Electro Sur Este S.A.A.",
    sub_gerencia: currentUser?.sub_gerencia || "",
    email: currentUser?.email || "",
    movil: currentUser?.movil || "",
    motivo_solicitud: "",
    modalidad_servicio: "prestamo_original",
    fecha_devolucion_prevista: ""
  });
  
  const [documentosSeleccionados, setDocumentosSeleccionados] = useState([]);
  const [busquedaDoc, setBusquedaDoc] = useState("");
  const [documentosFiltrados, setDocumentosFiltrados] = useState([]);
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

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const seleccionarSolicitante = useCallback((user) => {
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
  }, []);

  const agregarDocumento = useCallback((doc) => {
    if (documentosSeleccionados.some(d => d.id === doc.id)) {
      onMostrarMensaje("El documento ya está en la lista", "warning");
      return;
    }
    const nuevoDoc = {
      ...doc,
      numero_orden: documentosSeleccionados.length + 1,
      ubicacion_topografica: `E${doc.Estante || 1}-C${doc.Cuerpo || 1}-B${doc.Balda || 1}`,
      observaciones_documento: ""
    };
    setDocumentosSeleccionados(prev => [...prev, nuevoDoc]);
    onMostrarMensaje("Documento agregado correctamente", "success");
    setBusquedaDoc("");
  }, [documentosSeleccionados, onMostrarMensaje]);

  const removerDocumento = useCallback((docId) => {
    setDocumentosSeleccionados(prev => prev.filter(d => d.id !== docId).map((d, i) => ({ ...d, numero_orden: i + 1 })));
  }, []);

  const actualizarObservacionDoc = useCallback((docId, observacion) => {
    setDocumentosSeleccionados(prev => prev.map(d => d.id === docId ? { ...d, observaciones_documento: observacion } : d));
  }, []);

  const guardarNuevoSolicitante = async () => {
    try {
      const { nombre_completo, email } = nuevoSolicitante;
      if (!nombre_completo || !email) {
        onMostrarMensaje("Nombre y correo son obligatorios", "error");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        onMostrarMensaje("Correo no válido", "error");
        return;
      }
      
      const { data: existe } = await supabase
        .from("usuarios")
        .select("*")
        .eq("email", email)
        .single();
        
      if (existe) {
        onMostrarMensaje("Ya existe un usuario con ese correo", "warning");
        return;
      }
      
      const { data, error } = await supabase
        .from("usuarios")
        .insert(nuevoSolicitante)
        .select()
        .single();
        
      if (error) throw error;
      
      seleccionarSolicitante(data);
      onMostrarMensaje("Nuevo solicitante registrado", "success");
      setShowNuevoSolicitante(false);
      setNuevoSolicitante({
        nombre_completo: "",
        email: "",
        movil: "",
        sub_gerencia: "",
        entidad: "Electro Sur Este S.A.A."
      });
    } catch (error) {
      onMostrarMensaje("Error al registrar solicitante: " + error.message, "error");
    }
  };

  const handleGuardarSolicitud = async () => {
    try {
      const { nombre_solicitante, email, motivo_solicitud } = formData;
      if (!nombre_solicitante || !email || !motivo_solicitud) {
        onMostrarMensaje("Complete los campos obligatorios", "error");
        return;
      }
      if (documentosSeleccionados.length === 0) {
        onMostrarMensaje("Debe seleccionar al menos un documento", "error");
        return;
      }
      if (!firmaTemp) {
        onMostrarMensaje("Debe proporcionar su firma digital", "error");
        return;
      }
      
      await onGuardarSolicitud({
        formData,
        documentosSeleccionados,
        firmaTemp
      });
      
      // Resetear el formulario después de guardar
      setFormData({
        nombre_solicitante: currentUser?.nombre_completo || "",
        entidad: "Electro Sur Este S.A.A.",
        sub_gerencia: currentUser?.sub_gerencia || "",
        email: currentUser?.email || "",
        movil: currentUser?.movil || "",
        motivo_solicitud: "",
        modalidad_servicio: "Préstamo de Original",
        fecha_devolucion_prevista: ""
      });
      setDocumentosSeleccionados([]);
      setFirmaTemp(null);
    } catch (error) {
      onMostrarMensaje("Error al crear solicitud: " + error.message, "error");
    }
  };

  const fetchDocumentos = useCallback(async () => {
    if (!busquedaDoc.trim()) {
      setDocumentosFiltrados([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("Inventario_documental")
        .select("*")
        .or(`Descripcion.ilike.%${busquedaDoc}%,id.ilike.%${busquedaDoc}%,Numero_Caja.ilike.%${busquedaDoc}%`)
        .limit(20);

      if (error) throw error;
      setDocumentosFiltrados(data || []);
    } catch (err) {
      console.error("Error al buscar documentos:", err.message);
      onMostrarMensaje("Error al buscar documentos: " + err.message, "error");
    }
  }, [busquedaDoc, onMostrarMensaje]);

  const fetchUsuarios = useCallback(async () => {
    if (!busquedaSolicitante.trim()) {
      setShowUserDropdown(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("usuarios")
        .select("*") 
        .or(`nombre_completo.ilike.%${busquedaSolicitante}%,email.ilike.%${busquedaSolicitante}%,sub_gerencia.ilike.%${busquedaSolicitante}%,entidad.ilike.%${busquedaSolicitante}%`)
        .limit(20);

      if (error) throw error;
      setShowUserDropdown(true);
    } catch (err) {
      console.error("Error al buscar usuarios:", err.message);
      onMostrarMensaje("Error al buscar usuarios: " + err.message, "error");
    }
  }, [busquedaSolicitante, onMostrarMensaje]);

  useEffect(() => {
    const timeoutId = setTimeout(fetchDocumentos, 300);
    return () => clearTimeout(timeoutId);
  }, [fetchDocumentos]);

  useEffect(() => {
    const timeoutId = setTimeout(fetchUsuarios, 300);
    return () => clearTimeout(timeoutId);
  }, [fetchUsuarios]);

  const usuariosFiltrados = (usuarios || []).filter(usuario =>
    usuario.nombre_completo.toLowerCase().includes(busquedaSolicitante.toLowerCase()) ||
    usuario.email.toLowerCase().includes(busquedaSolicitante.toLowerCase()) ||
    (usuario.sub_gerencia || "").toLowerCase().includes(busquedaSolicitante.toLowerCase()) ||
    (usuario.entidad || "").toLowerCase().includes(busquedaSolicitante.toLowerCase())
  );

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg border p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-indigo-100 rounded-xl"><FilePlus className="h-6 w-6 text-indigo-600" /></div>
          <h2 className="text-2xl font-bold text-gray-800">Nueva Solicitud de Servicios Archivísticos</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-indigo-600" />Información del Solicitante
              </h3>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="mb-4 relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Buscar Solicitante</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input 
                      type="text" 
                      value={busquedaSolicitante} 
                      onChange={(e) => setBusquedaSolicitante(e.target.value)}
                      placeholder="Escriba nombre, correo o área..." 
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                    />
                  </div>
                  {showUserDropdown && busquedaSolicitante && (
                    <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-60 overflow-y-auto">
                      {usuariosFiltrados.length > 0 ? usuariosFiltrados.map((usuario) => (
                        <div key={usuario.id} onClick={() => seleccionarSolicitante(usuario)} className="px-3 py-2 hover:bg-gray-100 cursor-pointer rounded-md">
                          <p className="font-medium text-gray-800">{usuario.nombre_completo}</p>
                          <p className="text-xs text-gray-500">{usuario.email}</p>
                          <p className="text-xs text-gray-400">{usuario.sub_gerencia ? usuario.sub_gerencia + " • " : ""}{usuario.entidad || ""}</p>
                        </div>
                      )) : (
                        <div className="px-4 py-4 text-center text-gray-500 text-sm">No se encontraron usuarios con ese criterio</div>
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
                  <UserDetailsAccordion formData={formData} />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />Detalles de la Solicitud
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Motivo de la Solicitud *</label>
                  <textarea 
                    value={formData.motivo_solicitud} 
                    onChange={(e) => handleInputChange("motivo_solicitud", e.target.value)} 
                    placeholder="Describa el propósito y justificación de su solicitud..." 
                    rows="3" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none" 
                    required 
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Modalidad del Servicio</label>
                    <select 
                      value={formData.modalidad_servicio} 
                      onChange={(e) => handleInputChange("modalidad_servicio", e.target.value)} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="prestamo_original">Préstamo de Original</option>
                      <option value="copia_simple">Copia Simple</option>
                      <option value="copia_certificada">Copia Certificada</option>
                      <option value="consulta_sala">Consulta en Sala</option>
                    </select>
                  </div>
                  
                  {formData.modalidad_servicio === "prestamo_original" && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Calendar className="inline h-4 w-4 mr-1" />Fecha de Devolución Prevista
                      </label>
                      <input 
                        type="date" 
                        value={formData.fecha_devolucion_prevista} 
                        onChange={(e) => handleInputChange("fecha_devolucion_prevista", e.target.value)} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                        min={new Date().toISOString().split('T')[0]} 
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-indigo-600" />Selección de Documentos
              </h3>
              <div className="bg-gray-50 rounded-xl p-4">
                <SearchBar value={busquedaDoc} onChange={setBusquedaDoc} placeholder="Buscar documentos por descripción o id..." />
                {busquedaDoc && (
                  <div className="mt-5 bg-white border border-gray-200 rounded-xl max-h-48 overflow-y-auto">
                    {documentosFiltrados.length > 0 ? documentosFiltrados.map((doc) => (
                      <div key={doc.id} className="flex justify-between items-center px-3 py-2 border-b last:border-b-0 hover:bg-gray-50">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800 text-sm">{doc.Descripcion}</h4>
                          <p className="text-xs text-gray-600">Unidad: {doc.Unidad_Organica} • Caja: {doc.Numero_Caja}</p>
                        </div>
                        <button 
                          onClick={() => agregarDocumento(doc)} 
                          className="ml-2 px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs font-medium"
                        >
                          Agregar
                        </button>
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
                  <div className="mt-3 text-xs text-gray-500">
                    Total de documentos: {documentosSeleccionados.length}
                  </div>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Signature className="h-5 w-5 text-indigo-600" />Firma Digital
              </h3>
              <div className="bg-gray-50 rounded-xl p-4">
                <DigitalSignature value={firmaTemp} onChange={setFirmaTemp} />
                <p className="text-sm text-gray-600 mt-2">Su firma digital es requerida para procesar la solicitud</p>
                {firmaTemp && (
                  <p className="text-xs text-green-600 mt-1">✓ Firma registrada correctamente</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-gray-200 mt-6">
          <button 
            onClick={handleGuardarSolicitud} 
            disabled={loading} 
            className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? "Procesando..." : "Enviar Solicitud"}
          </button>
        </div>
      </div>

      <Modal isOpen={showNuevoSolicitante} onClose={() => setShowNuevoSolicitante(false)} title="Registrar Nuevo Solicitante" size="md">
        <div className="space-y-4">
          <InputField 
            label="Nombre Completo" 
            value={nuevoSolicitante.nombre_completo} 
            onChange={(value) => setNuevoSolicitante(prev => ({ ...prev, nombre_completo: value }))} 
            required 
            placeholder="Nombre completo del solicitante"
          />
          <InputField 
            label="Correo Electrónico" 
            type="email"
            value={nuevoSolicitante.email} 
            onChange={(value) => setNuevoSolicitante(prev => ({ ...prev, email: value }))} 
            required 
            placeholder="correo@ejemplo.com"
          />
          <InputField 
            label="Teléfono Móvil" 
            value={nuevoSolicitante.movil} 
            onChange={(value) => setNuevoSolicitante(prev => ({ ...prev, movil: value }))} 
            placeholder="Número de teléfono"
          />
          <InputField 
            label="Sub Gerencia" 
            value={nuevoSolicitante.sub_gerencia} 
            onChange={(value) => setNuevoSolicitante(prev => ({ ...prev, sub_gerencia: value }))} 
            placeholder="Sub gerencia o departamento"
          />
          <InputField 
            label="Entidad" 
            value={nuevoSolicitante.entidad} 
            onChange={(value) => setNuevoSolicitante(prev => ({ ...prev, entidad: value }))} 
            placeholder="Entidad o empresa"
          />
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <button 
            onClick={() => setShowNuevoSolicitante(false)} 
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm"
          >
            Cancelar
          </button>
          <button 
            onClick={guardarNuevoSolicitante} 
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
          >
            Registrar Solicitante
          </button>
        </div>
      </Modal>
    </>
  );
};

export default SolicitudServiciosArchivisticos;