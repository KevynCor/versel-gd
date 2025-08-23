import { Sparkles } from "lucide-react";

export const SparkleLoader = () => (
  <div className="flex flex-col items-center justify-center p-8">
    {/* Círculo giratorio con degradado */}
    <div className="relative w-12 h-12">
      <div className="absolute inset-0 rounded-full border-4 border-indigo-200 border-t-indigo-500 animate-spin"></div>
      {/* Sparkle animado */}
      <Sparkles size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-500 animate-pulse" />
    </div>

    {/* Texto de carga */}
    <p className="mt-4 text-sm font-medium text-slate-700 animate-pulse">
      Cargando...
    </p>

    {/* Barra de puntos animados opcional */}
    <div className="flex space-x-1 mt-2">
      <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-75"></span>
      <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-150"></span>
      <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-300"></span>
    </div>
  </div>
);
