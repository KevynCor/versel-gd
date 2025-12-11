import React, { useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { MapPin, Hash, Box, Book, FileText } from "lucide-react"; // Importamos iconos necesarios

// Componente interno para bloque de firma reutilizable
const SignatureBlock = ({ signatureImage, label, name, placeholder = "Pendiente de Firma" }) => (
    <div className="flex flex-col items-center w-full">
        <div className="h-24 w-full flex items-end justify-center mb-2 border-b border-dashed border-slate-400 relative">
            {signatureImage ? (
                <img 
                    src={signatureImage} 
                    alt={`Firma ${label}`} 
                    className="h-20 object-contain mb-1" 
                />
            ) : (
                <span className="absolute bottom-2 text-slate-300 text-sm font-serif italic opacity-50">{placeholder}</span>
            )}
        </div>
        <div className="text-center w-full">
            <p className="font-bold text-xs uppercase text-slate-900 border-t border-slate-900 pt-2 w-48 mx-auto">
                {label}
            </p>
            <p className="text-[10px] text-slate-500 mt-1 uppercase truncate max-w-[200px] mx-auto">{name || "Sin Nombre"}</p>
        </div>
    </div>
);

const CargoPrestamoPDF = ({ isReady, solicitud, documentos, onAfterPrint }) => {
    const componentRef = useRef();

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Cargo_${solicitud?.numero_solicitud || 'Documento'}`,
        onAfterPrint: onAfterPrint,
    });

    useEffect(() => {
        if (isReady && solicitud && documentos) {
            handlePrint();
        }
    }, [isReady, solicitud, documentos, handlePrint]);

    if (!solicitud) return null;

    // --- LÓGICA DE DATOS ---
    const devolucionData = solicitud.devoluciones_documentos?.[0] || solicitud.devoluciones?.[0];
    const firmaArchivoCentral = devolucionData?.firma_receptor || null;
    
    // Obtener nombre del receptor de forma segura
    const nombreReceptor = devolucionData?.usuario?.nombre_completo 
                        || devolucionData?.usuarios?.nombre_completo // Por si la relación viene en plural
                        || solicitud?.atendido_por?.nombre_completo // Fallback al usuario que atendió la solicitud original
                        || "Responsable de Archivo Central";

    // --- RENDERIZADO ---
    return (
        <div style={{ display: "none" }}>
            <div 
                ref={componentRef} 
                className="bg-white text-slate-900 w-full h-full p-10 print-container font-sans flex flex-col justify-between"
                style={{ fontSize: '11px', minHeight: '297mm' }} // A4 height aprox
            >
                <div>
                    {/* 1. ENCABEZADO */}
                    <header className="flex items-center justify-between border-b-2 border-slate-900 pb-6 mb-8">
                        <div className="w-1/3">
                            <img 
                                src="https://www.else.com.pe/logos/logo%20slogan.png" 
                                alt="Logo Electro Sur Este" 
                                className="h-12 object-contain" 
                            />
                        </div>
                        <div className="w-1/3 text-center">
                            <h1 className="font-bold text-lg uppercase tracking-wider text-slate-900 leading-tight">
                                Electro Sur Este S.A.A.
                            </h1>
                            <h2 className="font-bold text-xs text-slate-600 uppercase mt-1">
                                Géstion Documental y Archivo Central
                            </h2>
                        </div>
                        <div className="w-1/3 flex justify-end">
                            <div className="border border-slate-900 p-2 text-center min-w-[120px]">
                                <p className="text-[9px] font-bold uppercase text-slate-500">N° Solicitud</p>
                                <p className="text-lg font-mono font-bold text-slate-900">
                                    #{solicitud.numero_solicitud || solicitud.codigo_solicitud || "S/N"}
                                </p>
                            </div>
                        </div>
                    </header>

                    <div className="text-center mb-6">
                        <h3 className="text-sm font-bold border py-1.5 px-8 inline-block border-slate-300 bg-slate-50 uppercase tracking-widest shadow-sm">
                            Comprobante de Atención / Devolución
                        </h3>
                    </div>

                    {/* 2. DATOS GENERALES */}
                    <section className="mb-6 border border-slate-300 rounded-sm overflow-hidden">
                        <div className="bg-slate-100 px-4 py-1.5 border-b border-slate-300">
                            <span className="font-bold uppercase text-[10px] text-slate-700">Datos Generales</span>
                        </div>
                        
                        <div className="grid grid-cols-2 text-xs divide-x divide-slate-300">
                            <div className="p-3 space-y-1.5">
                                <div className="flex">
                                    <span className="w-24 font-bold text-slate-500 uppercase text-[10px]">Fecha:</span>
                                    <span className="flex-1 font-medium">{new Date(solicitud.fecha_solicitud).toLocaleString()}</span>
                                </div>
                                <div className="flex">
                                    <span className="w-24 font-bold text-slate-500 uppercase text-[10px]">Modalidad:</span>
                                    <span className="flex-1 font-bold uppercase">{solicitud.modalidad_servicio?.replace(/_/g, ' ')}</span>
                                </div>
                                <div className="flex">
                                    <span className="w-24 font-bold text-slate-500 uppercase text-[10px]">Estado:</span>
                                    <span className="flex-1 font-medium">{solicitud.estado}</span>
                                </div>
                            </div>
                            <div className="p-3 space-y-1.5">
                                <div className="flex">
                                    <span className="w-24 font-bold text-slate-500 uppercase text-[10px]">Solicitante:</span>
                                    <span className="flex-1 font-medium uppercase">{solicitud.nombre_solicitante}</span>
                                </div>
                                <div className="flex">
                                    <span className="w-24 font-bold text-slate-500 uppercase text-[10px]">Área:</span>
                                    <span className="flex-1 font-medium">{solicitud.sub_gerencia}</span>
                                </div>
                                <div className="flex">
                                    <span className="w-24 font-bold text-slate-500 uppercase text-[10px]">Contacto:</span>
                                    <span className="flex-1 font-medium text-slate-600">{solicitud.email || solicitud.movil || "-"}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 3. TABLA DE DOCUMENTOS */}
                    <section className="mb-6">
                        <h4 className="font-bold text-xs uppercase mb-2 text-slate-700 flex items-center gap-2">
                            <Hash size={12}/> Detalle de Documentos ({documentos?.length || 0})
                        </h4>
                        
                        <table className="w-full border-collapse border border-slate-300 text-[10px]">
                            <thead className="bg-slate-100 text-slate-700 uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="border border-slate-300 p-2 text-center w-10">#</th>
                                    <th className="border border-slate-300 p-2 text-center w-16">Caja</th>
                                    <th className="border border-slate-300 p-2 text-left">Descripción Documental</th>
                                    <th className="border border-slate-300 p-2 text-left w-32">Serie / Unidad</th>
                                    <th className="border border-slate-300 p-2 text-center w-16">Folios</th>
                                    <th className="border border-slate-300 p-2 text-center w-24">Ubicación</th>
                                </tr>
                            </thead>
                            <tbody>
                                {documentos && documentos.map((doc, i) => (
                                    <tr key={i} className="border-b border-slate-300">
                                        <td className="border-r border-slate-300 p-2 text-center text-slate-500">{i + 1}</td>
                                        <td className="border-r border-slate-300 p-2 text-center font-bold">{doc.idoc?.Numero_Caja || doc.caja || '-'}</td>
                                        <td className="border-r border-slate-300 p-2">
                                            <div className="font-medium text-slate-900">{doc.idoc?.Descripcion || doc.descripcion}</div>
                                            {doc.observaciones_entrega && <div className="text-[9px] italic text-slate-500 mt-1">Obs: {doc.observaciones_entrega}</div>}
                                        </td>
                                        <td className="border-r border-slate-300 p-2">
                                            <div className="font-bold text-slate-700">{doc.idoc?.Unidad_Organica || doc.unidad}</div>
                                            <div className="italic text-slate-500 text-[9px]">{doc.idoc?.Serie_Documental || doc.serie}</div>
                                        </td>
                                        <td className="border-r border-slate-300 p-2 text-center">{doc.idoc?.Numero_Folios || doc.numero_folios || '-'}</td>
                                        <td className="p-2 text-center font-mono text-slate-600">
                                            {doc.ubicacion_topografica || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>
                </div>

                {/* 4. SECCIÓN DE FIRMAS (FOOTER) */}
                <footer className="mt-auto pt-4">
                    <div className="grid grid-cols-2 gap-10 mt-5 mb-4">
                        <SignatureBlock 
                            signatureImage={solicitud.firma_solicitante_solicitud} 
                            label="Firma del Solicitante" 
                            name={solicitud.nombre_solicitante} 
                        />
                        <SignatureBlock 
                            signatureImage={firmaArchivoCentral} 
                            label="V°B° Archivo Central" 
                            name={nombreReceptor}
                            placeholder="Sello / Firma Digital"
                        />
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-[9px] text-slate-400 font-mono">
                        <span>Sistema de Gestión Documental - Electro Sur Este S.A.A.</span>
                        <span>Impresión: {new Date().toLocaleString()}</span>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default CargoPrestamoPDF;