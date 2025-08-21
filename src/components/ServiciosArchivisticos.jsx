import React, { useState, useEffect, useRef } from "react";
import { 
  FileText, 
  User, 
  Building, 
  Phone, 
  Mail, 
  Calendar, 
  Search,
  Plus,
  Trash2,
  Save,
  Send,
  PenTool,
  CheckCircle,
  AlertTriangle,
  Download,
  Eye,
  X
} from "lucide-react";

// Simulamos la conexión a Supabase (reemplazar con importación real)
const supabase = {
  from: (table) => ({
    select: (fields) => ({
      eq: (field, value) => Promise.resolve({ data: [], error: null }),
      order: (field, options) => Promise.resolve({ data: [], error: null }),
      insert: (data) => Promise.resolve({ data: [data], error: null }),
      update: (data) => Promise.resolve({ data: [data], error: null })
    }),
    insert: (data) => Promise.resolve({ data: [data], error: null }),
    update: (data) => Promise.resolve({ data: [data], error: null })
  })
};

// Componente de Firma Digital
const FirmaDigital = ({ onFirmaChange, firma, label }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1f2937';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL();
    onFirmaChange(dataURL);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onFirmaChange('');
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="border border-gray-300 rounded-lg p-2 bg-white">
        <canvas
          ref={canvasRef}
          width={300}
          height={150}
          className="border border-gray-200 rounded cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
        <button
          type="button"
          onClick={clearSignature}
          className="mt-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded flex items-center gap-1"
        >
          <X size={14} />
          Limpiar
        </button>
      </div>
    </div>
  );
};

// Componente principal
export default function SolicitudServiciosArchivisticos() {
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [documentosSeleccionados, setDocumentosSeleccionados] = useState([]);
  const [busquedaDoc, setBusquedaDoc] = useState('');
  const [showDocumentSelector, setShowDocumentSelector] = useState(false);

  // Estados del formulario
  const [formulario, setFormulario] = useState({
    // Datos del solicitante
    entidad: 'Electro Sur Este S.A.A.',
    sub_gerencia: '',
    nombre_solicitante: '',
    telefono: '',
    email: '',
    motivo_solicitud: '',
    
    // Solicitud del servicio
    modalidad_servicio: 'Préstamo de documento original',
    organo_responsable: '',
    descripcion_solicitud: '',
    fecha_prestamo: new Date().toISOString().split('T')[0],
    fecha_devolucion_prevista: '',
    fecha_ampliacion: '',
    
    // Firmas
    firma_solicitante: '',
    firma_archivo_central: '',
    firma_responsable: '',
    
    observaciones: ''
  });

  // Cargar documentos del inventario
  useEffect(() => {
    cargarDocumentos();
  }, []);

  const cargarDocumentos = async () => {
    try {
      const { data, error } = await supabase
        .from('Inventario_documental')
        .select('*')
        .order('Descripcion', { ascending: true });
      
      if (error) throw error;
      setDocumentos(data || []);
    } catch (err) {
      console.error('Error cargando documentos:', err);
    }
  };

  const handleInputChange = (field, value) => {
    setFormulario(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const agregarDocumento = (doc) => {
    if (!documentosSeleccionados.find(d => d.id === doc.id)) {
      setDocumentosSeleccionados(prev => [...prev, doc]);
      setShowDocumentSelector(false);
      setBusquedaDoc('');
    }
  };

  const removerDocumento = (docId) => {
    setDocumentosSeleccionados(prev => prev.filter(d => d.id !== docId));
  };

  const documentosFiltrados = documentos.filter(doc =>
    doc.Descripcion?.toLowerCase().includes(busquedaDoc.toLowerCase()) ||
    doc.Serie_Documental?.toLowerCase().includes(busquedaDoc.toLowerCase()) ||
    doc.Numero_Caja?.toLowerCase().includes(busquedaDoc.toLowerCase())
  );

  const guardarBorrador = async () => {
    setLoading(true);
    try {
      const prestamoData = {
        ...formulario,
        nombre_prestatario: formulario.nombre_solicitante,
        email_prestatario: formulario.email,
        estado_prestamo: 'borrador',
        fecha_devolucion_prevista: formulario.fecha_devolucion_prevista + 'T23:59:59Z'
      };

      const { data: prestamo, error: prestamoError } = await supabase
        .from('prestamos')
        .insert(prestamoData);

      if (prestamoError) throw prestamoError;

      // Insertar documentos seleccionados
      if (documentosSeleccionados.length > 0) {
        const documentosData = documentosSeleccionados.map(doc => ({
          prestamo_id: prestamo[0].id,
          documento_id: doc.id,
          estado_documento: 'prestado'
        }));

        const { error: docsError } = await supabase
          .from('prestamos_documentos')
          .insert(documentosData);

        if (docsError) throw docsError;
      }

      setMensaje({
        mensaje: 'Borrador guardado exitosamente',
        tipo: 'success'
      });

    } catch (err) {
      setMensaje({
        mensaje: 'Error al guardar: ' + err.message,
        tipo: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const enviarSolicitud = async () => {
    // Validaciones
    if (!formulario.nombre_solicitante || !formulario.email || !formulario.telefono) {
      setMensaje({
        mensaje: 'Complete todos los campos obligatorios del solicitante',
        tipo: 'error'
      });
      return;
    }

    if (!formulario.fecha_devolucion_prevista) {
      setMensaje({
        mensaje: 'Indique la fecha de devolución prevista',
        tipo: 'error'
      });
      return;
    }

    if (documentosSeleccionados.length === 0) {
      setMensaje({
        mensaje: 'Seleccione al menos un documento',
        tipo: 'error'
      });
      return;
    }

    if (!formulario.firma_solicitante) {
      setMensaje({
        mensaje: 'La firma del solicitante es obligatoria',
        tipo: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      const prestamoData = {
        ...formulario,
        nombre_prestatario: formulario.nombre_solicitante,
        email_prestatario: formulario.email,
        estado_prestamo: 'prestado'
      };

      const { data: prestamo, error: prestamoError } = await supabase
        .from('prestamos')
        .insert(prestamoData);

      if (prestamoError) throw prestamoError;

      // Insertar documentos seleccionados
      const documentosData = documentosSeleccionados.map(doc => ({
        prestamo_id: prestamo[0].id,
        documento_id: doc.id,
        estado_documento: 'prestado'
      }));

      const { error: docsError } = await supabase
        .from('prestamos_documentos')
        .insert(documentosData);

      if (docsError) throw docsError;

      setMensaje({
        mensaje: 'Solicitud enviada exitosamente',
        tipo: 'success'
      });

      // Limpiar formulario
      setFormulario({
        entidad: 'Electro Sur Este S.A.A.',
        sub_gerencia: '',
        nombre_solicitante: '',
        telefono: '',
        email: '',
        motivo_solicitud: '',
        modalidad_servicio: 'Préstamo de documento original',
        organo_responsable: '',
        descripcion_solicitud: '',
        fecha_prestamo: new Date().toISOString().split('T')[0],
        fecha_devolucion_prevista: '',
        fecha_ampliacion: '',
        firma_solicitante: '',
        firma_archivo_central: '',
        firma_responsable: '',
        observaciones: ''
      });
      setDocumentosSeleccionados([]);

    } catch (err) {
      setMensaje({
        mensaje: 'Error al enviar solicitud: ' + err.message,
        tipo: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      {/* Toast de mensajes */}
      {mensaje && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 ${
          mensaje.tipo === 'success' ? 'bg-green-100 text-green-800 border border-green-200' 
                                    : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {mensaje.tipo === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
          {mensaje.mensaje}
          <button onClick={() => setMensaje(null)} className="ml-2">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-t-2xl shadow-lg p-6 border-b border-gray-200">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              FORMATO DE SOLICITUD DE SERVICIOS ARCHIVÍSTICOS
            </h1>
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>FORMATO DE SOLICITUD DE INFORMACIÓN</span>
              <span>FECHA DE SOLICITUD: {new Date().toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-b-2xl p-6">
          {/* I. DATOS DEL SOLICITANTE */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b-2 border-indigo-600 flex items-center gap-2">
              <User className="text-indigo-600" size={20} />
              I. DATOS DEL SOLICITANTE
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Entidad *</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={formulario.entidad}
                    onChange={(e) => handleInputChange('entidad', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Nombre de la entidad"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sub Gerencia/Oficina/Unidad</label>
                <input
                  type="text"
                  value={formulario.sub_gerencia}
                  onChange={(e) => handleInputChange('sub_gerencia', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Área o departamento"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Solicitante *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={formulario.nombre_solicitante}
                    onChange={(e) => handleInputChange('nombre_solicitante', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Nombre completo"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono/Móvil *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={formulario.telefono}
                    onChange={(e) => handleInputChange('telefono', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Número de teléfono"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="email"
                    value={formulario.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de la Solicitud</label>
                <textarea
                  value={formulario.motivo_solicitud}
                  onChange={(e) => handleInputChange('motivo_solicitud', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows="3"
                  placeholder="Describa el motivo de su solicitud"
                />
              </div>
            </div>
          </div>

          {/* II. DETALLE DE DOCUMENTOS SOLICITADOS */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b-2 border-indigo-600 flex items-center gap-2">
              <FileText className="text-indigo-600" size={20} />
              II. DETALLE DE DOCUMENTO(S) SOLICITADO(S)
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Órgano o Unidad Orgánica Responsable del Documento Solicitado</label>
                <input
                  type="text"
                  value={formulario.organo_responsable}
                  onChange={(e) => handleInputChange('organo_responsable', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ej: Gerencia de Planeamiento"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción de documento(s) solicitado(s)</label>
                <textarea
                  value={formulario.descripcion_solicitud}
                  onChange={(e) => handleInputChange('descripcion_solicitud', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows="3"
                  placeholder="Describa los documentos que necesita"
                />
              </div>

              {/* Selector de documentos */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Documentos Seleccionados</label>
                  <button
                    type="button"
                    onClick={() => setShowDocumentSelector(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Seleccionar Documentos
                  </button>
                </div>

                {documentosSeleccionados.length > 0 && (
                  <div className="border border-gray-300 rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
                    {documentosSeleccionados.map((doc, index) => (
                      <div key={doc.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 text-sm">
                            <span className="font-medium">{index + 1}</span>
                            <span className="text-gray-600">Caja: {doc.Numero_Caja}</span>
                            <span className="text-gray-600">Folios: {doc.Numero_Folios}</span>
                            <span className="text-gray-600">Fecha: {doc.Fecha_Inicial}</span>
                            <span className="text-gray-600">Ubicación: E{doc.Estante}-B{doc.Balda}</span>
                          </div>
                          <div className="font-medium text-gray-900 mt-1">
                            {doc.Descripcion}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removerDocumento(doc.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Modal selector de documentos */}
          {showDocumentSelector && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Seleccionar Documentos del Inventario</h3>
                  <button
                    onClick={() => setShowDocumentSelector(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      value={busquedaDoc}
                      onChange={(e) => setBusquedaDoc(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="Buscar por descripción, serie documental o número de caja..."
                    />
                  </div>
                </div>

                <div className="overflow-y-auto max-h-96">
                  {documentosFiltrados.map(doc => (
                    <div
                      key={doc.id}
                      className="border-b border-gray-200 p-3 hover:bg-gray-50 cursor-pointer"
                      onClick={() => agregarDocumento(doc)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{doc.Descripcion}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            <span>Serie: {doc.Serie_Documental}</span> | 
                            <span> Caja: {doc.Numero_Caja}</span> | 
                            <span> Folios: {doc.Numero_Folios}</span>
                          </div>
                          <div className="text-sm text-gray-500">
                            Ubicación: E{doc.Estante}-B{doc.Balda} | 
                            Fechas: {doc.Fecha_Inicial} - {doc.Fecha_Final}
                          </div>
                        </div>
                        <button className="text-indigo-600 hover:text-indigo-800">
                          <Plus size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* IV. SOLICITUD DEL SERVICIO */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b-2 border-indigo-600">
              IV. SOLICITUD DEL SERVICIO
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modalidad de Servicio</label>
                <select
                  value={formulario.modalidad_servicio}
                  onChange={(e) => handleInputChange('modalidad_servicio', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Préstamo de documento original">Préstamo de documento original</option>
                  <option value="Consulta en sala">Consulta en sala</option>
                  <option value="Copia certificada">Copia certificada</option>
                  <option value="Digitalización">Digitalización</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Devolución Prevista *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="date"
                    value={formulario.fecha_devolucion_prevista}
                    onChange={(e) => handleInputChange('fecha_devolucion_prevista', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Ampliación de Préstamo</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="date"
                    value={formulario.fecha_ampliacion}
                    onChange={(e) => handleInputChange('fecha_ampliacion', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                <textarea
                  value={formulario.observaciones}
                  onChange={(e) => handleInputChange('observaciones', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows="3"
                  placeholder="Observaciones adicionales"
                />
              </div>
            </div>
          </div>

          {/* V. ATENCIÓN DE LA SOLICITUD */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b-2 border-indigo-600">
              V. ATENCIÓN DE LA SOLICITUD
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FirmaDigital
                label="Firma del Archivo Central"
                firma={formulario.firma_archivo_central}
                onFirmaChange={(firma) => handleInputChange('firma_archivo_central', firma)}
              />

              <FirmaDigital
                label="Firma del Responsable del Documento"
                firma={formulario.firma_responsable}
                onFirmaChange={(firma) => handleInputChange('firma_responsable', firma)}
              />
            </div>
          </div>

          {/* VI. CONFORMIDAD DEL SERVICIO */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b-2 border-indigo-600">
              VI. CONFORMIDAD DEL SERVICIO
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FirmaDigital
                label="Firma del Solicitante *"
                firma={formulario.firma_solicitante}
                onFirmaChange={(firma) => handleInputChange('firma_solicitante', firma)}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora</label>
                <input
                  type="datetime-local"
                  value={new Date().toISOString().slice(0, 16)}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* III. DEVOLUCIÓN DE DOCUMENTOS */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-600">
              III. DEVOLUCIÓN DE DOCUMENTOS
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 italic">
                Esta sección será completada por el Archivo Central al momento de la devolución de los documentos.
              </p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Devolución</label>
                  <input
                    type="date"
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    placeholder="A completar por Archivo Central"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones de Devolución</label>
                  <textarea
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    rows="2"
                    placeholder="A completar por Archivo Central"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-wrap gap-4 justify-end pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={guardarBorrador}
              disabled={loading}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                <Save size={16} />
              )}
              Guardar Borrador
            </button>

            <button
              type="button"
              onClick={enviarSolicitud}
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                <Send size={16} />
              )}
              Enviar Solicitud
            </button>

            <button
              type="button"
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Download size={16} />
              Exportar PDF
            </button>
          </div>

          {/* Información adicional */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-medium text-blue-900 mb-2">Información Importante:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Los campos marcados con (*) son obligatorios.</li>
              <li>• La firma digital del solicitante es requerida para enviar la solicitud.</li>
              <li>• Los documentos seleccionados serán validados por el Archivo Central.</li>
              <li>• Recibirá una notificación por email sobre el estado de su solicitud.</li>
              <li>• El tiempo de respuesta es de 2-5 días hábiles según la complejidad.</li>
            </ul>
          </div>

          {/* Resumen de documentos seleccionados */}
          {documentosSeleccionados.length > 0 && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                <CheckCircle size={16} />
                Resumen de Documentos Seleccionados ({documentosSeleccionados.length})
              </h3>
              <div className="text-sm text-green-800">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="font-medium">Total Cajas:</span>
                    <span className="ml-2">
                      {[...new Set(documentosSeleccionados.map(d => d.Numero_Caja))].length}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Total Folios:</span>
                    <span className="ml-2">
                      {documentosSeleccionados.reduce((sum, d) => sum + (d.Numero_Folios || 0), 0)}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Series Documentales:</span>
                    <span className="ml-2">
                      {[...new Set(documentosSeleccionados.map(d => d.Serie_Documental))].length}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Ubicaciones:</span>
                    <span className="ml-2">
                      {[...new Set(documentosSeleccionados.map(d => `E${d.Estante}-B${d.Balda}`))].length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Historial de solicitudes previas (placeholder) */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <FileText size={16} />
              Mis Solicitudes Recientes
            </h3>
            <p className="text-sm text-gray-600">
              Aquí se mostrarán sus últimas solicitudes de servicios archivísticos.
            </p>
            <div className="mt-2">
              <button className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center gap-1">
                <Eye size={14} />
                Ver historial completo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}