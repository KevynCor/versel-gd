import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, ArrowRightLeft, FileBarChart, ShieldCheck, 
  Activity, Clock, ChevronDown, FilePlus
} from 'lucide-react';

// --- DATOS MOCK ---

const ACTIVITY_DATA = [
  { id: 1, type: 'document', title: 'Memorando 2024-001 Ingresado', user: 'Ana G.', time: '10 min', desc: 'Registro de expediente administrativo RRHH.' },
  { id: 2, type: 'loan', title: 'Préstamo Solicitado', user: 'Carlos M.', time: '32 min', desc: 'Expediente Finanzas 2022 para auditoría.' },
  { id: 3, type: 'transfer', title: 'Transferencia Aprobada', user: 'Admin', time: '1h', desc: 'Lote #45 de Gestión a Central.' },
  { id: 4, type: 'document', title: 'Oficio 500 Digitalizado', user: 'Ana G.', time: '2h', desc: 'Carga masiva de imágenes.' },
  { id: 5, type: 'loan', title: 'Devolución Registrada', user: 'Roberto P.', time: '3h', desc: 'Expediente devuelto en buen estado.' },
];

const ORG_STATS = [
  { name: 'Dirección General', count: 1250, percent: 85 },
  { name: 'Recursos Humanos', count: 3400, percent: 60 },
  { name: 'Finanzas y Admin', count: 5100, percent: 92 },
  { name: 'Operaciones', count: 2800, percent: 45 },
  { name: 'Tecnología', count: 900, percent: 30 },
];

// --- COMPONENTES ATÓMICOS ---

const MinimalMetric = ({ label, value, trend, icon: Icon, color, details }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2.5 rounded-lg ${color.bg} ${color.text} bg-opacity-10`}>
          <Icon size={20} />
        </div>
        {trend && (
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
            {trend}
          </span>
        )}
      </div>
      <div>
        <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{value}</h3>
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mt-1">{label}</p>
      </div>
      
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="mt-4 text-[11px] flex items-center gap-1.5 text-slate-400 hover:text-blue-600 transition-colors w-full font-medium"
      >
        {isOpen ? 'Ocultar detalles' : 'Ver análisis rápido'} 
        <ChevronDown size={12} className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="pt-3 text-xs text-slate-600 border-t border-slate-100 mt-3 leading-relaxed">
              {details}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const OrgChartBar = () => (
  <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm h-full flex flex-col">
    <div className="flex justify-between items-center mb-6">
      <h3 className="font-bold text-slate-800 flex items-center gap-2">
        <FileBarChart size={18} className="text-blue-500" />
        Volumen Documental
      </h3>
      <button className="text-xs text-blue-600 hover:underline font-medium">Reporte completo</button>
    </div>
    
    <div className="space-y-5 flex-1">
      {ORG_STATS.map((dept, idx) => (
        <div key={idx} className="group">
          <div className="flex justify-between text-xs mb-2">
            <span className="font-semibold text-slate-700 group-hover:text-blue-700 transition-colors">{dept.name}</span>
            <span className="text-slate-500 font-mono">{dept.count.toLocaleString()}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${dept.percent}%` }}
              transition={{ duration: 1, delay: idx * 0.1 }}
              className={`h-full rounded-full ${idx === 0 ? 'bg-blue-600' : 'bg-slate-300 group-hover:bg-blue-400 transition-colors'}`}
            />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const RecentActivityPanel = () => {
  const [activeTab, setActiveTab] = useState('all');

  const filteredActivities = useMemo(() => {
    if (activeTab === 'all') return ACTIVITY_DATA;
    return ACTIVITY_DATA.filter(act => act.type === activeTab);
  }, [activeTab]);

  const tabs = [
    { id: 'all', label: 'Todo' },
    { id: 'document', label: 'Docs' },
    { id: 'loan', label: 'Préstamos' },
    { id: 'transfer', label: 'Transf.' },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm h-full overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <Activity size={18} className="text-blue-500" />
          Actividad Reciente
        </h3>
        <div className="flex bg-slate-100 p-0.5 rounded-lg">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-3 py-1 text-[10px] font-bold rounded-md transition-all
                ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {filteredActivities.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="group flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-default"
            >
              <div className={`mt-0.5 min-w-[28px] h-7 rounded-lg flex items-center justify-center border
                ${item.type === 'document' ? 'bg-blue-50 border-blue-100 text-blue-600' : 
                  item.type === 'loan' ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-purple-50 border-purple-100 text-purple-600'}
              `}>
                {item.type === 'document' ? <FileText size={14} /> : 
                 item.type === 'loan' ? <Clock size={14} /> : <ArrowRightLeft size={14} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-semibold text-slate-800 truncate">{item.title}</p>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{item.time}</span>
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">{item.desc}</p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-600">
                    {item.user.charAt(0)}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">{item.user}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filteredActivities.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400">
            <Activity size={24} className="mb-2 opacity-50" />
            <span className="text-xs">Sin actividad reciente</span>
          </div>
        )}
      </div>
      
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-center">
        <button className="text-xs text-blue-600 font-bold hover:text-blue-700 hover:underline">
          Ver historial completo
        </button>
      </div>
    </div>
  );
};

// --- COMPONENTE DASHBOARD (Solo Contenido) ---

const Dashboard = () => {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      
      {/* 1. Header de Sección */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Resumen Operativo</h2>
            <p className="text-sm text-slate-500 mt-1">Visión general del estado del archivo y tareas pendientes.</p>
          </div>
          
          <div className="flex items-center gap-3">
             <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
               <ShieldCheck size={16} />
               <span>Reporte Incidencia</span>
             </button>
             <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 active:scale-95">
               <FilePlus size={18} />
               <span>Nuevo Ingreso</span>
             </button>
          </div>
      </div>

      {/* 2. KPIs CLAVE */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MinimalMetric 
          label="Solicitudes Pendientes"
          value="12"
          trend="+2 hoy"
          icon={Clock}
          color={{ bg: 'bg-amber-500', text: 'text-amber-600' }}
          details="2 préstamos vencidos, 10 solicitudes de sala."
        />
        <MinimalMetric 
          label="Ingesta Documental (Mes)"
          value="8,450"
          trend="+15%"
          icon={FileText}
          color={{ bg: 'bg-blue-500', text: 'text-blue-600' }}
          details="Principalmente de Finanzas (Serie 400)."
        />
        <MinimalMetric 
          label="Eficacia Operativa"
          value="94%"
          icon={Activity}
          color={{ bg: 'bg-emerald-500', text: 'text-emerald-600' }}
          details="Tiempo promedio respuesta: 4.2 horas."
        />
      </section>

      {/* 3. GRÁFICOS Y ACTIVIDAD */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[26rem]">
        <div className="lg:col-span-1 h-full">
          <OrgChartBar />
        </div>
        <div className="lg:col-span-2 h-full">
          <RecentActivityPanel />
        </div>
      </section>

    </div>
  );
};

export default Dashboard;