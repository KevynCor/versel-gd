import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  FolderTree, 
  Eye, 
  EyeOff, 
  HelpCircle, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  KeyRound
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient'; 

const Auth = () => {
  // --- ESTADOS ---
  const [authMode, setAuthMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  
  const navigate = useNavigate();

  // --- HANDLERS ---
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    if (feedback.message) setFeedback({ type: '', message: '' });
  };

  const switchMode = (mode) => {
    setAuthMode(mode);
    setFeedback({ type: '', message: '' });
    setShowHelp(false);
  };

  const handleAuth = async (event) => {
    event.preventDefault();
    setLoading(true);
    setFeedback({ type: '', message: '' });

    const { email, password } = formData;

    try {
      if (!email) throw new Error('El correo es requerido.');
      
      if (authMode === 'login') {
        if (!password) throw new Error('La contraseña es requerida.');
        
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error('Credenciales incorrectas.');

        setFeedback({ type: 'success', message: 'Acceso autorizado. Redirigiendo...' });
        setTimeout(() => navigate('/'), 1000);

      } else {
        // Lógica Recuperación
        if (!email.includes('@')) throw new Error('Formato de correo inválido.');
        
        await supabase.auth.resetPasswordForEmail(email);
        setFeedback({ type: 'success', message: 'Enlace enviado. Revisa tu correo.' });
      }

    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 font-sans">
      
      {/* 1. Header Dinámico */}
      <div className="mb-8 text-center">
        <motion.div 
          layout
          className="inline-flex p-3 bg-white rounded-2xl shadow-sm mb-4"
        >
          <FolderTree size={32} className="text-blue-700" />
        </motion.div>
        <motion.h1 layout className="text-2xl font-bold text-slate-800 tracking-tight">
          {authMode === 'login' ? 'DocuFlow Enterprise' : 'Recuperar Acceso'}
        </motion.h1>
        <motion.p layout className="text-slate-400 text-sm mt-1">
          {authMode === 'login' ? 'Sistema de Gestión Centralizada' : 'Ingresa tu correo para restablecer'}
        </motion.p>
      </div>

      {/* 2. Panel Principal */}
      <motion.div 
        layout
        className="w-full max-w-sm bg-white rounded-2xl shadow-xl shadow-blue-900/5 overflow-hidden border border-white relative"
      >
        <div className="p-8 pt-10">
          <form onSubmit={handleAuth} className="space-y-5">
            
            {/* Campo Email (Siempre visible) */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">
                Correo Institucional
              </label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="usuario@empresa.com"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 block pl-10 p-3 transition-all outline-none"
                  required
                />
              </div>
            </div>

            {/* Campo Password (Solo Login) */}
            <AnimatePresence mode="popLayout">
              {authMode === 'login' && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 20 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="space-y-1.5 overflow-hidden"
                >
                  <div className="flex justify-between items-center ml-1">
                     <label htmlFor="password" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Contraseña
                    </label>
                  </div>
                 
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 block pl-10 pr-10 p-3 transition-all outline-none"
                      required={authMode === 'login'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Feedback Mensajes */}
            <AnimatePresence>
              {feedback.message && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`p-3 rounded-lg flex items-start gap-3 text-sm ${
                    feedback.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                  }`}
                >
                  {feedback.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                  <span className="font-medium">{feedback.message}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Botón Principal */}
            <button
              type="submit"
              disabled={loading}
              className="w-full group bg-blue-700 hover:bg-blue-800 text-white p-3 rounded-lg font-semibold shadow-lg shadow-blue-700/20 hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {authMode === 'login' ? 'Iniciar Sesión' : 'Enviar Enlace'}
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            
            {/* Navegación Secundaria (Botón de cambio de modo) */}
            <div className="pt-2 text-center">
                {authMode === 'login' ? (
                    <button
                        type="button"
                        onClick={() => switchMode('recovery')}
                        className="text-sm text-slate-500 hover:text-blue-700 font-medium transition-colors flex items-center justify-center gap-2 w-full py-2 rounded-md hover:bg-slate-50"
                    >
                        <KeyRound size={14} />
                        ¿Olvidaste tu contraseña?
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={() => switchMode('login')}
                        className="text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors flex items-center justify-center gap-2 w-full py-2 rounded-md hover:bg-slate-50"
                    >
                        <ArrowLeft size={14} />
                        Volver al inicio de sesión
                    </button>
                )}
            </div>

          </form>

          {/* Footer Ayuda */}
          <div className="mt-6 pt-4 border-t border-slate-50 flex justify-center">
             <button 
                type="button"
                onClick={() => setShowHelp(!showHelp)}
                className="text-xs font-medium text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-1.5"
              >
                <HelpCircle size={14} />
                Ayuda
              </button>
          </div>
          
           <AnimatePresence>
              {showHelp && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 text-center text-xs text-slate-500 pb-2">
                    Soporte TI: <span className="font-semibold">kevyncorrales@hotmail.com</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

        </div>
      </motion.div>
      
      <footer className="mt-8 text-slate-300 text-xs font-medium tracking-wide">
        © {new Date().getFullYear()} DocuFlow Enterprise v2.1
      </footer>

    </div>
  );
};

export default Auth;