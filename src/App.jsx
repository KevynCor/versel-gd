import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';

import { supabase } from './utils/supabaseClient';
import Navbar from './pages/Dashboard/Navbar';
import Auth from './pages/Login/Auth';
import Profile from './pages/Perfil/Perfil';
import Dashboard from './pages/Dashboard/Dashboard';
import BusquedaDocumento from './pages/Busqueda/Busqueda';
import InventarioDocumental from './pages/Inventario/InventarioDocumental';
import ServiciosArchivisticos from './pages/ServiciosArchivisticos/ServiciosArchivisticos';
import EliminacionDocumental from './pages/Eliminacion/EliminacionDocumental';
import BusquedaVoucher from './pages/Busqueda/BusquedaVoucher';
import SessionTimeout from './components/SessionTimeout'; 
import GestionAccesos from './pages/GestionAcceso/GestionUsuarios';

const ModuloEnConstruccion = ({ titulo }) => (
  <div className="p-8 text-center">
    <h2 className="text-xl font-bold text-slate-700 mb-2">{titulo}</h2>
    <p className="text-slate-500">Módulo en desarrollo.</p>
  </div>
);

// --- COMPONENTE DE RUTA PROTEGIDA MEJORADO ---
const ProtectedRoute = ({ children, user, userRole, allowedRoles, loading }) => {
  if (loading || (user && userRole === undefined)) {
     return (
        <div className="flex items-center justify-center h-screen bg-slate-50">
           <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
     );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// --- APP PRINCIPAL ---
export default function App() {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(undefined);
  const [userName, setUserName] = useState(""); 
  const [loadingSession, setLoadingSession] = useState(true);
  const [dbError, setDbError] = useState(null);

  const lastProcessedUserId = useRef(null);

  const fetchUserData = useCallback(async (userId) => {
    if (!userId) return;
    
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Tiempo de espera agotado en DB')), 4000)
      );

      const queryPromise = supabase
        .from('usuarios')
        .select('rol, nombre_completo') 
        .eq('id', userId)
        .maybeSingle();

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

      if (error) {
        console.error("Error Supabase:", error.message);
        setUserRole('Usuario'); // Fallback actualizado a Mayúscula
        setUserName("Usuario"); 
        setDbError(error.message);
      } else {
        setUserRole(data?.rol || 'Usuario'); // Fallback actualizado a Mayúscula
        setUserName(data?.nombre_completo || 'Usuario'); 
        setDbError(null);
        lastProcessedUserId.current = userId;
      }

    } catch (e) {
      console.error("Aviso:", e.message || e);
      setUserRole('Usuario');
      setUserName("Usuario");
      setDbError("Error de conexión");
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (mounted && initialSession?.user) {
          setSession(initialSession);
          lastProcessedUserId.current = initialSession.user.id;
          await fetchUserData(initialSession.user.id);
        }
      } catch (error) {
        console.error("Error en initSession:", error);
      } finally {
        if (mounted) setLoadingSession(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;
      setSession(currentSession);

      if (event === 'SIGNED_IN') {
         const newUserId = currentSession?.user?.id;
         if (newUserId && newUserId === lastProcessedUserId.current) {
             setLoadingSession(false); 
             return;
         }
         if (currentSession?.user) {
            setLoadingSession(true); 
            try {
                await fetchUserData(currentSession.user.id);
            } finally {
                setLoadingSession(false); 
            }
         } else {
             setLoadingSession(false);
         }
      } else if (event === 'SIGNED_OUT') {
         lastProcessedUserId.current = null;
         setUserRole(undefined);
         setUserName("");
         setDbError(null);
         setLoadingSession(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  if (loadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
             <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-700 rounded-full mb-4 animate-spin" />
             <span className="text-slate-600 font-medium text-sm animate-pulse">Cargando DocuFlow...</span>
        </div>
      </div>
    );
  }

  const rolesAdmin = ['Admin', 'Archivero', 'Supervisor'];

  return (
    <Router>
      {/* NUEVO: Componente Monitor de Sesión Se activa solo si hay sesión (session es true/objeto) */}
      <SessionTimeout isActive={!!session} />

      <Routes>
        <Route path="/login" element={!session ? <Auth /> : <Navigate to="/" replace />} />

        <Route element={
            <>
              <Navbar 
                user={session?.user} 
                role={userRole} 
                userName={userName}
                error={dbError} 
              />
              <Outlet />
            </>
        }>
          <Route path="/" element={<ProtectedRoute user={session?.user} userRole={userRole} loading={loadingSession}><Dashboard userRole={userRole} /></ProtectedRoute>} />
          <Route path="/solicitud" element={<ProtectedRoute user={session?.user} userRole={userRole} loading={loadingSession}><ServiciosArchivisticos /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute user={session?.user} userRole={userRole} loading={loadingSession}><Profile user={session?.user} /></ProtectedRoute>} />
          <Route path="/busqueda" element={<ProtectedRoute user={session?.user} userRole={userRole} allowedRoles={rolesAdmin} loading={loadingSession}><BusquedaDocumento /></ProtectedRoute>} />
          <Route path="/inventario" element={<ProtectedRoute user={session?.user} userRole={userRole} allowedRoles={rolesAdmin} loading={loadingSession}><InventarioDocumental /></ProtectedRoute>} />
          <Route path="/vouchers" element={<ProtectedRoute user={session?.user} userRole={userRole} allowedRoles={rolesAdmin} loading={loadingSession}><BusquedaVoucher /></ProtectedRoute>} />
          <Route path="/eliminacion" element={<ProtectedRoute user={session?.user} userRole={userRole} allowedRoles={rolesAdmin} loading={loadingSession}><EliminacionDocumental user={session?.user} /></ProtectedRoute>} />
          
          <Route path="/transferencia" element={<ProtectedRoute user={session?.user} userRole={userRole} allowedRoles={rolesAdmin} loading={loadingSession}><ModuloEnConstruccion titulo="Transferencia Documental"/></ProtectedRoute>} />
          <Route path="/ccf" element={<ProtectedRoute user={session?.user} userRole={userRole} allowedRoles={rolesAdmin} loading={loadingSession}><ModuloEnConstruccion titulo="Cuadro de Clasificación"/></ProtectedRoute>} />
          <Route path="/pcda" element={<ProtectedRoute user={session?.user} userRole={userRole} allowedRoles={rolesAdmin} loading={loadingSession}><ModuloEnConstruccion titulo="PCDA"/></ProtectedRoute>} />
          <Route path="/reportes" element={<ProtectedRoute user={session?.user} userRole={userRole} allowedRoles={rolesAdmin} loading={loadingSession}><ModuloEnConstruccion titulo="Reportes"/></ProtectedRoute>} />
          <Route path="/accesos" element={<ProtectedRoute user={session?.user} userRole={userRole} allowedRoles={['Admin']} loading={loadingSession}><GestionAccesos /></ProtectedRoute>} />
        </Route>
        <Route path="*" element={<Navigate to={session ? "/" : "/login"} replace />} />
      </Routes>
    </Router>
  );
}