import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Clock } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

// TIEMPO DE INACTIVIDAD (Configurable)
// Para PRODUCCIÓN: 60 * 60 * 1000 (1 Hora)
const INACTIVITY_LIMIT_MS = 60 * 60 * 1000; 

const SessionTimeout = ({ isActive }) => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  
  // Usamos referencias para no provocar re-renderizados constantes
  const lastActivityRef = useRef(Date.now());
  const intervalIdRef = useRef(null);

  const handleLogout = useCallback(async () => {
    try {
      // 1. Limpiamos el intervalo para evitar bucles
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
      
      // 2. Cerramos sesión en Supabase
      await supabase.auth.signOut();
      
      // 3. UI Updates
      setShowModal(false);
      navigate('/login');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      navigate('/login'); // Forzamos redirección aunque falle supabase
    }
  }, [navigate]);

  // Actualiza la marca de tiempo de la última actividad
  const updateLastActivity = useCallback(() => {
    if (!isActive) return;
    // Optimizacion: Solo actualizamos si han pasado más de 1 seg para no saturar
    // en eventos continuos como 'mousemove' o 'scroll'
    const now = Date.now();
    if (now - lastActivityRef.current > 1000) {
        lastActivityRef.current = now;
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;

    // A. LISTENERS DE ACTIVIDAD
    const events = ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    
    // Función optimizada para escuchar eventos
    const handleActivity = () => updateLastActivity();

    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // B. INTERVALO DE VERIFICACIÓN (El "Heartbeat")
    // En lugar de un timeout que se reinicia, usamos un intervalo que comprueba
    // cada 10 segundos si ya pasó el tiempo límite.
    intervalIdRef.current = setInterval(() => {
      const now = Date.now();
      const timeElapsed = now - lastActivityRef.current;

      if (timeElapsed >= INACTIVITY_LIMIT_MS) {
        // ¡Tiempo expirado!
        clearInterval(intervalIdRef.current);
        setShowModal(true);
        
        // Cierre automático tras mostrar el modal 3 segundos
        setTimeout(() => handleLogout(), 3000); 
      }
    }, 10000); // Comprobar cada 10 segundos es suficiente y eficiente

    // C. LIMPIEZA
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
    };
  }, [isActive, updateLastActivity, handleLogout]);

  return (
    <AnimatePresence>
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-red-100"
          >
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <Clock size={40} className="text-red-600" />
              </div>
              
              <h3 className="text-2xl font-bold text-slate-800 mb-3">
                Sesión Expirada
              </h3>
              
              <p className="text-slate-600 mb-8 leading-relaxed">
                Hemos detectado inactividad por más de 60 minutos. 
                <br/>
                <span className="text-sm text-slate-400">Cerrando sesión de forma segura...</span>
              </p>
              
              <button
                onClick={handleLogout}
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
              >
                <LogOut size={20} />
                Cerrar Sesión Ahora
              </button>
            </div>
            {/* Barra de progreso decorativa inferior */}
            <motion.div 
                className="h-1.5 bg-red-600 w-full"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 3, ease: "linear" }}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SessionTimeout;