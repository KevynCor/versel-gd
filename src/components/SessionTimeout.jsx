import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

// Tiempo límite de inactividad (Ej: 1 hora = 3600000 ms)
const INACTIVITY_LIMIT_MS = 60 * 60 * 1000; 
// Cada cuánto tiempo el sistema "mira el reloj" (Ej: cada 10 seg)
const CHECK_INTERVAL_MS = 10000; 
// Cuánto dura el modal rojo antes de expulsar al usuario (Ej: 3 seg)
const WARNING_DURATION_MS = 3000;

const SessionTimeout = ({ isActive }) => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  
  // Referencias para mantener el estado sin provocar renders visuales
  const lastActivityRef = useRef(Date.now());
  const intervalIdRef = useRef(null);

  const handleLogout = useCallback(async () => {
    try {
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
      
      // Intentamos cerrar sesión en Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
    } catch (error) {
      console.warn("Cierre de sesión forzado (token ya expirado o error de red):", error.message);
    } finally {
      // Siempre limpiamos la UI y redirigimos, pase lo que pase en el backend
      setShowModal(false);
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const updateLastActivity = useCallback(() => {
    if (!isActive || showModal) return; // No actualizar si ya estamos mostrando el modal de salida
    
    const now = Date.now();
    // Throttle: Solo actualizamos si pasó más de 1 segundo para no saturar
    if (now - lastActivityRef.current > 1000) {
        lastActivityRef.current = now;
    }
  }, [isActive, showModal]);

  useEffect(() => {
    if (!isActive) return;

    const events = ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    
    // 1. Escuchar eventos
    events.forEach(event => window.addEventListener(event, updateLastActivity));

    // 2. Heartbeat (Latido de verificación)
    intervalIdRef.current = setInterval(() => {
      const now = Date.now();
      const timeElapsed = now - lastActivityRef.current;

      if (timeElapsed >= INACTIVITY_LIMIT_MS) {
        // Tiempo agotado
        clearInterval(intervalIdRef.current);
        setShowModal(true); // Mostrar modal de "Adiós"
        
        // Esperar unos segundos para que el usuario lea el mensaje y luego expulsarlo
        setTimeout(() => handleLogout(), WARNING_DURATION_MS); 
      }
    }, CHECK_INTERVAL_MS);

    // 3. Limpieza
    return () => {
      events.forEach(event => window.removeEventListener(event, updateLastActivity));
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
    };
  }, [isActive, updateLastActivity, handleLogout]);

  return (
    <AnimatePresence>
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/95 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border-t-4 border-red-500"
          >
            <div className="p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <Clock className="w-8 h-8 text-red-600" />
              </div>
              
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Sesión Caducada</h3>
              <p className="text-slate-600 mb-6">
                Por seguridad, tu sesión se ha cerrado automáticamente debido a inactividad (60 min).
              </p>

              <div className="flex justify-center items-center gap-2 text-sm text-red-500 font-medium bg-red-50 py-2 rounded-lg">
                <AlertTriangle size={16} />
                <span>Cerrando sistema en breve...</span>
              </div>
            </div>

            {/* Barra de progreso de cierre automático */}
            <motion.div 
                className="h-2 bg-red-600 w-full"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: WARNING_DURATION_MS / 1000, ease: "linear" }}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SessionTimeout;