import React, { useState, useEffect } from 'react';
import { supabase } from "../../../utils/supabaseClient";
import { User, FileText, Search, UserPlus, Lock, Unlock, Phone, Save, Briefcase, ShieldCheck, Calendar } from "lucide-react";
import { InputField } from "../../../components/ui/InputField";
import { TextareaField } from "../../../components/ui/TextareaField";


// --- COMPONENTE PRINCIPAL ---
export default function NuevaSolicitudTab({ currentUser, usuarios, onGuardar, onMensaje }) {
    // Nota: Se ha incluido 'admin' minúscula por robustez, aunque la BD usa 'Admin' mayúscula.
    const isAdmin = ['Admin', 'admin', 'Supervisor', 'supervisor'].includes(currentUser?.rol);
    const [isManualEntry, setIsManualEntry] = useState(false);
    const [savingUser, setSavingUser] = useState(false);
    
    // Lógica de bloqueo (Solo afecta a los datos del SOLICITANTE)
    const areFieldsLocked = !isManualEntry;

    // Calcular fecha mínima (Hoy) para validación del calendario
    const today = new Date();
    const minDate = today.toISOString().split('T')[0];

    // Estado del formulario
    const [formData, setFormData] = useState({
        nombre_solicitante: currentUser?.nombre_completo || "",
        email: currentUser?.email || "",
        movil: currentUser?.movil || "", 
        sub_gerencia: currentUser?.sub_gerencia || "",
        entidad: currentUser?.entidad || "Electro Sur Este S.A.A.",
        motivo_solicitud: "",
        modalidad_servicio: "prestamo_original",
        fecha_devolucion_prevista: ""
    });

    const [solicitanteId, setSolicitanteId] = useState(currentUser?.id);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Cargar datos iniciales
    useEffect(() => {
        // Si NO es admin, forzamos siempre los datos del usuario logueado
        if (!isAdmin) {
            setFormData(prev => ({
                ...prev,
                nombre_solicitante: currentUser?.nombre_completo || "",
                email: currentUser?.email || "",
                movil: currentUser?.movil || "",
                sub_gerencia: currentUser?.sub_gerencia || "",
                entidad: currentUser?.entidad || "Electro Sur Este S.A.A."
            }));
            setSolicitanteId(currentUser?.id);
        }
        // Nota: Si ES admin, mantenemos los datos que haya escrito/seleccionado, no reseteamos en cada render
    }, [currentUser, isAdmin]);

    // Búsqueda de usuarios
    useEffect(() => {
        if (isAdmin && searchTerm.length > 2) {
            const lower = searchTerm.toLowerCase();
            const filtered = usuarios.filter(u => 
                (u.nombre_completo || "").toLowerCase().includes(lower) || 
                (u.email || "").toLowerCase().includes(lower)
            );
            setFilteredUsers(filtered);
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    }, [searchTerm, usuarios, isAdmin]);

    const selectUser = (user) => {
        setFormData(prev => ({
            ...prev,
            nombre_solicitante: user.nombre_completo,
            email: user.email,
            movil: user.movil || "",
            sub_gerencia: user.sub_gerencia || "",
            entidad: user.entidad || "Electro Sur Este S.A.A."
        }));
        // ASIGNAMOS el ID del usuario seleccionado
        setSolicitanteId(user.id);
        
        setIsManualEntry(false);
        setShowSuggestions(false);
        setSearchTerm("");
    };

    const handleNewApplicant = () => {
        setFormData(prev => ({
            ...prev,
            nombre_solicitante: "",
            email: "",
            movil: "",
            sub_gerencia: "",
            entidad: "Electro Sur Este S.A.A."
        }));
        setSolicitanteId(null); // Limpiamos ID para obligar a crear nuevo
        setIsManualEntry(true);
        setSearchTerm("");
    };

    const handleCancelManual = () => {
        setFormData(prev => ({
            ...prev,
            nombre_solicitante: currentUser?.nombre_completo || "",
            email: currentUser?.email || "",
            movil: currentUser?.movil || "",
            sub_gerencia: currentUser?.sub_gerencia || "",
            entidad: currentUser?.entidad || "Electro Sur Este S.A.A."
        }));
        // Volvemos al ID del usuario logueado
        setSolicitanteId(currentUser?.id);
        setIsManualEntry(false);
        setSearchTerm("");
    };

    const handleSaveNewUser = async () => {
        if (!formData.nombre_solicitante || !formData.email) {
            onMensaje("Nombre y Email son obligatorios para registrar al usuario.", "error");
            return;
        }

        setSavingUser(true);
        try {
            const { data, error } = await supabase.from('usuarios').insert({
                nombre_completo: formData.nombre_solicitante,
                email: formData.email,
                movil: formData.movil,
                sub_gerencia: formData.sub_gerencia,
                entidad: formData.entidad,
                rol: 'Usuario', // Estandarizamos a Mayúscula según tu esquema
                activo: true
            }).select().single();

            if (error) throw error;

            onMensaje("Usuario registrado exitosamente en la Base de Datos.", "success");
            setSolicitanteId(data.id); // Asignamos el ID del nuevo usuario creado
            setIsManualEntry(false); 
            
        } catch (error) {
            console.error(error);
            onMensaje("Error al guardar usuario: " + (error.message || "Verifique los datos"), "error");
        } finally {
            setSavingUser(false);
        }
    };

    const handleSubmit = () => {
        if (!formData.nombre_solicitante || !formData.motivo_solicitud) {
            onMensaje("Por favor complete la información del solicitante y el motivo.", "error");
            return;
        }

        if (isManualEntry && !solicitanteId) {
            onMensaje("Por favor guarde al nuevo usuario antes de registrar la solicitud.", "warning");
            return;
        }
        
        // Limpiar la fecha de devolución si no es préstamo original
        const finalData = { ...formData };
        if (formData.modalidad_servicio !== 'prestamo_original') {
            finalData.fecha_devolucion_prevista = null;
        }

        // --- VALIDACIÓN ESTRICTA DEL ID (PUNTO CRÍTICO CORREGIDO) ---
        // Si no hay ID de un usuario seleccionado (solicitanteId es nulo)
        // Y el usuario logueado tampoco tiene ID (currentUser?.id es nulo)
        // -> Detenemos el proceso y mostramos un error.
        
        let finalSolicitanteId = solicitanteId;

        if (!finalSolicitanteId) {
            // Intenta usar el ID del usuario logueado como respaldo si solicitanteId es nulo.
            finalSolicitanteId = currentUser?.id;

            // Si el respaldo también es nulo, es un fallo crítico
            if (!finalSolicitanteId) {
                onMensaje("Error Crítico: La identidad del solicitante es inválida. Por favor recargue la página e inicie sesión nuevamente.", "error");
                return;
            }
        }
        
        onGuardar({ 
            formData: {
                ...finalData,
                solicitante_id: finalSolicitanteId
            }, 
            documentosSeleccionados: [], 
            firmaTemp: null 
        });
    };

    return (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* SECCIÓN 1: INFORMACIÓN DEL SOLICITANTE */}
                <div className="space-y-6">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2 border-b border-slate-200 pb-2">
                        <User size={16} className="text-blue-600"/> Información del Solicitante
                    </h3>
                    
                    {isAdmin && (
                        <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm space-y-4 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <ShieldCheck size={16} className="text-blue-600"/> Panel de Control
                                </label>
                                <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold uppercase">Modo Admin</span>
                            </div>
                            
                            <div className="relative">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Buscar Usuario</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        className="w-full pl-10 pr-24 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 text-sm disabled:opacity-60 transition-all"
                                        placeholder="Buscar por nombre o correo..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        disabled={isManualEntry} 
                                    />
                                    <Search className="absolute left-3 top-3 text-slate-400" size={16} />
                                    
                                    {isManualEntry && (
                                        <button 
                                            onClick={handleCancelManual}
                                            className="absolute right-2 top-2 text-xs bg-slate-200 hover:bg-slate-300 px-3 py-1 rounded-md text-slate-700 font-medium transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                    )}
                                </div>
                                {showSuggestions && !isManualEntry && (
                                    <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-lg shadow-xl mt-1 max-h-48 overflow-y-auto">
                                        {filteredUsers.map(user => (
                                            <div key={user.id} onClick={() => selectUser(user)} className="p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors group">
                                                <p className="font-bold text-slate-700 text-sm group-hover:text-blue-700">{user.nombre_completo}</p>
                                                <p className="text-xs text-slate-500">{user.email}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {!isManualEntry && (
                                <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                                    <button 
                                        onClick={handleNewApplicant}
                                        className="text-xs flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-bold transition-colors"
                                    >
                                        <UserPlus size={14} /> Registrar Nuevo Usuario
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* CAMPOS DEL USUARIO */}
                    <div className={`p-5 rounded-xl border space-y-4 relative transition-all duration-300 ${isManualEntry ? 'bg-white border-amber-200 shadow-md ring-1 ring-amber-100' : 'bg-white border-slate-200'}`}>
                        
                        <div className="absolute top-4 right-4 text-slate-400" title={areFieldsLocked ? "Campos bloqueados (Solo lectura)" : "Edición habilitada"}>
                            {areFieldsLocked ? <Lock size={16}/> : <Unlock size={16} className="text-amber-500"/>}
                        </div>

                        <InputField 
                            label="Nombre Completo" 
                            icon={User}
                            value={formData.nombre_solicitante} 
                            onChange={(e) => setFormData({...formData, nombre_solicitante: e.target.value})}
                            disabled={areFieldsLocked}
                            placeholder={isManualEntry ? "Ingrese nombre completo..." : ""}
                            className={areFieldsLocked ? "bg-slate-50 text-slate-500" : ""}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField 
                                label="Sub Gerencia / Área" 
                                value={formData.sub_gerencia} 
                                onChange={(e) => setFormData({...formData, sub_gerencia: e.target.value})}
                                disabled={areFieldsLocked}
                                className={areFieldsLocked ? "bg-slate-50 text-slate-500" : ""}
                            />
                            <InputField 
                                label="Entidad" 
                                value={formData.entidad} 
                                onChange={(e) => setFormData({...formData, entidad: e.target.value})}
                                disabled={areFieldsLocked}
                                className={areFieldsLocked ? "bg-slate-50 text-slate-500" : ""}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField 
                                label="Email Corporativo" 
                                value={formData.email} 
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                disabled={areFieldsLocked}
                                className={areFieldsLocked ? "bg-slate-50 text-slate-500" : ""}
                            />
                            <InputField 
                                label="Móvil / Teléfono" 
                                icon={Phone}
                                value={formData.movil} 
                                onChange={(e) => setFormData({...formData, movil: e.target.value})}
                                disabled={areFieldsLocked}
                                placeholder={isManualEntry ? "Ingrese número..." : ""}
                                className={areFieldsLocked ? "bg-slate-50 text-slate-500" : ""}
                            />
                        </div>

                        {isManualEntry && (
                            <div className="pt-4 mt-2 border-t border-amber-100 flex justify-end">
                                <button 
                                    onClick={handleSaveNewUser}
                                    disabled={savingUser}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-70"
                                >
                                    <Save size={16} /> {savingUser ? "Guardando..." : "Guardar Usuario"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* SECCIÓN 2: DETALLES DE LA SOLICITUD */}
                <div className="space-y-6">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2 border-b border-slate-200 pb-2">
                        <Briefcase size={16} className="text-blue-600"/> Detalle del Requerimiento
                    </h3>

                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
                        <TextareaField 
                            label="Motivo de la Solicitud *" 
                            placeholder="Describa detalladamente el propósito de la consulta..."
                            value={formData.motivo_solicitud}
                            onChange={(value) => setFormData({...formData, motivo_solicitud: value})}
                            rows={5}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Modalidad</label>
                                <div className="relative">
                                    <select 
                                        className="w-full p-3 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white appearance-none cursor-pointer"
                                        value={formData.modalidad_servicio}
                                        onChange={(e) => setFormData({...formData, modalidad_servicio: e.target.value})}
                                    >
                                        <option value="prestamo_original">Préstamo de Original</option>
                                        <option value="copia_simple">Copia Simple</option>
                                        <option value="copia_certificada">Copia Certificada</option>
                                        <option value="consulta_sala">Consulta en Sala</option>
                                        <option value="digitalizacion">Digitalización</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>
                            
                            {formData.modalidad_servicio === 'prestamo_original' && (
                                <InputField 
                                    label="Fecha Devolución Prevista" 
                                    icon={Calendar}
                                    type="date" 
                                    value={formData.fecha_devolucion_prevista}
                                    onChange={(e) => {
                                        const val = e?.target ? e.target.value : e;
                                        setFormData({...formData, fecha_devolucion_prevista: val});
                                    }}
                                    min={minDate} 
                                    className="bg-white"
                                />
                            )}
                        </div>

                        <div className="pt-6 mt-4 border-t border-slate-100">
                            <button 
                                onClick={handleSubmit}
                                className="w-full py-3.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-3 text-sm uppercase tracking-wide"
                            >
                                <FileText size={18} />
                                Registrar Solicitud
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}