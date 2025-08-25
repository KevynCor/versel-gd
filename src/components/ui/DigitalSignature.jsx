// src/components/ui/DigitalSignature.jsx
import React, { useRef, useState, useEffect } from 'react';
import { Pen, RotateCcw, Check, X } from 'lucide-react';

export const DigitalSignature = ({ 
  value = null,
  onChange = () => {},
  title = "Firma Digital",
  required = false,
  disabled = false 
}) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!value);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Configurar canvas
    canvas.width = 400;
    canvas.height = 200;
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    // Cargar firma inicial si existe
    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        setHasSignature(true);
      };
      img.src = value;
    } else {
      clearCanvas();
    }
  }, [value]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Línea de firma
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, 160);
    ctx.lineTo(350, 160);
    ctx.stroke();
    
    // Texto guía
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Firme aquí', 200, 100);
    
    // Restaurar configuración para dibujo
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 2;
    
    setHasSignature(false);
  };

  const startDrawing = (e) => {
    if (disabled) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(
      e.clientX - rect.left,
      e.clientY - rect.top
    );
  };

  const draw = (e) => {
    if (!isDrawing || disabled) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    ctx.lineTo(
      e.clientX - rect.left,
      e.clientY - rect.top
    );
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (disabled) return;
    setIsDrawing(false);
    
    // Guardar automáticamente al terminar de dibujar
    saveSignature();
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
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent("mousedown", {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    if (canvasRef.current) {
      canvasRef.current.dispatchEvent(mouseEvent);
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent("mousemove", {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    if (canvasRef.current) {
      canvasRef.current.dispatchEvent(mouseEvent);
    }
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    const mouseEvent = new MouseEvent("mouseup", {});
    if (canvasRef.current) {
      canvasRef.current.dispatchEvent(mouseEvent);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Pen className="text-indigo-600" size={20} />
        <h3 className="font-semibold text-gray-800">{title}</h3>
        {required && <span className="text-red-500 text-sm">*</span>}
      </div>
      
      <div className={`border-2 border-dashed rounded-lg p-2 ${
        disabled ? 'border-gray-300 bg-gray-50' : 'border-indigo-300'
      }`}>
        <canvas
          ref={canvasRef}
          className={`border rounded cursor-crosshair w-full ${
            disabled ? 'cursor-not-allowed opacity-60' : ''
          }`}
          style={{ maxWidth: '100%', height: 'auto' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      </div>
      
      <div className="flex justify-between gap-2 mt-4">
        <button
          type="button"
          onClick={clearSignature}
          disabled={disabled}
          className="flex items-center gap-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw size={16} />
          Limpiar
        </button>
        
        <div className="flex gap-2">
          <button
            type="button"
            onClick={saveSignature}
            disabled={(required && !hasSignature) || disabled}
            className="flex items-center gap-1 px-3 py-2 text-sm bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check size={16} />
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};