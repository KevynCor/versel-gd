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
      // Validaciones antes de enviar
      if (!email || !password) {
        throw new Error('Por favor completa todos los campos');
      }

      if (password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      // Normalizar email
      const normalizedEmail = email.trim().toLowerCase();

      let authResponse;
      if (isSignUp) {
        authResponse = await supabase.auth.signUp({ 
          email: normalizedEmail, 
          password: password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        });
      } else {
        authResponse = await supabase.auth.signInWithPassword({ 
          email: normalizedEmail, 
          password: password 
        });
      }

      const { data, error } = authResponse;

      if (error) {
        // Manejo específico de errores comunes
        switch (error.message) {
          case 'Invalid login credentials':
            throw new Error('Email o contraseña incorrectos. Verifica tus credenciales.');
          case 'Email not confirmed':
            throw new Error('Por favor confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada.');
          case 'User already registered':
            throw new Error('Este email ya está registrado. Inicia sesión o usa otro email.');
          default:
            throw new Error(`Error de autenticación: ${error.message}`);
        }
      }

      if (isSignUp) {
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          throw new Error('Este usuario ya está registrado');
        }
        
        setMessage('¡Registro exitoso! Por favor, revisa tu correo para confirmar tu cuenta.');
        setMessageType('success');
        
        // Limpiar formulario después del registro
        setEmail('');
        setPassword('');
      } else {
        setMessage('¡Inicio de sesión exitoso! Redirigiendo...');
        setMessageType('success');
        
        // Verificar que la sesión se creó correctamente
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          setTimeout(() => navigate('/'), 1500);
        } else {
          throw new Error('No se pudo crear la sesión. Intenta nuevamente.');
        }
      }
    } catch (error) {
      setMessage(error.message);
      setMessageType('error');
      console.error('Error de autenticación:', error);
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
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-300 text-gray-900 placeholder-gray-500 font-medium"
              />
            </div>
            {isSignUp && (
              <p className="text-xs text-gray-500 mt-2">
                La contraseña debe tener al menos 6 caracteres
              </p>
            )}
          </div>

          {message && (
            <motion.p
              className={`text-center text-sm font-medium p-3 rounded-xl ${
                messageType === 'success' 
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : 'bg-red-100 text-red-700 border border-red-200'
              }`}
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
            className="w-full px-6 py-3 rounded-2xl font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
            whileHover={{ scale: loading ? 1 : 1.05 }}
            whileTap={{ scale: loading ? 1 : 0.95 }}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Cargando...
              </div>
            ) : (
              <>
                {isSignUp ? <><UserPlus className="w-5 h-5" /> Registrarme</> : <><LogIn className="w-5 h-5" /> Iniciar Sesión</>}
              </>
            )}
          </motion.button>
        </form>

        <motion.button
          onClick={() => {
            setIsSignUp(!isSignUp);
            resetForm();
          }}
          className="w-full mt-4 text-blue-600 hover:text-blue-800 font-medium transition-colors text-center"
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