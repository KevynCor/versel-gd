import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Calendar, LogOut, LogIn } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { useNavigate } from 'react-router-dom';

const Profile = ({ user }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return setError('No hay usuario autenticado.');

    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        setProfileData({
          email: user.email,
          createdAt: user.created_at,
          lastSignInAt: user.last_sign_in_at,
        });
      } catch (err) {
        console.error('Error al cargar el perfil:', err);
        setError('No pude cargar tu perfil.');
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

  const InfoCard = ({ icon: Icon, title, value }) => (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
      <Icon className="w-6 h-6 text-blue-500" />
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <p className="text-gray-800 font-medium">{value || '-'}</p>
      </div>
    </div>
  );

  if (!user) {
    return (
      <motion.div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
        <motion.div className="bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-8 shadow-xl w-full max-w-md text-center"
          initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 100 }}>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Acceso Denegado</h2>
          <p className="text-gray-600 mb-6">Por favor, inicia sesión para ver tu perfil.</p>
          <motion.button onClick={() => navigate('/login')}
            className="px-6 py-3 rounded-2xl font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            Ir a Iniciar Sesión
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
      <div className="container mx-auto max-w-3xl">
        <motion.div className="bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-8 shadow-xl"
          initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 100 }}>
          
          <h2 className="text-4xl font-extrabold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-700 flex justify-center items-center gap-3">
            <User className="w-10 h-10" /> Tu Perfil
          </h2>

          {loading && <p className="text-center text-gray-600">Cargando perfil...</p>}
          {error && <p className="text-center text-red-500">{error}</p>}

          {profileData && (
            <div className="space-y-6">
              <InfoCard icon={Mail} title="Correo Electrónico" value={profileData.email} />
              <InfoCard icon={Calendar} title="Miembro desde" value={profileData.createdAt ? new Date(profileData.createdAt).toLocaleDateString() : '-'} />
              <InfoCard icon={LogIn} title="Último inicio de sesión" value={profileData.lastSignInAt ? new Date(profileData.lastSignInAt).toLocaleString() : '-'} />

              <motion.button onClick={handleLogout} disabled={loading}
                className="w-full px-6 py-3 rounded-2xl font-semibold bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 mt-8"
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <LogOut className="w-5 h-5" />
                {loading ? 'Cerrando Sesión...' : 'Cerrar Sesión'}
              </motion.button>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Profile;
