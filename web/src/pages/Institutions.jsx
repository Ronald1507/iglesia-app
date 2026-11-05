import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { toast } from 'sonner';

export default function Institutions() {
  const [instituciones, setInstituciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [estados, setEstados] = useState([]);
  const [congregaciones, setCongregaciones] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState(null);
  const [viewingInstitution, setViewingInstitution] = useState(null);
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  // Cargar instituciones al inicio
  useEffect(() => {
    fetchInstituciones();
  }, []);

  // Fetch instituciones
  const fetchInstituciones = async () => {
    setLoading(true);
    try {
      const response = await api.get('/instituciones');
      const data = response.data?.success ? response.data.data : [];
      setInstituciones(data);
    } catch (error) {
      console.error('Error fetching instituciones:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch instituciones by estado
  const fetchInstitucionesByEstado = async (idEstado) => {
    setLoading(true);
    setFiltroEstado(idEstado);
    try {
      const response = await api.get(`/instituciones/estado/${idEstado}`);
      const data = response.data?.success ? response.data.data : [];
      setInstituciones(data);
    } catch (error) {
      console.error('Error fetching instituciones by estado:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar opciones
  const loadOpciones = async () => {
    try {
      const [estadosRes, congregacionesRes, tiposRes] = await Promise.all([
        api.get('/instituciones/listado/estados'),
        api.get('/instituciones/listado/congregaciones'),
        api.get('/instituciones/listado/tipos')
      ]);
      
      setEstados(estadosRes.data?.success ? estadosRes.data.data : []);
      setCongregaciones(congregacionesRes.data?.success ? congregacionesRes.data.data : []);
      setTipos(tiposRes.data?.success ? tiposRes.data.data : []);
    } catch (error) {
      console.error('Error loading opciones:', error);
      toast.error('Error al cargar opciones');
    }
  };

  // Abrir modal para crear
  const handleOpenModal = async () => {
    setEditingInstitution(null);
    reset();
    await loadOpciones();
    setIsModalOpen(true);
  };

  // Editar institución
  const handleEdit = async (institution) => {
    setEditingInstitution(institution);
    setValue('nombre', institution.nombre);
    setValue('tipo', institution.tipo);
    setValue('descripcion', institution.descripcion || '');
    setValue('id_congregacion', institution.id_congregacion);
    setValue('id_estado', institution.id_estado);
    
    await loadOpciones();
    setIsModalOpen(true);
  };

  // Ver detalle de la institución
  const handleViewInstitution = async (institution) => {
    try {
      const response = await api.get(`/instituciones/${institution.id_institucion}`);
      const institutionData = response.data?.success ? response.data.data : null;
      setViewingInstitution(institutionData);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error('Error fetching institution details:', error);
    }
  };

  // Eliminar institución
  const handleDelete = async (id) => {
    toast('¿Estás seguro de eliminar esta institución?', {
      action: {
        label: 'Eliminar',
        onClick: async () => {
          try {
            const response = await api.delete(`/instituciones/${id}`);
            if (response.data?.success) {
              toast.success('Institución eliminada correctamente');
              fetchInstituciones();
            } else {
              toast.error(response.data?.mensaje || 'Error al eliminar');
            }
          } catch (_error) {
            toast.error('Error al eliminar institución');
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
      id_congregacion: parseInt(data.id_congregacion)
    };

    try {
      let result;
      if (editingInstitution) {
        const response = await api.put(`/instituciones/${editingInstitution.id_institucion}`, payload);
        result = response.data;
      } else {
        const response = await api.post('/instituciones', payload);
        result = response.data;
      }

      if (result?.success) {
        toast.success(editingInstitution ? 'Institución actualizada correctamente' : 'Institución creada correctamente');
        setIsModalOpen(false);
        fetchInstituciones();
      } else {
        toast.error(result?.mensaje || 'Error al guardar');
      }
    } catch (_error) {
      toast.error('Error al guardar institución');
    }
  };

  // Toggle status
  const toggleStatus = async (id) => {
    try {
      const response = await api.patch(`/instituciones/${id}/status`);
      if (response.data?.success) {
        toast.success(response.data.mensaje);
        fetchInstituciones();
      }
    } catch (_error) {
      toast.error('Error al cambiar estado');
    }
  };

  // Helper para nombre de tipo
  const getTipoNombre = (tipoId) => {
    const tipo = tipos.find(t => t.id === tipoId);
    return tipo ? tipo.nombre : tipoId;
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Instituciones</h1>
          <p className="text-sm text-gray-500">{instituciones.length} registros</p>
        </div>
        <button
          onClick={handleOpenModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 shadow-md transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva Institución
        </button>
      </div>

      {/* Filtro por estado */}
      {estados.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Filtrar por estado:</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setFiltroEstado(null); fetchInstituciones(); }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filtroEstado === null
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            {estados.map((estado) => (
              <button
                key={estado.id_estado}
                onClick={() => fetchInstitucionesByEstado(estado.id_estado)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filtroEstado === estado.id_estado
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {estado.nombre}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lista de instituciones */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : instituciones.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-gray-500 text-lg">
            {filtroEstado ? 'No hay instituciones con el estado seleccionado' : 'No hay instituciones registradas'}
          </p>
          <button onClick={handleOpenModal} className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium">
            Agregar la primera institución
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {instituciones.map((inst) => (
            <div key={inst.id_institucion} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              {/* Card Header */}
              <div className="p-4 border-b bg-gray-50 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800 text-lg">{inst.nombre}</h3>
                    <p className="text-sm text-gray-500">{getTipoNombre(inst.tipo)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    inst.estado?.nombre === 'ACTIVA' || inst.estado?.nombre === 'ACTIVO'
                      ? 'bg-green-100 text-green-700' : 
                      inst.estado?.nombre === 'INACTIVA' || inst.estado?.nombre === 'INACTIVO'
                      ? 'bg-yellow-100 text-yellow-700' : 
                      'bg-gray-100 text-gray-600'
                  }`}>
                    {inst.estado?.nombre}
                  </span>
                </div>
              </div>
              
              {/* Card Body */}
              <div className="p-4 space-y-2">
                {inst.descripcion && (
                  <p className="text-sm text-gray-600 line-clamp-2">{inst.descripcion}</p>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>{inst.congregacion?.nombre || 'Sin congregación'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-indigo-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="font-medium">{inst._count?.miembroInstitucions || 0} miembros</span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-3 border-t bg-gray-50 rounded-b-lg">
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleViewInstitution(inst)}
                      className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                      title="Ver detalle"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => handleEdit(inst)}
                      className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                      title="Editar"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => toggleStatus(inst.id_institucion)}
                      className={`p-2 rounded transition-colors ${
                        inst.estado?.nombre === 'ACTIVA' || inst.estado?.nombre === 'ACTIVO'
                          ? 'text-yellow-600 hover:bg-yellow-50' 
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                      title={inst.estado?.nombre === 'ACTIVA' || inst.estado?.nombre === 'ACTIVO' ? 'Inactivar' : 'Activar'}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => handleDelete(inst.id_institucion)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Eliminar"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de creación/edición */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="bg-indigo-600 p-4 rounded-t-lg">
              <h2 className="text-xl font-bold text-white">
                {editingInstitution ? 'Editar Institución' : 'Nueva Institución'}
              </h2>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  {...register('nombre', { required: 'Nombre requerido' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                {errors.nombre && <span className="text-red-500 text-xs">{errors.nombre.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  {...register('tipo')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Seleccionar</option>
                  {tipos.map(tipo => (
                    <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  {...register('descripcion')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Congregación *</label>
                <select
                  {...register('id_congregacion', { required: 'Congregación requerida' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Seleccionar</option>
                  {congregaciones.map(cong => (
                    <option key={cong.id_congregacion} value={cong.id_congregacion}>{cong.nombre}</option>
                  ))}
                </select>
                {errors.id_congregacion && <span className="text-red-500 text-xs">{errors.id_congregacion.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
                <select
                  {...register('id_estado', { required: 'Estado requerido' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Seleccionar</option>
                  {estados.map(estado => (
                    <option key={estado.id_estado} value={estado.id_estado}>{estado.nombre}</option>
                  ))}
                </select>
                {errors.id_estado && <span className="text-red-500 text-xs">{errors.id_estado.message}</span>}
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-medium transition-colors">
                  {editingInstitution ? 'Actualizar' : 'Crear'}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg font-medium transition-colors">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de detalle */}
      {isDetailModalOpen && viewingInstitution && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-indigo-600 p-4 rounded-t-lg">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Detalle de la Institución</h2>
                <button onClick={() => setIsDetailModalOpen(false)} className="text-white hover:text-gray-200 text-2xl">&times;</button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Datos básicos */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold text-lg text-indigo-600 mb-3 border-b pb-2">Datos de la Institución</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Nombre</p>
                    <p className="font-medium">{viewingInstitution.nombre}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tipo</p>
                    <p className="font-medium">{getTipoNombre(viewingInstitution.tipo)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Estado</p>
                    <span className={`inline-block px-2 py-1 rounded text-sm ${
                      viewingInstitution.estado?.nombre === 'ACTIVA' || viewingInstitution.estado?.nombre === 'ACTIVO'
                        ? 'bg-green-100 text-green-800' : 
                        'bg-yellow-100 text-yellow-800'
                    }`}>
                      {viewingInstitution.estado?.nombre}
                    </span>
                  </div>
                  <div className="col-span-2 md:col-span-3">
                    <p className="text-xs text-gray-500">Descripción</p>
                    <p className="font-medium">{viewingInstitution.descripcion || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Congregación</p>
                    <p className="font-medium">{viewingInstitution.congregacion?.nombre || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Miembros */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3 border-b pb-2">
                  <h3 className="font-bold text-lg text-indigo-600">Miembros</h3>
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                    {viewingInstitution.miembroInstitucions?.length || 0}
                  </span>
                </div>
                {viewingInstitution.miembroInstitucions && viewingInstitution.miembroInstitucions.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {viewingInstitution.miembroInstitucions.map((mi, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-white rounded">
                        <span className="font-medium">{mi.miembro?.nombres} {mi.miembro?.apellidos}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          mi.estado?.nombre === 'ACTIVO' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {mi.estado?.nombre}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No hay miembros registrados</p>
                )}
              </div>

              {/* Cargos / Directiva */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3 border-b pb-2">
                  <h3 className="font-bold text-lg text-indigo-600">Directiva / Cargos</h3>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                    {viewingInstitution.cargoInstitucions?.length || 0}
                  </span>
                </div>
                {viewingInstitution.cargoInstitucions && viewingInstitution.cargoInstitucions.length > 0 ? (
                  <div className="space-y-2">
                    {viewingInstitution.cargoInstitucions.map((cargo, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-white rounded">
                        <div>
                          <span className="font-medium">{cargo.miembro?.nombres} {cargo.miembro?.apellidos}</span>
                        </div>
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                          {cargo.rol}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No hay cargos asignados</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50 rounded-b-lg flex justify-end">
              <button 
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
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