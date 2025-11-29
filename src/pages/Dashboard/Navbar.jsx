import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, LogOut, LogIn, Menu, X, FolderTree, Bell, 
  Home, AlertCircle, ChevronDown, Settings 
} from "lucide-react";

import { supabase } from "../../utils/supabaseClient";

// --- HOOKS AUXILIARES ---

// Hook para detectar clics fuera de un elemento (Cierra dropdowns)
const useClickOutside = (ref, handler) => {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
};

// --- SUB-COMPONENTES ATÓMICOS ---

// 1. Botón de Notificaciones (Badge solo si es necesario)
const NotificationBtn = () => (
  <button className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-slate-800">
    <Bell size={20} />
    {/* En un caso real, renderizar condicionalmente si count > 0 */}
    <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-blue-500 rounded-full border-2 border-slate-900"></span>
  </button>
);

// 2. Dropdown de Usuario (Escritorio) - Diseño Progresivo
const UserDropdown = ({ user, userName, role, error, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  useClickOutside(dropdownRef, () => setIsOpen(false));

  // Estado visual de error
  const avatarRingColor = error ? "ring-red-500" : "ring-slate-700 group-hover:ring-blue-500";

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 group focus:outline-none"
      >
        <div className="text-right hidden lg:block">
          <p className="text-sm font-medium text-white leading-none mb-1">
            {userName || "Usuario"}
          </p>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
            {role || "Invitado"}
          </p>
        </div>
        
        <div className={`h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 ring-2 ${avatarRingColor} transition-all overflow-hidden`}>
          {/* Aquí podría ir una imagen real del usuario */}
          <User size={18} />
        </div>
        
        <ChevronDown size={14} className={`text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 overflow-hidden"
          >
            {/* Cabecera del Dropdown */}
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Cuenta</p>
              <p className="text-sm font-semibold text-slate-800 truncate">{user.email}</p>
              {error && (
                <div className="mt-2 flex items-center gap-2 text-xs text-red-600 bg-red-50 p-1.5 rounded border border-red-100">
                  <AlertCircle size={12} />
                  <span>Error de sincronización</span>
                </div>
              )}
            </div>

            {/* Opciones */}
            <div className="py-1">
              <Link 
                to="/profile" 
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                <Settings size={16} /> Configuración de Perfil
              </Link>
            </div>

            {/* Footer con Acción Crítica */}
            <div className="border-t border-slate-100 mt-1 py-1">
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} /> Cerrar Sesión
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 3. Enlace Móvil Optimizado
const MobileLink = ({ to, icon: Icon, label, onClick, active = false }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center gap-4 px-4 py-3.5 rounded-lg transition-all font-medium ${
      active 
        ? "bg-blue-600 text-white shadow-md shadow-blue-900/20" 
        : "text-slate-400 hover:bg-slate-800 hover:text-white"
    }`}
  >
    <Icon size={20} /> {label}
  </Link>
);

// --- COMPONENTE PRINCIPAL ---

const Navbar = ({ user, role, userName, error }) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  
  // Lógica de Scroll (Mantenida intacta)
  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 10) {
        setIsVisible(true);
        lastScrollY = currentScrollY;
        return;
      }
      setIsVisible(currentScrollY <= lastScrollY);
      lastScrollY = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Error logout:", error.message);
    setMenuOpen(false);
    navigate("/login");
  };

  return (
    <>
      <motion.nav
        initial={{ y: 0 }}
        animate={{ y: isVisible ? 0 : "-100%" }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md bg-opacity-95"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* SECCIÓN 1: Identidad (Logo) */}
            <Link 
              to="/" 
              className="flex items-center gap-3 group focus:outline-none"
              onClick={() => setMenuOpen(false)}
            >
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-1.5 rounded-lg text-white shadow-lg shadow-blue-900/50 group-hover:scale-105 transition-transform duration-300">
                <FolderTree size={24} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-lg leading-tight tracking-wide group-hover:text-blue-200 transition-colors">DocuFlow</span>
                <span className="text-slate-500 text-[10px] font-bold tracking-widest uppercase">Enterprise</span>
              </div>
            </Link>

            {/* SECCIÓN 2: Acciones Desktop (Ocultas en móvil) */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <>
                  {/* Priorización: Notificaciones separadas */}
                  <NotificationBtn />
                  
                  {/* Separador Visual */}
                  <div className="h-6 w-px bg-slate-800 mx-1"></div>

                  {/* Agrupación: Menú de Usuario Todo-en-Uno */}
                  <UserDropdown 
                    user={user}
                    userName={userName}
                    role={role}
                    error={error}
                    onLogout={handleLogout}
                  />
                </>
              ) : (
                <Link 
                  to="/login" 
                  className="px-5 py-2 rounded-full bg-slate-800 text-slate-200 text-sm font-medium hover:bg-slate-700 hover:text-white transition-all border border-slate-700"
                >
                  <span className="flex items-center gap-2"><LogIn size={16}/> Iniciar Sesión</span>
                </Link>
              )}
            </div>

            {/* Botón Menú Móvil */}
            <button 
              className="md:hidden p-2 text-slate-400 hover:text-white active:scale-95 transition-transform" 
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* SECCIÓN 3: Navegación Móvil (Drawer) */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden"
            />

            {/* Drawer Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
              className="fixed right-0 top-0 h-full w-[80%] max-w-sm bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col md:hidden"
            >
              {/* Drawer Header: Perfil Móvil */}
              <div className="p-6 border-b border-slate-800 bg-slate-950/30">
                <div className="flex justify-between items-start mb-6">
                  {user ? (
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-900/40">
                        {userName ? userName.charAt(0).toUpperCase() : <User size={20}/>}
                      </div>
                      <div>
                        <p className="text-white font-bold truncate max-w-[150px]">
                          {userName || "Usuario"}
                        </p>
                        <p className="text-xs text-slate-400 font-medium bg-slate-800 px-2 py-0.5 rounded-full inline-block mt-1">
                          {role || "Invitado"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-white font-bold text-xl">Menú</span>
                  )}
                  
                  <button onClick={() => setMenuOpen(false)} className="text-slate-500 hover:text-white p-1">
                    <X size={24} />
                  </button>
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <p className="text-xs leading-relaxed">Error sincronizando datos del perfil.</p>
                  </div>
                )}
              </div>

              {/* Drawer Body: Links */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <MobileLink to="/" icon={Home} label="Panel Principal" onClick={() => setMenuOpen(false)} active />
                {user ? (
                  <MobileLink to="/profile" icon={Settings} label="Configuración" onClick={() => setMenuOpen(false)} />
                ) : (
                  <MobileLink to="/login" icon={LogIn} label="Iniciar Sesión" onClick={() => setMenuOpen(false)} />
                )}
              </div>

              {/* Drawer Footer: Logout */}
              {user && (
                <div className="p-4 border-t border-slate-800 bg-slate-950/50">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all font-bold text-sm"
                  >
                    <LogOut size={18} /> Cerrar Sesión
                  </button>
                  <p className="text-center text-[10px] text-slate-600 mt-4 uppercase tracking-widest font-bold">
                    DocuFlow Mobile v2.1
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;