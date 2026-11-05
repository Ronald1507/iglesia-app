import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Repeat } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';

export default function Events() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [estados, setEstados] = useState([]);
  const [congregaciones, setCongregaciones] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [viewingEvent, setViewingEvent] = useState(null);

  // Gestión de asistencia y servicios
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [managingEvent, setManagingEvent] = useState(null);
  const [manageTab, setManageTab] = useState('asistencia');
  const [asistencia, setAsistencia] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [miembros, setMiembros] = useState([]);
  const [rolesServicio, setRolesServicio] = useState([]);
  const [asistMiembro, setAsistMiembro] = useState('');
  const [asistTipo, setAsistTipo] = useState('presencial');
  const [servMiembro, setServMiembro] = useState('');
  const [servRol, setServRol] = useState('');
  const [servObs, setServObs] = useState('');

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();

  const [generarModal, setGenerarModal] = useState({ open: false, evento: null, fechaFin: '', loading: false });
  const openGenerarModal = (evento) => setGenerarModal({ open: true, evento, fechaFin: '', loading: false });

  useEffect(() => {
    fetchEventos();
  }, []);

  // Fetch eventos
  const fetchEventos = async () => {
    setLoading(true);
    try {
      const response = await api.get('/eventos');
      const data = response.data?.success ? response.data.data : [];
      setEventos(data);
    } catch (error) {
      console.error('Error fetching eventos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch eventos by estado
  const fetchEventosByEstado = async (idEstado) => {
    setLoading(true);
    setFiltroEstado(idEstado);
    try {
      const response = await api.get(`/eventos/estado/${idEstado}`);
      const data = response.data?.success ? response.data.data : [];
      setEventos(data);
    } catch (error) {
      console.error('Error fetching eventos by estado:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar opciones
  const loadOpciones = async () => {
    try {
      const [estadosRes, congregacionesRes, tiposRes] = await Promise.all([
        api.get('/eventos/listado/estados'),
        api.get('/eventos/listado/congregaciones'),
        api.get('/eventos/listado/tipos')
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
    setEditingEvent(null);
    reset();
    await loadOpciones();
    setIsModalOpen(true);
  };

  // Editar evento
  const handleEdit = async (event) => {
    setEditingEvent(event);
    Object.keys(event).forEach(key => {
      if (key !== 'congregacion' && key !== 'estado') {
        setValue(key, event[key] || '');
      }
    });
    setValue('id_estado', event.id_estado);
    setValue('id_congregacion', event.id_congregacion);
    setValue('recurrencia_tipo', event.recurrencia_tipo || '');
    setValue('recurrencia_dia_sem', event.recurrencia_dia_sem ?? 0);

    await loadOpciones();
    setIsModalOpen(true);
  };

  // Ver detalle del evento
  const handleViewEvent = async (event) => {
    try {
      const response = await api.get(`/eventos/${event.id_evento}`);
      const eventData = response.data?.success ? response.data.data : null;
      setViewingEvent(eventData);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error('Error fetching event details:', error);
    }
  };

  // ============================================
  // Gestión de asistencia y servicios
  // ============================================
  const fetchAsistencia = async (idEvento) => {
    try {
      const res = await api.get(`/eventos/${idEvento}/asistencia`);
      setAsistencia(res.data?.success ? res.data.data : []);
    } catch (error) {
      console.error('Error fetching asistencia:', error);
    }
  };

  const fetchServicios = async (idEvento) => {
    try {
      const res = await api.get(`/eventos/${idEvento}/servicios`);
      setServicios(res.data?.success ? res.data.data : []);
    } catch (error) {
      console.error('Error fetching servicios:', error);
    }
  };

  const handleManage = async (event) => {
    setManagingEvent(event);
    setManageTab('asistencia');
    setAsistMiembro('');
    setAsistTipo('presencial');
    setServMiembro('');
    setServRol('');
    setServObs('');
    setIsManageOpen(true);
    try {
      const [miembrosRes, rolesRes] = await Promise.all([
        api.get('/eventos/listado/miembros'),
        api.get('/eventos/listado/roles-servicio')
      ]);
      setMiembros(miembrosRes.data?.success ? miembrosRes.data.data : []);
      setRolesServicio(rolesRes.data?.success ? rolesRes.data.data : []);
    } catch (error) {
      console.error('Error loading opciones de gestión:', error);
      toast.error('Error al cargar opciones');
    }
    await Promise.all([fetchAsistencia(event.id_evento), fetchServicios(event.id_evento)]);
  };

  const handleAddAsistencia = async () => {
    if (!asistMiembro) { toast.error('Selecciona un miembro'); return; }
    try {
      const res = await api.post(`/eventos/${managingEvent.id_evento}/asistencia`, {
        id_miembro: parseInt(asistMiembro),
        tipo_registro: asistTipo,
      });
      if (res.data?.success) {
        toast.success('Asistencia registrada');
        setAsistMiembro('');
        fetchAsistencia(managingEvent.id_evento);
      } else {
        toast.error(res.data?.mensaje || 'Error al registrar');
      }
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al registrar asistencia');
    }
  };

  const handleRemoveAsistencia = async (idMiembro) => {
    try {
      const res = await api.delete(`/eventos/${managingEvent.id_evento}/asistencia/${idMiembro}`);
      if (res.data?.success) {
        toast.success('Asistencia eliminada');
        fetchAsistencia(managingEvent.id_evento);
      } else {
        toast.error(res.data?.mensaje || 'Error al eliminar');
      }
    } catch (_error) {
      toast.error('Error al eliminar asistencia');
    }
  };

  const handleAddServicio = async () => {
    if (!servMiembro || !servRol) { toast.error('Selecciona miembro y rol'); return; }
    try {
      const res = await api.post(`/eventos/${managingEvent.id_evento}/servicios`, {
        id_miembro: parseInt(servMiembro),
        id_rol: parseInt(servRol),
        observaciones: servObs || null,
      });
      if (res.data?.success) {
        toast.success('Servicio asignado');
        setServMiembro('');
        setServRol('');
        setServObs('');
        fetchServicios(managingEvent.id_evento);
      } else {
        toast.error(res.data?.mensaje || 'Error al asignar');
      }
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al asignar servicio');
    }
  };

  const handleRemoveServicio = async (idServicio) => {
    try {
      const res = await api.delete(`/eventos/${managingEvent.id_evento}/servicios/${idServicio}`);
      if (res.data?.success) {
        toast.success('Servicio eliminado');
        fetchServicios(managingEvent.id_evento);
      } else {
        toast.error(res.data?.mensaje || 'Error al eliminar');
      }
    } catch (_error) {
      toast.error('Error al eliminar servicio');
    }
  };

  // Eliminar evento
  const handleDelete = async (id) => {
    toast('¿Estás seguro de eliminar este evento?', {
      action: {
        label: 'Eliminar',
        onClick: async () => {
          try {
            const response = await api.delete(`/eventos/${id}`);
            if (response.data?.success) {
              toast.success('Evento eliminado correctamente');
              fetchEventos();
            } else {
              toast.error(response.data?.mensaje || 'Error al eliminar');
            }
          } catch (_error) {
            toast.error('Error al eliminar evento');
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
      capacidad_max: data.capacidad_max ? parseInt(data.capacidad_max) : null,
      recurrencia_tipo: data.recurrencia_tipo || null,
      recurrencia_dia_sem: data.recurrencia_tipo === 'SEMANAL' ? parseInt(data.recurrencia_dia_sem) : null,
    };

    try {
      let result;
      if (editingEvent) {
        const response = await api.put(`/eventos/${editingEvent.id_evento}`, payload);
        result = response.data;
      } else {
        const response = await api.post('/eventos', payload);
        result = response.data;
      }

      if (result?.success) {
        toast.success(editingEvent ? 'Evento actualizado correctamente' : 'Evento creado correctamente');
        setIsModalOpen(false);
        fetchEventos();
      } else {
        toast.error(result?.mensaje || 'Error al guardar');
      }
    } catch (_error) {
      toast.error('Error al guardar evento');
    }
  };

  // Toggle status
  const toggleStatus = async (id) => {
    try {
      const response = await api.patch(`/eventos/${id}/status`);
      if (response.data?.success) {
        toast.success(response.data.mensaje);
        fetchEventos();
      }
    } catch (_error) {
      toast.error('Error al cambiar estado');
    }
  };

  const handleGenerarRecurrencias = async () => {
    setGenerarModal(prev => ({ ...prev, loading: true }));
    try {
      const response = await api.post(`/eventos/${generarModal.evento.id_evento}/generar-recurrencias`, {
        fecha_fin: generarModal.fechaFin,
      });
      if (response.data?.success) {
        toast.success(`Se generaron ${response.data.data.generados} eventos`);
        setGenerarModal({ open: false, evento: null, fechaFin: '', loading: false });
        fetchEventos();
      } else {
        toast.error(response.data?.mensaje || 'Error al generar');
        setGenerarModal(prev => ({ ...prev, loading: false }));
      }
    } catch (_error) {
      toast.error('Error al generar ocurrencias');
      setGenerarModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Helper para nombre de tipo
  const getTipoNombre = (tipoId) => {
    const tipo = tipos.find(t => t.id === tipoId);
    return tipo ? tipo.nombre : tipoId;
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('es-CL');
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Eventos</h1>
          <p className="text-sm text-gray-500">{eventos.length} registros</p>
        </div>
        <button
          onClick={handleOpenModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 shadow-md transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Evento
        </button>
      </div>

      {/* Filtro por estado */}
      {estados.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Filtrar por estado:</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setFiltroEstado(null); fetchEventos(); }}
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
                onClick={() => fetchEventosByEstado(estado.id_estado)}
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

      {/* Lista de eventos */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : eventos.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500 text-lg">
            {filtroEstado ? 'No hay eventos con el estado seleccionado' : 'No hay eventos registrados'}
          </p>
          <button onClick={handleOpenModal} className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium">
            Agregar el primer evento
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {eventos.map((event) => (
            <div key={event.id_evento} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              {/* Card Header */}
              <div className="p-4 border-b bg-gray-50 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800 text-lg">{event.nombre}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm text-gray-500">{getTipoNombre(event.tipo)}</p>
                      {event.recurrencia_tipo && (
                        <span className="px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-700">
                          🔁 {event.recurrencia_tipo.charAt(0) + event.recurrencia_tipo.slice(1).toLowerCase()}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    event.estado?.nombre === 'ACTIVO' || event.estado?.nombre === 'PROGRAMADO'
                      ? 'bg-green-100 text-green-700' : 
                      event.estado?.nombre === 'CANCELADO'
                      ? 'bg-red-100 text-red-700' : 
                      'bg-gray-100 text-gray-600'
                  }`}>
                    {event.estado?.nombre}
                  </span>
                </div>
              </div>
              
              {/* Card Body */}
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{formatDate(event.fecha_inicio)}</span>
                </div>
                {event.lugar && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{event.lugar}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>{event.congregacion?.nombre || 'Sin congregación'}</span>
                </div>
                {event.capacidad_max && (
                  <div className="flex items-center gap-2 text-sm text-indigo-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="font-medium">{event.asistencia?.length || 0} / {event.capacidad_max} asistentes</span>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="p-3 border-t bg-gray-50 rounded-b-lg">
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleViewEvent(event)}
                      className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                      title="Ver detalle"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => handleEdit(event)}
                      className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                      title="Editar"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleManage(event)}
                      className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                      title="Asistencia y servicios"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                    {event.recurrencia_tipo && (
                      <button
                        onClick={() => openGenerarModal(event)}
                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                        title="Generar ocurrencias"
                      >
                        <Repeat className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => toggleStatus(event.id_evento)}
                      className={`p-2 rounded transition-colors ${
                        event.estado?.nombre === 'ACTIVO' || event.estado?.nombre === 'PROGRAMADO'
                          ? 'text-yellow-600 hover:bg-yellow-50' 
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                      title={event.estado?.nombre === 'ACTIVO' || event.estado?.nombre === 'PROGRAMADO' ? 'Inactivar' : 'Activar'}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => handleDelete(event.id_evento)}
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
                {editingEvent ? 'Editar Evento' : 'Nuevo Evento'}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad máxima</label>
                  <input
                    type="number"
                    {...register('capacidad_max')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Sin límite"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  {...register('descripcion')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio *</label>
                  <input
                    type="datetime-local"
                    {...register('fecha_inicio', { required: 'Fecha requerida' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {errors.fecha_inicio && <span className="text-red-500 text-xs">{errors.fecha_inicio.message}</span>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
                  <input
                    type="datetime-local"
                    {...register('fecha_fin')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lugar</label>
                <input
                  {...register('lugar')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              {/* Recurrencia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recurrencia</label>
                <select
                  {...register('recurrencia_tipo')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Ninguna</option>
                  <option value="DIARIA">Diaria</option>
                  <option value="SEMANAL">Semanal</option>
                  <option value="MENSUAL">Mensual</option>
                </select>
              </div>

              {watch('recurrencia_tipo') === 'SEMANAL' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Día de la semana</label>
                  <select
                    {...register('recurrencia_dia_sem')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value={0}>Domingo</option>
                    <option value={1}>Lunes</option>
                    <option value={2}>Martes</option>
                    <option value={3}>Miércoles</option>
                    <option value={4}>Jueves</option>
                    <option value={5}>Viernes</option>
                    <option value={6}>Sábado</option>
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-medium transition-colors">
                  {editingEvent ? 'Actualizar' : 'Crear'}
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
      {isDetailModalOpen && viewingEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="bg-indigo-600 p-4 rounded-t-lg">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Detalle del Evento</h2>
                <button onClick={() => setIsDetailModalOpen(false)} className="text-white hover:text-gray-200 text-2xl">&times;</button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold text-lg text-indigo-600 mb-3 border-b pb-2">Datos del Evento</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Nombre</p>
                    <p className="font-medium">{viewingEvent.nombre}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tipo</p>
                    <p className="font-medium">{getTipoNombre(viewingEvent.tipo)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Estado</p>
                    <span className={`inline-block px-2 py-1 rounded text-sm ${
                      viewingEvent.estado?.nombre === 'ACTIVO' || viewingEvent.estado?.nombre === 'PROGRAMADO'
                        ? 'bg-green-100 text-green-800' : 
                        viewingEvent.estado?.nombre === 'CANCELADO'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {viewingEvent.estado?.nombre}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Fecha inicio</p>
                    <p className="font-medium">{formatDate(viewingEvent.fecha_inicio)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Fecha fin</p>
                    <p className="font-medium">{formatDate(viewingEvent.fecha_fin)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Capacidad</p>
                    <p className="font-medium">{viewingEvent.capacidad_max || 'Sin límite'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Descripción</p>
                    <p className="font-medium">{viewingEvent.descripcion || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Lugar</p>
                    <p className="font-medium">{viewingEvent.lugar || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Congregación</p>
                    <p className="font-medium">{viewingEvent.congregacion?.nombre || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3 border-b pb-2">
                  <h3 className="font-bold text-lg text-indigo-600">Asistencia</h3>
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                    {viewingEvent.asistencia?.length || 0}
                  </span>
                </div>
                {viewingEvent.asistencia && viewingEvent.asistencia.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {viewingEvent.asistencia.map((asist, idx) => (
                      <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        {asist.miembro?.nombres} {asist.miembro?.apellidos}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No hay asistencia registrada</p>
                )}
              </div>
            </div>

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

      {/* Modal de gestión (asistencia + servicios) */}
      {isManageOpen && managingEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="bg-indigo-600 p-4 rounded-t-lg flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">Gestión del Evento</h2>
                <p className="text-indigo-100 text-sm">{managingEvent.nombre}</p>
              </div>
              <button onClick={() => setIsManageOpen(false)} className="text-white hover:text-gray-200 text-2xl">&times;</button>
            </div>

            {/* Tabs */}
            <div className="flex border-b">
              <button
                onClick={() => setManageTab('asistencia')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  manageTab === 'asistencia' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Asistencia ({asistencia.length})
              </button>
              <button
                onClick={() => setManageTab('servicios')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  manageTab === 'servicios' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Servicios / Equipo ({servicios.length})
              </button>
            </div>

            <div className="p-6">
              {manageTab === 'asistencia' ? (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={asistMiembro}
                      onChange={(e) => setAsistMiembro(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Seleccionar miembro</option>
                      {miembros.map((m) => (
                        <option key={m.id_miembro} value={m.id_miembro}>{m.nombres} {m.apellidos}</option>
                      ))}
                    </select>
                    <select
                      value={asistTipo}
                      onChange={(e) => setAsistTipo(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="presencial">Presencial</option>
                      <option value="online">Online</option>
                    </select>
                    <button onClick={handleAddAsistencia} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium">
                      Registrar
                    </button>
                  </div>

                  {asistencia.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-6">No hay asistencia registrada</p>
                  ) : (
                    <div className="space-y-2">
                      {asistencia.map((a) => (
                        <div key={a.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div>
                            <span className="font-medium">{a.miembro?.nombres} {a.miembro?.apellidos}</span>
                            <span className="ml-2 text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">{a.tipo_registro}</span>
                          </div>
                          <button onClick={() => handleRemoveAsistencia(a.miembro?.id_miembro)} className="text-red-500 hover:text-red-700 text-sm">
                            Quitar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      value={servMiembro}
                      onChange={(e) => setServMiembro(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Seleccionar miembro</option>
                      {miembros.map((m) => (
                        <option key={m.id_miembro} value={m.id_miembro}>{m.nombres} {m.apellidos}</option>
                      ))}
                    </select>
                    <select
                      value={servRol}
                      onChange={(e) => setServRol(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Seleccionar rol</option>
                      {rolesServicio.map((r) => (
                        <option key={r.id_rol} value={r.id_rol}>{r.nombre}</option>
                      ))}
                    </select>
                    <input
                      value={servObs}
                      onChange={(e) => setServObs(e.target.value)}
                      placeholder="Observaciones (opcional)"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 sm:col-span-1"
                    />
                    <button onClick={handleAddServicio} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium">
                      Asignar
                    </button>
                  </div>

                  {servicios.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-6">No hay servicios asignados</p>
                  ) : (
                    <div className="space-y-2">
                      {servicios.map((s) => (
                        <div key={s.id_servicio} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div>
                            <span className="font-medium">{s.miembro?.nombres} {s.miembro?.apellidos}</span>
                            <span className="ml-2 text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">{s.rol?.nombre}</span>
                            {s.observaciones && <span className="ml-2 text-xs text-gray-500">{s.observaciones}</span>}
                          </div>
                          <button onClick={() => handleRemoveServicio(s.id_servicio)} className="text-red-500 hover:text-red-700 text-sm">
                            Quitar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50 rounded-b-lg flex justify-end">
              <button onClick={() => setIsManageOpen(false)} className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal generar ocurrencias */}
      {generarModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold mb-4">Generar ocurrencias</h3>
            <p className="text-sm text-gray-600 mb-4">
              Evento: <strong>{generarModal.evento?.nombre}</strong>
              {' '}({generarModal.evento?.recurrencia_tipo?.toLowerCase()})
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha límite</label>
              <input
                type="date"
                value={generarModal.fechaFin}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setGenerarModal(prev => ({ ...prev, fechaFin: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleGenerarRecurrencias}
                disabled={!generarModal.fechaFin || generarModal.loading}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-2 rounded-lg font-medium"
              >
                {generarModal.loading ? 'Generando...' : 'Generar'}
              </button>
              <button
                onClick={() => setGenerarModal({ open: false, evento: null, fechaFin: '', loading: false })}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}