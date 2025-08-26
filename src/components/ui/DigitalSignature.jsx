// src/components/ui/DigitalSignature.jsx
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Pen, RotateCcw, Check, X } from 'lucide-react';

export const DigitalSignature = ({ 
  value = null,
  onChange = () => {},
  title = "Firma Digital",
  required = false,
  disabled = false 
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!value);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Configurar tamaño responsivo del canvas
  const setupCanvasSize = useCallback(() => {
    if (!containerRef.current) return;
    
    const containerWidth = containerRef.current.offsetWidth;
    const isMobile = window.innerWidth < 768;
    
    const width = Math.min(containerWidth - 40, isMobile ? 500 : 700);
    const height = isMobile ? 200 : 250;
    
    setCanvasSize({ width, height });
  }, []);

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
    
    // Configurar canvas
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    
    // Establecer estilo de dibujo
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Cargar firma inicial si existe
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
  }, [value, canvasSize]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Línea de firma
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width * 0.1, canvas.height * 0.8);
    ctx.lineTo(canvas.width * 0.9, canvas.height * 0.8);
    ctx.stroke();
    
    // Texto guía
    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Firme aquí', canvas.width / 2, canvas.height / 2);
    
    // Restaurar configuración para dibujo
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 3;
    
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
      e.clientX || e.touches[0].clientX,
      e.clientY || e.touches[0].clientY
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
      e.clientX || e.touches[0].clientX,
      e.clientY || e.touches[0].clientY
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
  };

  // Touch events para móviles
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

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-4xl mx-auto" ref={containerRef}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <Pen className="text-indigo-600" size={24} />
        </div>
        <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
        {required && <span className="text-red-500 text-lg">*</span>}
      </div>
      
      <div className={`border-2 border-dashed rounded-xl p-4 transition-colors ${
        disabled ? 'border-gray-300 bg-gray-50' : 'border-indigo-300 hover:border-indigo-400'
      }`}>
        <div className="relative">
          <canvas
            ref={canvasRef}
            className={`block mx-auto rounded-lg shadow-inner ${
              disabled ? 'cursor-not-allowed opacity-60' : 'cursor-crosshair'
            }`}
            style={{ 
              width: '100%', 
              height: canvasSize.height,
              maxWidth: canvasSize.width,
              touchAction: 'none'
            }}
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
              <p className="text-gray-400 text-lg font-medium">Deslice su dedo o use el mouse para firmar</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between gap-4 mt-6">
        <button
          type="button"
          onClick={clearSignature}
          disabled={disabled || !hasSignature}
          className="flex items-center justify-center gap-2 px-4 py-3 text-base bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          <RotateCcw size={20} />
          Limpiar Firma
        </button>
        
        <button
          type="button"
          onClick={saveSignature}
          disabled={(required && !hasSignature) || disabled}
          className="flex items-center justify-center gap-2 px-6 py-3 text-base bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md"
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