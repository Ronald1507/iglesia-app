import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { FileText, FileBadge, User, Calendar, Hash, ExternalLink, Pencil, Trash2, RefreshCw, Plus } from 'lucide-react';
import { useDocumentStore } from '../store/documentStore';

const TIPOS_DOCUMENTO = [
  'CERTIFICADO_BAUTISMO',
  'CERTIFICADO_MATRIMONIO',
  'CARTA_TRASLADO',
  'CONSTANCIA',
  'OTRO',
];

export default function Documents() {
  const { documentos, loading, fetchDocumentos, fetchOpciones, createDocumento, updateDocumento, deleteDocumento, opciones } = useDocumentStore();
  const { estados, miembros } = opciones;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchDocumentos(); }, []);

  const handleOpenModal = async () => {
    setEditingDoc(null);
    reset();
    await fetchOpciones();
    setIsModalOpen(true);
  };

  const handleEdit = async (doc) => {
    setEditingDoc(doc);
    setValue('id_miembro', doc.miembro?.id_miembro);
    setValue('tipo_documento', doc.tipo_documento);
    setValue('numero_serie', doc.numero_serie || '');
    setValue('fecha_emision', doc.fecha_emision ? doc.fecha_emision.split('T')[0] : '');
    setValue('archivo_url', doc.archivo_url || '');
    setValue('id_estado', doc.estado?.id_estado);
    await fetchOpciones();
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    toast('¿Estás seguro de anular este documento?', {
      action: {
        label: 'Anular',
        onClick: async () => {
          const result = await deleteDocumento(id);
          if (result.success) {
            toast.success('Documento anulado correctamente');
          } else {
            toast.error(result.message || 'Error al anular');
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
      tipo_documento: data.tipo_documento,
      numero_serie: data.numero_serie || null,
      fecha_emision: data.fecha_emision || null,
      archivo_url: data.archivo_url || null,
    };
    if (data.id_estado) {
      payload.id_estado = parseInt(data.id_estado);
    }

    const result = editingDoc
      ? await updateDocumento(editingDoc.id_documento, payload)
      : await createDocumento(payload);

    if (result.success) {
      toast.success(editingDoc ? 'Documento actualizado correctamente' : 'Documento creado correctamente');
      setIsModalOpen(false);
      reset();
    } else {
      toast.error(result.message || 'Error al guardar');
    }
  };

  const formatTipo = (tipo) => (tipo ? tipo.replace(/_/g, ' ') : '-');

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6" />
          Documentos
        </h1>
        <button
          onClick={handleOpenModal}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 w-full sm:w-auto flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Agregar Documento
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-2 text-gray-500">Cargando...</p>
        </div>
      ) : documentos.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No hay documentos registrados</p>
          <button
            onClick={handleOpenModal}
            className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Agregar el primer documento
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documentos.map((doc) => (
            <div key={doc.id_documento} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg flex items-center gap-1">
                      <FileBadge className="w-4 h-4 text-indigo-600" />
                      <span className="truncate">{formatTipo(doc.tipo_documento)}</span>
                    </h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {doc.miembro ? `${doc.miembro.nombres} ${doc.miembro.apellidos}` : '-'}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => handleEdit(doc)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id_documento)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Anular"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2 text-sm">
                  {doc.numero_serie && (
                    <div className="flex items-center gap-1 text-gray-600">
                      <Hash className="w-4 h-4" />
                      <span className="font-medium">{doc.numero_serie}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{doc.fecha_emision ? new Date(doc.fecha_emision).toLocaleDateString('es-CL') : '-'}</span>
                  </div>
                  {doc.archivo_url && (
                    <a
                      href={doc.archivo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Ver archivo
                    </a>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    doc.estado?.nombre === 'Activo' || doc.estado?.nombre === 'Vigente'
                      ? 'bg-green-100 text-green-700'
                      : doc.estado?.nombre === 'Anulado'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {doc.estado?.nombre || '-'}
                  </span>
                </div>
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
                {editingDoc ? 'Editar Documento' : 'Nuevo Documento'}
              </h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Miembro *</label>
                  <select
                    {...register('id_miembro', { required: 'Miembro requerido' })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Seleccionar</option>
                    {miembros.map((m) => (
                      <option key={m.id_miembro} value={m.id_miembro}>{m.nombres} {m.apellidos}</option>
                    ))}
                  </select>
                  {errors.id_miembro && <span className="text-red-500 text-sm">{errors.id_miembro.message}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo de Documento *</label>
                  <select
                    {...register('tipo_documento', { required: 'Tipo requerido' })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Seleccionar</option>
                    {TIPOS_DOCUMENTO.map((t) => (
                      <option key={t} value={t}>{formatTipo(t)}</option>
                    ))}
                  </select>
                  {errors.tipo_documento && <span className="text-red-500 text-sm">{errors.tipo_documento.message}</span>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Número de Serie</label>
                    <input
                      {...register('numero_serie')}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="N° 001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha de Emisión</label>
                    <input
                      type="date"
                      {...register('fecha_emision')}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">URL del Archivo</label>
                  <input
                    {...register('archivo_url')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="https://..."
                  />
                </div>

                {estados.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estado</label>
                    <select
                      {...register('id_estado')}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Seleccionar</option>
                      {estados.map((estado) => (
                        <option key={estado.id_estado} value={estado.id_estado}>{estado.nombre}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 font-medium"
                  >
                    {editingDoc ? 'Actualizar' : 'Crear'}
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
