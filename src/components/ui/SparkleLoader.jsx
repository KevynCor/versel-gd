import { Sparkles } from "lucide-react";

export const SparkleLoader = () => (
  <div className="flex flex-col items-center justify-center p-8">
    <div className="relative w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    <Sparkles size={20} className="absolute text-indigo-600 animate-pulse" />
    <p className="text-slate-600 mt-3 text-sm">Cargando...</p>
  </div>
);