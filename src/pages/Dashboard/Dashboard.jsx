import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, BookOpen, FileText, Trash2, ArrowRightLeft, 
  FolderTree, ClipboardCheck, FileBarChart, ShieldCheck, 
  LayoutGrid, Layers, Settings, ChevronRight, Activity, Clock,
  ChevronDown, Bell, Filter, AlertCircle
} from 'lucide-react';

// --- 1. COMPONENTES ATÓMICOS Y MODULARES ---

/**
 * MetricCard: KPI con funcionalidad de expansión ("Ver más")
 * Preserva estilos: border-slate-200, shadow-sm, colores semánticos
 */
const MetricCard = ({ label, value, trend, icon: Icon, color, details }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div 
      layout
      className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden"
    >
      <div className="flex items-start justify-between w-full">
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
          <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{value}</h3>
          
          {trend && (
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`h-1.5 w-1.5 rounded-full ${color.split(' ')[0].replace('bg-opacity-10', '')}`}></span>
              <p className="text-xs font-medium text-slate-500">{trend}</p>
            </div>
          )}
        </div>
        <div className={`p-2.5 rounded-md ${color} bg-opacity-10 text-opacity-100`}>
          <Icon size={20} className={color.replace('bg-', 'text-')} />
        </div>
      </div>

      {/* Botón de expansión discreto */}
      <div className="mt-4 pt-3 border-t border-slate-100 w-full">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
        >
          {isExpanded ? 'Ocultar detalles' : 'Ver detalles'}
          <ChevronDown size={12} className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Contenido Expandible */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded"
          >
            {details || "Sin información adicional disponible por el momento."}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/**
 * ModuleCard (QuickAccessCard): Tarjeta de navegación
 * Preserva estilos: group-hover:blue, border-slate-200
 */
const ModuleCard = ({ item, onClick }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.98 }}
    whileHover={{ y: -2 }}
    transition={{ duration: 0.2 }}
    onClick={onClick}
    className="group cursor-pointer bg-white border border-slate-200 rounded-lg p-5 hover:border-blue-400 hover:shadow-md transition-all duration-200 flex flex-col h-full relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
      <ChevronRight size={18} className="text-blue-500" />
    </div>
    
    <div className="mb-4">
      <div className="inline-flex p-2 rounded-md bg-slate-50 text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
        <item.icon size={22} strokeWidth={1.5} />
      </div>
    </div>
    
    <div>
      <h3 className="font-bold text-slate-800 text-base mb-2 group-hover:text-blue-700 transition-colors">
        {item.title}
      </h3>
      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
        {item.desc}
      </p>
    </div>
  </motion.div>
);

/**
 * TabNavigation: Sistema de pestañas
 */
const TabNavigation = ({ tabs, activeTab, onTabChange }) => (
  <div className="border-b border-slate-200 mb-6">
    <nav className="-mb-px flex space-x-8 overflow-x-auto scrollbar-hide" aria-label="Tabs">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-all duration-200 outline-none
              ${isActive 
                ? 'border-blue-600 text-blue-700' 
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'}
            `}
          >
            <tab.icon size={16} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
            {tab.label}
          </button>
        );
      })}
    </nav>
  </div>
);

/**
 * CollapsibleSection: Acordeón para información secundaria
 */
const CollapsibleSection = ({ title, children, defaultOpen = false, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-slate-200 rounded-lg bg-white overflow-hidden mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon size={18} className="text-slate-500" />}
          <span className="text-sm font-semibold text-slate-700">{title}</span>
        </div>
        <ChevronDown 
          size={16} 
          className={`text-slate-400 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-4 border-t border-slate-200">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- 2. COMPONENTE PRINCIPAL REFACTORIZADO ---

const Dashboard = ({ userRole = 'Admin' }) => {
  const navigate = useNavigate();
  
  // Estados preservados y nuevos
  const [activeTab, setActiveTab] = useState('operaciones');
  const [searchQuery, setSearchQuery] = useState('');
  
  // --- CONFIGURACIÓN DE DATOS (Mismos datos) ---
  const stats = [
    { 
      label: "Solicitudes Pendientes", 
      value: "12", 
      trend: "+2 nuevas hoy", 
      icon: Clock, 
      color: "bg-amber-500 text-amber-600",
      details: "Hay 2 préstamos vencidos y 10 solicitudes de sala de lectura pendientes de aprobación."
    },
    { 
      label: "Documentos Archivados", 
      value: "8,450", 
      trend: "+150 esta semana", 
      icon: FileText, 
      color: "bg-blue-500 text-blue-600",
      details: "El volumen de ingestión ha aumentado un 15% respecto al mes anterior."
    },
    { 
      label: "Eficacia Operativa", 
      value: "94%", 
      trend: "Dentro del objetivo", 
      icon: Activity, 
      color: "bg-emerald-500 text-emerald-600",
      details: "Tiempo promedio de respuesta: 4 horas. Meta: < 6 horas."
    },
    // Se podría agregar un 4to KPI aquí si fuera necesario
  ];

  const menuStructure = [
    {
      id: 'operaciones',
      label: 'Operaciones',
      icon: LayoutGrid,
      items: [
        { id: 'busqueda', title: "Búsqueda Documental", desc: "Búsqueda avanzada de expedientes y metadatos.", icon: Search, path: "/busqueda", roles: ['Admin', 'Archivero', 'Supervisor'] },
        { id: 'solicitud', title: "Servicios Archivísticos", desc: "Gestión de préstamos y consultas.", icon: ClipboardCheck, path: "/solicitud", roles: ['Admin', 'Archivero', 'Supervisor', 'Usuario'] },
        { id: 'vouchers', title: "Busqueda Vouchers", desc: "Trazabilidad de documentos financieros.", icon: FileText, path: "/vouchers", roles: ['Admin', 'Supervisor'] },
      ]
    },
    {
      id: 'gestion',
      label: 'Gestión Documental',
      icon: Layers,
      items: [
        { id: 'inventario', title: "Inventario", desc: "Catálogo maestro y topografía.", icon: BookOpen, path: "/inventario", roles: ['Admin', 'Supervisor'] },
        { id: 'transferencia', title: "Transferencias", desc: "Remisiones entre archivos de gestión y central.", icon: ArrowRightLeft, path: "/transferencia", roles: ['Admin', 'Supervisor'] },
        { id: 'eliminacion', title: "Eliminación", desc: "Disposición final controlada.", icon: Trash2, path: "/eliminacion", roles: ['Admin', 'Supervisor'] },
        { id: 'ccf', title: "Cuadro Clasificación", desc: "Tablas de retención y series documentales.", icon: FolderTree, path: "/ccf", roles: ['Admin', 'Supervisor'] },
      ]
    },
    {
      id: 'control',
      label: 'Control y Auditoría',
      icon: Settings,
      items: [
        { id: 'reportes', title: "Reportes", desc: "Métricas e indicadores de gestión.", icon: FileBarChart, path: "/reportes", roles: ['Admin', 'Supervisor'] },
        { id: 'pcda', title: "Auditoría (PCDA)", desc: "Supervisión normativa y cumplimiento.", icon: ShieldCheck, path: "/pcda", roles: ['Admin', 'Supervisor'] },
        { id: 'accesos', title: "Seguridad", desc: "Gestión de usuarios, roles y permisos.", icon: ShieldCheck, path: "/accesos", roles: ['Admin'] },
      ]
    }
  ];

  // Lógica de Filtrado (PRESERVADA)
  const filteredModules = useMemo(() => {
    if (searchQuery.length > 1) {
      return menuStructure
        .flatMap(cat => cat.items)
        .filter(item => 
          item.roles.includes(userRole) && 
          (item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
           item.desc.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }
    const currentCategory = menuStructure.find(cat => cat.id === activeTab);
    return currentCategory 
      ? currentCategory.items.filter(item => item.roles.includes(userRole)) 
      : [];
  }, [activeTab, searchQuery, userRole]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 p-6 md:p-8">
      
      {/* 1. SECCIÓN SUPERIOR: Título + Buscador Contextual (Reemplaza Header) */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Panel de Control</h1>
            <p className="text-sm text-slate-500 mt-1">Bienvenido al sistema de gestión archivística.</p>
          </div>
          
          {/* Buscador integrado en el flujo, no en header fijo */}
          <div className="relative w-full md:w-80 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input 
              type="text" 
              placeholder="Buscar módulo..." 
              className="block w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-600"
              >
                ESC
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto space-y-8">
        
        {/* 2. MÉTRICAS PRINCIPALES (KPIs) - Ocultas si hay búsqueda activa */}
        {!searchQuery && (
          <motion.section 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {stats.map((stat, idx) => (
              <MetricCard key={idx} {...stat} />
            ))}
            {/* Ejemplo de tarjeta de acción rápida si sobrara espacio en grid de 4 */}
            <div className="hidden xl:flex items-center justify-center p-5 rounded-lg border border-dashed border-slate-300 bg-slate-50/50 hover:bg-slate-100 transition-colors cursor-pointer group">
               <div className="text-center">
                  <div className="w-10 h-10 mx-auto bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200 mb-2 group-hover:scale-110 transition-transform">
                    <Filter size={18} className="text-slate-400" />
                  </div>
                  <p className="text-xs font-medium text-slate-500">Personalizar KPIs</p>
               </div>
            </div>
          </motion.section>
        )}

        {/* 3. NAVEGACIÓN PRINCIPAL (Módulos) */}
        <section>
          {/* Tabs - Ocultas si hay búsqueda activa */}
          {!searchQuery && (
            <TabNavigation 
              tabs={menuStructure} 
              activeTab={activeTab} 
              onTabChange={setActiveTab} 
            />
          )}

          {/* Resultado de búsqueda header */}
          {searchQuery && (
            <div className="mb-6 flex items-center justify-between pb-2 border-b border-slate-200">
               <div className="flex items-center gap-2 text-sm text-slate-600">
                <Search size={14} />
                <p>Resultados para <span className="font-bold text-slate-900">"{searchQuery}"</span></p>
              </div>
              <button 
                onClick={() => setSearchQuery('')}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Limpiar filtros
              </button>
            </div>
          )}
          
          {/* Grid de Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredModules.map((item) => (
                <ModuleCard 
                  key={item.id} 
                  item={item} 
                  onClick={() => navigate(item.path)} 
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Estado Vacío */}
          {filteredModules.length === 0 && (
            <div className="text-center py-16 bg-white rounded-lg border border-dashed border-slate-300">
              <FolderTree size={48} className="mx-auto text-slate-300 mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-slate-900">Sin resultados</h3>
              <p className="text-sm text-slate-500 mt-1">Intenta ajustar tu búsqueda.</p>
              <button 
                onClick={() => setSearchQuery('')}
                className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-md transition-colors"
              >
                Ver todo
              </button>
            </div>
          )}
        </section>

        {/* 4. INFORMACIÓN SECUNDARIA (Acordeones Colapsables) */}
        {!searchQuery && (
          <section className="mt-8">
            <CollapsibleSection title="Alertas y Notificaciones Recientes" icon={Bell} defaultOpen={false}>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded bg-amber-50 border border-amber-100">
                  <AlertCircle size={16} className="text-amber-500 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-amber-800">Mantenimiento Programado</h4>
                    <p className="text-xs text-amber-600 mt-1">El sistema estará en mantenimiento el Sábado a las 22:00 hrs.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded bg-blue-50 border border-blue-100">
                  <Activity size={16} className="text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-800">Actualización de Normativa</h4>
                    <p className="text-xs text-blue-600 mt-1">Se han cargado las nuevas tablas de retención documental.</p>
                  </div>
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Accesos Rápidos Admin" icon={Settings}>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button className="text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 p-2 rounded text-left transition-colors">
                    Configuración Global
                  </button>
                  <button className="text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 p-2 rounded text-left transition-colors">
                    Logs del Sistema
                  </button>
                  <button className="text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 p-2 rounded text-left transition-colors">
                    Respaldo Database
                  </button>
               </div>
            </CollapsibleSection>
          </section>
        )}

      </main>
    </div>
  );
};

export default Dashboard;