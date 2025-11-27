import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { User, LogOut, LogIn, Menu, X, FolderTree, Bell, Home, AlertCircle } from "lucide-react";

import { supabase } from "../utils/supabaseClient";

// 1. Añadimos userName a las props recibidas
const Navbar = ({ user, role, userName, error }) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  
  // Control de scroll (sin cambios)
  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 10) {
        setIsVisible(true);
        lastScrollY = currentScrollY;
        return;
      }
      if (currentScrollY > lastScrollY) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      lastScrollY = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error al cerrar sesión:", error.message);
    } else {
      setMenuOpen(false);
      navigate("/login");
    }
  };

  return (
    <>
      <motion.nav
        animate={{ y: isVisible ? 0 : "-100%" }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-md"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center gap-3 group"
              onClick={() => setMenuOpen(false)}
            >
              <div className="bg-blue-700 p-1.5 rounded text-white shadow-blue-900/50 shadow-lg group-hover:bg-blue-600 transition-colors">
                <FolderTree size={24} />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-lg leading-tight tracking-wide">DocuFlow</span>
                <span className="text-slate-400 text-xs font-medium tracking-wider uppercase group-hover:text-slate-300 transition-colors">Sistema de Gestión</span>
              </div>
            </Link>

            {/* Menú Desktop */}
            <div className="hidden md:flex items-center gap-6">
              {user ? (
                <>
                  <button className="text-slate-400 hover:text-white transition relative p-1">
                    <Bell size={20} />
                    <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full border-2 border-slate-900"></span>
                  </button>
                  
                  <div className="h-8 w-px bg-slate-700 mx-2"></div>

                  <div className="flex items-center gap-3">
                    <div className="text-right hidden lg:block">
                      {/* 2. AQUÍ MOSTRAMOS EL NOMBRE REAL */}
                      <p className="text-sm font-medium text-white">
                        {userName || user.email}
                      </p>
                      
                      {error ? (
                        <div className="flex items-center justify-end gap-1 text-red-400" title={error}>
                            <AlertCircle size={14} />
                            <p className="text-xs font-bold uppercase tracking-wide">Error Datos</p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-wide">
                          {role || 'Cargando...'}
                        </p>
                      )}
                    </div>
                    
                    <Link 
                      to="/profile"
                      className={`h-9 w-9 rounded-full flex items-center justify-center text-slate-200 transition ring-2 ring-transparent hover:ring-blue-500/50 ${error ? 'bg-red-900/50 text-red-200' : 'bg-slate-700 hover:bg-blue-700 hover:text-white'}`}
                      title="Mi Perfil"
                    >
                      <User size={18} />
                    </Link>

                    <button 
                      onClick={handleLogout}
                      className="ml-2 text-slate-400 hover:text-red-400 transition p-1"
                      title="Cerrar Sesión"
                    >
                      <LogOut size={20} />
                    </button>
                  </div>
                </>
              ) : (
                <Link 
                  to="/login" 
                  className="text-slate-300 hover:text-white font-medium flex items-center gap-2 transition-colors"
                >
                  <LogIn size={18} /> Iniciar Sesión
                </Link>
              )}
            </div>

            {/* Botón menú móvil */}
            <button 
              className="md:hidden text-slate-400 hover:text-white p-2" 
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Menú Móvil */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div className="fixed inset-0 z-50 md:hidden">
            <motion.div
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            />

            <motion.div
              className="absolute right-0 top-0 h-full w-72 bg-slate-800 border-l border-slate-700 shadow-2xl flex flex-col p-6"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
                <span className="text-white font-bold text-lg">Menú</span>
                <button
                  className="text-slate-400 hover:text-white transition"
                  onClick={() => setMenuOpen(false)}
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <MobileLink to="/" icon={Home} label="Inicio" onClick={() => setMenuOpen(false)} />
                
                {user && (
                  <>
                    <MobileLink to="/profile" icon={User} label="Mi Perfil" onClick={() => setMenuOpen(false)} />
                    
                    {error && (
                         <div className="mx-4 mt-2 p-2 bg-red-900/30 border border-red-800 rounded flex items-center gap-2">
                            <AlertCircle size={16} className="text-red-400" />
                            <span className="text-xs text-red-300">Error de sincronización</span>
                         </div>
                    )}

                    <div className="my-4 border-t border-slate-700" />
                    <div className="px-4 py-2 text-xs text-slate-500 uppercase tracking-wider font-semibold">
                      {/* 3. NOMBRE TAMBIÉN EN MÓVIL */}
                      {userName || user.email}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-slate-700/50 hover:text-red-300 rounded-lg transition-all w-full text-left font-medium"
                    >
                      <LogOut size={18} /> Cerrar Sesión
                    </button>
                  </>
                )}
                
                {!user && (
                  <MobileLink to="/login" icon={LogIn} label="Iniciar Sesión" onClick={() => setMenuOpen(false)} />
                )}
              </div>
              
              <div className="mt-auto pt-6 border-t border-slate-700 text-center">
                 <p className="text-xs text-slate-500">DocuFlow Mobile v2.0</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const MobileLink = ({ to, icon: Icon, label, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-all font-medium"
  >
    <Icon size={18} /> {label}
  </Link>
);

export default Navbar;