import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';


// CONFIGURACIÓN DE TIEMPO 60 minutos * 60 segundos * 1000 milisegundos
const INACTIVITY_LIMIT_MS = 60 * 60 * 1000; 

const SessionTimeout = ({ isActive }) => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const timerRef = useRef(null);
  
  // Función para cerrar sesión
  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setShowModal(false);
      navigate('/login');
    } catch (error) {
      console.error("Error al cerrar sesión por inactividad", error);
    }
  }, [navigate]);

  // Función que se ejecuta cuando el tiempo expira
  const onExpire = useCallback(() => {
    // Mostramos el modal y forzamos el logout visual
    setShowModal(true);
    // Opcional: Cerrar sesión automáticamente tras mostrar el modal unos segundos
    setTimeout(() => {
        handleLogout();
    }, 4000); 
  }, [handleLogout]);

  // Función para reiniciar el temporizador
  const resetTimer = useCallback(() => {
    if (!isActive) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    // Iniciamos la cuenta regresiva de 60 minutos
    timerRef.current = setTimeout(onExpire, INACTIVITY_LIMIT_MS);
  }, [isActive, onExpire]);

  // Efecto para escuchar eventos del DOM
  useEffect(() => {
    if (!isActive) return;

    // Lista de eventos que consideramos "actividad"
    const events = ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'];

    // Iniciar timer al montar
    resetTimer();

    // Agregar listeners
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Limpieza
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [isActive, resetTimer]);

  return (
    <AnimatePresence>
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-red-100"
          >
            <div className="bg-red-50 p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Clock size={32} className="text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                Sesión Caducada
              </h3>
              <p className="text-slate-600 text-sm mb-6">
                Por motivos de seguridad, tu sesión ha sido cerrada automáticamente después de 60 minutos de inactividad.
              </p>
              
              <button
                onClick={handleLogout}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
              >
                <LogOut size={18} />
                Ir al Inicio de Sesión
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SessionTimeout;