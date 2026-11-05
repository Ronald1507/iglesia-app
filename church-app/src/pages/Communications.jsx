import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useCommunicationsStore } from '../store/communicationsStore';
import { toast } from 'sonner';
import { MessageSquare, Send, Megaphone, RefreshCw, Calendar, Pencil, Trash2 } from 'lucide-react';

const CANALES = ['EMAIL', 'SMS', 'WHATSAPP', 'INTERNO'];
const DESTINATARIOS = ['CONGREGACION', 'INSTITUCION', 'TODOS'];

export default function Communications() {
  const { comunicaciones, loading, opciones, fetchComunicaciones, fetchOpciones, createComunicacion, updateComunicacion, deleteComunicacion, enviarComunicacion } = useCommunicationsStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();

  const destinatarioTipo = watch('destinatario_tipo');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchComunicaciones(); }, []);

  // Abrir modal para crear
  const handleOpenModal = async () => {
    setEditingItem(null);
    reset();
    await fetchOpciones();
    setIsModalOpen(true);
  };

  // Editar
  const handleEdit = async (item) => {
    setEditingItem(item);
    setValue('asunto', item.asunto || '');
    setValue('mensaje', item.mensaje || '');
    setValue('canal', item.canal || 'EMAIL');
    setValue('destinatario_tipo', item.destinatario_tipo || 'TODOS');
    setValue('id_institucion', item.institucion?.id_institucion || '');
    setValue('id_estado', item.estado?.id_estado || '');
    await fetchOpciones();
    setIsModalOpen(true);
  };

  // Enviar
  const handleEnviar = async (id) => {
    const result = await enviarComunicacion(id);
    if (result.success) {
      toast.success('Comunicación enviada correctamente');
    } else {
      toast.error(result.message || 'Error al enviar');
    }
  };

  // Anular
  const handleDelete = async (id) => {
    toast('¿Estás seguro de anular esta comunicación?', {
      action: {
        label: 'Anular',
        onClick: async () => {
          const result = await deleteComunicacion(id);
          if (result.success) {
            toast.success('Comunicación anulada correctamente');
          } else {
            toast.error(result.message || 'Error al anular');
          }
        },
      },
      description: 'La comunicación quedará marcada como anulada',
      duration: 5000,
    });
  };

  // Submit
  const onSubmit = async (data) => {
    const payload = {
      asunto: data.asunto,
      mensaje: data.mensaje,
      canal: data.canal,
      destinatario_tipo: data.destinatario_tipo,
    };

    if (data.destinatario_tipo === 'INSTITUCION' && data.id_institucion) {
      payload.id_institucion = parseInt(data.id_institucion);
    }
    if (data.id_estado) {
      payload.id_estado = parseInt(data.id_estado);
    }

    const result = editingItem
      ? await updateComunicacion(editingItem.id_comunicacion, payload)
      : await createComunicacion(payload);

    if (result.success) {
      toast.success(editingItem ? 'Comunicación actualizada correctamente' : 'Comunicación creada correctamente');
      setIsModalOpen(false);
      reset();
    } else {
      toast.error(result.message || 'Error al guardar');
    }
  };

  const formatDate = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-CL');
  };

  const destinatarioLabel = (item) => {
    if (item.destinatario_tipo === 'INSTITUCION') {
      return item.institucion?.nombre || 'Institución';
    }
    if (item.destinatario_tipo === 'CONGREGACION') {
      return item.congregacion?.nombre || 'Congregación';
    }
    return 'Todos';
  };

  const isBorrador = (item) => {
    const nombre = (item.estado?.nombre || '').toLowerCase();
    return nombre.includes('borrador');
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="w-6 h-6" />
          Comunicaciones
        </h1>
        <button
          onClick={handleOpenModal}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 w-full sm:w-auto flex items-center justify-center gap-2"
        >
          <Megaphone className="w-4 h-4" />
          Agregar Comunicación
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-2 text-gray-500">Cargando...</p>
        </div>
      ) : comunicaciones.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No hay comunicaciones registradas</p>
          <button
            onClick={handleOpenModal}
            className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Crear la primera comunicación
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {comunicaciones.map((item) => (
            <div key={item.id_comunicacion} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg truncate">{item.asunto}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {item.canal}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    {isBorrador(item) && (
                      <button
                        onClick={() => handleEnviar(item.id_comunicacion)}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Enviar"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id_comunicacion)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Anular"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {item.mensaje && (
                  <p className="text-sm text-gray-700 line-clamp-3">{item.mensaje}</p>
                )}

                <div className="flex flex-wrap gap-2 mt-3 text-xs text-gray-500">
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                    {destinatarioLabel(item)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(item.fecha_envio)}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                    {item.estado?.nombre || '-'}
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
                {editingItem ? 'Editar Comunicación' : 'Nueva Comunicación'}
              </h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Asunto *</label>
                  <input
                    {...register('asunto', { required: 'Asunto requerido' })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {errors.asunto && <span className="text-red-500 text-sm">{errors.asunto.message}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Mensaje *</label>
                  <textarea
                    {...register('mensaje', { required: 'Mensaje requerido' })}
                    rows={4}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {errors.mensaje && <span className="text-red-500 text-sm">{errors.mensaje.message}</span>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Canal *</label>
                    <select
                      {...register('canal', { required: 'Canal requerido' })}
                      defaultValue="EMAIL"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {CANALES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    {errors.canal && <span className="text-red-500 text-sm">{errors.canal.message}</span>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Destinatario *</label>
                    <select
                      {...register('destinatario_tipo', { required: 'Destinatario requerido' })}
                      defaultValue="TODOS"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {DESTINATARIOS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    {errors.destinatario_tipo && <span className="text-red-500 text-sm">{errors.destinatario_tipo.message}</span>}
                  </div>
                </div>

                {destinatarioTipo === 'INSTITUCION' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Institución</label>
                    <select
                      {...register('id_institucion')}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Seleccionar</option>
                      {opciones.instituciones.map((inst) => (
                        <option key={inst.id_institucion} value={inst.id_institucion}>{inst.nombre}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <select
                    {...register('id_estado')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Seleccionar</option>
                    {opciones.estados.map((estado) => (
                      <option key={estado.id_estado} value={estado.id_estado}>{estado.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 font-medium"
                  >
                    {editingItem ? 'Actualizar' : 'Crear'}
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
