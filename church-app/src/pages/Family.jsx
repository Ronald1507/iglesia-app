import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Users, Heart, ArrowRight, RefreshCw, Pencil, Trash2 } from 'lucide-react';
import { useFamilyStore } from '../store/familyStore';

export default function Family() {
  const { relaciones, loading, fetchRelaciones, fetchOpciones, createRelacion, updateRelacion, deleteRelacion, opciones } = useFamilyStore();
  const { tipos, miembros } = opciones;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRelacion, setEditingRelacion] = useState(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchRelaciones(); }, []);

  const handleOpenModal = async () => {
    setEditingRelacion(null);
    reset();
    await fetchOpciones();
    setIsModalOpen(true);
  };

  const handleEdit = async (relacion) => {
    setEditingRelacion(relacion);
    reset();
    setValue('id_miembro_origen', relacion.miembroOrigen?.id_miembro);
    setValue('id_miembro_destino', relacion.miembroDestino?.id_miembro);
    setValue('id_tipo_relacion', relacion.tipoRelacion?.id_tipo);
    await fetchOpciones();
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    toast('¿Estás seguro de eliminar esta relación?', {
      action: {
        label: 'Eliminar',
        onClick: async () => {
          const result = await deleteRelacion(id);
          if (result.success) {
            toast.success('Relación eliminada correctamente');
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
    let result;
    if (editingRelacion) {
      result = await updateRelacion(editingRelacion.id, { id_tipo_relacion: parseInt(data.id_tipo_relacion) });
    } else {
      result = await createRelacion({
        id_miembro_origen: parseInt(data.id_miembro_origen),
        id_miembro_destino: parseInt(data.id_miembro_destino),
        id_tipo_relacion: parseInt(data.id_tipo_relacion),
      });
    }

    if (result.success) {
      toast.success(editingRelacion ? 'Relación actualizada correctamente' : 'Relación creada correctamente');
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
          <Users className="w-6 h-6" />
          Relaciones Familiares
        </h1>
        <button
          onClick={handleOpenModal}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 w-full sm:w-auto flex items-center justify-center gap-2"
        >
          <Heart className="w-4 h-4" />
          Agregar Relación
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-2 text-gray-500">Cargando...</p>
        </div>
      ) : relaciones.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No hay relaciones familiares registradas</p>
          <button
            onClick={handleOpenModal}
            className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Agregar la primera relación
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {relaciones.map((relacion) => (
            <div key={relacion.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    {relacion.tipoRelacion?.nombre || '-'}
                  </span>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => handleEdit(relacion)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(relacion.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-800">{nombreMiembro(relacion.miembroOrigen)}</span>
                  <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="font-medium text-gray-800">{nombreMiembro(relacion.miembroDestino)}</span>
                </div>

                {relacion.fecha_registro && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-400">
                      Registrado el {new Date(relacion.fecha_registro).toLocaleDateString('es-CL')}
                    </span>
                  </div>
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
                {editingRelacion ? 'Editar Relación' : 'Nueva Relación'}
              </h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Miembro Origen *</label>
                  <select
                    {...register('id_miembro_origen', { required: 'Miembro origen requerido' })}
                    disabled={!!editingRelacion}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
                  >
                    <option value="">Seleccionar</option>
                    {miembros.map(m => (
                      <option key={m.id_miembro} value={m.id_miembro}>{m.nombres} {m.apellidos}</option>
                    ))}
                  </select>
                  {errors.id_miembro_origen && <span className="text-red-500 text-sm">{errors.id_miembro_origen.message}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Miembro Destino *</label>
                  <select
                    {...register('id_miembro_destino', { required: 'Miembro destino requerido' })}
                    disabled={!!editingRelacion}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
                  >
                    <option value="">Seleccionar</option>
                    {miembros.map(m => (
                      <option key={m.id_miembro} value={m.id_miembro}>{m.nombres} {m.apellidos}</option>
                    ))}
                  </select>
                  {errors.id_miembro_destino && <span className="text-red-500 text-sm">{errors.id_miembro_destino.message}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo de Relación *</label>
                  <select
                    {...register('id_tipo_relacion', { required: 'Tipo de relación requerido' })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Seleccionar</option>
                    {tipos.map(tipo => (
                      <option key={tipo.id_tipo} value={tipo.id_tipo}>{tipo.nombre}</option>
                    ))}
                  </select>
                  {errors.id_tipo_relacion && <span className="text-red-500 text-sm">{errors.id_tipo_relacion.message}</span>}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 font-medium"
                  >
                    {editingRelacion ? 'Actualizar' : 'Crear'}
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
