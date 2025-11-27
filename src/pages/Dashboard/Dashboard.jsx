import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, BookOpen, FileText, Trash2, ArrowRightLeft, 
  FolderTree, ClipboardCheck, FileBarChart, ShieldCheck 
} from 'lucide-react';

const HomeCard = ({ icon: Icon, title, description, delay, onClick }) => (
  <motion.div
    onClick={onClick}
    className="group cursor-pointer bg-white border border-slate-200 rounded-lg p-6 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all duration-300 relative overflow-hidden h-full flex flex-col"
    initial={{ y: 20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ delay, duration: 0.4 }}
  >
    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
      <Icon size={80} />
    </div>

    <div className="relative z-10 flex flex-col h-full">
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 rounded-md bg-slate-50 text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-inner ring-1 ring-slate-200 group-hover:ring-blue-500">
          <Icon size={24} strokeWidth={2} />
        </div>
        <h2 className="text-lg font-bold text-slate-800 group-hover:text-blue-700 transition-colors line-clamp-2">
          {title}
        </h2>
      </div>
      
      <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-grow">
        {description}
      </p>

      <div className="flex items-center text-xs font-bold text-blue-700 uppercase tracking-wider opacity-60 group-hover:opacity-100 transition-all duration-300 mt-auto">
        Acceder al Módulo <ArrowRightLeft size={12} className="ml-1 transform group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
    <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-100 group-hover:bg-blue-600 transition-colors duration-300"></div>
  </motion.div>
);

const Dashboard = ({ userRole }) => {
  const navigate = useNavigate();

  // Definición de todos los módulos del sistema
  const allMenuItems = [
    {
      id: 'busqueda',
      title: "Búsqueda de Documentos",
      desc: "Localización rápida de expedientes mediante metadatos y filtros avanzados.",
      icon: Search,
      path: "/busqueda",
      roles: ['Admin', 'Supervisor'] // Solo personal autorizado
    },
    {
      id: 'vouchers',
      title: "Gestión de Vouchers",
      desc: "Consulta, verificación y trazabilidad de comprobantes financieros.",
      icon: FileText,
      path: "/vouchers",
      roles: ['Admin', 'Supervisor']
    },
    {
      id: 'solicitud',
      title: "Servicios Archivísticos",
      desc: "Gestión de solicitudes de préstamo, copias certificadas y consultas en sala.",
      icon: ClipboardCheck,
      path: "/solicitud",
      roles: ['Admin', 'Supervisor', 'Usuario'] // ACCESIBLE PARA TODOS
    },
    {
      id: 'inventario',
      title: "Inventario Documental",
      desc: "Administración del catálogo maestro y ubicación topográfica.",
      icon: BookOpen,
      path: "/inventario",
      roles: ['Admin', 'Supervisor']
    },
    {
      id: 'eliminacion',
      title: "Eliminación Documental",
      desc: "Proceso controlado para la disposición final de documentos caducos.",
      icon: Trash2,
      path: "/eliminacion",
      roles: ['Admin', 'Supervisor']
    },
    {
      id: 'transferencia',
      title: "Transferencia Documental",
      desc: "Control de remisiones entre Archivos de Gestión y Archivo Central.",
      icon: ArrowRightLeft,
      path: "/transferencia",
      roles: ['Admin', 'Supervisor']
    },
    {
      id: 'ccf',
      title: "Cuadro de Clasificación (CCF)",
      desc: "Mantenimiento de Series, Subseries y Tablas de Retención.",
      icon: FolderTree,
      path: "/ccf",
      roles: ['Admin', 'Supervisor']
    },
    {
      id: 'pcda',
      title: "Programa de Control (PCDA)",
      desc: "Auditoría y supervisión del cumplimiento normativo archivístico.",
      icon: ShieldCheck,
      path: "/pcda",
      roles: ['Admin', 'Supervisor']
    },
    {
      id: 'reportes',
      title: "Reportes y Métricas",
      desc: "Dashboard de indicadores de gestión, ocupación y préstamos.",
      icon: FileBarChart,
      path: "/reportes",
      roles: ['Admin', 'Supervisor']
    },
    {
      id: 'accesos',
      title: "Control de Accesos",
      desc: "Administración de roles, permisos y seguridad de usuarios.",
      icon: ShieldCheck,
      path: "/accesos",
      roles: ['Admin']
    }
  ];

  // Filtrar ítems según el rol del usuario
  const visibleItems = allMenuItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header del Dashboard */}
      <div className="bg-white border-b border-slate-200 py-3 px-2 sm:px-6 lg:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-2">
              Panel de Control
            </h1>
            <p className="text-slate-500 max-w-3xl text-sm leading-relaxed">
              Bienvenido al sistema centralizado <strong>DocuFlow</strong>. 
              {userRole === 'Usuario' 
                ? ' Seleccione una opción para gestionar sus trámites.'
                : ' Seleccione un módulo operativo para comenzar.'
              }
            </p>
          </motion.div>
        </div>
      </div>

      {/* Grid de Tarjetas */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {visibleItems.map((item, index) => (
            <HomeCard
              key={item.id}
              icon={item.icon}
              title={item.title}
              description={item.desc}
              delay={index * 0.05}
              onClick={() => navigate(item.path)}
            />
          ))}
        </div>
      </div>
      
      {/* Footer simple */}
      <footer className="max-w-7xl mx-auto px-8 py-8 text-center border-t border-slate-200 mt-8">
        <div className="flex flex-col items-center justify-center gap-2">
           <FolderTree size={20} className="text-slate-300" />
           <p className="text-xs text-slate-400 font-medium">
            © {new Date().getFullYear()} DocuFlow Enterprise. Sistema de Gestión de Archivo Central.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;