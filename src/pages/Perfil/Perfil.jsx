import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Phone, Building2, Briefcase, Calendar, 
  LogOut, Shield, Key, Save, AlertCircle, CheckCircle2, 
  Activity, Fingerprint, Clock, ChevronDown, ChevronUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';

// --- COMPONENTES UI REUTILIZABLES ---

// 1. Tarjeta de Detalle (Para mostrar datos clave)
const DetailCard = ({ icon: Icon, label, value, subtext }) => (
  <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
    <div className="p-2.5 bg-slate-50 text-slate-500 rounded-lg border border-slate-100">
      <Icon size={20} strokeWidth={1.5} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-slate-800 truncate">{value || <span className="text-slate-300 italic">No registrado</span>}</p>
      {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
    </div>
  </div>
);

// 2. Badge de Estado (Activo/Inactivo)
const StatusBadge = ({ active }) => (
  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
    <span className={`h-2 w-2 rounded-full ${active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
    {active ? 'Cuenta Activa' : 'Cuenta Inactiva'}
  </div>
);

// 3. Acordeón de Datos Técnicos (Oculta ID y Timestamps)
const SystemMetadata = ({ id, createdAt, updatedAt }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="mt-8 pt-6 border-t border-slate-100">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-blue-600 transition-colors"
      >
        {isOpen ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
        {isOpen ? 'Ocultar metadatos del sistema' : 'Ver metadatos del sistema'}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-500 bg-slate-50 p-4 rounded-lg border border-slate-100">
              <div>
                <p className="font-bold text-slate-400 mb-1 flex items-center gap-1"><Fingerprint size={12}/> UUID Sistema</p>
                <p className="font-mono text-[10px] break-all">{id}</p>
              </div>
              <div>
                <p className="font-bold text-slate-400 mb-1 flex items-center gap-1"><Calendar size={12}/> Fecha Registro</p>
                <p>{new Date(createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="font-bold text-slate-400 mb-1 flex items-center gap-1"><Clock size={12}/> Última Actualización</p>
                <p>{new Date(updatedAt).toLocaleString()}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---

const Profile = ({ user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('professional'); // 'professional', 'contact', 'security'
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  
  // Estados para cambio de contraseña
  const [showPassForm, setShowPassForm] = useState(false);
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });
  const [passStatus, setPassStatus] = useState({ loading: false, message: '', type: '' });

  // 1. Carga de Datos Completa
  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        // Consultamos TODOS los campos requeridos
        const { data, error } = await supabase
            .from('usuarios')
            .select('*') // Trae: id, email, nombre_completo, entidad, sub_gerencia, movil, rol, activo, created_at, updated_at
            .eq('id', user.id)
            .single();

        if (error) throw error;

        setProfileData(data);
      } catch (err) {
        console.error("Error cargando perfil:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  // 2. Manejadores
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPassStatus({ loading: true, message: '', type: '' });

    if (passwords.new.length < 6) {
        setPassStatus({ loading: false, message: 'Mínimo 6 caracteres.', type: 'error' });
        return;
    }
    if (passwords.new !== passwords.confirm) {
        setPassStatus({ loading: false, message: 'Las contraseñas no coinciden.', type: 'error' });
        return;
    }

    try {
        const { error } = await supabase.auth.updateUser({ password: passwords.new });
        if (error) throw error;
        
        setPassStatus({ loading: false, message: 'Contraseña actualizada con éxito.', type: 'success' });
        setTimeout(() => {
            setShowPassForm(false);
            setPasswords({ new: '', confirm: '' });
            setPassStatus({ loading: false, message: '', type: '' });
        }, 2000);
    } catch (err) {
        setPassStatus({ loading: false, message: err.message, type: 'error' });
    }
  };

  if (!profileData && loading) {
      return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin w-8 h-8 border-2 border-blue-600 rounded-full border-t-transparent"></div></div>;
  }

  if (!profileData) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* --- 1. ENCABEZADO DE IDENTIDAD --- */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-6 flex flex-col md:flex-row gap-6 items-center md:items-start">
            <div className="relative">
                <div className="h-24 w-24 bg-slate-900 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg ring-4 ring-slate-50">
                    {profileData.nombre_completo?.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-2 -right-2">
                    <div className="bg-white p-1 rounded-full shadow-sm">
                        <Shield size={20} className="text-blue-600 fill-blue-100" />
                    </div>
                </div>
            </div>
            
            <div className="flex-1 text-center md:text-left space-y-2">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 capitalize">{profileData.nombre_completo}</h1>
                    <p className="text-slate-500 font-medium">{profileData.rol}</p>
                </div>
                <StatusBadge active={profileData.activo} />
            </div>

            <div className="hidden md:block text-right text-slate-400 text-xs space-y-1">
                <p>DocuFlow ID</p>
                <p className="font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">{profileData.id.split('-')[0]}...</p>
            </div>
        </div>

        {/* --- 2. CONTENIDO PRINCIPAL (TABS) --- */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
            
            {/* Navegación */}
            <div className="flex border-b border-slate-100 overflow-x-auto">
                {[
                    { id: 'professional', label: 'Datos Profesionales', icon: Briefcase },
                    { id: 'contact', label: 'Contacto & Cuenta', icon: User },
                    { id: 'security', label: 'Seguridad', icon: Shield }
                ].map((tab) => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap
                            ${activeTab === tab.id 
                                ? 'border-blue-600 text-blue-700 bg-blue-50/30' 
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        <tab.icon size={16} /> {tab.label}
                    </button>
                ))}
            </div>

            <div className="p-6 md:p-8 flex-1">
                
                {/* TAB 1: DATOS PROFESIONALES */}
                {activeTab === 'professional' && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Building2 size={20} className="text-blue-500" />
                            <h3 className="text-lg font-bold text-slate-800">Información Organizacional</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <DetailCard 
                                icon={Building2} 
                                label="Entidad / Organización" 
                                value={profileData.entidad} 
                                subtext="Empresa matriz asignada"
                            />
                            <DetailCard 
                                icon={Briefcase} 
                                label="Sub-Gerencia / Área" 
                                value={profileData.sub_gerencia} 
                                subtext="Departamento operativo actual"
                            />
                            <DetailCard 
                                icon={Shield} 
                                label="Nivel de Acceso" 
                                value={profileData.rol} 
                                subtext="Permisos determinados por el sistema"
                            />
                        </div>
                    </motion.div>
                )}

                {/* TAB 2: CONTACTO Y CUENTA */}
                {activeTab === 'contact' && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                        <div className="flex items-center gap-2 mb-4">
                            <User size={20} className="text-blue-500" />
                            <h3 className="text-lg font-bold text-slate-800">Detalles de Contacto</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <DetailCard 
                                icon={Mail} 
                                label="Correo Electrónico" 
                                value={profileData.email} 
                                subtext="Canal principal de notificaciones"
                            />
                            <DetailCard 
                                icon={Phone} 
                                label="Teléfono Móvil" 
                                value={profileData.movil} 
                                subtext="Contacto para emergencias/2FA"
                            />
                        </div>

                        <SystemMetadata 
                            id={profileData.id} 
                            createdAt={profileData.created_at} 
                            updatedAt={profileData.updated_at} 
                        />
                    </motion.div>
                )}

                {/* TAB 3: SEGURIDAD */}
                {activeTab === 'security' && (
                    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="max-w-2xl">
                        <div className="flex items-center gap-2 mb-6">
                            <Shield size={20} className="text-blue-500" />
                            <h3 className="text-lg font-bold text-slate-800">Centro de Seguridad</h3>
                        </div>

                        {/* Cambio de Contraseña (Acordeón) */}
                        <div className="border border-slate-200 rounded-xl overflow-hidden mb-6 transition-all duration-300">
                            <div 
                                className="bg-slate-50 p-5 flex justify-between items-center cursor-pointer hover:bg-slate-100" 
                                onClick={() => setShowPassForm(!showPassForm)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600">
                                        <Key size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">Contraseña de Acceso</p>
                                        <p className="text-xs text-slate-500">Se recomienda actualizarla cada 90 días.</p>
                                    </div>
                                </div>
                                <span className="text-blue-600 text-sm font-medium">
                                    {showPassForm ? 'Cancelar' : 'Actualizar'}
                                </span>
                            </div>

                            <AnimatePresence>
                                {showPassForm && (
                                    <motion.form 
                                        initial={{ height: 0, opacity: 0 }} 
                                        animate={{ height: 'auto', opacity: 1 }} 
                                        exit={{ height: 0, opacity: 0 }}
                                        onSubmit={handleUpdatePassword}
                                        className="p-5 border-t border-slate-200 bg-white"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Nueva Contraseña</label>
                                                <input 
                                                    type="password" 
                                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                                    placeholder="••••••••"
                                                    value={passwords.new}
                                                    onChange={e => setPasswords({...passwords, new: e.target.value})}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Confirmar</label>
                                                <input 
                                                    type="password" 
                                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                                    placeholder="••••••••"
                                                    value={passwords.confirm}
                                                    onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                                                />
                                            </div>
                                        </div>

                                        {passStatus.message && (
                                            <div className={`mb-4 p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${passStatus.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                                {passStatus.type === 'error' ? <AlertCircle size={16}/> : <CheckCircle2 size={16}/>}
                                                {passStatus.message}
                                            </div>
                                        )}

                                        <div className="flex justify-end">
                                            <button 
                                                type="submit" 
                                                disabled={passStatus.loading}
                                                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm"
                                            >
                                                {passStatus.loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Save size={16}/>}
                                                Guardar Cambios
                                            </button>
                                        </div>
                                    </motion.form>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Zona de Peligro */}
                        <div className="border border-red-100 rounded-xl p-5 bg-red-50/30 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-red-100 text-red-600 rounded-lg">
                                    <LogOut size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800">Finalizar Sesión</p>
                                    <p className="text-xs text-slate-500">Cierra tu sesión en este dispositivo de forma segura.</p>
                                </div>
                            </div>
                            <button 
                                onClick={handleLogout}
                                className="px-5 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-bold hover:bg-red-50 hover:border-red-300 transition-all shadow-sm w-full sm:w-auto"
                            >
                                Cerrar Sesión
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;