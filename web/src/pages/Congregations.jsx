import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { toast } from 'sonner';
import { Church, MapPin, Phone, Mail, Tag, Eye, Edit2, Trash2, RefreshCw } from 'lucide-react';

export default function Congregations() {
  const [congregaciones, setCongregaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [estados, setEstados] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingCongregation, setEditingCongregation] = useState(null);
  const [viewingCongregation, setViewingCongregation] = useState(null);
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  // Cargar congregaciones al inicio
  useEffect(() => {
    fetchCongregaciones();
  }, []);

  // Fetch congregaciones
  const fetchCongregaciones = async () => {
    setLoading(true);
    setFiltroEstado(null);
    try {
      const response = await api.get('/congregaciones');
      const data = response.data?.success ? response.data.data : [];
      setCongregaciones(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching congregaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch congregaciones by estado
  const fetchCongregacionesByEstado = async (idEstado) => {
    setLoading(true);
    setFiltroEstado(idEstado);
    try {
      const response = await api.get(`/congregaciones/estado/${idEstado}`);
      const data = response.data?.success ? response.data.data : [];
      setCongregaciones(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching congregaciones by estado:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar opciones
  const loadOpciones = async () => {
    try {
      const estadosRes = await api.get('/congregaciones/listado/estados');
      setEstados(estadosRes.data?.success ? estadosRes.data.data : []);
    } catch (error) {
      console.error('Error loading opciones:', error);
      toast.error('Error al cargar opciones');
    }
  };

  // Abrir modal para crear
  const handleOpenModal = async () => {
    setEditingCongregation(null);
    reset();
    await loadOpciones();
    setIsModalOpen(true);
  };

  // Editar congregación
  const handleEdit = async (cong) => {
    setEditingCongregation(cong);
    setValue('nombre', cong.nombre);
    setValue('direccion', cong.direccion || '');
    setValue('ciudad', cong.ciudad || '');
    setValue('region', cong.region || '');
    setValue('telefono', cong.telefono || '');
    setValue('email', cong.email || '');
    setValue('id_estado', cong.id_estado);
    
    await loadOpciones();
    setIsModalOpen(true);
  };

  // Ver detalle de congregación
  const handleViewCongregation = async (cong) => {
    try {
      const response = await api.get(`/congregaciones/${cong.id_congregacion}`);
      const congData = response.data?.success ? response.data.data : null;
      setViewingCongregation(congData);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error('Error fetching congregation details:', error);
    }
  };

  // Eliminar congregación
  const handleDelete = async (id) => {
    toast('¿Estás seguro de eliminar esta congregación?', {
      action: {
        label: 'Eliminar',
        onClick: async () => {
          try {
            const response = await api.delete(`/congregaciones/${id}`);
            if (response.data?.success) {
              toast.success('Congregación eliminada correctamente');
              fetchCongregaciones();
            } else {
              toast.error(response.data?.mensaje || 'Error al eliminar');
            }
          } catch (_error) {
            toast.error('Error al eliminar congregación');
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
      id_estado: parseInt(data.id_estado),
      id_pastor: data.id_pastor ? parseInt(data.id_pastor) : null
    };

    try {
      let response;
      if (editingCongregation) {
        response = await api.put(`/congregaciones/${editingCongregation.id_congregacion}`, payload);
      } else {
        response = await api.post('/congregaciones', payload);
      }
      
      if (response.data?.success) {
        toast.success(editingCongregation ? 'Congregación actualizada correctamente' : 'Congregación creada correctamente');
        setIsModalOpen(false);
        reset();
        fetchCongregaciones();
      } else {
        toast.error(response.data?.mensaje || 'Error al guardar');
      }
    } catch (_error) {
      toast.error('Error al guardar congregación');
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <Church className="w-6 h-6" />
          Congregaciones
        </h1>
        <button
          onClick={handleOpenModal}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 w-full sm:w-auto flex items-center justify-center gap-2"
        >
          <Church className="w-4 h-4" />
          Agregar Congregación
        </button>
      </div>

      {/* Filtro por estado */}
      {estados.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por estado:</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={fetchCongregaciones}
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
                onClick={() => fetchCongregacionesByEstado(estado.id_estado)}
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
      ) : congregaciones.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Church className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {filtroEstado 
              ? 'No hay congregaciones con el estado seleccionado' 
              : 'No hay congregaciones registradas'}
          </p>
          <button
            onClick={handleOpenModal}
            className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Agregar la primera congregación
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {congregaciones.map((cong) => (
            <div key={cong.id_congregacion} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg truncate">{cong.nombre}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {cong.direccion || 'Sin dirección'}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => handleViewCongregation(cong)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Ver detalle"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(cong)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cong.id_congregacion)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                  {cong.ciudad && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{cong.ciudad}</span>
                    </div>
                  )}
                  {cong.telefono && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      <span>{cong.telefono}</span>
                    </div>
                  )}
                  {cong.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{cong.email}</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    cong.estado?.nombre === 'Activo' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {cong.estado?.nombre || '-'}
                  </span>
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
                {editingCongregation ? 'Editar Congregación' : 'Nueva Congregación'}
              </h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre *</label>
                  <input
                    {...register('nombre', { required: 'Nombre requerido' })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {errors.nombre && <span className="text-red-500 text-sm">{errors.nombre.message}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Dirección</label>
                  <input
                    {...register('direccion')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ciudad</label>
                    <input
                      {...register('ciudad')}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Región</label>
                    <input
                      {...register('region')}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                    <input
                      {...register('telefono')}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      {...register('email')}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
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

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 font-medium"
                  >
                    {editingCongregation ? 'Actualizar' : 'Crear'}
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
      {isDetailModalOpen && viewingCongregation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-bold">{viewingCongregation.nombre}</h2>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="col-span-2">
                  <span className="text-gray-500">Dirección:</span>
                  <span className="ml-2 font-medium">{viewingCongregation.direccion || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Ciudad:</span>
                  <span className="ml-2 font-medium">{viewingCongregation.ciudad || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Región:</span>
                  <span className="ml-2 font-medium">{viewingCongregation.region || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Teléfono:</span>
                  <span className="ml-2 font-medium">{viewingCongregation.telefono || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Email:</span>
                  <span className="ml-2 font-medium">{viewingCongregation.email || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Estado:</span>
                  <span className="ml-2 font-medium">{viewingCongregation.estado?.nombre || '-'}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-indigo-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-indigo-600">
                    {viewingCongregation.miembros?.length || 0}
                  </div>
                  <div className="text-xs text-gray-600">Miembros</div>
                </div>
                <div className="bg-indigo-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-indigo-600">
                    {viewingCongregation.institucions?.length || 0}
                  </div>
                  <div className="text-xs text-gray-600">Instituciones</div>
                </div>
                <div className="bg-indigo-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-indigo-600">
                    {viewingCongregation.eventos?.length || 0}
                  </div>
                  <div className="text-xs text-gray-600">Eventos</div>
                </div>
                <div className="bg-indigo-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-indigo-600">
                    {viewingCongregation.finanzasCuentas?.length || 0}
                  </div>
                  <div className="text-xs text-gray-600">Cuentas</div>
                </div>
                <div className="bg-indigo-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-indigo-600">
                    {viewingCongregation.inventarioItems?.length || 0}
                  </div>
                  <div className="text-xs text-gray-600">Items</div>
                </div>
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