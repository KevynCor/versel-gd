import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, User, LogOut, LogIn } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

const Navbar = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error al cerrar sesión:', error.message);
    } else {
      navigate('/login');
    }
  };

  const links = [
    { to: '/', icon: Home, label: 'Inicio', show: true },
    { to: '/profile', icon: User, label: 'Perfil', show: !!user },
  ];

  return (
    <motion.nav
      className="bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-sm py-4 px-8"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 14 }}
    >
      <div className="container mx-auto flex justify-between items-center">
        <Link
          to="/"
          className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-700"
        >
          DocuFlow
        </Link>

        <div className="flex items-center space-x-6">
          {links
            .filter(link => link.show)
            .map(({ to, icon: Icon, label }) => (
              <NavItem key={to} to={to}>
                <Icon className="w-5 h-5" /> {label}
              </NavItem>
            ))}

          {user ? (
            <NavButton onClick={handleLogout} icon={LogOut} label="Cerrar Sesión" color="red" />
          ) : (
            <NavItem to="/login">
              <LogIn className="w-5 h-5" /> Iniciar Sesión
            </NavItem>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

const NavItem = ({ to, children }) => (
  <Link to={to}>
    <motion.div
      className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium transition-colors"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.div>
  </Link>
);

const NavButton = ({ onClick, icon: Icon, label, color }) => (
  <motion.button
    onClick={onClick}
    className={`flex items-center gap-2 text-gray-600 hover:text-${color}-600 font-medium transition-colors`}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    <Icon className="w-5 h-5" /> {label}
  </motion.button>
);

export default Navbar;
