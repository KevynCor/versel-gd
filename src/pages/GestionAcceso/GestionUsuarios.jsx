import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { 
  Users, UserPlus, Key, Edit, Trash2, CheckCircle, XCircle, 
  Shield, Mail, Building, Search, RefreshCw, Loader2
} from 'lucide-react';

// Componentes UI
import { CrudLayout } from '../../components/layout/CrudLayout';
import { StatCard } from '../../components/ui/StatCard';
import { DataTable } from '../../components/data/DataTable';
import { Pagination } from '../../components/data/Pagination';
import { SearchBar } from '../../components/controls/SearchBar';
import { Toast } from '../../components/ui/Toast';
import { SparkleLoader } from '../../components/ui/SparkleLoader';
import { ModalGenerico } from '../../components/form/ModalGenerico'; // Para el modal de contraseña

// Componentes Locales
import UserModal from './components/UserModal';

export default function GestionUsuarios() {
  // --- ESTADOS ---
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [toast, setToast] = useState(null);

  // Estados de Interfaz
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // Usuario seleccionado para editar/pass
  const [processing, setProcessing] = useState(false);

  // --- CARGA DE DATOS ---
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
      setToast({ mensaje: "Error al cargar la lista de usuarios: " + error.message, tipo: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // --- LÓGICA DE FILTRADO Y PAGINACIÓN ---
  const filteredUsers = useMemo(() => {
    const lowerTerm = searchTerm.toLowerCase();
    return users.filter(u => 
      u.nombre_completo?.toLowerCase().includes(lowerTerm) ||
      u.email?.toLowerCase().includes(lowerTerm) ||
      u.rol?.toLowerCase().includes(lowerTerm)
    );
  }, [users, searchTerm]);

  const paginatedUsers = useMemo(() => {
    const start = currentPage * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  // --- MANEJADORES DE ACCIÓN ---

  // Abrir Modal (Crear o Editar)
  const handleOpenModal = (user = null) => {
    setCurrentUser(user);
    setIsModalOpen(true);
  };

  // Helper para notificaciones desde componentes hijos
  const showToast = (mensaje, tipo) => {
    setToast({ mensaje, tipo });
  };

  // Guardar Usuario (Lógica Principal)
  const handleSaveUser = async (formData) => {
    setProcessing(true);
    try {
      if (currentUser) {
        // 1. ACTUALIZAR USUARIO (DB Pública)
        const { error } = await supabase
          .from('usuarios')
          .update({
            nombre_completo: formData.nombre_completo,
            entidad: formData.entidad,
            sub_gerencia: formData.sub_gerencia,
            movil: formData.movil,
            rol: formData.rol,
            activo: formData.activo,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentUser.id);

        if (error) throw error;
        setToast({ mensaje: "Usuario actualizado correctamente.", tipo: "success" });

      } else {
        // 2. CREAR NUEVO USUARIO (Auth + DB Pública)
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: { full_name: formData.nombre_completo, rol: formData.rol }
          }
        });

        if (authError) throw authError;

        if (authData.user) {
           // Insertar en tabla pública usando el ID de Auth
           const { error: dbError } = await supabase
             .from('usuarios')
             .insert([{
               id: authData.user.id, 
               email: formData.email,
               nombre_completo: formData.nombre_completo,
               entidad: formData.entidad,
               sub_gerencia: formData.sub_gerencia,
               movil: formData.movil,
               rol: formData.rol,
               activo: formData.activo
             }]);
           
           if (dbError) throw dbError;
           setToast({ mensaje: "Usuario registrado y sincronizado.", tipo: "success" });
        } else {
           setToast({ mensaje: "Solicitud enviada. Pendiente de confirmación.", tipo: "info" });
        }
      }

      setIsModalOpen(false);
      fetchUsers(); // Recargar lista

    } catch (error) {
      console.error(error);
      setToast({ mensaje: "Error: " + error.message, tipo: "error" });
    } finally {
      setProcessing(false);
    }
  };

  // Restablecer Contraseña
  const handlePasswordReset = async () => {
    if (!currentUser?.email) return;
    
    setProcessing(true);
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(currentUser.email, {
            redirectTo: `${window.location.origin}/update-password`,
        });

        if (error) throw error;

        setToast({ mensaje: `Correo enviado a ${currentUser.email}`, tipo: "success" });
        setIsPasswordModalOpen(false);
    } catch (error) {
        setToast({ mensaje: "Error al enviar correo: " + error.message, tipo: "error" });
    } finally {
        setProcessing(false);
    }
  };

  // Eliminar Usuario
  const handleDeleteUser = async (id) => {
      if(!window.confirm("¿Está seguro de eliminar este usuario? Esta acción borrará su acceso.")) return;
      
      try {
          const { error } = await supabase.from('usuarios').delete().eq('id', id);
          if (error) throw error;
          
          setToast({ mensaje: "Usuario eliminado.", tipo: "info" });
          fetchUsers();
      } catch (error) {
          setToast({ mensaje: "Error al eliminar: " + error.message, tipo: "error" });
      }
  }

  // --- COLUMNAS DE LA TABLA ---
  const columns = [
    {
      key: "usuario",
      label: "Usuario",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200 shadow-sm shrink-0">
            <Users size={20} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-800 text-sm truncate">{row.nombre_completo}</p>
            <p className="text-xs text-slate-500 flex items-center gap-1 font-medium truncate">
              <Mail size={10} /> {row.email}
            </p>
          </div>
        </div>
      )
    },
    {
      key: "rol",
      label: "Rol Asignado",
      render: (row) => {
        const roleStyles = {
            'Admin': 'bg-purple-100 text-purple-800 border-purple-200',
            'Supervisor': 'bg-indigo-100 text-indigo-800 border-indigo-200',
            'Archivero': 'bg-blue-100 text-blue-800 border-blue-200',
            'Secretaria': 'bg-pink-100 text-pink-800 border-pink-200',
            'Auditor': 'bg-amber-100 text-amber-800 border-amber-200',
            'Usuario': 'bg-slate-100 text-slate-700 border-slate-200'
        };
        const style = roleStyles[row.rol] || roleStyles['Usuario'];
        return (
            <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide border ${style}`}>
                {row.rol}
            </span>
        );
      }
    },
    {
        key: "entidad",
        label: "Dependencia",
        render: (row) => (
            <div className="text-xs text-slate-600">
                <p className="font-bold text-slate-800 truncate max-w-[200px]">{row.entidad}</p>
                <p className="text-slate-500 flex items-center gap-1 mt-0.5 truncate max-w-[200px]">
                    <Building size={10}/> {row.sub_gerencia || 'Sin área'}
                </p>
            </div>
        )
    },
    {
        key: "estado",
        label: "Acceso",
        render: (row) => (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${row.activo ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {row.activo ? <CheckCircle size={12}/> : <XCircle size={12}/>}
                {row.activo ? 'Habilitado' : 'Bloqueado'}
            </span>
        )
    }
  ];

  // Renderizar acciones de fila
  const renderActions = (row) => (
    <div className="flex items-center justify-center gap-2">
      <button 
        onClick={() => handleOpenModal(row)}
        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100" 
        title="Editar Datos"
      >
        <Edit size={18} />
      </button>
      <button 
        onClick={() => { setCurrentUser(row); setIsPasswordModalOpen(true); }}
        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border border-transparent hover:border-amber-100" 
        title="Restablecer Contraseña"
      >
        <Key size={18} />
      </button>
      <button 
        onClick={() => handleDeleteUser(row.id)}
        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100" 
        title="Eliminar Usuario"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );

  // Estadísticas Memoizadas
  const stats = useMemo(() => ({
    total: users.length,
    activos: users.filter(u => u.activo).length,
    admins: users.filter(u => u.rol === 'Admin').length,
    archiveros: users.filter(u => u.rol === 'Archivero').length
  }), [users]);

  return (
    <CrudLayout title="Gestión de Usuarios" icon={Users} description="Control centralizado de cuentas, roles y seguridad del sistema.">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Panel de Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Usuarios" value={stats.total} icon={Users} color="blue" />
        <StatCard title="Usuarios Activos" value={stats.activos} icon={CheckCircle} color="green" />
        <StatCard title="Administradores" value={stats.admins} icon={Shield} color="purple" />
        <StatCard title="Archiveros" value={stats.archiveros} icon={Building} color="indigo" />
      </div>

      {/* Barra de Controles */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="w-full sm:max-w-md relative">
            <SearchBar 
                value={searchTerm} 
                onChange={setSearchTerm} 
                placeholder="Buscar por nombre, email, rol..." 
            />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
            <button 
                onClick={fetchUsers} 
                className="px-3 py-2.5 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                title="Recargar lista"
            >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
            <button 
                onClick={() => handleOpenModal()} 
                className="flex-1 sm:flex-none px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
                <UserPlus size={18} /> Nuevo Usuario
            </button>
        </div>
      </div>

      {/* Tabla de Datos */}
      {loading ? (
        <SparkleLoader />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <DataTable 
                columns={columns} 
                data={paginatedUsers} 
                renderActions={renderActions}
                emptyMessage="No se encontraron usuarios registrados."
            />
             <div className="p-4 border-t border-slate-200 bg-slate-50">
                <Pagination 
                    page={currentPage} 
                    total={filteredUsers.length} 
                    pageSize={itemsPerPage} 
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setItemsPerPage}
                />
            </div>
        </div>
      )}

      {/* --- MODAL COMPONETIZADO (USUARIO) --- */}
      <UserModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveUser}
        userToEdit={currentUser}
        processing={processing}
        onToast={showToast}
      />

      {/* --- MODAL CAMBIO DE CONTRASEÑA (Simple, se mantiene aquí) --- */}
      {isPasswordModalOpen && (
         <ModalGenerico title="Gestión de Seguridad" onClose={() => setIsPasswordModalOpen(false)}>
            <div className="space-y-6 p-2">
                <div className="text-center py-4">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
                        <Key size={32} className="text-blue-600"/>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Restablecer Contraseña</h3>
                    <p className="text-slate-500 text-sm mt-2 max-w-xs mx-auto">
                        Se enviará un enlace seguro a <strong>{currentUser?.email}</strong> para que el usuario defina una nueva contraseña.
                    </p>
                </div>

                <div className="flex justify-center gap-3 pt-4 border-t border-slate-100">
                    <button onClick={() => setIsPasswordModalOpen(false)} className="px-5 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-bold hover:bg-slate-50 text-sm transition-colors">Cancelar</button>
                    <button onClick={handlePasswordReset} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold shadow-md hover:bg-blue-700 text-sm flex items-center gap-2 transition-all disabled:opacity-70" disabled={processing}>
                         {processing ? <Loader2 size={16} className="animate-spin"/> : <Mail size={18}/>} Enviar Correo
                    </button>
                </div>
            </div>
         </ModalGenerico>
      )}
    </CrudLayout>
  );
}