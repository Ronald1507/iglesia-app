import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Award, BookOpen, Calendar, MapPin, RefreshCw, Pencil, Trash2 } from 'lucide-react';
import { useSpiritualStore } from '../store/spiritualStore';

export default function Spiritual() {
  const { hitos, loading, fetchHitos, fetchOpciones, createHito, updateHito, deleteHito, opciones } = useSpiritualStore();
  const { tipos, miembros } = opciones;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHito, setEditingHito] = useState(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchHitos(); }, []);

  const toInputDate = (value) => {
    if (!value) return '';
    return new Date(value).toISOString().split('T')[0];
  };

  const handleOpenModal = async () => {
    setEditingHito(null);
    reset();
    await fetchOpciones();
    setIsModalOpen(true);
  };

  const handleEdit = async (hito) => {
    setEditingHito(hito);
    reset();
    setValue('id_miembro', hito.miembro?.id_miembro);
    setValue('id_tipo_hito', hito.tipoHito?.id_tipo_hito);
    setValue('fecha_hito', toInputDate(hito.fecha_hito));
    setValue('lugar', hito.lugar || '');
    setValue('id_ministro', hito.id_ministro || '');
    setValue('observaciones', hito.observaciones || '');
    setValue('documento_url', hito.documento_url || '');
    await fetchOpciones();
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    toast('¿Estás seguro de eliminar este hito espiritual?', {
      action: {
        label: 'Eliminar',
        onClick: async () => {
          const result = await deleteHito(id);
          if (result.success) {
            toast.success('Hito eliminado correctamente');
          } else {
            toast.error(result.message || 'Error al eliminar');
          }
        },
      },
      description: 'Esta acción no se puede deshacer',
      duration: 5000,
    });
  };

  const onSubmit = async (data) => {
    const payload = {
      id_miembro: parseInt(data.id_miembro),
      id_tipo_hito: parseInt(data.id_tipo_hito),
      fecha_hito: data.fecha_hito,
      lugar: data.lugar || null,
      id_ministro: data.id_ministro ? parseInt(data.id_ministro) : null,
      observaciones: data.observaciones || null,
      documento_url: data.documento_url || null,
    };

    const result = editingHito
      ? await updateHito(editingHito.id_hito, payload)
      : await createHito(payload);

    if (result.success) {
      toast.success(editingHito ? 'Hito actualizado correctamente' : 'Hito creado correctamente');
      setIsModalOpen(false);
      reset();
    } else {
      toast.error(result.message || 'Error al guardar');
    }
  };

  const nombreMiembro = (m) => (m ? `${m.nombres} ${m.apellidos}` : '-');

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <Award className="w-6 h-6" />
          Historial Espiritual
        </h1>
        <button
          onClick={handleOpenModal}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 w-full sm:w-auto flex items-center justify-center gap-2"
        >
          <BookOpen className="w-4 h-4" />
          Agregar Hito
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-2 text-gray-500">Cargando...</p>
        </div>
      ) : hitos.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No hay hitos espirituales registrados</p>
          <button
            onClick={handleOpenModal}
            className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Agregar el primer hito
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hitos.map((hito) => (
            <div key={hito.id_hito} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg truncate">{nombreMiembro(hito.miembro)}</h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 inline-flex items-center gap-1 mt-1">
                      <Award className="w-3 h-3" />
                      {hito.tipoHito?.nombre || '-'}
                    </span>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => handleEdit(hito)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(hito.id_hito)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 text-sm">
                  {hito.fecha_hito && (
                    <div className="flex items-center gap-1 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(hito.fecha_hito).toLocaleDateString('es-CL')}</span>
                    </div>
                  )}
                  {hito.lugar && (
                    <div className="flex items-center gap-1 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{hito.lugar}</span>
                    </div>
                  )}
                </div>

                {hito.observaciones && (
                  <p className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-500 line-clamp-3">
                    {hito.observaciones}
                  </p>
                )}

                {hito.documento_url && (
                  <a
                    href={hito.documento_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
                  >
                    <BookOpen className="w-3 h-3" />
                    Ver documento
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-bold mb-4">
                {editingHito ? 'Editar Hito' : 'Nuevo Hito'}
              </h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Miembro *</label>
                  <select
                    {...register('id_miembro', { required: 'Miembro requerido' })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Seleccionar</option>
                    {miembros.map(m => (
                      <option key={m.id_miembro} value={m.id_miembro}>{m.nombres} {m.apellidos}</option>
                    ))}
                  </select>
                  {errors.id_miembro && <span className="text-red-500 text-sm">{errors.id_miembro.message}</span>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo de Hito *</label>
                    <select
                      {...register('id_tipo_hito', { required: 'Tipo de hito requerido' })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Seleccionar</option>
                      {tipos.map(tipo => (
                        <option key={tipo.id_tipo_hito} value={tipo.id_tipo_hito}>{tipo.nombre}</option>
                      ))}
                    </select>
                    {errors.id_tipo_hito && <span className="text-red-500 text-sm">{errors.id_tipo_hito.message}</span>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha *</label>
                    <input
                      type="date"
                      {...register('fecha_hito', { required: 'Fecha requerida' })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    {errors.fecha_hito && <span className="text-red-500 text-sm">{errors.fecha_hito.message}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Lugar</label>
                    <input
                      {...register('lugar')}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Templo, ciudad, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ministro</label>
                    <select
                      {...register('id_ministro')}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Sin ministro</option>
                      {miembros.map(m => (
                        <option key={m.id_miembro} value={m.id_miembro}>{m.nombres} {m.apellidos}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Observaciones</label>
                  <textarea
                    {...register('observaciones')}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">URL del Documento</label>
                  <input
                    {...register('documento_url')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="https://..."
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 font-medium"
                  >
                    {editingHito ? 'Actualizar' : 'Crear'}
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
    </div>
  );
}
