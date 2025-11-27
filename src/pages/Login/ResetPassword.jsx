import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, CheckCircle, AlertCircle, RotateCcw, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';

const ResetPassword = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: 'info', message: 'Ingresa tu nueva contraseña para completar el reseteo.' });

    // 1. Efecto para verificar si estamos en un contexto de reseteo (Supabase redirigió aquí)
    useEffect(() => {
        const checkUrlForReset = async () => {
            // Supabase maneja la sesión automáticamente tras la redirección.
            const { data: { session } } = await supabase.auth.getSession();
            
            // Si hay sesión, significa que el token de reseteo fue válido.
            if (!session) {
                setStatus({ type: 'error', message: 'Sesión de reseteo no válida o caducada. Por favor, solicita un nuevo enlace.' });
            }
        };

        checkUrlForReset();
    }, []);

    // 2. Función para actualizar la contraseña
    const handleReset = async (e) => {
        e.preventDefault();
        setStatus({ type: 'info', message: 'Actualizando contraseña...' });
        setLoading(true);

        if (password.length < 6) {
            setStatus({ type: 'error', message: 'La contraseña debe tener al menos 6 caracteres.' });
            setLoading(false);
            return;
        }
        if (password !== confirmPassword) {
            setStatus({ type: 'error', message: 'Las contraseñas no coinciden.' });
            setLoading(false);
            return;
        }

        try {
            // Llama a la función de Supabase para actualizar el password
            const { error } = await supabase.auth.updateUser({ password });

            if (error) throw error;

            setStatus({ type: 'success', message: '¡Contraseña actualizada! Serás redirigido al inicio de sesión.' });
            
            // 3. Redirigir al login después del éxito
            setTimeout(() => {
                // Forzamos el logout para limpiar la sesión de reseteo y obligar a loguear
                supabase.auth.signOut(); 
                navigate('/login');
            }, 3000); 

        } catch (error) {
            setStatus({ type: 'error', message: `Fallo al actualizar: ${error.message}` });
        } finally {
            setLoading(false);
        }
    };
    
    // UI del Formulario
    const AlertIcon = status.type === 'success' ? CheckCircle : status.type === 'error' ? AlertCircle : RotateCcw;
    const alertClasses = {
        info: "bg-blue-50 text-blue-700 border-blue-200",
        error: "bg-red-50 text-red-700 border-red-200",
        success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
            <motion.div
                className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            >
                <div className="bg-slate-50 px-8 py-10 text-center border-b border-slate-100">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-blue-700 rounded-lg shadow-lg shadow-blue-900/20">
                            <Lock size={32} className="text-white" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                        Definir Nueva Contraseña
                    </h2>
                </div>

                <div className="p-8">
                    {/* Mensaje de Estado */}
                    <div className={`text-sm p-3 rounded-lg border flex items-start gap-2 mb-6 ${alertClasses[status.type]}`}>
                        <AlertIcon size={18} className="flex-shrink-0 mt-0.5" />
                        <p className="font-medium">{status.message}</p>
                    </div>

                    <form onSubmit={handleReset} className="space-y-5">
                        
                        {/* Campo Nueva Contraseña */}
                        <div>
                            <label htmlFor="password" className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Nueva Contraseña</label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                    required
                                    minLength={6}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                            </div>
                        </div>

                        {/* Campo Confirmar Contraseña */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Confirmar Contraseña</label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Repite la nueva contraseña"
                                    required
                                    minLength={6}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                            </div>
                        </div>

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
                                    <RotateCcw size={18} />
                                    Actualizar y Entrar
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                        <button
                            onClick={() => navigate('/login')}
                            className="text-slate-500 hover:text-blue-700 text-sm font-medium transition-colors flex items-center justify-center w-full gap-1"
                        >
                            <LogIn size={16} /> Volver al Login
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ResetPassword;