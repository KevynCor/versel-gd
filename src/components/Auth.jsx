import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, UserPlus } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const navigate = useNavigate();

  const handleAuth = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setMessageType('');

    try {
      let authResponse;
      if (isSignUp) {
        authResponse = await supabase.auth.signUp({ email, password });
      } else {
        authResponse = await supabase.auth.signInWithPassword({ email, password });
      }

      const { data, error } = authResponse;

      if (error) {
        throw error;
      }

      if (isSignUp) {
        setMessage('¡Registro exitoso! Por favor, revisa tu correo para confirmar tu cuenta.');
        setMessageType('success');
      } else {
        setMessage('¡Inicio de sesión exitoso! Redirigiendo...');
        setMessageType('success');
        // Redirigir después de 1 segundo (opcional, para que el usuario vea el mensaje)
        setTimeout(() => navigate('/'), 1000);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
      setMessageType('error');
      console.error('Error de autenticación:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div
        className="bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-8 shadow-xl w-full max-w-md"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
      >
        <h2 className="text-4xl font-extrabold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-700">
          {isSignUp ? 'Regístrate' : 'Inicia Sesión'}
        </h2>

        <form onSubmit={handleAuth} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@ejemplo.com"
                required
                className="w-full pl-10 pr-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-300 text-gray-900 placeholder-gray-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-300 text-gray-900 placeholder-gray-500 font-medium"
              />
            </div>
          </div>

          {message && (
            <motion.p
              className={`text-center text-sm font-medium p-3 rounded-xl ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {message}
            </motion.p>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 rounded-2xl font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {loading ? 'Cargando...' : (isSignUp ? <><UserPlus className="w-5 h-5" /> Registrarme</> : <><LogIn className="w-5 h-5" /> Iniciar Sesión</>)}
          </motion.button>
        </form>

        <motion.button
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full mt-4 text-blue-600 hover:text-blue-800 font-medium transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isSignUp ? '¿Ya tienes una cuenta? Inicia Sesión' : '¿No tienes una cuenta? Regístrate'}
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default Auth;