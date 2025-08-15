import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, BookOpen, FileText } from 'lucide-react';
import DocumentSearch from './components/BusquedaDocumento';
import LoanManagement from './components/PrestamoDocumento';
import VoucherSearch from './components/BusquedaVoucher'; // Nuevo componente
import Auth from './components/Auth';
import Navbar from './components/Navbar';
import Profile from './components/Profile';
import { supabase } from './utils/supabaseClient';

// Ruta protegida
const ProtectedRoute = ({ children, user }) =>
  user ? children : <Navigate to="/login" replace />;

export default function App() {
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingSession(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoadingSession(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-2xl font-bold text-gray-700"
        >
          Cargando aplicación...
        </motion.div>
      </div>
    );
  }

  return (
    <Router>
      <Navbar user={session?.user} />
      <Routes>
        <Route path="/login" element={<Auth />} />
        <Route
          path="/"
          element={
            <ProtectedRoute user={session?.user}>
              <HomeContent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/busqueda"
          element={
            <ProtectedRoute user={session?.user}>
              <DocumentSearch />
            </ProtectedRoute>
          }
        />
        <Route
          path="/prestamo"
          element={
            <ProtectedRoute user={session?.user}>
              <LoanManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vouchers"
          element={
            <ProtectedRoute user={session?.user}>
              <VoucherSearch />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute user={session?.user}>
              <Profile user={session?.user} />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to={session ? "/" : "/login"} replace />} />
      </Routes>
    </Router>
  );
}

// Componente reutilizable para las tarjetas de inicio
const HomeCard = ({ icon: Icon, title, description, color, delay, onClick }) => (
  <motion.div
    onClick={onClick}
    className="cursor-pointer bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-8 shadow-xl text-center hover:shadow-2xl transition"
    initial={{ x: -100, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    transition={{ delay, type: 'spring', stiffness: 100 }}
  >
    <Icon className={`w-16 h-16 mx-auto ${color} mb-4`} />
    <h2 className="text-2xl font-bold text-gray-800 mb-3">{title}</h2>
    <p className="text-gray-600">{description}</p>
  </motion.div>
);

const HomeContent = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
          <h1 className="text-5xl font-extrabold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-700">
            Bienvenido a DocuFlow
          </h1>
          <p className="text-center text-gray-700 text-xl mb-8">
            Tu solución integral para la gestión de documentos, préstamos y vouchers.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <HomeCard
              icon={Search}
              title="Busca Documentos"
              description="Encuentra rápidamente cualquier documento en tu inventario."
              color="text-blue-500"
              delay={0.3}
              onClick={() => navigate('/busqueda')}
            />
            <HomeCard
              icon={BookOpen}
              title="Gestiona Préstamos"
              description="Controla quién tiene qué documento y cuándo debe devolverlo."
              color="text-purple-500"
              delay={0.4}
              onClick={() => navigate('/prestamo')}
            />
            <HomeCard
              icon={FileText}
              title="Buscar Vouchers"
              description="Consulta y verifica vouchers fácilmente."
              color="text-green-500"
              delay={0.5}
              onClick={() => navigate('/vouchers')}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};
