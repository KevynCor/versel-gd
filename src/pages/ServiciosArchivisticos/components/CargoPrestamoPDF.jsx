import React, { useEffect } from 'react';
import { FileText, Book, Archive } from 'lucide-react';

// Funciones auxiliares
const getDocData = (doc) => {
    const inventoryData = doc.idoc || {};
    return {
        caja: doc.caja || inventoryData.Numero_Caja || '-',
        tomo: doc.numero_tomo || inventoryData.Numero_Tomo || '-',
        folios: doc.numero_folios || inventoryData.Numero_Folios || '-',
        unidad: doc.unidad || inventoryData.Unidad_Organica || '-',
        ubicacion: doc.ubicacion_topografica || [
            inventoryData.Ambiente, 
            inventoryData.Estante && `E${inventoryData.Estante}`, 
            inventoryData.Cuerpo && `C${inventoryData.Cuerpo}`, 
            inventoryData.Balda && `B${inventoryData.Balda}`
        ].filter(Boolean).join("-") || 'No asignada'
    };
};

const getDocIcon = (doc) => {
    const tipo = doc.idoc ? doc.idoc.Tipo_Unidad_Conservacion : null;
    if (tipo === 'ARCHIVADOR') return <Archive size={14} className="inline" />;
    if (tipo === 'EMPASTADO') return <Book size={14} className="inline" />;
    return <FileText size={14} className="inline" />;
};

const getModalidadTexto = (modalidad) => {
    const modalidades = {
        prestamo_original: "Préstamo de Original",
        copia_simple: "Copia Simple",
        copia_certificada: "Copia Certificada",
        consulta_sala: "Consulta en Sala",
        digitalizacion: "Digitalización"
    };
    return modalidades[modalidad] || modalidad;
};

const CargoPrestamoPDF = ({ solicitud, documentos = [], isReady, onAfterPrint, onCancel }) => {
    // Hook para disparar la impresión
    useEffect(() => {
        if (isReady && solicitud) {
            const timer = setTimeout(() => {
                window.print();
            }, 500);

            const handleAfterPrintEvent = () => {
                if (onAfterPrint) onAfterPrint();
            };

            window.addEventListener("afterprint", handleAfterPrintEvent);

            return () => {
                clearTimeout(timer);
                window.removeEventListener("afterprint", handleAfterPrintEvent);
            };
        }
    }, [isReady, solicitud, onAfterPrint]);

    if (!solicitud) return null;

    // CORRECCIÓN: Validar que haya documentos antes de paginar
    const ITEMS_POR_PAGINA = 14;
    const paginatedDocs = [];
    
    if (documentos && documentos.length > 0) {
        for (let i = 0; i < documentos.length; i += ITEMS_POR_PAGINA) {
            paginatedDocs.push(documentos.slice(i, i + ITEMS_POR_PAGINA));
        }
    } else {
        // Si no hay documentos, crear una página vacía
        paginatedDocs.push([]);
    }
    
    const totalPages = paginatedDocs.length;

    return (
        <div id="print-section-wrapper">
            {/* ESTILOS DE IMPRESIÓN */}
            <style>
                {`
                    #print-section-wrapper { display: none; }
                    
                    @media print {
                        /* CORRECCIÓN CRÍTICA: Prevenir páginas en blanco */
                        html, body {
                            height: 100vh !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            overflow: hidden !important;
                        }
                        
                        body * { visibility: hidden; }
                        #print-section-wrapper, #print-section-wrapper * { visibility: visible; }
                        #print-section-wrapper {
                            display: block;
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            background-color: white;
                            margin: 0 !important;
                            padding: 0 !important;
                        }
                        
                        @page {
                            size: A4 portrait;
                            margin: 15mm 12mm;
                        }
                        
                        .page-break {
                            page-break-after: always;
                            break-after: page;
                        }
                        
                        .no-page-break {
                            page-break-inside: avoid;
                            break-inside: avoid;
                        }
                        
                        .print-page {
                            width: 210mm;
                            height: 297mm;
                            max-height: 297mm;
                            position: relative;
                            background: white;
                            margin: 0 !important;
                            padding: 0 !important;
                            box-sizing: border-box;
                            overflow: hidden;
                        }
                    }
                    
                    @media screen {
                        #print-section-wrapper {
                            display: block;
                        }
                        
                        .print-page {
                            box-shadow: 0 0 10px rgba(0,0,0,0.1);
                            margin: 20px auto;
                        }
                    }
                `}
            </style>

            {/* GENERAR PÁGINAS */}
            {paginatedDocs.map((pageDocuments, pageIndex) => {
                const isFirstPage = pageIndex === 0;
                const isLastPage = pageIndex === totalPages - 1;
                const currentPage = pageIndex + 1;

                return (
                    <div 
                        key={`page-${pageIndex}`}
                        className={`print-page bg-white text-black font-sans w-full max-w-[210mm] mx-auto text-xs leading-tight ${!isLastPage ? 'page-break' : ''}`}
                        style={{ 
                            padding: '20mm 15mm',
                            paddingBottom: '30mm',
                            position: 'relative',
                            boxSizing: 'border-box',
                            height: '297mm',
                            maxHeight: '297mm',
                            overflow: 'hidden'
                        }}
                    >
                        
                        {/* CABECERA (Solo en primera página) */}
                        {isFirstPage && (
                            <header className="flex items-start justify-between border-b-2 border-slate-700 pb-4 mb-6 no-page-break">
                                <div className="w-1/3">
                                    <img 
                                        src="https://www.else.com.pe/logos/logo%20slogan.png" 
                                        alt="Electro Sur Este" 
                                        className="h-14 object-contain" 
                                    />
                                </div>
                                <div className="w-2/3 text-right">
                                    <h1 className="text-lg font-bold uppercase tracking-wide text-slate-900 leading-tight">
                                        Solicitud de Servicios Archivisticos
                                    </h1>
                                    <h2 className="text-xs font-semibold text-slate-600 uppercase mt-1">
                                        Gestión Documental y Archivo Central
                                    </h2>
                                    <div className="mt-3 inline-flex items-center gap-3">
                                        <div className="bg-slate-50 border border-slate-200 text-slate-800 px-3 py-1.5 rounded font-semibold text-xs">
                                            Nº {solicitud.numero_solicitud || solicitud.id.slice(0, 8)}
                                        </div>
                                    </div>
                                </div>
                            </header>
                        )}

                        {/* DATOS GENERALES (Solo en primera página) */}
                        {isFirstPage && (
                            <div className="border border-slate-300 mb-5 rounded overflow-hidden no-page-break shadow-sm">
                                <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-4 py-2">
                                    <h3 className="font-bold text-white uppercase text-xs tracking-wide">
                                        Información de la Solicitud
                                    </h3>
                                </div>
                                <div className="grid grid-cols-2 divide-x divide-slate-200">
                                    {/* Columna Izquierda */}
                                    <div className="p-4 space-y-2.5 bg-slate-50">
                                        <div className="flex border-b border-slate-200 pb-2">
                                            <span className="w-28 font-bold text-slate-600 text-xs">Solicitante:</span>
                                            <span className="flex-1 uppercase flex-1 text-slate-700 text-xs">
                                                {solicitud.nombre_solicitante}<br />
                                                {solicitud.entidad || 'Electro Sur Este S.A.A.'}
                                            </span>
                                        </div>
                                        <div className="flex border-b border-slate-200 pb-2">
                                            <span className="w-28 font-bold text-slate-600 text-xs">Sección:</span>
                                            <span className="flex-1 uppercase text-slate-800 text-xs">
                                                {solicitud.sub_gerencia}
                                            </span>
                                        </div>
                                        <div className="flex border-b border-slate-200 pb-2">
                                            <span className="w-28 font-bold text-slate-600 text-xs">Email:</span>
                                            <span className="flex-1 text-slate-700 text-xs">
                                                {solicitud.email}
                                            </span>
                                        </div>
                                        <div className="flex">
                                            <span className="w-28 font-bold text-slate-600 text-xs">Motivo:</span>
                                            <span className="flex-1 text-slate-800 text-xs">
                                                {solicitud.motivo_solicitud}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Columna Derecha */}
                                    <div className="p-4 space-y-2.5 bg-white">
                                        <div className="flex border-b border-slate-200 pb-2">
                                            <span className="w-32 font-bold text-slate-600 text-xs">F. Solicitud:</span>
                                            <span className="flex-1 text-slate-700 text-xs">
                                                {new Date(solicitud.fecha_solicitud).toLocaleDateString('es-PE', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                        <div className="flex border-b border-slate-200 pb-2">
                                            <span className="w-32 font-bold text-slate-600 text-xs">F. Dev. Prevista:</span>
                                            <span className="flex-1 text-slate-700 text-xs">
                                                {new Date(solicitud.fecha_devolucion_prevista).toLocaleDateString('es-PE', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                        <div className="flex border-b border-slate-200 pb-2">
                                            <span className="w-32 font-bold text-slate-600 text-xs">F. Devolución:</span>
                                            <span className="flex-1 text-slate-700 text-xs">
                                                {solicitud.fecha_devolucion_real
                                                    ? new Date(solicitud.fecha_devolucion_real).toLocaleDateString('es-PE', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })
                                                    : 'PENDIENTE'
                                                }
                                            </span>
                                        </div>
                                        <div className="flex border-b border-slate-200 pb-2">
                                            <span className="w-32 font-bold text-slate-600 text-xs">Modalidad:</span>
                                            <span className="flex-1 text-slate-700 text-xs">
                                                {getModalidadTexto(solicitud.modalidad_servicio)}
                                            </span>
                                        </div>
                                        <div className="flex">
                                            <span className="w-32 font-bold text-slate-600 text-xs">Estado:</span>
                                            <span className="flex-1 text-slate-700 text-xs">
                                                {solicitud.estado} {solicitud.observaciones_archivo ? `- ${solicitud.observaciones_archivo}` : ''}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TABLA DE DOCUMENTOS */}
                        <div className="mb-6">
                            {isFirstPage && (
                                <div className="flex items-center justify-between mb-3 no-page-break">
                                    <h3 className="font-bold text-sm uppercase text-slate-800 border-l-4 border-blue-600 pl-3">
                                        Detalle de Documentos Entregados
                                    </h3>
                                    <span className="text-xs text-slate-500 font-semibold">
                                        Total: {documentos.length} documento(s)
                                    </span>
                                </div>
                            )}
                            
                            {!isFirstPage && (
                                <div className="mb-3 text-xs text-slate-600 font-semibold">
                                    Continuación - Detalle de Documentos
                                </div>
                            )}
                            
                            <table className="w-full border-collapse border border-slate-300 text-[10px] shadow-sm">
                                <thead>
                                    <tr className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                                        <th className="border border-slate-400 p-2 w-8 text-center">#</th>
                                        <th className="border border-slate-400 p-2 w-24 text-center">Código</th>
                                        <th className="border border-slate-400 p-2 text-left">Descripción</th>
                                        <th className="border border-slate-400 p-2 w-20 text-center">Sección</th>
                                        <th className="border border-slate-400 p-2 w-12 text-center">Caja</th>
                                        <th className="border border-slate-400 p-2 w-12 text-center">Tomo</th>
                                        <th className="border border-slate-400 p-2 w-12 text-center">Fls.</th>
                                        <th className="border border-slate-400 p-2 w-24 text-center">Ubicación</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pageDocuments.length > 0 ? (
                                        pageDocuments.map((doc, index) => {
                                            const globalIndex = pageIndex * ITEMS_POR_PAGINA + index;
                                            const data = getDocData(doc);
                                            return (
                                                <tr key={`doc-${doc.id}-${index}`} className="border-b border-slate-200 hover:bg-slate-50 no-page-break">
                                                    <td className="border-r border-slate-300 p-2 text-center font-bold bg-slate-50">
                                                        {globalIndex + 1}
                                                    </td>
                                                    <td className="border-r border-slate-300 p-2 text-center font-mono text-[9px] bg-blue-50">
                                                        {doc.documento_id}
                                                    </td>
                                                    <td className="border-r border-slate-300 p-2">
                                                        <div className="flex items-start gap-1.5">
                                                            <div className="flex-1">
                                                                <div className="font-bold text-slate-800 uppercase leading-snug">
                                                                    {doc.descripcion || 'Sin descripción'}
                                                                </div>
                                                                {doc.idoc?.Serie_Documental && (
                                                                    <div className="text-slate-500 italic text-[9px] mt-0.5">
                                                                        {doc.idoc.Serie_Documental}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="border-r border-slate-300 p-2 text-center uppercase text-[9px] text-slate-700">
                                                        {data.unidad}
                                                    </td>
                                                    <td className="border-r border-slate-300 p-2 text-center font-semibold text-slate-800">
                                                        {data.caja}
                                                    </td>
                                                    <td className="border-r border-slate-300 p-2 text-center font-semibold text-slate-800">
                                                        {data.tomo}
                                                    </td>
                                                    <td className="border-r border-slate-300 p-2 text-center font-semibold text-slate-800">
                                                        {data.folios}
                                                    </td>
                                                    <td className="border-r border-slate-300 p-2 text-center font-semibold text-slate-800">
                                                        {data.ubicacion}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="8" className="p-6 text-center text-slate-400 italic border border-slate-300">
                                                No se han seleccionado documentos para este cargo.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* SECCIÓN DE FIRMAS (Solo en última página) */}
                        {isLastPage && (
                            <div className="mt-8 pt-6 border-t-2 border-slate-300 no-page-break">
                                <div className="grid grid-cols-2 gap-8 px-4">
                                    {/* Firma Archivo Central */}
                                    <div className="text-center border border-slate-200 rounded-lg p-4 bg-slate-50">
                                        <div className="h-20 flex items-center justify-center mb-3 bg-white border border-dashed border-slate-300 rounded">
                                            {solicitud.firma_archivo_central ? (
                                                <img 
                                                    src={solicitud.firma_archivo_central} 
                                                    alt="Firma Archivo" 
                                                    className="max-h-20 max-w-full object-contain" 
                                                />
                                            ) : (
                                                <span className="text-slate-200 text-xs italic opacity-40">Firmar Digital o Manuscrita</span>
                                            )}
                                        </div>
                                        <div className="border-t-2 border-slate-800 pt-2">
                                            <p className="font-bold text-xs uppercase text-slate-800">
                                                Responsable Archivo Central
                                            </p>
                                            <p className="text-[9px] text-slate-500 mt-1 font-semibold">
                                                Entrega Conforme
                                            </p>
                                        </div>
                                    </div>

                                    {/* Firma Solicitante */}
                                    <div className="text-center border border-slate-200 rounded-lg p-4 bg-slate-50">
                                        <div className="h-20 flex items-center justify-center mb-3 bg-white border border-dashed border-slate-300 rounded">
                                            {solicitud.firma_conformidad ? (
                                                <img 
                                                    src={solicitud.firma_conformidad} 
                                                    alt="Firma Solicitante" 
                                                    className="max-h-20 max-w-full object-contain" 
                                                />
                                            ) : (
                                                <span className="text-slate-200 text-xs italic opacity-40">Firmar Digital o Manuscrita</span>
                                            )}
                                        </div>
                                        <div className="border-t-2 border-slate-800 pt-2">
                                            <p className="font-bold text-xs uppercase text-slate-800">
                                                {solicitud.nombre_solicitante || 'SOLICITANTE'}
                                            </p>
                                            <p className="text-[9px] text-slate-500 mt-1 font-semibold">
                                                Recibí Conforme
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Nota Legal */}
                                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-[9px] text-amber-900 leading-relaxed">
                                    <p className="font-bold mb-1">IMPORTANTE:</p>
                                    <p>
                                        El solicitante se compromete a devolver la documentación en el plazo establecido 
                                        y en las mismas condiciones de conservación. El uso indebido o pérdida del material 
                                        será responsabilidad del receptor.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* FOOTER DINÁMICO */}
                        <div 
                            className="absolute left-0 right-0 text-[9px] text-slate-500" 
                            style={{ 
                                bottom: '15mm',
                                paddingLeft: '15mm',
                                paddingRight: '15mm'
                            }}
                        >
                            <div className="border-t border-slate-300 pt-2 flex justify-between items-center">
                                <span className="font-semibold">
                                    Sistema de Gestión de Archivos - Electro Sur Este S.A.A.
                                </span>
                                <span>
                                    Impreso: {new Date().toLocaleDateString('es-PE')} {new Date().toLocaleTimeString('es-PE', {hour: '2-digit', minute: '2-digit'})}
                                </span>
                                <span className="font-bold">
                                    Pág. {currentPage}/{totalPages}
                                </span>
                            </div>
                        </div>

                    </div>
                );
            })}
        </div>
    );
};

export default CargoPrestamoPDF;