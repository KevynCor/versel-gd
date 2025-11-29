import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';

// --- A. RE-EXPORTACIÓN DE ICONOS ---
export * from 'lucide-react';

// --- B. RE-EXPORTACIÓN DE TUS COMPONENTES UI EXISTENTES ---
// (Asegúrate de que estas rutas sean correctas en tu proyecto)
export { SearchBar } from '../../components/controls/SearchBar';
export { StatCard } from '../../components/ui/StatCard'; 
// ... exporta aquí el resto de tus componentes ui si los necesitas en el dashboard

// --- C. COMPONENTES ESPECÍFICOS DEL DASHBOARD (REFACTORIZADOS) ---

/**
 * DashboardMetricCard:
 * Estilo "StatCard" corporativo: Fondo blanco, número grande, borde suave.
 * Mantiene la lógica de expansión "Ver detalles".
 */
export const DashboardMetricCard = ({ label, value, trend, icon: Icon, color, details }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Extraemos el color base para el borde superior (ej: bg-blue-500 -> border-blue-500)
  const borderColorClass = color.split(' ')[0].replace('bg-', 'border-');
  const textColorClass = color.split(' ')[1] || 'text-slate-600';

  return (
    <motion.div 
      layout
      className={`bg-white rounded-lg shadow-sm border border-slate-200 border-t-4 ${borderColorClass} p-4 flex flex-col justify-between`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
          <h3 className="text-3xl font-bold text-slate-800 mt-1">{value}</h3>
        </div>
        <div className={`p-2 rounded-md bg-slate-50 ${textColorClass}`}>
          <Icon size={24} />
        </div>
      </div>

      {trend && (
        <div className="mt-3 flex items-center text-xs font-medium text-slate-500">
           <span className="mr-1">📈</span> {trend}
        </div>
      )}

      {/* Lógica de expansión preservada */}
      <div className="mt-3 pt-2 border-t border-slate-100">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 transition-colors w-full justify-end"
        >
          {isExpanded ? 'Ocultar' : 'Ver análisis'}
          <ChevronDown size={12} className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded border border-slate-100 italic"
            >
              {details}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

/**
 * DashboardModuleCard:
 * Tarjeta de navegación estilo corporativo.
 */
export const DashboardModuleCard = ({ item, onClick }) => (
  <motion.div
    layout
    whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}
    onClick={onClick}
    className="group cursor-pointer bg-white border border-slate-200 rounded-lg p-5 hover:border-blue-500 transition-all duration-300 relative overflow-hidden"
  >
    {/* Decoración de fondo */}
    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-slate-50 to-slate-100 rounded-bl-full -mr-4 -mt-4 transition-colors group-hover:from-blue-50 group-hover:to-blue-100"></div>

    <div className="flex items-start justify-between mb-3 relative z-10">
      <div className="p-2.5 rounded-lg bg-slate-50 text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-sm">
        <item.icon size={24} strokeWidth={1.5} />
      </div>
      <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
    </div>
    
    <div className="relative z-10">
      <h3 className="font-bold text-slate-800 text-lg mb-1 group-hover:text-blue-700 transition-colors">
        {item.title}
      </h3>
      <p className="text-sm text-slate-500 leading-snug line-clamp-2">
        {item.desc}
      </p>
    </div>
  </motion.div>
);

/**
 * SectionHeader: Titulos de secciones con linea separadora
 */
export const SectionHeader = ({ title, icon: Icon }) => (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200">
        {Icon && <Icon size={18} className="text-blue-600" />}
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{title}</h2>
    </div>
);

/**
 * InfoPanel: Contenedor tipo panel para información secundaria
 */
export const InfoPanel = ({ title, children, icon: Icon, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden mb-4">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-3 bg-slate-50 border-b border-slate-100 hover:bg-slate-100 transition-colors"
            >
                <div className="flex items-center gap-2">
                    {Icon && <Icon size={16} className="text-slate-500" />}
                    <span className="text-sm font-semibold text-slate-700">{title}</span>
                </div>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}