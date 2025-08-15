import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, User, LogOut, LogIn, Menu, X } from "lucide-react";
import { supabase } from "../utils/supabaseClient";

// Componente reutilizable para enlaces y botones
const NavAction = ({ to, onClick, icon: Icon, label, color = "blue", closeMenu }) => {
  const Wrapper = to ? Link : "button";
  return (
    <Wrapper
      to={to}
      onClick={() => {
        if (onClick) onClick();
        if (closeMenu) closeMenu();
      }}
    >
      <motion.div
        className={`flex items-center gap-2 font-medium transition-colors text-gray-600 hover:text-${color}-600`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Icon className="w-5 h-5" /> {label}
      </motion.div>
    </Wrapper>
  );
};

const Navbar = ({ user }) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    error ? console.error("Error al cerrar sesión:", error.message) : navigate("/login");
  };

  const links = [
    { to: "/", icon: Home, label: "Inicio", show: true },
    { to: "/profile", icon: User, label: "Perfil", show: !!user },
  ];

  return (
    <>
      {/* Barra superior */}
      <motion.nav
        className="bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-sm py-4 px-4 md:px-8 mb-[8px]"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 14 }}
      >
        <div className="container mx-auto flex justify-between items-center">
          <Link
            to="/"
            className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-700"
          >
            DocuFlow
          </Link>

          {/* Menú en desktop */}
          <div className="hidden md:flex items-center gap-6">
            {links.filter(l => l.show).map(({ to, icon, label }) => (
              <NavAction key={to} to={to} icon={icon} label={label} />
            ))}
            {user
              ? <NavAction onClick={handleLogout} icon={LogOut} label="Cerrar Sesión" color="red" />
              : <NavAction to="/login" icon={LogIn} label="Iniciar Sesión" />}
          </div>

          {/* Botón menú móvil */}
          <button className="md:hidden" onClick={() => setMenuOpen(true)}>
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </motion.nav>

      {/* Menú lateral móvil */}
      <AnimatePresence>
        {menuOpen && (
          <motion.aside
            className="fixed inset-0 z-50 bg-black/50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute right-0 top-0 h-full w-64 bg-white shadow-lg flex flex-col p-6 gap-4"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
            >
              <button
                className="self-end mb-4"
                onClick={() => setMenuOpen(false)}
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>

              {links.filter(l => l.show).map(({ to, icon, label }) => (
                <NavAction key={to} to={to} icon={icon} label={label} closeMenu={() => setMenuOpen(false)} />
              ))}

              {user
                ? <NavAction onClick={handleLogout} icon={LogOut} label="Cerrar Sesión" color="red" closeMenu={() => setMenuOpen(false)} />
                : <NavAction to="/login" icon={LogIn} label="Iniciar Sesión" closeMenu={() => setMenuOpen(false)} />}
            </motion.div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
