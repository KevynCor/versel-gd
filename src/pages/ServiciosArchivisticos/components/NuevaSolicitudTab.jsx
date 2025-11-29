import React, { useState, useEffect, useMemo } from 'react';
import { 
    User, FileText, Search, UserPlus, Phone, Briefcase, 
    Calendar, ChevronDown, ChevronUp, Mail, Building2, Info, UserCheck 
} from "lucide-react";
import { InputField } from "../../../components/ui/InputField";
import { TextareaField } from "../../../components/ui/TextareaField";
import UserModal from '../../GestionAcceso/components/UserModal';
import { MODALIDADES} from "./Shared";

export default function NuevaSolicitudTab({ currentUser, usuarios, onGuardar, onMensaje }) {
    const isAdmin = ['Admin', 'Supervisor'].includes(currentUser?.rol);
    const today = new Date().toISOString().split('T')[0];

    // --- ESTADO ---
    const [showUserModal, setShowUserModal] = useState(false);
    
    // Estado de UI: Progressive Disclosure
    const [expandUserDetails, setExpandUserDetails] = useState(false);
    const [isBehalfMode, setIsBehalfMode] = useState(false); // Modo "Solicitar para otro"

    // Estado de Datos
    const [solicitanteId, setSolicitanteId] = useState(currentUser?.id);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const [formData, setFormData] = useState({
        nombre_solicitante: currentUser?.nombre_completo || "",
        email: currentUser?.email || "",
        movil: currentUser?.movil || "",
        sub_gerencia: currentUser?.sub_gerencia || "",
        entidad: currentUser?.entidad || "Electro Sur Este S.A.A.",
        motivo_solicitud: "",
        modalidad_servicio: "PRESTAMO_ORIGINAL", // Default más común
        fecha_devolucion_prevista: ""
    });

    // --- EFECTOS ---
    useEffect(() => {
        if (!isBehalfMode || searchTerm.length <= 2) {
            setShowSuggestions(false);
            return;
        }
        const lowerTerm = searchTerm.toLowerCase();
        const filtered = usuarios.filter(u => 
            (u.nombre_completo || "").toLowerCase().includes(lowerTerm) || 
            (u.email || "").toLowerCase().includes(lowerTerm)
        );
        setFilteredUsers(filtered);
        setShowSuggestions(true);
    }, [searchTerm, usuarios, isBehalfMode]);

    // --- HANDLERS ---
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSelectUser = (user) => {
        setFormData(prev => ({
            ...prev,
            nombre_solicitante: user.nombre_completo,
            email: user.email,
            movil: user.movil || "",
            sub_gerencia: user.sub_gerencia || "",
            entidad: user.entidad || "Electro Sur Este S.A.A."
        }));
        setSolicitanteId(user.id);
        setShowSuggestions(false);
        setSearchTerm("");
    };

    const toggleBehalfMode = () => {
        if (isBehalfMode) {
            // Revertir a currentUser
            handleSelectUser(currentUser);
        } else {
            setSearchTerm("");
        }
        setIsBehalfMode(!isBehalfMode);
    };

    const handleSubmit = () => {
        if (!formData.nombre_solicitante || !formData.motivo_solicitud) {
            return onMensaje("Indique el motivo de la solicitud.", "error");
        }
        if (formData.modalidad_servicio === 'PRESTAMO_ORIGINAL' && !formData.fecha_devolucion_prevista) {
            return onMensaje("La fecha de devolución es requerida para préstamos.", "error");
        }

        const finalData = { ...formData };
        if (formData.modalidad_servicio !== 'PRESTAMO_ORIGINAL') {
            finalData.fecha_devolucion_prevista = null;
        }

        onGuardar({
            formData: {
                ...finalData,
                solicitante_id: solicitanteId
            }
        });
    };

    // --- COMPONENTES INTERNOS (Para limpieza visual) ---

    // Tarjeta colapsable de información de usuario
    const ApplicantCard = () => (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
            {/* Cabecera Compacta (Siempre visible) */}
            <div className="p-4 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <User size={20} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Solicitante</p>
                        <h3 className="text-sm font-bold text-slate-800">{formData.nombre_solicitante}</h3>
                        <p className="text-xs text-slate-500 truncate max-w-[200px]">{formData.sub_gerencia || "Sin área asignada"}</p>
                    </div>
                </div>
                <button 
                    onClick={() => setExpandUserDetails(!expandUserDetails)}
                    className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                    title={expandUserDetails ? "Ocultar detalles" : "Ver detalles de contacto"}
                >
                    {expandUserDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
            </div>

            {/* Detalles Expandibles (Ocultos por defecto) */}
            {expandUserDetails && (
                <div className="px-4 pb-4 pt-0 bg-slate-50/50 animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 gap-2 pt-2 border-t border-slate-200">
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Mail size={14} className="text-slate-400"/> {formData.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Phone size={14} className="text-slate-400"/> {formData.movil || "Sin móvil"}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Building2 size={14} className="text-slate-400"/> {formData.entidad}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="flex flex-col lg:flex-row gap-6 animate-fade-in">
            
            {/* SECCIÓN 1: CONTEXTO (Izquierda) */}
            <div className="w-full lg:w-1/3 space-y-4">
                
                {/* 1. Selector de Modo (Solo Admin) */}
                {isAdmin && (
                    <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-bold text-slate-500 uppercase">Configuración</span>
                        <button 
                            onClick={toggleBehalfMode}
                            className={`text-xs flex items-center gap-1 font-bold transition-colors ${isBehalfMode ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <UserCheck size={14} />
                            {isBehalfMode ? "Solicitar para mí" : "Solicitando para otro"}
                        </button>
                    </div>
                )}

                {/* 2. Buscador (Visible solo si es necesario) */}
                {isBehalfMode && (
                    <div className="relative animate-in zoom-in-95 duration-200">
                        <input 
                            type="text" 
                            className="w-full pl-9 pr-4 py-2.5 bg-white border border-blue-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none shadow-sm"
                            placeholder="Buscar usuario..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                        <Search className="absolute left-3 top-3 text-blue-400" size={16} />
                        
                        {/* Dropdown de Resultados */}
                        {showSuggestions && (
                            <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-xl shadow-xl mt-2 max-h-60 overflow-y-auto custom-scrollbar">
                                {filteredUsers.map(user => (
                                    <div 
                                        key={user.id} 
                                        onClick={() => handleSelectUser(user)} 
                                        className="p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors group"
                                    >
                                        <p className="font-bold text-slate-700 text-sm group-hover:text-blue-700">{user.nombre_completo}</p>
                                        <p className="text-xs text-slate-400">{user.sub_gerencia}</p>
                                    </div>
                                ))}
                                <div className="p-2 bg-slate-50 sticky bottom-0 text-center">
                                    <button 
                                        onClick={() => setShowUserModal(true)} 
                                        className="text-xs text-blue-600 font-bold hover:underline flex items-center justify-center gap-1 w-full"
                                    >
                                        <UserPlus size={12} /> Registrar Nuevo Usuario
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 3. Tarjeta de Usuario (Información Progresiva) */}
                <ApplicantCard />

                {/* 4. Tips Contextuales (Estáticos para UX) */}
                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 hidden lg:block">
                    <h4 className="text-xs font-bold text-blue-700 mb-2 flex items-center gap-2">
                        <Info size={14}/> Importante
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                        Las solicitudes registradas antes de las 16:00 serán atendidas el mismo día, previa autorización del Responsable de Documentos. Para consultas externas, asegúrese de contar con la autorización de Gerencia.
                    </p>
                </div>
            </div>

            {/* SECCIÓN 2: ACCIÓN PRINCIPAL (Derecha) */}
            <div className="w-full lg:w-2/3">
                <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm h-full flex flex-col">
                    
                    <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <FileText className="text-blue-600" size={20}/> 
                            Nueva Solicitud
                        </h2>
                        <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-500 rounded-md border border-slate-200">
                            {today}
                        </span>
                    </div>

                    <div className="space-y-6 flex-1">
                        {/* Motivo: Campo Principal */}
                        <div>
                            <TextareaField 
                                label="Motivo de la Solicitud" 
                                placeholder="Describa brevemente qué documentos necesita y para qué finalidad..."
                                value={formData.motivo_solicitud}
                                onChange={(val) => handleInputChange("motivo_solicitud", val)}
                                rows={4}
                                className="resize-none"
                            />
                        </div>

                        {/* Configuración de Servicio */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide ml-1">Modalidad de Servicio</label>
                                <div className="relative group">
                                    <select 
                                        className="w-full p-3 pl-10 border border-slate-300 rounded-xl text-sm bg-white appearance-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer hover:border-blue-300 outline-none"
                                        value={formData.modalidad_servicio}
                                        onChange={(e) => handleInputChange("modalidad_servicio", e.target.value)}
                                    >
                                        {MODALIDADES.map(mod => (
                                            <option key={mod.value} value={mod.value}>{mod.label}</option>
                                        ))}
                                    </select>
                                    <Briefcase className="absolute left-3 top-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" size={16} />
                                    <ChevronDown className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" size={16} />
                                </div>
                            </div>

                            {/* Campo Condicional con Animación */}
                            <div className={`transition-all duration-300 ${formData.modalidad_servicio === 'PRESTAMO_ORIGINAL' ? 'opacity-100 translate-y-0' : 'opacity-50 grayscale cursor-not-allowed'}`}>
                                <InputField 
                                    label="Fecha Devolución Estimada" 
                                    icon={Calendar}
                                    type="date" 
                                    value={formData.fecha_devolucion_prevista}
                                    onChange={(e) => handleInputChange("fecha_devolucion_prevista", e.target.value)}
                                    min={today} 
                                    disabled={formData.modalidad_servicio !== 'PRESTAMO_ORIGINAL'}
                                    className={formData.modalidad_servicio === 'PRESTAMO_ORIGINAL' ? "border-blue-200 bg-blue-50/30" : "bg-slate-100"}
                                />
                            </div>
                        </div>

                        {/* Alerta Contextual (Aparece solo si es necesario) */}
                        {formData.modalidad_servicio === 'PRESTAMO_ORIGINAL' && (
                            <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100 animate-in fade-in slide-in-from-bottom-2">
                                <Info className="text-amber-600 mt-0.5 shrink-0" size={16} />
                                <div className="text-xs text-amber-800">
                                    <span className="font-bold">Política de Préstamos:</span> El plazo máximo para originales es de 5 días habiles. La no devolución a tiempo generará una alerta a su jefatura inmediata.
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer de Acciones */}
                    <div className="pt-6 mt-8 border-t border-slate-100 flex justify-end">
                        <button 
                            onClick={handleSubmit}
                            className="px-8 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow-lg shadow-blue-700/20 transition-all flex items-center gap-2 transform active:scale-95 hover:-translate-y-0.5"
                        >
                            <FileText size={18} /> 
                            Registrar Solicitud
                        </button>
                    </div>
                </div>
            </div>

            {/* Modales Auxiliares */}
            <UserModal 
                isOpen={showUserModal}
                onClose={() => setShowUserModal(false)}
                onSave={() => { setShowUserModal(false); onMensaje("Usuario creado", "success"); }}
                userToEdit={null}
                onToast={onMensaje}
            />
        </div>
    );
}