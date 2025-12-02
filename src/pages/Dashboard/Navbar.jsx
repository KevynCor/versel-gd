import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Menu, X, Search, Bell, User, LogOut, ChevronRight, 
  FolderTree, BookOpen, FileText, ArrowRightLeft, 
  ClipboardCheck, FileBarChart, ShieldCheck, Home, Settings, AlertCircle 
} from "lucide-react";
import { supabase } from "../../utils/supabaseClient";

// --- CONSTANTES DE ROLES (Basado en App.jsx) ---
const ROLES_ADMIN = ['Admin', 'Archivero', 'Supervisor'];
const ROL_SUPER_ADMIN = ['Admin'];

// --- DATOS DEL MENÚ CON CONTROL DE ACCESO ---
// Se añade la propiedad 'allowedRoles'. Si no existe, es accesible para todos los usuarios logueados.
const MENU_STRUCTURE = [
  {
    label: 'OPERACIONES',
    items: [
      { 
        id: 'busqueda', 
        title: "Búsqueda Documental", 
        icon: Search, 
        path: "/busqueda",
        allowedRoles: ROLES_ADMIN 
      },
      { 
        id: 'solicitud', 
        title: "Servicios Archivísticos", 
        icon: ClipboardCheck, 
        path: "/solicitud"
        // Sin allowedRoles = Acceso para 'Usuario', 'Admin', etc.
      },
      { 
        id: 'vouchers', 
        title: "Búsqueda Vouchers", 
        icon: FileText, 
        path: "/vouchers",
        allowedRoles: ROLES_ADMIN
      },
    ]
  },
  {
    label: 'GESTIÓN',
    items: [
      { 
        id: 'inventario', 
        title: "Inventario & Topografía", 
        icon: BookOpen, 
        path: "/inventario",
        allowedRoles: ROLES_ADMIN
      },
      { 
        id: 'transferencia', 
        title: "Transferencias", 
        icon: ArrowRightLeft, 
        path: "/transferencia",
        allowedRoles: ROLES_ADMIN
      },
      { 
        id: 'ccf', 
        title: "Cuadro Clasificación", 
        icon: FolderTree, 
        path: "/ccf",
        allowedRoles: ROLES_ADMIN
      },
      { 
        id: 'eliminacion', 
        title: "Eliminación Documental", 
        icon: ArrowRightLeft, 
        path: "/eliminacion",
        allowedRoles: ROLES_ADMIN
      },
    ]
  },
  {
    label: 'CONTROL',
    items: [
      { 
        id: 'reportes', 
        title: "Reportes & KPIs", 
        icon: FileBarChart, 
        path: "/reportes",
        allowedRoles: ROLES_ADMIN
      },
      { 
        id: 'pcda', 
        title: "Auditoría (PCDA)", 
        icon: ShieldCheck, 
        path: "/pcda",
        allowedRoles: ROLES_ADMIN
      },
      { 
        id: 'accesos', 
        title: "Gestión de Accesos", 
        icon: Settings, 
        path: "/accesos",
        allowedRoles: ROL_SUPER_ADMIN // Solo Admin
      },
    ]
  }
];

// --- COMPONENTE DE ITEM DE MENÚ ---
const MenuItem = ({ item, isCollapsed, isActive, onClick }) => (
  <button 
    onClick={onClick}
    title={isCollapsed ? item.title : ''}
    className={`
      w-full flex items-center gap-3 px-3 py-2.5 mb-1 rounded-lg transition-all duration-200 group relative
      ${isActive 
        ? "bg-blue-50 text-blue-700 font-medium shadow-sm" 
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}
      ${isCollapsed ? "justify-center px-0" : ""}
    `}
  >
    <div className={`
      flex items-center justify-center transition-colors flex-shrink-0
      ${isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"}
    `}>
      <item.icon size={20} strokeWidth={isActive ? 2 : 1.5} />
    </div>
    
    {!isCollapsed && (
      <span className="truncate text-sm transition-opacity duration-300">{item.title}</span>
    )}
    
    {/* Indicador lateral azul activo */}
    {isActive && (
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full" />
    )}
  </button>
);

// --- LAYOUT PRINCIPAL (NAVBAR + SIDEBAR) ---
const Navbar = ({ children, user, role, userName, error }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Filtrado del menú por ROL (Seguridad visual)
  const menuByRole = useMemo(() => {
    // Si no hay rol definido aún (cargando), mostramos solo lo básico o nada.
    // Asumimos que si role es undefined, tratamos como invitado o usuario básico hasta que cargue.
    return MENU_STRUCTURE.map(section => ({
      ...section,
      items: section.items.filter(item => {
        // Si no tiene allowedRoles, es público (para usuarios autenticados)
        if (!item.allowedRoles) return true;
        // Si tiene allowedRoles, verificamos si el rol del usuario está incluido
        return item.allowedRoles.includes(role);
      })
    })).filter(section => section.items.length > 0); // Eliminamos secciones vacías
  }, [role]);

  // 2. Filtrado del menú por BÚSQUEDA (sobre el menú ya filtrado por rol)
  const filteredMenu = useMemo(() => {
    if (!searchTerm) return menuByRole;
    return menuByRole.map(section => ({
      ...section,
      items: section.items.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })).filter(section => section.items.length > 0);
  }, [searchTerm, menuByRole]);

  // 3. Lógica para el Título Dinámico (Breadcrumb)
  const currentPageTitle = useMemo(() => {
    if (location.pathname === '/' || location.pathname === '/dashboard') return 'Panel Principal';
    if (location.pathname === '/profile') return 'Perfil de Usuario';
    
    // Buscar en la estructura completa (para que el título aparezca aunque el usuario no tenga permiso, si accedió por URL)
    // Opcionalmente podrías buscar en 'menuByRole' si quieres ser estricto.
    for (const section of MENU_STRUCTURE) {
      const foundItem = section.items.find(item => item.path === location.pathname);
      if (foundItem) return foundItem.title;
    }
    return 'Sistema DocuFlow';
  }, [location.pathname]);

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
      
      {/* 1. SIDEBAR IZQUIERDO (Fijo en escritorio) */}
      <aside 
        className={`hidden md:flex flex-col bg-white border-r border-slate-200 h-full transition-all duration-300 ease-in-out z-30 flex-shrink-0
          ${isSidebarOpen ? 'w-64' : 'w-20'}`}
      >
        {/* Logo Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 flex-shrink-0">
           <div className={`flex items-center gap-3 overflow-hidden ${!isSidebarOpen && 'justify-center w-full'}`}>
              <div className="bg-blue-600 p-1.5 rounded-lg text-white flex-shrink-0 shadow-lg shadow-blue-200">
                <FolderTree size={20} />
              </div>
              {isSidebarOpen && (
                <div className="flex flex-col min-w-0 transition-opacity duration-300">
                  <span className="font-bold text-slate-800 leading-none truncate">DocuFlow</span>
                  <span className="text-[9px] text-slate-400 font-bold tracking-wider uppercase mt-0.5">Enterprise</span>
                </div>
              )}
           </div>
        </div>

        {/* Buscador (Solo si está abierto el sidebar) */}
        {isSidebarOpen && (
          <div className="p-4 pb-2">
            <div className="relative group">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Buscar módulo..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-400 text-slate-700"
              />
            </div>
          </div>
        )}

        {/* Lista de Navegación (Scrollable) */}
        <div className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar space-y-6">
          {/* Link Fijo al Dashboard */}
          <div>
            <MenuItem 
               item={{ title: "Panel Principal", icon: Home }} 
               isCollapsed={!isSidebarOpen} 
               isActive={location.pathname === "/"} 
               onClick={() => navigate("/")}
            />
          </div>

          {filteredMenu.map((section, idx) => (
            <div key={idx}>
              {isSidebarOpen ? (
                <h4 className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                  {section.label}
                </h4>
              ) : (
                <div className="h-px bg-slate-100 mx-2 my-4" />
              )}
              
              {section.items.map(item => (
                <MenuItem 
                  key={item.id}
                  item={item}
                  isCollapsed={!isSidebarOpen}
                  isActive={location.pathname === item.path}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                />
              ))}
            </div>
          ))}

          {/* Mensaje si la búsqueda no arroja resultados */}
          {searchTerm && filteredMenu.length === 0 && (
             <div className="text-center py-4">
                <p className="text-xs text-slate-400">No se encontraron módulos.</p>
             </div>
          )}
        </div>

        {/* Footer Sidebar (Logout) */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
          <button 
            onClick={handleLogout}
            className={`
              flex items-center gap-3 text-slate-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all w-full
              ${!isSidebarOpen && 'justify-center'}
            `}
            title="Cerrar Sesión"
          >
            <LogOut size={18} />
            {isSidebarOpen && <span className="text-sm font-medium">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* 2. ÁREA DE CONTENIDO PRINCIPAL (Derecha) */}
      <div className="flex-1 flex flex-col min-w-0 h-full bg-slate-50 relative">
        
        {/* Header Superior (TopBar) */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20 flex-shrink-0">
          <div className="flex items-center gap-4">
            {/* Botón Toggle Sidebar (Desktop) */}
            <button 
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="hidden md:flex p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <Menu size={20} />
            </button>
             {/* Botón Menú (Móvil) */}
             <button 
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <Menu size={20} />
            </button>

            {/* BREADCRUMB / TÍTULO DINÁMICO */}
            <div className="flex items-center gap-2 text-sm overflow-hidden whitespace-nowrap">
              <span className="text-slate-400 hidden sm:inline">Sistema</span>
              <ChevronRight size={14} className="text-slate-300 hidden sm:inline" />
              <span className="font-bold text-slate-700 truncate">{currentPageTitle}</span>
            </div>
          </div>

          {/* Área de Usuario y Notificaciones */}
          <div className="flex items-center gap-4">
            {/* Alerta si hay error de DB */}
            {error && (
              <div className="hidden sm:flex items-center gap-1 text-xs text-red-500 bg-red-50 px-2 py-1 rounded-full border border-red-100">
                <AlertCircle size={12} />
                <span>Sin conexión</span>
              </div>
            )}

            <button className="relative p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
              <Bell size={18} />
              {/* Badge de notificación */}
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white ring-1 ring-white"></span>
            </button>
            
            {/* Info Usuario */}
            <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-bold text-slate-700 truncate max-w-[150px]">
                  {userName || user?.email || 'Usuario'}
                </p>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  {role || 'Invitado'}
                </p>
              </div>
              <button 
                onClick={() => navigate('/profile')}
                className="group focus:outline-none transition-transform active:scale-95"
                title="Ir a mi perfil"
              >
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 ring-2 ring-white shadow-sm border border-blue-200">
                  <User size={18} />
                </div>
              </button>              
            </div>
          </div>
        </header>

        {/* CONTENEDOR DE PÁGINAS (Children) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <div className="w-full max-w-7xl mx-auto animate-in fade-in duration-300">
             {children}
          </div>
        </main>

      </div>

      {/* =========================================================
          3. MENÚ MÓVIL (Overlay) - Solo pantallas pequeñas
         ========================================================= */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop Oscuro */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
            />
            {/* Panel Deslizante */}
            <motion.div
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[85%] max-w-xs bg-white shadow-2xl z-50 md:hidden flex flex-col"
            >
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                 <div className="flex items-center gap-2">
                    <div className="bg-blue-600 p-1 rounded text-white"><FolderTree size={16}/></div>
                    <span className="font-bold text-slate-800">DocuFlow</span>
                 </div>
                 <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-500 hover:text-red-500"><X size={20}/></button>
              </div>
              
              {/* Info usuario móvil */}
              <div className="p-4 bg-slate-50/50 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200">
                        <User size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 truncate max-w-[180px]">{userName || 'Usuario'}</p>
                        <p className="text-xs text-slate-500">{role || 'Invitado'}</p>
                      </div>
                  </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                 <button 
                    onClick={() => navigate("/")}
                    className="w-full flex items-center gap-3 px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg mb-4 bg-white border border-slate-200"
                 >
                    <Home size={18} className="text-blue-500" /> Panel Principal
                 </button>

                 {/* Usamos 'menuByRole' aquí para que el móvil también respete los permisos */}
                 {menuByRole.map((section, i) => (
                    <div key={i} className="mb-6">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">{section.label}</p>
                      {section.items.map(item => (
                        <button 
                          key={item.id} 
                          onClick={() => navigate(item.path)}
                          className={`w-full flex items-center gap-3 px-3 py-3 text-sm rounded-lg mb-1 transition-colors
                            ${location.pathname === item.path ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}
                          `}
                        >
                          <item.icon size={18} strokeWidth={location.pathname === item.path ? 2 : 1.5} /> 
                          {item.title}
                        </button>
                      ))}
                    </div>
                 ))}
              </div>

              <div className="p-4 border-t border-slate-100">
                <button 
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 w-full p-3 text-red-600 bg-red-50 rounded-lg font-medium hover:bg-red-100 transition-colors"
                >
                  <LogOut size={18} /> Cerrar Sesión
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Navbar;