import React, { useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { MapPin, Hash } from "lucide-react";

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

    // --- LÓGICA PARA OBTENER DATOS DE DEVOLUCIÓN ---
    // 1. Obtenemos el registro de devolución (asumimos el primero o único vigente)
    const devolucionData = solicitud.devoluciones_documentos?.[0] || solicitud.devoluciones?.[0];
    
    // 2. Extraemos la firma
    const firmaArchivoCentral = devolucionData?.firma_receptor || null;

    // 3. Extraemos el nombre del usuario receptor
    // Nota: Dependiendo de tu consulta, esto puede venir como 'usuario' o 'usuarios'
    // Se intenta acceder de forma segura a ambas posibilidades.
    const nombreReceptor = devolucionData?.usuario?.nombre_completo 
                        || devolucionData?.usuarios?.nombre_completo 
                        || "Responsable de Atención";

    // --- RENDERIZADO ---
    return (
        <div style={{ display: "none" }}>
            <div 
                ref={componentRef} 
                className="bg-white text-slate-900 w-full h-full p-10 print-container font-sans"
                style={{ fontSize: '11px' }}
            >
                {/* 1. ENCABEZADO */}
                <header className="flex items-center justify-between border-b-2 border-slate-900 pb-6 mb-8">
                    <div className="w-1/3">
                        <img 
                            src="https://www.else.com.pe/logos/logo%20slogan.png" 
                            alt="Logo Electro Sur Este" 
                            className="h-16 object-contain" 
                        />
                    </div>
                    <div className="w-1/3 text-center">
                        <h1 className="font-bold text-lg uppercase tracking-wider text-slate-900 leading-tight">
                            Electro Sur Este S.A.A.
                        </h1>
                        <h2 className="font-bold text-xs text-slate-600 uppercase mt-1">
                            Unidad de Archivo Central
                        </h2>
                    </div>
                    <div className="w-1/3 flex justify-end">
                        <div className="border border-slate-900 p-2 text-center min-w-[140px]">
                            <p className="text-[9px] font-bold uppercase text-slate-500">N° de Solicitud</p>
                            <p className="text-xl font-mono font-bold text-slate-900">
                                #{solicitud.numero_solicitud}
                            </p>
                        </div>
                    </div>
                </header>

                <div className="text-center mb-8">
                    <h3 className="text-sm font-bold border py-1.5 px-8 inline-block border-slate-300 bg-slate-50 uppercase tracking-widest shadow-sm">
                        Comprobante de Atención / Devolución
                    </h3>
                </div>

                {/* 2. DATOS GENERALES */}
                <section className="mb-8 border border-slate-300 rounded-sm overflow-hidden">
                    <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 flex justify-between items-center">
                        <span className="font-bold uppercase text-[10px] text-slate-600">Datos Generales</span>
                    </div>
                    
                    <div className="grid grid-cols-2 text-xs">
                        <div className="p-4 border-r border-slate-300 space-y-2">
                            <div className="flex">
                                <span className="w-24 font-bold text-slate-500 uppercase text-[10px] pt-0.5">Fecha:</span>
                                <span className="flex-1 font-medium">{new Date(solicitud.fecha_solicitud).toLocaleString()}</span>
                            </div>
                            <div className="flex">
                                <span className="w-24 font-bold text-slate-500 uppercase text-[10px] pt-0.5">Modalidad:</span>
                                <span className="flex-1 font-bold uppercase">{solicitud.modalidad_servicio?.replace(/_/g, ' ')}</span>
                            </div>
                            <div className="flex">
                                <span className="w-24 font-bold text-slate-500 uppercase text-[10px] pt-0.5">Estado:</span>
                                <span className="flex-1 font-medium">{solicitud.estado}</span>
                            </div>
                        </div>
                        <div className="p-4 space-y-2">
                            <div className="flex">
                                <span className="w-24 font-bold text-slate-500 uppercase text-[10px] pt-0.5">Solicitante:</span>
                                <span className="flex-1 font-medium uppercase">{solicitud.nombre_solicitante}</span>
                            </div>
                            <div className="flex">
                                <span className="w-24 font-bold text-slate-500 uppercase text-[10px] pt-0.5">Área / Oficina:</span>
                                <span className="flex-1 font-medium">{solicitud.sub_gerencia}</span>
                            </div>
                            <div className="flex">
                                <span className="w-24 font-bold text-slate-500 uppercase text-[10px] pt-0.5">Contacto:</span>
                                <span className="flex-1 font-medium text-slate-600">{solicitud.email || solicitud.movil}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. TABLA DE DOCUMENTOS */}
                <section className="mb-5">
                    <h4 className="font-bold text-xs uppercase mb-2 text-slate-700 flex items-center gap-2">
                        <Hash size={12}/> Detalle de Documentos ({documentos?.length || 0})
                    </h4>
                    
                    <table className="w-full border-collapse border border-slate-300 text-[10px]">
                        <thead className="bg-slate-100 text-slate-700 uppercase font-bold tracking-wider">
                            <tr>
                                <th className="border border-slate-300 p-2 text-center w-10">Item</th>
                                <th className="border border-slate-300 p-2 text-center w-16">Caja</th>
                                <th className="border border-slate-300 p-2 text-center w-16">Tomo</th>
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
                                    <td className="border-r border-slate-300 p-2 text-center">{doc.idoc?.Numero_Tomo || doc.numero_tomo || '-'}</td>
                                    <td className="border-r border-slate-300 p-2">
                                        <div className="font-medium text-slate-800">{doc.idoc?.Descripcion || doc.descripcion}</div>
                                    </td>
                                    <td className="border-r border-slate-300 p-2">
                                        <div className="font-bold text-slate-700">{doc.idoc?.Unidad_Organica || doc.unidad}</div>
                                        <div className="italic text-slate-500 text-[9px]">{doc.idoc?.Serie_Documental || doc.serie}</div>
                                    </td>
                                    <td className="border-r border-slate-300 p-2 text-center">{doc.idoc?.Numero_Folios || doc.numero_folios || '-'}</td>
                                    <td className="p-2 text-center font-mono text-slate-600 flex justify-center items-center gap-1">
                                         <MapPin size={10} className="inline"/> {doc.ubicacion_topografica || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                {/* 4. SECCIÓN DE FIRMAS (ACTUALIZADO) */}
                <footer className="mt-auto">
                    <div className="grid grid-cols-2 gap-20 mt-5">
                        {/* FIRMA 1: SOLICITANTE */}
                        <div className="flex flex-col items-center">
                            <div className="h-24 w-full flex items-end justify-center mb-2 border-b border-dashed border-slate-400 relative">
                                {solicitud.firma_solicitante_solicitud ? (
                                    <img 
                                        src={solicitud.firma_solicitante_solicitud} 
                                        alt="Firma Solicitante" 
                                        className="h-20 object-contain mb-1" 
                                    />
                                ) : (
                                    <span className="absolute bottom-2 text-slate-300 text-sm font-serif italic">Pendiente de Firma</span>
                                )}
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-xs uppercase text-slate-900 border-t border-slate-900 pt-2 w-48 mx-auto">
                                    Firma del Solicitante
                                </p>
                                <p className="text-[10px] text-slate-500 mt-1 uppercase">{solicitud.nombre_solicitante}</p>
                            </div>
                        </div>

                        {/* FIRMA 2: ARCHIVO CENTRAL */}
                        <div className="flex flex-col items-center">
                            <div className="h-24 w-full flex items-end justify-center mb-2 border-b border-dashed border-slate-400 relative">
                                {firmaArchivoCentral ? (
                                    <img 
                                        src={firmaArchivoCentral} 
                                        alt="Firma Receptor Archivo" 
                                        className="h-20 object-contain mb-1" 
                                    />
                                ) : (
                                    <span className="absolute bottom-2 text-slate-300 text-sm font-serif italic opacity-50">Sello / Firma Digital</span>
                                )}
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-xs uppercase text-slate-900 border-t border-slate-900 pt-2 w-48 mx-auto">
                                    V°B° Archivo Central
                                </p>
                                {/* AQUÍ SE MUESTRA EL NOMBRE OBTENIDO DEL USUARIO */}
                                <p className="text-[10px] text-slate-500 mt-1 font-medium uppercase">
                                    {nombreReceptor}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center text-[9px] text-slate-400 font-mono">
                        <span>Sistema de Gestión Documental - Electro Sur Este S.A.A.</span>
                        <span>Impresión: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</span>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default CargoPrestamoPDF;