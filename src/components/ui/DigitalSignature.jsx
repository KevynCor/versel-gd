import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Pen, RotateCcw, Check, X, Maximize2, Minimize2 } from 'lucide-react';

export const DigitalSignature = ({ 
  value = null,
  onChange = () => {},
  title = "Firma Electrónica",
  required = false,
  disabled = false,
  fullScreenMode = true // Nueva prop para controlar el modo pantalla completa
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!value);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 200 });

  // Configurar tamaño responsivo del canvas
  const setupCanvasSize = useCallback(() => {
    if (!containerRef.current) return;
    
    if (isFullScreen) {
      const width = window.innerWidth - 80;
      const height = window.innerHeight - 200;
      setCanvasSize({ width, height });
    } else {
      const containerWidth = containerRef.current.offsetWidth;
      const isMobile = window.innerWidth < 768;
      const width = Math.min(containerWidth - 40, isMobile ? 500 : 600);
      const height = isMobile ? 200 : 250;
      setCanvasSize({ width, height });
    }
  }, [isFullScreen]);

  useEffect(() => {
    setupCanvasSize();
    window.addEventListener('resize', setupCanvasSize);
    return () => {
      window.removeEventListener('resize', setupCanvasSize);
    };
  }, [setupCanvasSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvasSize.width) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    
    // Color corporativo para la tinta (Azul Oscuro)
    ctx.strokeStyle = '#1e3a8a'; // blue-900
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
      clearCanvas();
    }
  }, [value, canvasSize, isFullScreen]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Fondo sutilmente blanco/slate
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Línea guía estilo firma
    ctx.strokeStyle = '#cbd5e1'; // slate-300
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width * 0.1, canvas.height * 0.8);
    ctx.lineTo(canvas.width * 0.9, canvas.height * 0.8);
    ctx.stroke();
    
    // Placeholder text
    if (!hasSignature) {
        /* Se dibuja solo si está vacío para evitar superposición */
    }
    
    // Restaurar estilo de pluma
    ctx.strokeStyle = '#1e3a8a'; // blue-900
    ctx.lineWidth = isFullScreen ? 4 : 3;
    setHasSignature(false);
  };

  const getCanvasCoordinates = (clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCanvasCoordinates(
      e.clientX || (e.touches && e.touches[0].clientX),
      e.clientY || (e.touches && e.touches[0].clientY)
    );
    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing || disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCanvasCoordinates(
      e.clientX || (e.touches && e.touches[0].clientX),
      e.clientY || (e.touches && e.touches[0].clientY)
    );
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (disabled) return;
    setIsDrawing(false);
  };

  const clearSignature = () => {
    if (disabled) return;
    clearCanvas();
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

  const handleTouchStart = (e) => {
    e.preventDefault();
    startDrawing(e);
  };
  const handleTouchMove = (e) => {
    e.preventDefault();
    draw(e);
  };
  const handleTouchEnd = (e) => {
    e.preventDefault();
    stopDrawing();
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  useEffect(() => {
    if (isDrawing) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isDrawing]);

  // Pantalla completa (Modal Overlay)
  if (isFullScreen) {
    return (
      <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white w-full h-full max-w-6xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fadeIn">
          {/* Header Fullscreen */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Pen className="text-blue-700" size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Firma Electrónica (Pantalla Completa)</h2>
            </div>
            <button
              onClick={toggleFullScreen}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
              title="Salir de pantalla completa"
            >
              <Minimize2 size={24} />
            </button>
          </div>
          
          {/* Canvas Area Fullscreen */}
          <div className="flex-1 p-6 bg-slate-100 overflow-hidden flex items-center justify-center">
            <div className="relative w-full h-full border-2 border-dashed border-blue-300 rounded-xl bg-white shadow-sm overflow-hidden">
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
            </div>
          </div>

          {/* Footer Fullscreen */}
          <div className="p-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row justify-between gap-4 items-center">
             <button
              type="button"
              onClick={clearSignature}
              disabled={disabled || !hasSignature}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg transition-colors disabled:opacity-50 font-medium w-full sm:w-auto"
            >
              <RotateCcw size={20} />
              Limpiar Lienzo
            </button>
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={toggleFullScreen}
                className="flex items-center justify-center gap-2 px-6 py-3 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors font-medium flex-1 sm:flex-none"
              >
                <X size={20} />
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveSignature}
                disabled={(required && !hasSignature) || disabled}
                className="flex items-center justify-center gap-2 px-8 py-3 bg-blue-700 text-white hover:bg-blue-800 rounded-lg transition-colors disabled:opacity-50 shadow-md font-bold flex-1 sm:flex-none"
              >
                <Check size={20} />
                Confirmar Firma
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista Normal (Embed)
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 w-full max-w-4xl mx-auto" ref={containerRef}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 border border-blue-100 rounded-lg">
            <Pen className="text-blue-700" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
            {required && <span className="text-xs text-red-500 font-medium uppercase tracking-wide">* Requerido</span>}
          </div>
        </div>
        {fullScreenMode && (
          <button
            onClick={toggleFullScreen}
            className="p-2 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            title="Pantalla Completa"
            disabled={disabled}
          >
            <Maximize2 size={20} />
          </button>
        )}
      </div>

      {/* Canvas Container */}
      <div 
        className={`
          border-2 border-dashed rounded-xl p-1 bg-slate-50 transition-colors
          ${disabled ? 'border-slate-200 opacity-60' : 'border-blue-200 hover:border-blue-300'}
        `}
      >
        <div className="relative bg-white rounded-lg overflow-hidden shadow-inner">
          <canvas
            ref={canvasRef}
            className={`block mx-auto ${disabled ? 'cursor-not-allowed' : 'cursor-crosshair'}`}
            style={{ width: '100%', height: canvasSize.height, maxWidth: canvasSize.width, touchAction: 'none' }}
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
              <p className="text-slate-400 text-sm font-medium uppercase tracking-widest select-none">Espacio para firmar</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mt-6 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={clearSignature}
          disabled={disabled || !hasSignature}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
        >
          <RotateCcw size={16} />
          Limpiar
        </button>
        <button
          type="button"
          onClick={saveSignature}
          disabled={(required && !hasSignature) || disabled}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-700 text-white hover:bg-blue-800 rounded-lg transition-colors disabled:opacity-50 shadow-sm text-sm font-bold"
        >
          <Check size={18} />
          Guardar Firma
        </button>
      </div>
      
      {required && !hasSignature && (
        <p className="text-red-500 text-xs mt-3 text-center font-medium bg-red-50 py-1 rounded">
          Debe registrar su firma para continuar
        </p>
      )}
    </div>
  );
};