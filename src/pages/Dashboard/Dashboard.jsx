import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, BookOpen, FileText, Trash2, ArrowRightLeft, 
  FolderTree, ClipboardCheck, FileBarChart, ShieldCheck, 
  LayoutGrid, Layers, Settings, ChevronRight, Activity, Clock
} from 'lucide-react';

// --- 1. COMPONENTES ATÓMICOS ---

// Tarjeta de Métrica (KPI)
const StatCard = ({ label, value, trend, icon: Icon, color }) => (
  <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 flex items-start justify-between">
    <div>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{value}</h3>
      {trend && (
        <div className="flex items-center gap-1.5 mt-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          <p className="text-xs font-medium text-slate-500">{trend}</p>
        </div>
      )}
    </div>
    <div className={`p-2.5 rounded-md ${color} bg-opacity-10 text-opacity-100`}>
      <Icon size={20} className={color.replace('bg-', 'text-')} />
    </div>
  </div>
);

// Tarjeta de Módulo
const ModuleCard = ({ item, onClick }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.98 }}
    transition={{ duration: 0.2 }}
    onClick={onClick}
    className="group cursor-pointer bg-white border border-slate-200 rounded-lg p-5 hover:border-blue-400 hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full"
  >
    <div>
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 rounded-md bg-slate-50 text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
          <item.icon size={22} strokeWidth={1.5} />
        </div>
        <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors transform group-hover:translate-x-1" />
      </div>
      <h3 className="font-bold text-slate-800 text-base mb-2 group-hover:text-blue-700 transition-colors">
        {item.title}
      </h3>
      <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
        {item.desc}
      </p>
    </div>
  </motion.div>
);

// --- 2. COMPONENTE PRINCIPAL ---

const Dashboard = ({ userRole }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('operaciones');
  const [searchQuery, setSearchQuery] = useState('');

  // Configuración de Datos
  const stats = [
    { label: "Solicitudes Pendientes", value: "12", trend: "+2 nuevas hoy", icon: Clock, color: "bg-amber-500 text-amber-600" },
    { label: "Documentos Archivados", value: "8,450", trend: "+150 esta semana", icon: FileText, color: "bg-blue-500 text-blue-600" },
    { label: "Eficacia Operativa", value: "94%", trend: "Dentro del objetivo", icon: Activity, color: "bg-emerald-500 text-emerald-600" },
  ];

  // Estructura de menús
  const menuStructure = [
    {
      id: 'operaciones',
      label: 'Operaciones',
      icon: LayoutGrid,
      items: [
        { id: 'busqueda', title: "Búsqueda Global", desc: "Búsqueda avanzada de expedientes y metadatos.", icon: Search, path: "/busqueda", roles: ['Admin', 'Supervisor'] },
        { id: 'solicitud', title: "Servicios Archivísticos", desc: "Gestión de préstamos y consultas.", icon: ClipboardCheck, path: "/solicitud", roles: ['Admin', 'Supervisor', 'Usuario'] },
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

  // Lógica de Filtrado
  const filteredModules = useMemo(() => {
    // 1. Búsqueda Global
    if (searchQuery.length > 1) {
      return menuStructure
        .flatMap(cat => cat.items)
        .filter(item => 
          item.roles.includes(userRole) && 
          (item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
           item.desc.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }

    // 2. Filtrado por Tab
    const currentCategory = menuStructure.find(cat => cat.id === activeTab);
    return currentCategory 
      ? currentCategory.items.filter(item => item.roles.includes(userRole)) 
      : [];
  }, [activeTab, searchQuery, userRole]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* 1. CABECERA CORPORATIVA */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            {/* Título de Sección */}
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">Panel de Control</h1>
            </div>
            
            {/* Buscador Integrado */}
            <div className="relative w-full md:w-96">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400" />
              </div>
              <input 
                type="text" 
                placeholder="Buscar módulo, reporte o función..." 
                className="block w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-transparent rounded-md text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* 2. KPIS OPERATIVOS (Solo visible sin búsqueda) */}
        {!searchQuery && (
          <motion.section 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {stats.map((stat, idx) => (
              <StatCard key={idx} {...stat} />
            ))}
          </motion.section>
        )}

        {/* 3. PESTAÑAS DE NAVEGACIÓN (Solo visible sin búsqueda) */}
        {!searchQuery && (
          <div className="border-b border-slate-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
              {menuStructure.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-all duration-200
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
        )}

        {/* 4. GRID DE MÓDULOS */}
        <section>
          {searchQuery && (
            <div className="mb-6 flex items-center gap-2 text-sm text-slate-600">
              <Search size={14} />
              <p>Resultados para <span className="font-bold">"{searchQuery}"</span>:</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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

          {filteredModules.length === 0 && (
            <div className="text-center py-24 bg-white rounded-lg border border-dashed border-slate-300">
              <FolderTree size={48} className="mx-auto text-slate-300 mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-slate-900">Sin resultados</h3>
              <p className="text-sm text-slate-500 mt-1">No se encontraron módulos con el término ingresado.</p>
            </div>
          )}
        </section>

      </main>
    </div>
  );
};

export default Dashboard;