import React, { useState, useEffect } from 'react';
import { supabase } from "../../../utils/supabaseClient";
import { User, FileText, Calendar, Search, Briefcase, UserPlus, Lock, Unlock, Phone, Save } from "lucide-react";
import { InputField } from "../../../components/ui/InputField";
import { TextareaField } from "../../../components/ui/TextareaField";

export default function NuevaSolicitudTab({ currentUser, usuarios, onGuardar, onMensaje }) {
    const isAdmin = currentUser?.rol === 'admin';
    const [isManualEntry, setIsManualEntry] = useState(false);
    const [savingUser, setSavingUser] = useState(false);
    
    // Lógica de bloqueo (Solo afecta a los datos del SOLICITANTE)
    const areFieldsLocked = !isManualEntry;

    // Calcular fecha mínima (Hoy) para validación del calendario
    const today = new Date();
    const minDate = today.toISOString().split('T')[0]; // Formato YYYY-MM-DD

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
    }, [currentUser, isAdmin]);

    // Búsqueda
    useEffect(() => {
        if (isAdmin && searchTerm.length > 2) {
            const lower = searchTerm.toLowerCase();
            const filtered = usuarios.filter(u => 
                u.nombre_completo.toLowerCase().includes(lower) || 
                u.email.toLowerCase().includes(lower)
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
        setSolicitanteId(null);
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
                rol: 'usuario',
                activo: true
            }).select().single();

            if (error) throw error;

            onMensaje("Usuario registrado exitosamente en la Base de Datos.", "success");
            setSolicitanteId(data.id);
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
        
        onGuardar({ 
            formData: {
                ...finalData,
                solicitante_id: solicitanteId 
            }, 
            documentosSeleccionados: [], 
            firmaTemp: null 
        });
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                <div className="p-3 bg-indigo-100 rounded-xl">
                    <FileText className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Nueva Solicitud de Servicios Archivísticos</h2>
                    <p className="text-sm text-gray-500">Registre los detalles iniciales de la solicitud.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* SECCIÓN 1: INFORMACIÓN DEL SOLICITANTE */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-indigo-700 flex items-center gap-2">
                        <User size={20}/> Información del Solicitante
                    </h3>
                    
                    {isAdmin && (
                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-bold text-indigo-800">Panel de Administrador</label>
                                <span className="text-xs bg-indigo-200 text-indigo-800 px-2 py-1 rounded-full font-medium">Modo Admin</span>
                            </div>
                            
                            <div className="relative">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Buscar Usuario Existente</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm disabled:bg-gray-100 disabled:text-gray-400"
                                        placeholder="Buscar por nombre o correo..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        disabled={isManualEntry} 
                                    />
                                    <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                    
                                    {isManualEntry && (
                                        <button 
                                            onClick={handleCancelManual}
                                            className="absolute right-2 top-1.5 text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-gray-700 transition-colors"
                                        >
                                            Cancelar Manual
                                        </button>
                                    )}
                                </div>
                                {showSuggestions && !isManualEntry && (
                                    <div className="absolute z-10 w-full bg-white border rounded-lg shadow-xl mt-1 max-h-48 overflow-y-auto">
                                        {filteredUsers.map(user => (
                                            <div key={user.id} onClick={() => selectUser(user)} className="p-3 hover:bg-indigo-50 cursor-pointer border-b last:border-0">
                                                <p className="font-medium text-gray-800 text-sm">{user.nombre_completo}</p>
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {!isManualEntry && (
                                <div className="flex items-center gap-2 pt-2 border-t border-indigo-200">
                                    <span className="text-xs text-gray-500">¿El usuario no existe?</span>
                                    <button 
                                        onClick={handleNewApplicant}
                                        className="text-xs flex items-center gap-1 bg-white border border-indigo-300 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors font-medium"
                                    >
                                        <UserPlus size={14} /> Registrar Nuevo (Manual)
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* CONTENEDOR DE CAMPOS DE USUARIO */}
                    <div className={`p-4 rounded-xl border space-y-3 relative transition-colors ${isManualEntry ? 'bg-white border-orange-200 ring-2 ring-orange-50' : 'bg-gray-50 border-gray-200'}`}>
                        
                        <div className="absolute top-2 right-2 text-gray-400" title={areFieldsLocked ? "Campos bloqueados (Lectura)" : "Edición habilitada"}>
                            {areFieldsLocked ? <Lock size={16}/> : <Unlock size={16} className="text-orange-400"/>}
                        </div>

                        <InputField 
                            label="Nombre Completo" 
                            value={formData.nombre_solicitante} 
                            onChange={(e) => setFormData({...formData, nombre_solicitante: e.target.value})}
                            disabled={areFieldsLocked}
                            placeholder={isManualEntry ? "Ingrese nombre completo..." : ""}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <InputField 
                                label="Sub Gerencia / Área" 
                                value={formData.sub_gerencia} 
                                onChange={(e) => setFormData({...formData, sub_gerencia: e.target.value})}
                                disabled={areFieldsLocked}
                            />
                            <InputField 
                                label="Entidad" 
                                value={formData.entidad} 
                                onChange={(e) => setFormData({...formData, entidad: e.target.value})}
                                disabled={areFieldsLocked}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <InputField 
                                label="Email Corporativo" 
                                value={formData.email} 
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                disabled={areFieldsLocked}
                            />
                            <InputField 
                                label="Móvil / Teléfono" 
                                icon={Phone}
                                value={formData.movil} 
                                onChange={(e) => setFormData({...formData, movil: e.target.value})}
                                disabled={areFieldsLocked}
                                placeholder={isManualEntry ? "Ingrese número..." : ""}
                            />
                        </div>

                        {isManualEntry && (
                            <div className="pt-2 mt-2 border-t border-orange-100 flex justify-end">
                                <button 
                                    onClick={handleSaveNewUser}
                                    disabled={savingUser}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg shadow transition-colors disabled:opacity-50"
                                >
                                    <Save size={16} /> {savingUser ? "Guardando..." : "Guardar Usuario"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* SECCIÓN 2: DETALLES DE LA SOLICITUD */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-indigo-700 flex items-center gap-2">
                        <Briefcase size={20}/> Detalles de la Solicitud
                    </h3>

                    <TextareaField 
                        label="Motivo de la Solicitud *" 
                        placeholder="Describa el propósito y justificación de su solicitud..."
                        value={formData.motivo_solicitud}
                        onChange={(value) => setFormData({...formData, motivo_solicitud: value})}
                        rows={4}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Modalidad del Servicio</label>
                            <select 
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                                value={formData.modalidad_servicio}
                                onChange={(e) => setFormData({...formData, modalidad_servicio: e.target.value})}
                            >
                                <option value="prestamo_original">Préstamo de Original</option>
                                <option value="copia_simple">Copia Simple</option>
                                <option value="copia_certificada">Copia Certificada</option>
                                <option value="consulta_sala">Consulta en Sala</option>
                                <option value="digitalizacion">Digitalización</option>
                            </select>
                        </div>
                        
                        {/* CORRECCIÓN AQUÍ: Manejo híbrido de evento/valor para asegurar compatibilidad */}
                        {formData.modalidad_servicio === 'prestamo_original' && (
                            <InputField 
                                label="Fecha de Devolución Prevista" 
                                type="date" 
                                value={formData.fecha_devolucion_prevista}
                                onChange={(e) => {
                                    // Verifica si recibe un evento (con target.value) o el valor directo
                                    const val = e?.target ? e.target.value : e;
                                    setFormData({...formData, fecha_devolucion_prevista: val});
                                }}
                                min={minDate} 
                            />
                        )}
                    </div>

                    <div className="pt-6">
                        <button 
                            onClick={handleSubmit}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all transform hover:scale-[1.01] flex items-center justify-center gap-2"
                        >
                            <FileText size={20} />
                            Registrar Solicitud
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}