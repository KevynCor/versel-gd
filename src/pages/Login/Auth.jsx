import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, FolderTree, RotateCcw, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Eliminamos isSignUp
  const [isResetting, setIsResetting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setMessageType('');

    try {
      // Validaciones
      if (!email || !password) {
        throw new Error('Por favor completa todos los campos');
      }
      if (password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Solamente INICIO DE SESIÓN
      const authResponse = await supabase.auth.signInWithPassword({ 
        email: normalizedEmail, 
        password: password 
      });

      const { data, error } = authResponse;

      if (error) {
        switch (error.message) {
          case 'Invalid login credentials':
            throw new Error('Credenciales incorrectas. Verifica tu usuario y contraseña.');
          case 'Email not confirmed':
            throw new Error('Email no confirmado. Por favor revisa tu bandeja de entrada.');
          default:
            throw new Error(`Error de autenticación: ${error.message}`);
        }
      }
      
      // INICIO DE SESIÓN EXITOSO
      setMessage('Acceso autorizado. Redirigiendo al sistema...');
      setMessageType('success');
      
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        setTimeout(() => navigate('/'), 1000);
      } else {
        throw new Error('Error al establecer sesión segura.');
      }
      
    } catch (error) {
      setMessage(error.message);
      setMessageType('error');
      console.error('Error de autenticación:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // --- FUNCIÓN DE RECUPERACIÓN DE CONTRASEÑA ---
  const handlePasswordRecovery = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setMessageType('');
    
    if (!email || !email.includes('@')) {
        setMessage('Por favor ingresa un correo electrónico válido.');
        setMessageType('error');
        setLoading(false);
        return;
    }

    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            // Asegúrate de que esta URL dirija a una página donde el usuario pueda cambiar la contraseña
            redirectTo: `${window.location.origin}/profile?reset=true` 
        });

        if (error) throw error;
        
        setMessage('Se ha enviado un enlace de recuperación a tu correo. Revisa tu bandeja de entrada.');
        setMessageType('success');
        
    } catch (error) {
        setMessage(`Error al enviar recuperación: ${error.message}`);
        setMessageType('error');
    } finally {
        setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setMessage('');
    setMessageType('');
  };

  const handleToggleReset = () => {
      setIsResetting(!isResetting);
      resetForm();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <motion.div
        className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Header Corporativo */}
        <div className="bg-slate-50 px-8 py-10 text-center border-b border-slate-100">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-700 rounded-lg shadow-lg shadow-blue-900/20">
              <FolderTree size={32} className="text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            DocuFlow Enterprise
          </h2>
          <p className="text-slate-500 text-sm mt-2">
            {isResetting ? 'Recuperar Acceso' : 'Inicio de Sesión Requerido'}
          </p>
        </div>

        {/* Formulario */}
        <div className="p-8">
          <form onSubmit={isResetting ? handlePasswordRecovery : handleAuth} className="space-y-5">
            
            {/* Campo Email (siempre visible) */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                Correo Institucional
              </label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@entidad.gob.pe"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Campo Password (solo visible en Login) */}
            {!isResetting && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <label htmlFor="password" className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                        Contraseña
                    </label>
                    <div className="relative group">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            minLength={6}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>
                </motion.div>
            )}

            {/* Mensajes de Estado */}
            {message && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className={`text-sm p-3 rounded-lg border ${
                  messageType === 'success' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}
              >
                <p className="font-medium text-center">{message}</p>
              </motion.div>
            )}

            {/* Botón Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-bold text-sm shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  {isResetting ? <Send size={18} /> : <LogIn size={18} />}
                  {isResetting ? 'Enviar Enlace de Recuperación' : 'Iniciar Sesión'}
                </>
              )}
            </button>
            
            {/* Enlace de Olvidé Contraseña (solo visible en Login) */}
            {!isResetting && (
                <div className="text-right">
                    <button
                        onClick={handleToggleReset}
                        type="button"
                        className="text-xs text-slate-500 hover:text-blue-700 font-medium transition-colors flex items-center justify-end w-full gap-1 pt-1"
                    >
                         <RotateCcw size={14} /> ¿Olvidaste tu contraseña?
                    </button>
                </div>
            )}
            
          </form>

          {/* Footer / Toggle (Adaptado) */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-slate-500 text-sm mb-3">
              {isResetting ? '¿Recuerdas tu contraseña ahora?' : 'El acceso es solo para personal autorizado.'}
            </p>
            <button
              onClick={handleToggleReset}
              type="button"
              className="text-blue-700 hover:text-blue-900 text-sm font-bold hover:underline transition-colors"
            >
              {isResetting ? 'Volver al Inicio de Sesión' : 'Contactar a Soporte Técnico'}
            </button>
          </div>
        </div>
      </motion.div>
      
      {/* Footer Copyright */}
      <div className="fixed bottom-4 text-center w-full pointer-events-none">
        <p className="text-xs text-slate-400">© {new Date().getFullYear()} Sistema de Archivo Central</p>
      </div>
    </div>
  );
};

export default Auth;