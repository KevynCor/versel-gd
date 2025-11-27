import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Calendar, LogOut, Shield, Activity, 
  Lock, X, CheckCircle, AlertCircle, BadgeCheck 
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useNavigate } from 'react-router-dom';

const Profile = ({ user }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState(null);

  // --- ESTADOS PARA CAMBIO DE CONTRASEÑA ---
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });
  const [passLoading, setPassLoading] = useState(false);
  const [passMessage, setPassMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!user) {
        setError('No hay usuario autenticado.');
        return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Consultamos la tabla 'usuarios' para obtener nombre y rol
        const { data: publicData, error: dbError } = await supabase
            .from('usuarios')
            .select('nombre_completo, rol')
            .eq('id', user.id)
            .maybeSingle();

        if (dbError) throw dbError;

        setProfileData({
          email: user.email,
          createdAt: user.created_at,
          lastSignInAt: user.last_sign_in_at,
          id: user.id,
          // Si no existe el dato, usamos fallbacks
          nombreCompleto: publicData?.nombre_completo || user.email.split('@')[0],
          rol: publicData?.rol || 'usuario'
        });

      } catch (err) {
        console.error('Error al cargar el perfil:', err);
        setError('No se pudo cargar la información completa del perfil.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleLogout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error al cerrar sesión:', error.message);
      setError('Error al cerrar sesión.');
    } else {
      navigate('/login');
    }
    setLoading(false);
  };

  // --- LÓGICA DE CAMBIO DE CONTRASEÑA ---
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPassMessage({ type: '', text: '' });

    if (passwords.new.length < 6) {
        setPassMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres.' });
        return;
    }

    if (passwords.new !== passwords.confirm) {
        setPassMessage({ type: 'error', text: 'Las contraseñas no coinciden.' });
        return;
    }

    setPassLoading(true);
    try {
        const { error } = await supabase.auth.updateUser({ 
            password: passwords.new 
        });

        if (error) throw error;

        setPassMessage({ type: 'success', text: 'Contraseña actualizada correctamente.' });
        
        // Limpiar y cerrar modal después de 2 segundos
        setTimeout(() => {
            setShowPasswordModal(false);
            setPasswords({ new: '', confirm: '' });
            setPassMessage({ type: '', text: '' });
        }, 2000);

    } catch (err) {
        setPassMessage({ type: 'error', text: err.message || 'Error al actualizar contraseña.' });
    } finally {
        setPassLoading(false);
    }
  };

  // Tarjeta de Información Corporativa
  const InfoCard = ({ icon: Icon, title, value, subtext }) => (
    <div className="flex items-start gap-4 p-4 bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 group">
      <div className="p-2.5 bg-slate-50 text-slate-500 rounded-lg border border-slate-100 group-hover:bg-blue-50 group-hover:text-blue-700 group-hover:border-blue-100 transition-colors">
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{title}</p>
        <p className="text-slate-800 font-semibold text-sm sm:text-base break-all leading-tight">{value || '-'}</p>
        {subtext && <p className="text-xs text-slate-400 mt-1 font-medium">{subtext}</p>}
      </div>
    </div>
  );

  // Estado de Carga
  if (loading && !profileData) {
     return (
       <div className="min-h-screen bg-slate-50 flex items-center justify-center">
         <div className="flex flex-col items-center gap-4">
           <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-700 rounded-full animate-spin"></div>
           <p className="text-slate-500 text-sm font-medium animate-pulse">Cargando datos del perfil...</p>
         </div>
       </div>
     );
  }

  // Estado Sin Usuario
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
            <Shield size={32} className="text-red-500" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-800 mb-2">Acceso Restringido</h2>
          <p className="text-slate-500 mb-6 text-sm">No se ha detectado una sesión activa. Por favor, inicie sesión para continuar.</p>
          <button 
            onClick={() => navigate('/login')}
            className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-bold text-sm transition-colors shadow-sm"
          >
            Ir al Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 relative">
      <div className="max-w-5xl mx-auto">
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
        >
          {/* Banner de Fondo */}
          <div className="h-32 bg-slate-900 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900 to-blue-900 opacity-90"></div>
            <div className="absolute -bottom-10 -right-10 text-white opacity-5">
                <Shield size={200} />
            </div>
          </div>

          <div className="px-8 pb-8 relative">
            {/* Cabecera del Perfil */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-12 mb-8 gap-6">
              <div className="w-24 h-24 bg-white rounded-full p-1.5 shadow-md ring-1 ring-slate-100">
                <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-slate-400 border border-slate-200">
                  <User size={40} />
                </div>
              </div>
              
              <div className="text-center sm:text-left flex-1 pb-1">
                {/* NOMBRE COMPLETO */}
                <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight capitalize">
                  {profileData?.nombreCompleto}
                </h1>
                <p className="text-slate-500 text-sm font-medium flex items-center justify-center sm:justify-start gap-1.5">
                  <Mail size={14} /> {profileData?.email}
                </p>
              </div>

              <div className="flex flex-col gap-2 pb-2 items-center sm:items-end">
                 <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                    Sesión Activa
                 </span>
                 {/* BADGE DEL ROL */}
                 <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
                    <BadgeCheck size={14} className="mr-1.5" />
                    {profileData?.rol}
                 </span>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-md shadow-sm">
                <p className="font-bold flex items-center gap-2">
                  <Shield size={16} /> Error del Sistema
                </p>
                <p className="mt-1">{error}</p>
              </div>
            )}

            {/* Grid de Información */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
              <InfoCard 
                icon={Mail} 
                title="Correo Electrónico" 
                value={profileData?.email} 
                subtext="Cuenta principal vinculada"
              />
              {/* TARJETA DE ROL */}
              <InfoCard 
                icon={Shield} 
                title="Rol del Sistema" 
                value={profileData?.rol} 
                subtext="Nivel de permisos asignado"
              />
              <InfoCard 
                icon={Calendar} 
                title="Fecha de Alta" 
                value={profileData?.createdAt ? new Date(profileData.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'} 
                subtext="Registro en el sistema"
              />
              <InfoCard 
                icon={Activity} 
                title="Último Acceso" 
                value={profileData?.lastSignInAt ? new Date(profileData.lastSignInAt).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' }) : 'Primer inicio'} 
                subtext="Actividad reciente detectada"
              />
            </div>

            {/* Acciones de Pie de Página */}
            <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-xs text-slate-400 text-center sm:text-left">
                Última sincronización: {new Date().toLocaleTimeString()} <br/>
                Versión del Sistema: 2.1.0 (Enterprise)
              </p>
              
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* BOTÓN CAMBIAR CONTRASEÑA */}
                <button 
                    onClick={() => setShowPasswordModal(true)}
                    disabled={loading}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-50 border border-blue-200 text-blue-700 font-bold text-sm hover:bg-blue-100 hover:border-blue-300 rounded-lg transition-all shadow-sm"
                >
                    <Lock size={16} />
                    <span>Cambiar Contraseña</span>
                </button>

                {/* BOTÓN LOGOUT */}
                <button 
                    onClick={handleLogout} 
                    disabled={loading}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-slate-300 text-slate-600 font-bold text-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-lg transition-all shadow-sm hover:shadow disabled:opacity-60"
                >
                    {loading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                    <LogOut size={18} />
                    )}
                    <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* --- MODAL DE CAMBIO DE CONTRASEÑA --- */}
      <AnimatePresence>
        {showPasswordModal && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            >
                <motion.div 
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 20 }}
                    className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 overflow-hidden"
                >
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <Lock size={18} className="text-blue-600" />
                            Actualizar Credenciales
                        </h3>
                        <button 
                            onClick={() => setShowPasswordModal(false)}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleUpdatePassword} className="p-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nueva Contraseña</label>
                                <input 
                                    type="password"
                                    value={passwords.new}
                                    onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Confirmar Contraseña</label>
                                <input 
                                    type="password" 
                                    value={passwords.confirm}
                                    onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {/* Mensajes de feedback */}
                        {passMessage.text && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className={`mt-4 p-3 rounded-lg flex items-start gap-2 text-sm ${
                                    passMessage.type === 'error' 
                                        ? 'bg-red-50 text-red-600 border border-red-100' 
                                        : 'bg-green-50 text-green-700 border border-green-100'
                                }`}
                            >
                                {passMessage.type === 'error' ? <AlertCircle size={16} className="mt-0.5" /> : <CheckCircle size={16} className="mt-0.5" />}
                                <span>{passMessage.text}</span>
                            </motion.div>
                        )}

                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowPasswordModal(false)}
                                className="flex-1 px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={passLoading}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md shadow-blue-200 transition-all disabled:opacity-70 flex justify-center items-center gap-2"
                            >
                                {passLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Guardando...</span>
                                    </>
                                ) : (
                                    'Actualizar'
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;