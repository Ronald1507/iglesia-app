import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { toast } from 'sonner';

export default function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [estados, setEstados] = useState([]);
  const [congregaciones, setCongregaciones] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [instituciones, setInstituciones] = useState([]);
  const [selectedInstituciones, setSelectedInstituciones] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [viewingMember, setViewingMember] = useState(null);
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  // Cargar miembros al inicio
  useEffect(() => {
    fetchMembers();
  }, []);

  // Fetch members
  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/miembros');
      const data = response.data?.success ? response.data.data : [];
      setMembers(data);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch members by estado
  const fetchMembersByEstado = async (idEstado) => {
    setLoading(true);
    setFiltroEstado(idEstado);
    try {
      const response = await api.get(`/miembros/estado/${idEstado}`);
      const data = response.data?.success ? response.data.data : [];
      setMembers(data);
    } catch (error) {
      console.error('Error fetching members by estado:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar opciones
  const loadOpciones = async () => {
    try {
      const [estadosRes, congregacionesRes, tiposRes, institucionesRes] = await Promise.all([
        api.get('/miembros/listado/estados'),
        api.get('/miembros/listado/congregaciones'),
        api.get('/miembros/listado/tipos'),
        api.get('/miembros/listado/instituciones')
      ]);
      
      setEstados(estadosRes.data?.success ? estadosRes.data.data : []);
      setCongregaciones(congregacionesRes.data?.success ? congregacionesRes.data.data : []);
      setTipos(tiposRes.data?.success ? tiposRes.data.data : []);
      setInstituciones(institucionesRes.data?.success ? institucionesRes.data.data : []);
    } catch (error) {
      console.error('Error loading opciones:', error);
      toast.error('Error al cargar opciones');
    }
  };

  // Abrir modal para crear
  const handleOpenModal = async () => {
    setEditingMember(null);
    reset();
    setSelectedInstituciones([]);
    await loadOpciones();
    setIsModalOpen(true);
  };

  // Editar miembro
  const handleEdit = async (member) => {
    setEditingMember(member);
    setValue('nombres', member.nombres);
    setValue('apellidos', member.apellidos);
    setValue('fecha_nacimiento', member.fecha_nacimiento ? member.fecha_nacimiento.split('T')[0] : '');
    setValue('genero', member.genero || '');
    setValue('estado_civil', member.estado_civil || '');
    setValue('rut', member.rut || '');
    setValue('telefono', member.telefono || '');
    setValue('email', member.email || '');
    setValue('direccion', member.direccion || '');
    setValue('id_estado', member.id_estado);
    setValue('id_congregacion', member.id_congregacion);
    setValue('id_tipo_miembro', member.id_tipo_miembro);
    
    const institucionIds = member.miembroInstitucions?.map(m => m.id_institucion) || [];
    setSelectedInstituciones(institucionIds);
    
    await loadOpciones();
    setIsModalOpen(true);
  };

  // Ver detalle del miembro
  const handleViewMember = async (member) => {
    try {
      const response = await api.get(`/miembros/${member.id_miembro}`);
      const memberData = response.data?.success ? response.data.data : null;
      setViewingMember(memberData);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error('Error fetching member details:', error);
    }
  };

  // Eliminar miembro
  const handleDelete = async (id) => {
    toast('¿Estás seguro de eliminar este miembro?', {
      action: {
        label: 'Eliminar',
        onClick: async () => {
          try {
            const response = await api.delete(`/miembros/${id}`);
            if (response.data?.success) {
              toast.success('Miembro eliminado correctamente');
              fetchMembers();
            } else {
              toast.error(response.data?.mensaje || 'Error al eliminar');
            }
          } catch (_error) {
            toast.error('Error al eliminar miembro');
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
      id_congregacion: parseInt(data.id_congregacion),
      id_tipo_miembro: parseInt(data.id_tipo_miembro),
      instituciones: selectedInstituciones
    };

    try {
      let result;
      if (editingMember) {
        const response = await api.put(`/miembros/${editingMember.id_miembro}`, payload);
        result = response.data;
      } else {
        const response = await api.post('/miembros', payload);
        result = response.data;
      }

      if (result?.success) {
        toast.success(editingMember ? 'Miembro actualizado correctamente' : 'Miembro creado correctamente');
        setIsModalOpen(false);
        setSelectedInstituciones([]);
        fetchMembers();
      } else {
        toast.error(result?.mensaje || 'Error al guardar');
      }
    } catch (_error) {
      toast.error('Error al guardar miembro');
    }
  };

  // Toggle status
  const toggleStatus = async (id) => {
    try {
      const response = await api.patch(`/miembros/${id}/status`);
      if (response.data?.success) {
        toast.success(response.data.mensaje);
        fetchMembers();
      }
    } catch (_error) {
      toast.error('Error al cambiar estado');
    }
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Miembros</h1>
          <p className="text-sm text-gray-500">{members.length} registros</p>
        </div>
        <button
          onClick={handleOpenModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 shadow-md transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Miembro
        </button>
      </div>

      {/* Filtro por estado - Diseño mejorado */}
      {estados.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Filtrar por estado:</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setFiltroEstado(null); fetchMembers(); }}
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
                onClick={() => fetchMembersByEstado(estado.id_estado)}
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

      {/* Lista de miembros - Diseño mejorado */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : members.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-gray-500 text-lg">
            {filtroEstado ? 'No hay miembros con el estado seleccionado' : 'No hay miembros registrados'}
          </p>
          <button onClick={handleOpenModal} className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium">
            Agregar el primer miembro
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
            <div key={member.id_miembro} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              {/* Card Header */}
              <div className="p-4 border-b bg-gray-50 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800 text-lg">{member.nombres} {member.apellidos}</h3>
                    <p className="text-sm text-gray-500">{member.tipoMiembro?.nombre}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    member.estado?.nombre === 'ACTIVO' ? 'bg-green-100 text-green-700' : 
                    member.estado?.nombre === 'INACTIVO' ? 'bg-yellow-100 text-yellow-700' : 
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {member.estado?.nombre}
                  </span>
                </div>
              </div>
              
              {/* Card Body */}
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>{member.congregacion?.nombre || 'Sin congregación'}</span>
                </div>
                {member.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>{member.email}</span>
                  </div>
                )}
                {member.telefono && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{member.telefono}</span>
                  </div>
                )}
                {/* Instituciones */}
                {member.miembroInstitucions && member.miembroInstitucions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {member.miembroInstitucions.slice(0, 2).map((mi, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded">
                        {mi.institucion?.nombre}
                      </span>
                    ))}
                    {member.miembroInstitucions.length > 2 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        +{member.miembroInstitucions.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer - Acciones */}
              <div className="p-3 border-t bg-gray-50 rounded-b-lg">
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleViewMember(member)}
                      className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                      title="Ver detalle"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => handleEdit(member)}
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
                      onClick={() => toggleStatus(member.id_miembro)}
                      className={`p-2 rounded transition-colors ${
                        member.estado?.nombre === 'ACTIVO' 
                          ? 'text-yellow-600 hover:bg-yellow-50' 
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                      title={member.estado?.nombre === 'ACTIVO' ? 'Inactivar' : 'Activar'}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => handleDelete(member.id_miembro)}
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
            {/* Header */}
            <div className="bg-indigo-600 p-4 rounded-t-lg">
              <h2 className="text-xl font-bold text-white">
                {editingMember ? 'Editar Miembro' : 'Nuevo Miembro'}
              </h2>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombres *</label>
                  <input
                    {...register('nombres', { required: 'Nombres requeridos' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {errors.nombres && <span className="text-red-500 text-xs">{errors.nombres.message}</span>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos *</label>
                  <input
                    {...register('apellidos', { required: 'Apellidos requeridos' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {errors.apellidos && <span className="text-red-500 text-xs">{errors.apellidos.message}</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de nacimiento</label>
                  <input
                    type="date"
                    {...register('fecha_nacimiento')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Género</label>
                  <select {...register('genero')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="">Seleccionar</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado civil</label>
                  <select {...register('estado_civil')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="">Seleccionar</option>
                    <option value="SOLTERO">Soltero</option>
                    <option value="CASADO">Casado</option>
                    <option value="VIUDO">Viudo</option>
                    <option value="DIVORCIADO">Divorciado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RUT</label>
                  <input
                    {...register('rut')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    {...register('telefono')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <input
                  {...register('direccion')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Miembro *</label>
                  <select
                    {...register('id_tipo_miembro', { required: 'Tipo requerido' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Seleccionar</option>
                    {tipos.map(tipo => (
                      <option key={tipo.id_tipo} value={tipo.id_tipo}>{tipo.nombre}</option>
                    ))}
                  </select>
                  {errors.id_tipo_miembro && <span className="text-red-500 text-xs">{errors.id_tipo_miembro.message}</span>}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Instituciones (Ctrl+Click para seleccionar varias)</label>
                <select
                  multiple
                  value={selectedInstituciones}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                    setSelectedInstituciones(selected);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg h-32 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {instituciones.map(inst => (
                    <option key={inst.id_institucion} value={inst.id_institucion}>{inst.nombre}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedInstituciones.length > 0 ? `Seleccionadas: ${selectedInstituciones.length}` : 'Sin instituciones'}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-medium transition-colors">
                  {editingMember ? 'Actualizar' : 'Crear'}
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
      {isDetailModalOpen && viewingMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-indigo-600 p-4 rounded-t-lg">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Detalle del Miembro</h2>
                <button onClick={() => setIsDetailModalOpen(false)} className="text-white hover:text-gray-200 text-2xl">&times;</button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Datos Personales */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold text-lg text-indigo-600 mb-3 border-b pb-2">Datos Personales</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Nombres</p>
                    <p className="font-medium">{viewingMember.nombres}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Apellidos</p>
                    <p className="font-medium">{viewingMember.apellidos}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">RUT</p>
                    <p className="font-medium">{viewingMember.rut || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Fecha de nacimiento</p>
                    <p className="font-medium">{viewingMember.fecha_nacimiento ? new Date(viewingMember.fecha_nacimiento).toLocaleDateString('es-CL') : '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Género</p>
                    <p className="font-medium">{viewingMember.genero === 'M' ? 'Masculino' : viewingMember.genero === 'F' ? 'Femenino' : '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Estado Civil</p>
                    <p className="font-medium">{viewingMember.estado_civil || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Contacto */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold text-lg text-indigo-600 mb-3 border-b pb-2">Contacto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Teléfono</p>
                    <p className="font-medium">{viewingMember.telefono || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-medium">{viewingMember.email || '-'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs text-gray-500">Dirección</p>
                    <p className="font-medium">{viewingMember.direccion || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Información de Miembro */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold text-lg text-indigo-600 mb-3 border-b pb-2">Información de Miembro</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Tipo de Miembro</p>
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {viewingMember.tipoMiembro?.nombre || '-'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Estado</p>
                    <span className={`inline-block px-2 py-1 rounded text-sm ${
                      viewingMember.estado?.nombre === 'ACTIVO' ? 'bg-green-100 text-green-800' : 
                      viewingMember.estado?.nombre === 'INACTIVO' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {viewingMember.estado?.nombre || '-'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Congregación</p>
                    <p className="font-medium">{viewingMember.congregacion?.nombre || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Instituciones */}
              {viewingMember.miembroInstitucions && viewingMember.miembroInstitucions.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-bold text-lg text-indigo-600 mb-3 border-b pb-2">Instituciones</h3>
                  <div className="flex flex-wrap gap-2">
                    {viewingMember.miembroInstitucions.map((mi, idx) => (
                      <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                        {mi.institucion?.nombre}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Relaciones Familiares */}
              {(viewingMember.relacionesOrigen?.length > 0 || viewingMember.relacionesDestino?.length > 0) && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-bold text-lg text-indigo-600 mb-3 border-b pb-2">Relaciones Familiares</h3>
                  <div className="space-y-2">
                    {viewingMember.relacionesOrigen?.map((rel, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="text-gray-600">{rel.tipoRelacion?.nombre}:</span>
                        <span className="font-medium">{rel.miembroDestino?.nombres} {rel.miembroDestino?.apellidos}</span>
                      </div>
                    ))}
                    {viewingMember.relacionesDestino?.map((rel, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="text-gray-600">{rel.tipoRelacion?.nombre}:</span>
                        <span className="font-medium">{rel.miembroOrigen?.nombres} {rel.miembroOrigen?.apellidos}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Historial Espiritual */}
              {viewingMember.historialEspirituals && viewingMember.historialEspirituals.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-bold text-lg text-indigo-600 mb-3 border-b pb-2">Historial Espiritual</h3>
                  <div className="space-y-2">
                    {viewingMember.historialEspirituals.map((he, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                          {he.tipoHito?.nombre}
                        </span>
                        <span className="text-sm text-gray-600">
                          {he.fecha ? new Date(he.fecha).toLocaleDateString('es-CL') : '-'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Visitas Pastorales */}
              {viewingMember.visitaPastorals && viewingMember.visitaPastorals.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-bold text-lg text-indigo-600 mb-3 border-b pb-2">Visitas Pastorales</h3>
                  <div className="space-y-2">
                    {viewingMember.visitaPastorals.slice(0, 5).map((vp, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-white rounded">
                        <div>
                          <span className="font-medium">{vp.pastor?.nombres} {vp.pastor?.apellidos}</span>
                          <span className="text-xs text-gray-500 ml-2">{vp.fecha ? new Date(vp.fecha).toLocaleDateString('es-CL') : ''}</span>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          vp.estado?.nombre === 'COMPLETADA' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {vp.estado?.nombre}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Peticiones de Oración */}
              {viewingMember.peticionOraciones && viewingMember.peticionOraciones.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-bold text-lg text-indigo-600 mb-3 border-b pb-2">Peticiones de Oración</h3>
                  <div className="space-y-2">
                    {viewingMember.peticionOraciones.slice(0, 5).map((po, idx) => (
                      <div key={idx} className="p-2 bg-white rounded">
                        <p className="text-sm">{po.solicitud}</p>
                        <p className="text-xs text-gray-500">{po.fecha ? new Date(po.fecha).toLocaleDateString('es-CL') : ''}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ofrendas y Diezmos */}
              {viewingMember.ofrendaDizmos && viewingMember.ofrendaDizmos.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-bold text-lg text-indigo-600 mb-3 border-b pb-2">Ofrendas y Diezmos</h3>
                  <div className="space-y-1">
                    {viewingMember.ofrendaDizmos.slice(0, 5).map((od, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-600">{od.fecha ? new Date(od.fecha).toLocaleDateString('es-CL') : '-'}</span>
                        <span className="font-medium text-green-600">${od.monto?.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                      <span>Total:</span>
                      <span className="text-green-600">
                        ${viewingMember.ofrendaDizmos.reduce((sum, od) => sum + (od.monto || 0), 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
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