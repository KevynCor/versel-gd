import React, { useState, useMemo, useRef, useEffect } from 'react';
import jsQR from "jsqr";
import { X, Scan, RefreshCw } from "lucide-react";

/**
 * Componente de Escáner QR en modalidad de pantalla completa (Modal).
 * Utiliza la cámara del dispositivo para detectar códigos QR en tiempo real.
 *
 * NOTA: Este componente requiere que se incluya 'jsQR' en el proyecto.
 *
 * @param {boolean} isOpen - Controla la visibilidad del escáner.
 * @param {function} onClose - Función para cerrar el escáner.
 * @param {function} onScan - Función de callback que se ejecuta al detectar un código QR exitosamente. Recibe el string del código.
 */
export default function QRScanner({ isOpen, onClose, onScan }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const animationFrameRef = useRef(null);
    const [status, setStatus] = useState("Iniciando cámara...");
    const [error, setError] = useState(null);

    const iniciarCamara = async () => {
        setError(null);
        setStatus("Solicitando permisos de cámara...");
        try {
            // Intentar obtener la cámara trasera si está disponible
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } } 
            });
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play().catch(e => {
                        console.error("Error al reproducir video", e);
                        setError("Error al reproducir el video de la cámara.");
                    });
                    setStatus("Escaneando...");
                    iniciarEscaneoQR();
                };
            }
        } catch (err) {
            console.error("Error al acceder a la cámara:", err);
            setStatus("Error al acceder a la cámara.");
            setError("No se pudo acceder a la cámara. Verifique permisos (HTTPS/Navegador).");
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
            if (!streamRef.current || !animationFrameRef.current) return;
            
            try {
                if (video.readyState === video.HAVE_ENOUGH_DATA) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    // Dibujar el frame de video en el canvas
                    context.drawImage(video, 0, 0, canvas.width, canvas.height);
                    
                    // Obtener los datos de imagen del canvas
                    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                    // Usar jsQR para detectar el código
                    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
                    
                    if (code) {
                        setStatus("Código QR detectado.");
                        // Detener y cerrar al encontrar el código
                        detenerCamara();
                        onScan(code.data);
                        onClose();
                        return;
                    }
                }
            } catch (scanError) {
                console.error("Error en escaneo de frame:", scanError);
                // Continuar intentando si el error es de procesamiento, no de stream
            }

            // Continuar con el siguiente frame
            animationFrameRef.current = requestAnimationFrame(escanearFrame);
        };
        
        // Iniciar el ciclo de animación
        animationFrameRef.current = requestAnimationFrame(escanearFrame);
    };

    // Efecto para controlar la cámara al abrir/cerrar el modal
    useEffect(() => {
        if (isOpen) {
            // Un pequeño retraso asegura que el modal esté montado y visible antes de intentar acceder al hardware.
            setTimeout(() => iniciarCamara(), 300);
        } else {
            detenerCamara();
            setError(null); // Limpiar errores al cerrar
        }
        return () => detenerCamara();
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        // Contenedor de pantalla completa, z-index alto para cubrir todo
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
            <style jsx="true">{`
                @keyframes scan {
                    0% { transform: translateY(0); opacity: 0.5; }
                    50% { transform: translateY(calc(18rem - 1px)); opacity: 1; }
                    100% { transform: translateY(0); opacity: 0.5; }
                }
                @media (max-width: 768px) {
                    @keyframes scan {
                        0% { transform: translateY(0); opacity: 0.5; }
                        50% { transform: translateY(calc(18rem - 1px)); opacity: 1; } /* Ajustar si el tamaño cambia */
                        100% { transform: translateY(0); opacity: 0.5; }
                    }
                }
            `}</style>
            
            {/* Barra Superior Flotante */}
            <div className="absolute top-0 left-0 w-full z-20 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                <h3 className="text-white font-bold text-lg flex items-center gap-2 drop-shadow-md">
                    <Scan className="text-emerald-400" size={24} /> Escáner QR
                </h3>
                <button 
                    onClick={onClose} 
                    className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/30 transition-colors">
                    <X size={24} />
                </button>
            </div>

            {/* Área de Cámara */}
            <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
                {/* Etiqueta de Video oculta detrás, se usa como fuente de frames */}
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="absolute inset-0 w-full h-full object-cover" 
                />
                {/* Canvas oculto para el procesamiento de imágenes */}
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Capa de superposición con la guía visual */}
                <div className="relative w-72 h-72 md:w-80 md:h-80 border-2 border-emerald-500/70 rounded-3xl z-10 shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]">
                    {/* Línea de escaneo animada. Usa 18rem (w-72/h-72) como base para la animación */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/80 animate-scan shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
                    
                    {/* Esquinas decorativas */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 -mt-2 -ml-2 rounded-tl-xl"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 -mt-2 -mr-2 rounded-tr-xl"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 -mb-2 -ml-2 rounded-bl-xl"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 -mb-2 -mr-2 rounded-br-xl"></div>
                </div>

                {/* Mensajes de estado */}
                <div className="absolute bottom-12 left-0 w-full text-center z-20 px-4">
                    <div className="text-white/90 text-sm bg-black/50 backdrop-blur-sm py-2 px-4 rounded-full inline-flex items-center gap-2">
                        {status === "Escaneando..." ? <Scan size={16} className="text-emerald-400"/> : <RefreshCw size={16} className={status.includes("Error") ? "text-red-400" : "text-slate-400 animate-spin"} />}
                        <p>{error || status}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};