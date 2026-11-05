import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { toast } from 'sonner';
import { Users as UserIcon, Shield, Mail, Tag, Building, Eye, Edit2, Trash2, RefreshCw, Key } from 'lucide-react';

export default function Users() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [estados, setEstados] = useState([]);
  const [miembros, setMiembros] = useState([]);
  const [congregaciones, setCongregaciones] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  // Cargar usuarios al inicio
  useEffect(() => {
    fetchUsuarios();
  }, []);

  // Fetch usuarios
  const fetchUsuarios = async () => {
    setLoading(true);
    setFiltroEstado(null);
    try {
      const response = await api.get('/usuarios');
      const data = response.data?.success ? response.data.data : [];
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch usuarios by estado
  const fetchUsuariosByEstado = async (idEstado) => {
    setLoading(true);
    setFiltroEstado(idEstado);
    try {
      const response = await api.get(`/usuarios/estado/${idEstado}`);
      const data = response.data?.success ? response.data.data : [];
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching usuarios by estado:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar opciones
  const loadOpciones = async () => {
    try {
      const [rolesRes, estadosRes, miembrosRes,congRes] = await Promise.all([
        api.get('/usuarios/listado/roles'),
        api.get('/usuarios/listado/estados'),
        api.get('/usuarios/listado/miembros'),
        api.get('/usuarios/listado/congregaciones')
      ]);
      
      setRoles(rolesRes.data?.success ? rolesRes.data.data : []);
      setEstados(estadosRes.data?.success ? estadosRes.data.data : []);
      setMiembros(miembrosRes.data?.success ? miembrosRes.data.data : []);
      setCongregaciones(congRes.data?.success ? congRes.data.data : []);
    } catch (error) {
      console.error('Error loading opciones:', error);
      toast.error('Error al cargar opciones');
    }
  };

  // Abrir modal para crear
  const handleOpenModal = async () => {
    setEditingUser(null);
    reset();
    await loadOpciones();
    setIsModalOpen(true);
  };

  // Editar usuario
  const handleEdit = async (user) => {
    setEditingUser(user);
    setValue('username', user.username);
    setValue('email', user.email);
    setValue('id_rol', user.id_rol);
    setValue('id_estado', user.id_estado);
    setValue('id_miembro', user.id_miembro || '');
    setValue('id_congregacion', user.id_congregacion || '');
    
    await loadOpciones();
    setIsModalOpen(true);
  };

  // Ver detalle del usuario
  const handleViewUser = async (user) => {
    try {
      const response = await api.get(`/usuarios/${user.id_usuario}`);
      const userData = response.data?.success ? response.data.data : null;
      setViewingUser(userData);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  // Eliminar usuario
  const handleDelete = async (id) => {
    toast('¿Estás seguro de eliminar este usuario?', {
      action: {
        label: 'Eliminar',
        onClick: async () => {
          try {
            const response = await api.delete(`/usuarios/${id}`);
            if (response.data?.success) {
              toast.success('Usuario eliminado correctamente');
              fetchUsuarios();
            } else {
              toast.error(response.data?.mensaje || 'Error al eliminar');
            }
          } catch (_error) {
            toast.error('Error al eliminar usuario');
          }
        },
      },
      description: 'Esta acción no se puede deshacer',
      duration: 5000,
    });
  };

  // Submit form
  const onSubmit = async (data) => {
    const payload = {
      ...data,
      id_rol: parseInt(data.id_rol),
      id_estado: parseInt(data.id_estado),
      id_miembro: data.id_miembro ? parseInt(data.id_miembro) : null,
      id_congregacion: data.id_congregacion ? parseInt(data.id_congregacion) : null
    };

    try {
      let response;
      if (editingUser) {
        // Solo actualizar si se proporciona nueva contraseña
        if (data.password) {
          payload.password = data.password;
        } else {
          delete payload.password;
        }
        response = await api.put(`/usuarios/${editingUser.id_usuario}`, payload);
      } else {
        response = await api.post('/usuarios', payload);
      }
      
      if (response.data?.success) {
        toast.success(editingUser ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente');
        setIsModalOpen(false);
        reset();
        fetchUsuarios();
      } else {
        toast.error(response.data?.mensaje || 'Error al guardar');
      }
    } catch (_error) {
      toast.error('Error al guardar usuario');
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <UserIcon className="w-6 h-6" />
          Usuarios
        </h1>
        <button
          onClick={handleOpenModal}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 w-full sm:w-auto flex items-center justify-center gap-2"
        >
          <UserIcon className="w-4 h-4" />
          Agregar Usuario
        </button>
      </div>

      {/* Filtro por estado */}
      {estados.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por estado:</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={fetchUsuarios}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filtroEstado === null
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            {estados.map((estado) => (
              <button
                key={estado.id_estado}
                onClick={() => fetchUsuariosByEstado(estado.id_estado)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  filtroEstado === estado.id_estado
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {estado.nombre}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-2 text-gray-500">Cargando...</p>
        </div>
      ) : usuarios.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <UserIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {filtroEstado 
              ? 'No hay usuarios con el estado seleccionado' 
              : 'No hay usuarios registrados'}
          </p>
          <button
            onClick={handleOpenModal}
            className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Agregar el primer usuario
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {usuarios.map((user) => (
            <div key={user.id_usuario} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-lg">{user.username}</h3>
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                      {user.rol?.nombre || '-'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {user.email}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {user.congregacion && (
                      <span className="text-xs flex items-center gap-1 text-gray-500">
                        <Building className="w-3 h-3" />
                        {user.congregacion.nombre}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      user.estado?.nombre === 'Activo' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {user.estado?.nombre || '-'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() => handleViewUser(user)}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Ver detalle"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(user)}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(user.id_usuario)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de crear/editar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-bold mb-4">
                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Usuario *</label>
                  <input
                    {...register('username', { required: 'Usuario requerido' })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={editingUser}
                  />
                  {errors.username && <span className="text-red-500 text-sm">{errors.username.message}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email *</label>
                  <input
                    type="email"
                    {...register('email', { required: 'Email requerido' })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {errors.email && <span className="text-red-500 text-sm">{errors.email.message}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {editingUser ? 'Nueva Contraseña (dejar vacío para mantener)' : 'Contraseña *'}
                  </label>
                  <input
                    type="password"
                    {...register('password', { required: !editingUser ? 'Contraseña requerida' : false })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder={editingUser ? '••••••••' : ''}
                  />
                  {errors.password && <span className="text-red-500 text-sm">{errors.password.message}</span>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rol *</label>
                    <select
                      {...register('id_rol', { required: 'Rol requerido' })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Seleccionar</option>
                      {roles.map(rol => (
                        <option key={rol.id_rol} value={rol.id_rol}>{rol.nombre}</option>
                      ))}
                    </select>
                    {errors.id_rol && <span className="text-red-500 text-sm">{errors.id_rol.message}</span>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estado *</label>
                    <select
                      {...register('id_estado', { required: 'Estado requerido' })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Seleccionar</option>
                      {estados.map(estado => (
                        <option key={estado.id_estado} value={estado.id_estado}>{estado.nombre}</option>
                      ))}
                    </select>
                    {errors.id_estado && <span className="text-red-500 text-sm">{errors.id_estado.message}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Congregación</label>
                    <select
                      {...register('id_congregacion')}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Todas</option>
                      {congregaciones.map(cong => (
                        <option key={cong.id_congregacion} value={cong.id_congregacion}>{cong.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Miembro Relacionado</label>
                    <select
                      {...register('id_miembro')}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Sin miembro</option>
                      {miembros.map(miembro => (
                        <option key={miembro.id_miembro} value={miembro.id_miembro}>
                          {miembro.nombres} {miembro.apellidos}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 font-medium"
                  >
                    {editingUser ? 'Actualizar' : 'Crear'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalle */}
      {isDetailModalOpen && viewingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-bold">{viewingUser.username}</h2>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500 w-20">Email:</span>
                  <span className="font-medium">{viewingUser.email || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500 w-20">Rol:</span>
                  <span className="font-medium">{viewingUser.rol?.nombre || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500 w-20">Congregación:</span>
                  <span className="font-medium">{viewingUser.congregacion?.nombre || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500 w-20">Estado:</span>
                  <span className={`font-medium ${
                    viewingUser.estado?.nombre === 'Activo' ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {viewingUser.estado?.nombre || '-'}
                  </span>
                </div>
                {viewingUser.miembro && (
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <UserIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500 w-20">Miembro:</span>
                    <span className="font-medium">
                      {viewingUser.miembro.nombres} {viewingUser.miembro.apellidos}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="mt-6 w-full bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}