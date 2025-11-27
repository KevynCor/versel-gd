import { Sparkles } from "lucide-react";

export const SparkleLoader = () => (
  <div className="flex flex-col items-center justify-center p-12">
    {/* Círculo giratorio corporativo */}
    <div className="relative w-12 h-12">
      <div className="absolute inset-0 rounded-full border-4 border-slate-200 border-t-blue-700 animate-spin"></div>
      {/* Sparkle estático central o animado sutilmente */}
      <Sparkles size={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600 animate-pulse" />
    </div>

    {/* Texto de carga */}
    <p className="mt-6 text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">
      Procesando Datos...
    </p>

    {/* Indicador de progreso visual */}
    <div className="flex space-x-1.5 mt-3">
      <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-75"></span>
      <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-150"></span>
      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-300"></span>
    </div>
  </div>
);