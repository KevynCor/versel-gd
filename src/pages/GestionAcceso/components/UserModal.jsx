import React, { useState, useEffect } from 'react';
import { 
  Users, Mail, Phone, Building, Key, AlertTriangle, Save, Loader2 
} from 'lucide-react';
import { supabase } from '../../../utils/supabaseClient';

// Importaciones de UI
import { ModalGenerico } from '../../../components/form/ModalGenerico.jsx';
import { InputField } from '../../../components/ui/InputField.jsx';
import { SelectInput } from '../../../components/ui/SelectInput.jsx';
import { ToggleSwitch } from '../../../components/ui/ToggleSwitch.jsx';

export default function UserModal({ isOpen, onClose, onSave, userToEdit, onToast }) {
  const [processing, setProcessing] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre_completo: '',
    entidad: 'Electro Sur Este S.A.A.',
    sub_gerencia: '',
    movil: '',
    rol: 'Usuario',
    activo: true
  });

  // Cargar datos al abrir el modal
  useEffect(() => {
    if (isOpen) {
      if (userToEdit) {
        setFormData({
          email: userToEdit.email,
          password: '', 
          nombre_completo: userToEdit.nombre_completo,
          entidad: userToEdit.entidad || '',
          sub_gerencia: userToEdit.sub_gerencia || '',
          movil: userToEdit.movil || '',
          rol: userToEdit.rol || 'Usuario',
          activo: userToEdit.activo
        });
      } else {
        setFormData({
          email: '',
          password: '',
          nombre_completo: '',
          entidad: 'Electro Sur Este S.A.A.',
          sub_gerencia: '',
          movil: '',
          rol: 'Usuario',
          activo: true
        });
      }
    }
  }, [isOpen, userToEdit]);

  const handleSubmit = async () => {
    // Validaciones
    if (!formData.email || !formData.nombre_completo) {
      onToast("El email y nombre completo son obligatorios.", "error");
      return;
    }
    if (!userToEdit && (!formData.password || formData.password.length < 6)) {
      onToast("La contraseña es obligatoria y debe tener al menos 6 caracteres.", "error");
      return;
    }

    setProcessing(true);

    try {
      if (userToEdit) {
        // --- ACTUALIZACIÓN (UPDATE) ---
        const updates = {
          nombre_completo: formData.nombre_completo,
          entidad: formData.entidad,
          sub_gerencia: formData.sub_gerencia,
          movil: formData.movil,
          rol: formData.rol,
          activo: formData.activo,
          updated_at: new Date()
        };

        const { error } = await supabase
          .from('usuarios')
          .update(updates)
          .eq('id', userToEdit.id);

        if (error) throw error;
        onToast("Usuario actualizado correctamente.", "success");
        
      } else {
        // --- CREACIÓN (CREATE) ---
        // Delegamos la creación del perfil al Trigger de Base de Datos
        // Enviamos todos los datos extra en 'options.data'
        
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              // Estos campos serán leídos por el Trigger SQL
              nombre_completo: formData.nombre_completo,
              entidad: formData.entidad,
              sub_gerencia: formData.sub_gerencia,
              movil: formData.movil,
              rol: formData.rol
            }
          }
        });

        if (error) throw error;

        // Si llegamos aquí, Auth creó el usuario y el Trigger debió crear el perfil.
        onToast("Usuario registrado. Si no aparece, verifique su email.", "success");
      }

      onSave(); 
      onClose();

    } catch (error) {
      console.error('Error:', error);
      onToast(error.message || "Error al procesar la solicitud.", "error");
    } finally {
      setProcessing(false);
    }
  };

  const roleOptions = [
    { value: 'Usuario', label: 'Usuario General' },
    { value: 'Archivero', label: 'Archivero' },
    { value: 'Secretaria', label: 'Secretaria' },
    { value: 'Supervisor', label: 'Supervisor' },
    { value: 'Auditor', label: 'Auditor' },
    { value: 'Admin', label: 'Administrador' }
  ];

  if (!isOpen) return null;

  return (
    <ModalGenerico 
        title={userToEdit ? "Editar Ficha de Usuario" : "Registrar Nuevo Usuario"} 
        onClose={onClose}
    >
        <div className="space-y-5 p-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputField 
                    label="Nombre Completo *" 
                    icon={Users} 
                    value={formData.nombre_completo} 
                    onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})}
                    placeholder="Ej: Juan Pérez Pérez"
                />
                <InputField 
                    label="Correo Electrónico *" 
                    icon={Mail} 
                    type="email"
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    disabled={!!userToEdit} 
                    className={userToEdit ? "bg-slate-100 text-slate-500 cursor-not-allowed" : ""}
                />
            </div>

            {!userToEdit && (
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                    <InputField 
                        label="Contraseña Inicial *" 
                        icon={Key} 
                        type="password"
                        value={formData.password} 
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder="Mínimo 6 caracteres"
                    />
                    <p className="text-xs text-amber-700 mt-2 flex items-center gap-1 font-medium">
                        <AlertTriangle size={12} /> 
                        Atención: Al crear un usuario nuevo, es posible que se cierre su sesión de administrador.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <InputField 
                    label="Entidad" 
                    icon={Building} 
                    value={formData.entidad} 
                    onChange={(e) => setFormData({...formData, entidad: e.target.value})}
                />
                 <InputField 
                    label="Sub Gerencia / Área" 
                    value={formData.sub_gerencia} 
                    onChange={(e) => setFormData({...formData, sub_gerencia: e.target.value})}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputField 
                    label="Teléfono Móvil" 
                    icon={Phone} 
                    value={formData.movil} 
                    onChange={(e) => setFormData({...formData, movil: e.target.value})}
                />
                <SelectInput 
                    label="Rol del Sistema *"
                    value={formData.rol}
                    onChange={(e) => setFormData({...formData, rol: e.target.value})}
                    options={roleOptions}
                />
            </div>

            <div className="pt-4 border-t border-slate-100">
                <ToggleSwitch 
                    label="Cuenta Habilitada" 
                    description="Si se desactiva, el usuario no podrá acceder al sistema."
                    checked={formData.activo}
                    onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                    onClick={onClose} 
                    className="px-5 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-bold hover:bg-slate-50 text-sm transition-colors" 
                    disabled={processing}
                >
                    Cancelar
                </button>
                <button 
                    onClick={handleSubmit} 
                    className="px-6 py-2.5 bg-blue-700 text-white rounded-lg font-bold shadow-md hover:bg-blue-800 text-sm flex items-center gap-2 transition-all disabled:opacity-70" 
                    disabled={processing}
                >
                    {processing ? <><Loader2 size={16} className="animate-spin"/> Guardando...</> : <><Save size={18}/> Guardar</>}
                </button>
            </div>
        </div>
    </ModalGenerico>
  );
}