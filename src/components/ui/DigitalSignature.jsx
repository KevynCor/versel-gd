// src/components/ui/DigitalSignature.jsx
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
    
    ctx.strokeStyle = '#1e40af';
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
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Línea guía
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width * 0.1, canvas.height * 0.8);
    ctx.lineTo(canvas.width * 0.9, canvas.height * 0.8);
    ctx.stroke();
    
    ctx.fillStyle = '#94a3b8';
    ctx.font = isFullScreen ? '20px sans-serif' : '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Deslice su dedo o use el mouse para firmar', canvas.width / 2, canvas.height / 2);
    
    ctx.strokeStyle = '#1e40af';
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

  // Pantalla completa
  if (isFullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        <div className="flex items-center justify-between p-4 border-b bg-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Pen className="text-indigo-600" size={24} />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Firma Electrónica</h2>
          </div>
          <button
            onClick={toggleFullScreen}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Minimize2 size={24} />
          </button>
        </div>
        <div className="flex-1 p-4 overflow-hidden">
          <div className="h-full border-2 border-dashed border-indigo-300 rounded-xl overflow-hidden">
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
        <div className="p-4 border-t bg-white shadow-md">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <button
              type="button"
              onClick={clearSignature}
              disabled={disabled || !hasSignature}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              <RotateCcw size={20} />
              Limpiar
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={toggleFullScreen}
                className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <X size={20} />
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveSignature}
                disabled={(required && !hasSignature) || disabled}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 shadow-md"
              >
                <Check size={20} />
                Guardar Firma
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista normal
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-4xl mx-auto" ref={containerRef}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Pen className="text-indigo-600" size={24} />
          </div>
          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          {required && <span className="text-red-500 text-lg">*</span>}
        </div>
        {fullScreenMode && (
          <button
            onClick={toggleFullScreen}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={disabled}
          >
            <Maximize2 size={20} />
          </button>
        )}
      </div>
      <div className={`border-2 border-dashed rounded-xl p-4 ${disabled ? 'border-gray-300 bg-gray-50' : 'border-indigo-300 hover:border-indigo-400'}`}>
        <div className="relative">
          <canvas
            ref={canvasRef}
            className={`block mx-auto rounded-lg shadow-inner ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-crosshair'}`}
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
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-gray-400 text-lg font-medium">Haga clic aquí para firmar</p>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row justify-between gap-4 mt-6">
        <button
          type="button"
          onClick={clearSignature}
          disabled={disabled || !hasSignature}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
        >
          <RotateCcw size={20} />
          Limpiar Firma
        </button>
        <button
          type="button"
          onClick={saveSignature}
          disabled={(required && !hasSignature) || disabled}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 shadow-md"
        >
          <Check size={20} />
          Guardar Firma
        </button>
      </div>
      {required && !hasSignature && (
        <p className="text-red-500 text-sm mt-4 text-center">
          * La firma es obligatoria para continuar
        </p>
      )}
    </div>
  );
};
