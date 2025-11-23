import React, { useState, useMemo, useRef, useEffect } from 'react';
import { supabase } from "../../../utils/supabaseClient"; 
import { Clock, Check, Search, Trash2, FileText, AlertCircle, X, Scan, PlusSquare, Save, Box, RefreshCw, Ban } from "lucide-react";
import { DigitalSignature } from "../../../components/ui/DigitalSignature";
import { TextareaField } from "../../../components/ui/TextareaField";
import jsQR from "jsqr"; 

// --- COMPONENTES UI LOCALES ---
const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
  if (!isOpen) return null;
  const sizeClasses = { sm: "max-w-md", md: "max-w-2xl", lg: "max-w-4xl", xl: "max-w-6xl" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white w-full ${sizeClasses[size]} rounded-2xl shadow-2xl border max-h-[90vh] overflow-y-auto`}>
        <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

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
  return <span className={`px-3 py-1 text-xs font-medium rounded-full border uppercase ${badges[estado] || badges.pendiente}`}>{estado}</span>;
};

// --- COMPONENTE ESCÁNER QR ---
const ScannerModal = ({ isOpen, onClose, onScan }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);

  const iniciarCamara = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        videoRef.current.onloadedmetadata = () => {
             videoRef.current.play().catch(e => console.error("Error playing video", e));
             iniciarEscaneoQR();
        };
      }
    } catch (error) {
      console.error("Error al acceder a la cámara:", error);
      alert("No se pudo acceder a la cámara. Verifique permisos HTTPS/Navegador.");
    }
  };

  const detenerCamara = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const iniciarEscaneoQR = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const context = canvas.getContext('2d', { willReadFrequently: true });

    const escanearFrame = () => {
      if (!animationFrameRef.current) return;
      
      try {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // TODO: Descomentar cuando instales jsQR
          /*
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
          
          if (code) {
            onScan(code.data);
            detenerCamara();
            onClose();
            return;
          }
          */
        }
        if (animationFrameRef.current) {
          animationFrameRef.current = requestAnimationFrame(escanearFrame);
        }
      } catch (error) {
        console.error("Error en escaneo:", error);
        animationFrameRef.current = requestAnimationFrame(escanearFrame);
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(escanearFrame);
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => iniciarCamara(), 300);
    } else {
      detenerCamara();
    }
    return () => detenerCamara();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl border max-h-[90vh] overflow-hidden">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Scan size={24} /> Escanear QR</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><X size={20} /></button>
        </div>
        <div className="p-6">
          <div className="relative bg-black rounded-lg overflow-hidden mx-auto aspect-square max-w-sm">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-2 border-green-500 w-48 h-48 rounded-lg animate-pulse"></div>
            </div>
          </div>
          <p className="mt-4 text-center text-sm text-slate-500">Apunta la cámara hacia el código QR</p>
          <div className="mt-2 text-center bg-amber-50 text-amber-700 p-2 rounded text-xs">
            Nota: Instala <strong>jsqr</strong> para habilitar la lectura real.
          </div>
          <div className="mt-4 flex justify-center">
            <button onClick={onClose} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---

export default function PendientesTab({ solicitudes, currentUser, onReload, onMensaje }) {
    const [selectedSolicitud, setSelectedSolicitud] = useState(null);
    const [showProcessModal, setShowProcessModal] = useState(false);
    
    // --- ESTADOS PARA RECHAZO ---
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [motivoRechazo, setMotivoRechazo] = useState("");
    
    const [showScanner, setShowScanner] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [buscandoDocs, setBuscandoDocs] = useState(false);
    const [guardandoBorrador, setGuardandoBorrador] = useState(false);

    // --- ESTADOS PROCESO ---
    const [busquedaDoc, setBusquedaDoc] = useState("");
    const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
    const [documentosSeleccionados, setDocumentosSeleccionados] = useState([]);
    const [firma, setFirma] = useState(null);
    const [observacionesAtencion, setObservacionesAtencion] = useState("");

    // --- HELPER: Formatear Modalidad ---
    const formatModalidad = (modalidad) => {
        const mapa = {
            'prestamo_original': 'Préstamo de Original',
            'copia_simple': 'Copia Simple',
            'copia_certificada': 'Copia Certificada',
            'consulta_sala': 'Consulta en Sala',
            'digitalizacion': 'Digitalización'
        };
        return mapa[modalidad] || modalidad || 'No especificado';
    };

    // --- BÚSQUEDA MEJORADA (RPC MULTI-TÉRMINO) ---
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (busquedaDoc.length < 2) {
                setResultadosBusqueda([]);
                return;
            }

            setBuscandoDocs(true);
            try {
                const { data, error } = await supabase
                    .rpc('buscar_documentos_archivisticos', { busqueda: busquedaDoc });

                if (error) {
                    console.warn("RPC error (fallback):", error.message);
                    const { data: simpleData } = await supabase
                        .from("Inventario_documental")
                        .select("*")
                        .ilike('Descripcion', `%${busquedaDoc}%`)
                        .limit(20);
                    setResultadosBusqueda(simpleData || []);
                } else {
                    setResultadosBusqueda(data || []);
                }
            } catch (error) {
                console.error("Error en búsqueda:", error);
                setResultadosBusqueda([]);
            } finally {
                setBuscandoDocs(false);
            }
        }, 400);

        return () => clearTimeout(delayDebounceFn);
    }, [busquedaDoc]);

    // --- FUNCIONES ---
    
    const handleScanResult = async (code) => {
        setBusquedaDoc(code);
        setBuscandoDocs(true);
        try {
            const { data, error } = await supabase
                .from("Inventario_documental")
                .select("*")
                .eq("id", code)
                .single();

            if (data) {
                agregarDocumento(data);
                onMensaje(`Documento escaneado: ${data.Descripcion}`, "success");
                setBusquedaDoc(""); 
            } else {
                onMensaje(`Código: ${code}. Verifique resultados.`, "info");
            }
        } catch (err) {
             onMensaje(`Código escaneado: ${code}. No exacto.`, "info");
        } finally {
            setBuscandoDocs(false);
        }
    };

    const agregarDocumento = (doc) => {
        if (documentosSeleccionados.some(d => d.id === doc.id)) {
            onMensaje("El documento ya está en la lista", "error");
            return;
        }
        const nuevoDoc = { ...doc, numero_orden: documentosSeleccionados.length + 1 };
        setDocumentosSeleccionados([...documentosSeleccionados, nuevoDoc]);
    };

    // NUEVA FUNCIÓN: Agregar todo en bloque
    const agregarTodoEnBloque = () => {
        const nuevosDocs = resultadosBusqueda.filter(
            r => !documentosSeleccionados.some(d => d.id === r.id)
        );

        if (nuevosDocs.length === 0) {
            onMensaje("Todos los documentos ya están agregados.", "info");
            return;
        }

        const docsConOrden = nuevosDocs.map((doc, index) => ({
            ...doc,
            numero_orden: documentosSeleccionados.length + index + 1
        }));

        setDocumentosSeleccionados([...documentosSeleccionados, ...docsConOrden]);
        setBusquedaDoc(""); 
        setResultadosBusqueda([]);
        onMensaje(`Se agregaron ${nuevosDocs.length} documentos.`, "success");
    };

    const eliminarDocumento = (id) => {
        setDocumentosSeleccionados(prev => prev.filter(d => d.id !== id));
    };

    // NUEVA FUNCIÓN: Eliminar TODOS los documentos
    const eliminarTodosDocumentos = () => {
        if (window.confirm("¿Estás seguro de quitar todos los documentos seleccionados?")) {
            setDocumentosSeleccionados([]);
        }
    };

    // --- LOGICA DE BORRADOR (GUARDAR/RECUPERAR) ---

    const cargarBorrador = async (solicitudId) => {
        try {
            const { data, error } = await supabase
                .from('atenciones_temporales')
                .select('*')
                .eq('solicitud_id', solicitudId)
                .single();
            
            if (data) {
                if (data.documentos_json) setDocumentosSeleccionados(data.documentos_json);
                if (data.firma_temp) setFirma(data.firma_temp);
                if (data.observaciones_temp) setObservacionesAtencion(data.observaciones_temp);
                onMensaje("Borrador recuperado exitosamente.", "success");
            }
        } catch (error) {
            // Es normal si no hay borrador, no mostramos error
            console.log("No hay borrador previo.");
        }
    };

    const guardarBorrador = async () => {
        if (!selectedSolicitud) return;
        
        setGuardandoBorrador(true);
        try {
            const { error } = await supabase
                .from('atenciones_temporales')
                .upsert({
                    solicitud_id: selectedSolicitud.id,
                    documentos_json: documentosSeleccionados,
                    firma_temp: firma,
                    observaciones_temp: observacionesAtencion,
                    updated_at: new Date().toISOString()
                });
            
            if (error) throw error;
            onMensaje("Progreso guardado. Puede continuar más tarde.", "success");
        } catch (error) {
            console.error(error);
            onMensaje("Error al guardar borrador: " + error.message, "error");
        } finally {
            setGuardandoBorrador(false);
        }
    };

    const handleAtenderClick = async (solicitud) => {
        setSelectedSolicitud(solicitud);
        // Resetear estados
        setDocumentosSeleccionados([]);
        setFirma(null);
        setBusquedaDoc("");
        setResultadosBusqueda([]);
        setObservacionesAtencion("");
        
        setShowProcessModal(true);
        
        // Intentar cargar borrador existente
        await cargarBorrador(solicitud.id);
    };

    const confirmarAtencion = async () => {
        if (documentosSeleccionados.length === 0) return onMensaje("Seleccione al menos un documento.", "error");
        if (!firma) return onMensaje("Firma obligatoria.", "error");

        setProcessing(true);
        try {
            const docsData = documentosSeleccionados.map(doc => ({
                solicitud_id: selectedSolicitud.id,
                documento_id: doc.id,
                descripcion: doc.Descripcion,
                serie: doc.Serie_Documental,
                unidad: doc.Unidad_Organica,
                caja: doc.Numero_Caja,
                // Ubicación formateada si no existe
                ubicacion_topografica: doc.ubicacion_topografica || `(${doc.Ambiente || '?'}-${doc.Estante || '?'}-${doc.Cuerpo || '?'}-${doc.Balda || '?'})`,
                numero_orden: doc.numero_orden,
                estado_documento: 'entregado', 
                fecha_entrega: new Date().toISOString()
            }));

            const { error: errDocs } = await supabase.from("solicitudes_documentos").insert(docsData);
            if (errDocs) throw errDocs;

            const { error: errSol } = await supabase.from("solicitudes_archivisticas").update({
                estado: 'entregada', 
                fecha_entrega: new Date().toISOString(),
                firma_conformidad: firma, 
                fecha_firma_conformidad: new Date().toISOString(),
                observaciones_archivo: observacionesAtencion,
                updated_by: currentUser.id
            }).eq("id", selectedSolicitud.id);

            if (errSol) throw errSol;

            // Limpiar borrador si existe, ya que se completó
            await supabase.from('atenciones_temporales').delete().eq('solicitud_id', selectedSolicitud.id);

            onMensaje("Solicitud atendida exitosamente.", "success");
            setShowProcessModal(false);
            onReload(); 

        } catch (e) { 
            console.error(e);
            onMensaje("Error al procesar: " + e.message, "error"); 
        } finally { 
            setProcessing(false); 
        }
    };

    // --- LÓGICA DE RECHAZO ---

    const handleRechazarClick = (solicitud) => {
        setSelectedSolicitud(solicitud);
        setMotivoRechazo("");
        setShowRejectModal(true);
    };

    const confirmarRechazo = async () => {
        if (!motivoRechazo.trim()) {
            return onMensaje("Debe ingresar un motivo para el rechazo.", "error");
        }

        setProcessing(true);
        try {
            const { error } = await supabase
                .from("solicitudes_archivisticas")
                .update({
                    estado: 'rechazada',
                    observaciones_archivo: motivoRechazo,
                    updated_by: currentUser.id,
                    updated_at: new Date().toISOString()
                })
                .eq("id", selectedSolicitud.id);

            if (error) throw error;

            onMensaje("La solicitud ha sido rechazada.", "success");
            setShowRejectModal(false);
            onReload();
        } catch (e) {
            console.error(e);
            onMensaje("Error al rechazar: " + e.message, "error");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Clock className="text-amber-600"/> Solicitudes Pendientes de Atención
            </h2>
            
            {solicitudes.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <p>No hay solicitudes pendientes.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {solicitudes.map(sol => (
                        <div key={sol.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="bg-white text-amber-700 text-xs font-bold px-2 py-0.5 rounded border border-amber-200">#{sol.numero_solicitud || sol.id.slice(0,8)}</span>
                                    <div className="group relative w-full">
                                        <h3 className="text-gray-900 group-hover:line-clamp-none transition-all duration-200 whitespace-pre-wrap line-clamp-2 group-hover:line-clamp-none transition-all duration-200">
                                            {sol.motivo_solicitud}
                                        </h3>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-600">Solicitante: <strong>{sol.nombre_solicitante}</strong> ({sol.sub_gerencia})</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Fecha y hora: {new Date(sol.fecha_solicitud).toLocaleString('es-ES', {dateStyle: 'short',timeStyle: 'short'})} • <span className="font-medium text-indigo-600">{formatModalidad(sol.modalidad_servicio)}</span>
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <EstadoBadge estado={sol.estado} />
                                <button onClick={() => handleAtenderClick(sol)} className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium flex items-center gap-2 shadow-sm">
                                 <Check size={16}/> Atender </button>
                                <button onClick={() => handleRechazarClick(sol)} 
                                    className="px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
                                    title="Rechazar Solicitud"> <Ban size={16}/> Rechazar</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* --- MODAL DE ATENCIÓN --- */}
            <Modal isOpen={showProcessModal} onClose={() => setShowProcessModal(false)} title="Atención de Solicitud" size="xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-1">
                    
                    {/* COLUMNA IZQUIERDA: SELECCIÓN DE DOCUMENTOS */}
                    <div className="space-y-4">
                        <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                            <h4 className="font-bold text-indigo-800 text-sm mb-1 flex items-center gap-2"><FileText size={16}/> Selección de Documentos</h4>
                            <p className="text-xs text-indigo-600">Busque en el inventario para entregar.</p>
                        </div>

                        <div className="relative">
                            <div className="relative flex">
                                <input
                                    type="text"
                                    placeholder="Buscar: Descripción; Código; Caja (separar con ';')"
                                    className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                                    value={busquedaDoc}
                                    onChange={(e) => setBusquedaDoc(e.target.value)}
                                />
                                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                <button 
                                    onClick={() => setShowScanner(true)} 
                                    className="absolute right-2 top-1 p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" 
                                    title="Escanear código QR"
                                >
                                    <Scan size={20} />
                                </button>
                            </div>
                            
                            {buscandoDocs && <div className="p-2 text-xs text-indigo-500">Buscando en base de datos...</div>}

                            {/* LISTA DE RESULTADOS DE BÚSQUEDA */}
                            {resultadosBusqueda.length > 0 && !buscandoDocs && (
                                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-60 overflow-y-auto">
                                    {/* Opción Agregar Todo */}
                                    {resultadosBusqueda.length > 1 && (
                                        <div 
                                            onClick={agregarTodoEnBloque}
                                            className="p-3 bg-indigo-50 hover:bg-indigo-100 cursor-pointer border-b border-indigo-200 text-sm flex items-center gap-2 font-semibold text-indigo-700 sticky top-0"
                                        >
                                            <PlusSquare size={16} /> Agregar los {resultadosBusqueda.length} resultados
                                        </div>
                                    )}

                                    {resultadosBusqueda.map(doc => (
                                        <div 
                                            key={doc.id} 
                                            onClick={() => agregarDocumento(doc)}
                                            className="p-3 hover:bg-indigo-50 cursor-pointer border-b last:border-0 text-sm group"
                                        >
                                            <div className="flex justify-between items-start">
                                                <span className="font-medium text-gray-800">{doc.Descripcion}</span>
                                                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600"><Box className="w-4 h-4"/>{doc.Numero_Caja}</span>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1 flex gap-2">
                                                <span>ID: {doc.id}</span> • <span>{doc.Unidad_Organica}</span> • <span>{doc.Tipo_Unidad_Conservacion}</span> • <span>Folios: {doc.Numero_Folios}</span> • <span>Tomo: {doc.Numero_Tomo}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="border rounded-lg overflow-hidden bg-gray-50 min-h-[250px]">
                            <div className="bg-gray-100 px-3 py-2 border-b text-xs font-semibold text-gray-600 flex justify-between items-center">
                                <span>A Entregar ({documentosSeleccionados.length})</span>
                                {documentosSeleccionados.length > 0 && (
                                    <button onClick={eliminarTodosDocumentos} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors" title="Quitar todos">
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                            <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
                                {documentosSeleccionados.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-sm"><AlertCircle className="mb-2 opacity-50" size={24}/><p>Sin documentos.</p></div>
                                ) : (
                                    documentosSeleccionados.map((doc, idx) => (
                                        <div key={idx} className="p-3 bg-white flex justify-between items-start">
                                            <div className="flex-1 pr-2">
                                                {/* FORMATO MEJORADO: TÍTULO DESCRIPCIÓN */}
                                                <p className="text-sm font-bold text-gray-800 line-clamp-2 mb-1">{doc.Descripcion}</p>
                                                {/* SUBTÍTULO: DETALLES */}
                                                <div className="text-[11px] text-gray-600 leading-relaxed space-y-0.5">
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-mono bg-gray-100 px-1 rounded text-indigo-700">{doc.id}</span>
                                                        <span className="text-gray-400">|</span>
                                                        <span>{doc.Tipo_Unidad_Conservacion || 'Tipo: ?'}</span>                                                         
                                                    </div>
                                                    <div className="flex items-center gap-3">  
                                                        <span>Ubicación: <strong>{[doc.Ambiente && `${doc.Ambiente}`, doc.Estante && `E${doc.Estante}`, doc.Cuerpo && `C${doc.Cuerpo}`, doc.Balda && `B${doc.Balda}`].filter(Boolean).join("-")}</strong></span>
                                                        <span className="text-gray-400">|</span>
                                                        <span>Caja: <strong>{doc.Numero_Caja || '-'}</strong></span>
                                                        <span className="text-gray-400">|</span>
                                                        <span>Tomo: <strong>{doc.Numero_Tomo || '-'}</strong></span>
                                                        <span className="text-gray-400">|</span>
                                                        <span>Folios: <strong>{doc.Numero_Folios || '-'}</strong></span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button onClick={() => eliminarDocumento(doc.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded mt-1"><Trash2 size={16}/></button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                        <div>
                        <TextareaField 
                            label="Observaciones" 
                            placeholder="Describa..."
                            value={observacionesAtencion} onChange={(e) => setObservacionesAtencion(e.target.value)}
                            rows={4}
                        />
                        </div>
                    </div>

                    {/* COLUMNA DERECHA */}
                    <div className="flex flex-col gap-6">
                        <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                            <h4 className="font-bold text-indigo-800 text-sm mb-1">Conformidad</h4>
                            <p className="text-xs text-indigo-600">Firma del solicitante o responsable.</p>
                        </div>

                        <div className="border rounded-xl p-4 bg-white shadow-sm flex flex-col gap-3">
                             <label className="block text-sm font-medium text-gray-700">Firma Electrónica *</label>
                             <div className="min-h-[220px] border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex flex-col justify-center overflow-hidden relative">
                                <DigitalSignature value={firma} onChange={setFirma} />
                             </div>
                        </div>

                        <div className="flex gap-3 mt-auto pt-4 border-t border-gray-100 items-center">
                            {/* BOTÓN GUARDAR BORRADOR */}
                            <button 
                                onClick={guardarBorrador} 
                                disabled={guardandoBorrador || (!documentosSeleccionados.length && !firma && !observacionesAtencion)}
                                className="px-4 py-2.5 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                                title="Guardar avance para continuar después"
                            >
                                <Save size={16} />
                                {guardandoBorrador ? "..." : "Guardar Progreso"}
                            </button>

                            <div className="flex-1 flex justify-end gap-3">
                                <button onClick={() => setShowProcessModal(false)} className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium">Cancelar</button>
                                <button onClick={confirmarAtencion} disabled={processing} className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium shadow-md disabled:opacity-50">
                                    {processing ? "Procesando..." : "Finalizar"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* --- MODAL DE RECHAZO (NUEVO) --- */}
            <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} title="Rechazar Solicitud" size="sm">
                <div className="p-2 space-y-4">
                    <div className="bg-red-50 text-red-800 p-3 rounded-lg text-sm border border-red-100 flex gap-2">
                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold">Atención</p>
                            <p>Está a punto de rechazar esta solicitud. Esta acción notificará al usuario y la solicitud dejará de estar pendiente.</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Motivo del rechazo *</label>
                        <textarea 
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none" 
                            rows="4" 
                            placeholder="Indique por qué se rechaza la solicitud..."
                            value={motivoRechazo} 
                            onChange={(e) => setMotivoRechazo(e.target.value)} 
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium">
                            Cancelar
                        </button>
                        <button 
                            onClick={confirmarRechazo} 
                            disabled={processing || !motivoRechazo.trim()} 
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? "Rechazando..." : "Confirmar Rechazo"}
                        </button>
                    </div>
                </div>
            </Modal>

            <ScannerModal isOpen={showScanner} onClose={() => setShowScanner(false)} onScan={handleScanResult} />
        </div>
    );
}