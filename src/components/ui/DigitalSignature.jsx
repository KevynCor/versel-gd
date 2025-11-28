import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Pen, RotateCcw, Check, X, Maximize2, Minimize2, Save, AlertTriangle } from 'lucide-react';

export const DigitalSignature = ({ 
    value = null,
    onChange = () => {},
    title = "Firma Electrónica",
    required = false,
    disabled = false,
    fullScreenMode = true 
}) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(!!value);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 }); 

    // --- LÓGICA DE TAMAÑO ---
    const setupCanvasSize = useCallback(() => {
        if (isFullScreen) {
            const width = window.innerWidth * 0.9;
            const height = window.innerHeight * 0.7;
            setCanvasSize({ width, height });
        } else if (containerRef.current) {
            const containerWidth = containerRef.current.offsetWidth;
            const width = containerWidth || 600;
            const height = 220; 
            setCanvasSize({ width, height });
        }
    }, [isFullScreen]);

    useEffect(() => {
        setupCanvasSize();
        window.addEventListener('resize', setupCanvasSize);
        return () => window.removeEventListener('resize', setupCanvasSize);
    }, [setupCanvasSize]);

    // --- INICIALIZACIÓN DEL CANVAS ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || canvasSize.width === 0) return;
        
        const ctx = canvas.getContext('2d');
        canvas.width = canvasSize.width;
        canvas.height = canvasSize.height;
        
        ctx.strokeStyle = '#1e3a8a'; 
        ctx.lineWidth = isFullScreen ? 4 : 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if (value) {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                setHasSignature(true);
            };
            img.src = value;
        } else {
            clearCanvas(ctx, canvas.width, canvas.height);
        }
    }, [value, canvasSize, isFullScreen]);

    const clearCanvas = (ctx, w, h) => {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        
        // Línea guía
        ctx.strokeStyle = '#cbd5e1'; 
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(w * 0.1, h * 0.8);
        ctx.lineTo(w * 0.9, h * 0.8);
        ctx.stroke();
        
        ctx.strokeStyle = '#1e3a8a'; 
        ctx.lineWidth = isFullScreen ? 4 : 3;
        setHasSignature(false);
    };

    // --- HANDLERS ---
    const getCanvasCoordinates = (clientX, clientY) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / (rect.width || canvas.width); 
        const scaleY = canvas.height / (rect.height || canvas.height); 
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };

    const startDrawing = (e) => {
        if (disabled) return;
        const ctx = canvasRef.current.getContext('2d');
        const coords = getCanvasCoordinates(
            e.clientX || (e.touches && e.touches[0].clientX),
            e.clientY || (e.touches && e.touches[0].clientY)
        );
        setIsDrawing(true);
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
    };

    const draw = (e) => {
        if (!isDrawing || disabled) return;
        const ctx = canvasRef.current.getContext('2d');
        const coords = getCanvasCoordinates(
            e.clientX || (e.touches && e.touches[0].clientX),
            e.clientY || (e.touches && e.touches[0].clientY)
        );
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
        setHasSignature(true);
    };

    const stopDrawing = () => {
        if (disabled) return;
        setIsDrawing(false);
    };

    const clearSignature = () => {
        if (disabled) return;
        if (canvasRef.current) {
            clearCanvas(canvasRef.current.getContext('2d'), canvasRef.current.width, canvasRef.current.height);
        }
        onChange(null);
    };

    const saveSignature = () => {
        if (!hasSignature && required) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const signatureData = canvas.toDataURL('image/png');
        onChange(signatureData);
        if (isFullScreen) setIsFullScreen(false); 
    };

    const handleTouchStart = (e) => { e.preventDefault(); startDrawing(e); };
    const handleTouchMove = (e) => { e.preventDefault(); draw(e); };
    const handleTouchEnd = (e) => { stopDrawing(); };

    useEffect(() => {
        document.body.style.overflow = isDrawing ? 'hidden' : 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isDrawing]);

    const toggleFullScreen = () => {
        setIsFullScreen(!isFullScreen);
    };

    // --- VISTA FULLSCREEN ---
    if (isFullScreen) {
        return (
            <div className="fixed inset-0 z-[60] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white w-full h-full max-w-7xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Pen className="text-blue-700" size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">Firma Electrónica (Lienzo Ampliado)</h2>
                        </div>
                        <button onClick={toggleFullScreen} className="p-2 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors">
                            <Minimize2 size={24} />
                        </button>
                    </div>
                    
                    <div className="flex-1 p-6 bg-slate-100 overflow-hidden flex items-center justify-center">
                        <div className="relative w-full h-full border-2 border-dashed border-blue-300 rounded-xl bg-white shadow-inner overflow-hidden">
                            <canvas
                                ref={canvasRef}
                                className="block w-full h-full cursor-crosshair touch-none"
                                style={{ touchAction: 'none' }}
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                            />
                            {!hasSignature && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                                    <p className="text-slate-400 text-base font-medium uppercase tracking-widest select-none">Firme aquí utilizando su dedo o stylus</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row justify-between gap-3 items-center flex-shrink-0">
                        <button type="button" onClick={clearSignature} disabled={disabled || !hasSignature} className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg transition-colors disabled:opacity-50 font-medium w-full sm:w-auto">
                            <RotateCcw size={20} /> Limpiar Lienzo
                        </button>
                        <div className="flex gap-3 w-full sm:w-auto">
                            <button type="button" onClick={toggleFullScreen} className="flex items-center justify-center gap-2 px-6 py-3 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors font-medium flex-1 sm:flex-none">
                                <X size={20} /> Cerrar
                            </button>
                            <button type="button" onClick={saveSignature} disabled={(required && !hasSignature) || disabled} className="flex items-center justify-center gap-2 px-8 py-3 bg-blue-700 text-white hover:bg-blue-800 rounded-lg transition-colors disabled:opacity-50 shadow-md font-bold flex-1 sm:flex-none">
                                <Check size={20} /> Confirmar Firma
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- VISTA NORMAL (Embed) ---
    return (
        <div className="w-full" ref={containerRef}>
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3 pt-2">
                    <div className="flex items-center gap-2">
                        <Pen className="text-blue-700" size={16} />
                        <h3 className="text-sm font-bold text-slate-700">{title}</h3>
                    </div>
                    {required && <AlertTriangle size={14} className="text-red-500" title="Campo Requerido"/>}
                </div>
                {fullScreenMode && (
                    <button
                        onClick={toggleFullScreen}
                        className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ampliar Lienzo"
                        disabled={disabled}
                    >
                        <Maximize2 size={16} />
                    </button>
                )}
            </div>

            {/* Canvas Container */}
            <div 
                className={`
                    border-2 border-dashed rounded-xl p-0.5 bg-slate-100 transition-colors
                    ${disabled ? 'border-slate-200 opacity-60' : 'border-blue-200 hover:border-blue-300'}
                `}
            >
                <div className="relative bg-white rounded-lg overflow-hidden">
                    <canvas
                        ref={canvasRef}
                        className={`block mx-auto ${disabled ? 'cursor-not-allowed' : 'cursor-crosshair'}`}
                        style={{ width: '100%', height: canvasSize.height, touchAction: 'none' }}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    />
                    {!hasSignature && !disabled && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                            <p className="text-slate-400 text-xs font-medium uppercase tracking-widest select-none">Firme aquí</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Controls (EMBED - PEQUEÑOS) */}
            <div className="flex justify-end gap-2 mt-2">
                <button
                    type="button"
                    onClick={clearSignature}
                    disabled={disabled || !hasSignature}
                    className="flex items-center justify-center gap-1 px-3 py-1 bg-white border border-slate-300 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg transition-colors disabled:opacity-50 text-xs font-medium"
                    title="Borrar Firma"
                >
                    <RotateCcw size={14} />
                    Limpiar
                </button>
                <button
                    type="button"
                    onClick={saveSignature}
                    disabled={(required && !hasSignature) || disabled}
                    className="flex items-center justify-center gap-1 px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 text-xs font-bold shadow-sm"
                    title="Confirmar Firma"
                >
                    <Check size={14} />
                    Confirmar
                </button>
            </div>
            
        </div>
    );
};