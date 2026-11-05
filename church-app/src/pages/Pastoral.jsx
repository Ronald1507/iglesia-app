import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { usePastoralStore } from '../store/pastoralStore';
import { toast } from 'sonner';
import { HeartHandshake, HandHeart, Cross, RefreshCw, Calendar, User, Pencil, Trash2 } from 'lucide-react';

export default function Pastoral() {
  const [tab, setTab] = useState('visitas');
  const [isVisitaModalOpen, setIsVisitaModalOpen] = useState(false);
  const [isPeticionModalOpen, setIsPeticionModalOpen] = useState(false);
  const [editingVisita, setEditingVisita] = useState(null);
  const [editingPeticion, setEditingPeticion] = useState(null);

  const {
    visitas,
    peticiones,
    loading,
    opciones,
    fetchVisitas,
    fetchPeticiones,
    fetchOpciones,
    createVisita,
    updateVisita,
    deleteVisita,
    createPeticion,
    updatePeticion,
    deletePeticion,
  } = usePastoralStore();

  const {
    register: registerVisita,
    handleSubmit: handleSubmitVisita,
    reset: resetVisita,
    setValue: setValueVisita,
    formState: { errors: errorsVisita },
  } = useForm();

  const {
    register: registerPeticion,
    handleSubmit: handleSubmitPeticion,
    reset: resetPeticion,
    setValue: setValuePeticion,
    formState: { errors: errorsPeticion },
  } = useForm();

  useEffect(() => {
    if (tab === 'visitas') {
      fetchVisitas();
    } else {
      fetchPeticiones();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // ===== VISITAS =====

  const handleOpenVisitaModal = async () => {
    setEditingVisita(null);
    resetVisita();
    try { await fetchOpciones(); } catch { toast.error('Error al cargar opciones'); }
    setIsVisitaModalOpen(true);
  };

  const handleEditVisita = async (visita) => {
    setEditingVisita(visita);
    setValueVisita('id_miembro', visita.miembro?.id_miembro);
    setValueVisita('id_pastor', visita.pastor?.id_miembro || '');
    setValueVisita('fecha_visita', visita.fecha_visita ? visita.fecha_visita.substring(0, 10) : '');
    setValueVisita('motivo', visita.motivo || '');
    setValueVisita('observaciones', visita.observaciones || '');
    setValueVisita('resultado', visita.resultado || '');
    setValueVisita('id_estado', visita.estado?.id_estado || '');
    try { await fetchOpciones(); } catch { toast.error('Error al cargar opciones'); }
    setIsVisitaModalOpen(true);
  };

  const handleDeleteVisita = async (id) => {
    toast('¿Estás seguro de cancelar esta visita?', {
      action: {
        label: 'Cancelar visita',
        onClick: async () => {
          const result = await deleteVisita(id);
          if (result.success) {
            toast.success('Visita cancelada correctamente');
          } else {
            toast.error(result.message || 'Error al cancelar');
          }
        },
      },
      description: 'La visita quedará marcada como cancelada',
      duration: 5000,
    });
  };

  const onSubmitVisita = async (data) => {
    const payload = {
      id_miembro: parseInt(data.id_miembro),
      id_pastor: data.id_pastor ? parseInt(data.id_pastor) : null,
      fecha_visita: data.fecha_visita || null,
      motivo: data.motivo,
      observaciones: data.observaciones,
      resultado: data.resultado,
      id_estado: data.id_estado ? parseInt(data.id_estado) : null,
    };

    const result = editingVisita
      ? await updateVisita(editingVisita.id_visita, payload)
      : await createVisita(payload);

    if (result.success) {
      toast.success(editingVisita ? 'Visita actualizada correctamente' : 'Visita registrada correctamente');
      setIsVisitaModalOpen(false);
      resetVisita();
    } else {
      toast.error(result.message || 'Error al guardar');
    }
  };

  // ===== PETICIONES =====
  const handleOpenPeticionModal = async () => {
    setEditingPeticion(null);
    resetPeticion();
    try { await fetchOpciones(); } catch { toast.error('Error al cargar opciones'); }
    setIsPeticionModalOpen(true);
  };

  const handleEditPeticion = async (peticion) => {
    setEditingPeticion(peticion);
    setValuePeticion('id_miembro', peticion.miembro?.id_miembro);
    setValuePeticion('descripcion', peticion.descripcion || '');
    setValuePeticion('categoria', peticion.categoria || '');
    setValuePeticion('privacidad', peticion.privacidad || 'privada');
    setValuePeticion('testimonio', peticion.testimonio || '');
    setValuePeticion('fecha_cierre', peticion.fecha_cierre ? peticion.fecha_cierre.substring(0, 10) : '');
    setValuePeticion('id_estado', peticion.estado?.id_estado || '');
    try { await fetchOpciones(); } catch { toast.error('Error al cargar opciones'); }
    setIsPeticionModalOpen(true);
  };

  const handleDeletePeticion = async (id) => {
    toast('¿Estás seguro de cerrar esta petición?', {
      action: {
        label: 'Cerrar petición',
        onClick: async () => {
          const result = await deletePeticion(id);
          if (result.success) {
            toast.success('Petición cerrada correctamente');
          } else {
            toast.error(result.message || 'Error al cerrar');
          }
        },
      },
      description: 'La petición quedará marcada como cerrada',
      duration: 5000,
    });
  };

  const onSubmitPeticion = async (data) => {
    const payload = {
      id_miembro: parseInt(data.id_miembro),
      descripcion: data.descripcion,
      categoria: data.categoria,
      privacidad: data.privacidad || 'privada',
      id_estado: data.id_estado ? parseInt(data.id_estado) : null,
    };

    if (editingPeticion) {
      payload.testimonio = data.testimonio;
      payload.fecha_cierre = data.fecha_cierre || null;
    }

    const result = editingPeticion
      ? await updatePeticion(editingPeticion.id_peticion, payload)
      : await createPeticion(payload);

    if (result.success) {
      toast.success(editingPeticion ? 'Petición actualizada correctamente' : 'Petición registrada correctamente');
      setIsPeticionModalOpen(false);
      resetPeticion();
    } else {
      toast.error(result.message || 'Error al guardar');
    }
  };

  const formatDate = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-CL');
  };

  const fullName = (persona) => {
    if (!persona) return '-';
    return `${persona.nombres || ''} ${persona.apellidos || ''}`.trim() || '-';
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <HeartHandshake className="w-6 h-6" />
          Pastoral
        </h1>
        {tab === 'visitas' ? (
          <button
            onClick={handleOpenVisitaModal}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <HeartHandshake className="w-4 h-4" />
            Agregar Visita
          </button>
        ) : (
          <button
            onClick={handleOpenPeticionModal}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <HandHeart className="w-4 h-4" />
            Agregar Petición
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setTab('visitas')}
          className={`px-4 py-2 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
            tab === 'visitas'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <HeartHandshake className="w-4 h-4" />
          Visitas Pastorales
        </button>
        <button
          onClick={() => setTab('peticiones')}
          className={`px-4 py-2 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
            tab === 'peticiones'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <HandHeart className="w-4 h-4" />
          Peticiones de Oración
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-2 text-gray-500">Cargando...</p>
        </div>
      ) : tab === 'visitas' ? (
        visitas.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <HeartHandshake className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No hay visitas registradas</p>
            <button
              onClick={handleOpenVisitaModal}
              className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Registrar la primera visita
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visitas.map((visita) => (
              <div key={visita.id_visita} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg truncate">{fullName(visita.miembro)}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Pastor: {fullName(visita.pastor)}
                      </p>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={() => handleEditVisita(visita)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteVisita(visita.id_visita)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Cancelar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                    <Calendar className="w-4 h-4" />
                    {formatDate(visita.fecha_visita)}
                  </div>

                  {visita.motivo && (
                    <p className="text-sm text-gray-700"><span className="text-gray-500">Motivo:</span> {visita.motivo}</p>
                  )}
                  {visita.resultado && (
                    <p className="text-sm text-gray-700 mt-1"><span className="text-gray-500">Resultado:</span> {visita.resultado}</p>
                  )}

                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                      {visita.estado?.nombre || '-'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : peticiones.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <HandHeart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No hay peticiones de oración</p>
          <button
            onClick={handleOpenPeticionModal}
            className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Registrar la primera petición
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {peticiones.map((peticion) => (
            <div key={peticion.id_peticion} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg truncate flex items-center gap-2">
                      <Cross className="w-4 h-4 text-indigo-500" />
                      {fullName(peticion.miembro)}
                    </h3>
                    <p className="text-sm text-gray-500">{peticion.categoria || 'Sin categoría'}</p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => handleEditPeticion(peticion)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePeticion(peticion.id_peticion)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Cerrar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {peticion.descripcion && (
                  <p className="text-sm text-gray-700">{peticion.descripcion}</p>
                )}

                <div className="flex flex-wrap gap-2 mt-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(peticion.fecha_solicitud)}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full ${
                    peticion.privacidad === 'publica'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {peticion.privacidad === 'publica' ? 'Pública' : 'Privada'}
                  </span>
                </div>

                {peticion.testimonio && (
                  <div className="mt-2 text-sm text-gray-700">
                    <span className="text-gray-500">Testimonio:</span> {peticion.testimonio}
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                    {peticion.estado?.nombre || '-'}
                  </span>
                  {peticion.fecha_cierre && (
                    <span className="text-xs text-gray-400">Cierre: {formatDate(peticion.fecha_cierre)}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Visita */}
      {isVisitaModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-bold mb-4">
                {editingVisita ? 'Editar Visita' : 'Nueva Visita'}
              </h2>
              <form onSubmit={handleSubmitVisita(onSubmitVisita)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Miembro *</label>
                  <select
                    {...registerVisita('id_miembro', { required: 'Miembro requerido' })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Seleccionar</option>
                    {opciones.miembros.map((m) => (
                      <option key={m.id_miembro} value={m.id_miembro}>{fullName(m)}</option>
                    ))}
                  </select>
                  {errorsVisita.id_miembro && <span className="text-red-500 text-sm">{errorsVisita.id_miembro.message}</span>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Pastor</label>
                    <select
                      {...registerVisita('id_pastor')}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Seleccionar</option>
                      {opciones.miembros.map((m) => (
                        <option key={m.id_miembro} value={m.id_miembro}>{fullName(m)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha de Visita</label>
                    <input
                      type="date"
                      {...registerVisita('fecha_visita')}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Motivo</label>
                  <input
                    {...registerVisita('motivo')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Motivo de la visita"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Observaciones</label>
                  <textarea
                    {...registerVisita('observaciones')}
                    rows={2}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Resultado</label>
                  <textarea
                    {...registerVisita('resultado')}
                    rows={2}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <select
                    {...registerVisita('id_estado')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Seleccionar</option>
                    {opciones.estadosVisita.map((estado) => (
                      <option key={estado.id_estado} value={estado.id_estado}>{estado.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 font-medium"
                  >
                    {editingVisita ? 'Actualizar' : 'Crear'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsVisitaModalOpen(false)}
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

      {/* Modal Petición */}
      {isPeticionModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-bold mb-4">
                {editingPeticion ? 'Editar Petición' : 'Nueva Petición'}
              </h2>
              <form onSubmit={handleSubmitPeticion(onSubmitPeticion)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Miembro *</label>
                  <select
                    {...registerPeticion('id_miembro', { required: 'Miembro requerido' })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Seleccionar</option>
                    {opciones.miembros.map((m) => (
                      <option key={m.id_miembro} value={m.id_miembro}>{fullName(m)}</option>
                    ))}
                  </select>
                  {errorsPeticion.id_miembro && <span className="text-red-500 text-sm">{errorsPeticion.id_miembro.message}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Descripción *</label>
                  <textarea
                    {...registerPeticion('descripcion', { required: 'Descripción requerida' })}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {errorsPeticion.descripcion && <span className="text-red-500 text-sm">{errorsPeticion.descripcion.message}</span>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Categoría</label>
                    <input
                      {...registerPeticion('categoria')}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Salud, Familia, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Privacidad</label>
                    <select
                      {...registerPeticion('privacidad')}
                      defaultValue="privada"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="privada">Privada</option>
                      <option value="publica">Pública</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <select
                    {...registerPeticion('id_estado')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Seleccionar</option>
                    {opciones.estadosPeticion.map((estado) => (
                      <option key={estado.id_estado} value={estado.id_estado}>{estado.nombre}</option>
                    ))}
                  </select>
                </div>

                {editingPeticion && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Testimonio</label>
                      <textarea
                        {...registerPeticion('testimonio')}
                        rows={2}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Fecha de Cierre</label>
                      <input
                        type="date"
                        {...registerPeticion('fecha_cierre')}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 font-medium"
                  >
                    {editingPeticion ? 'Actualizar' : 'Crear'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPeticionModalOpen(false)}
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
    </div>
  );
}
