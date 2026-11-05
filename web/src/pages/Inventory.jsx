import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { toast } from 'sonner';
import { Package, MapPin, Tag, Box, DollarSign, MapPinned, RefreshCw, Eye } from 'lucide-react';

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [estados, setEstados] = useState([]);
  const [congregaciones, setCongregaciones] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  // Cargar items al inicio
  useEffect(() => {
    fetchItems();
  }, []);

  // Fetch items
  const fetchItems = async () => {
    setLoading(true);
    setFiltroEstado(null);
    try {
      const response = await api.get('/inventario');
      const data = response.data?.success ? response.data.data : [];
      setItems(data);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch items by estado
  const fetchItemsByEstado = async (idEstado) => {
    setLoading(true);
    setFiltroEstado(idEstado);
    try {
      const response = await api.get(`/inventario/estado/${idEstado}`);
      const data = response.data?.success ? response.data.data : [];
      setItems(data);
    } catch (error) {
      console.error('Error fetching items by estado:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar opciones
  const loadOpciones = async () => {
    try {
      const [estadosRes, congregacionesRes] = await Promise.all([
        api.get('/inventario/listado/estados'),
        api.get('/inventario/listado/congregaciones')
      ]);
      
      setEstados(estadosRes.data?.success ? estadosRes.data.data : []);
      setCongregaciones(congregacionesRes.data?.success ? congregacionesRes.data.data : []);
    } catch (error) {
      console.error('Error loading opciones:', error);
      toast.error('Error al cargar opciones');
    }
  };

  // Abrir modal para crear
  const handleOpenModal = async () => {
    setEditingItem(null);
    reset();
    await loadOpciones();
    setIsModalOpen(true);
  };

  // Editar item
  const handleEdit = async (item) => {
    setEditingItem(item);
    setValue('nombre', item.nombre);
    setValue('categoria', item.categoria || '');
    setValue('descripcion', item.descripcion || '');
    setValue('codigo', item.codigo || '');
    setValue('cantidad', item.cantidad);
    setValue('unidad_medida', item.unidad_medida || 'unidad');
    setValue('valor_unitario', item.valor_unitario || '');
    setValue('ubicacion', item.ubicacion || '');
    setValue('id_estado', item.id_estado);
    setValue('id_congregacion', item.id_congregacion);
    
    await loadOpciones();
    setIsModalOpen(true);
  };

  // Ver detalle del item
  const handleViewItem = async (item) => {
    try {
      const response = await api.get(`/inventario/${item.id_item}`);
      const itemData = response.data?.success ? response.data.data : null;
      setViewingItem(itemData);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error('Error fetching item details:', error);
    }
  };

  // Eliminar item
  const handleDelete = async (id) => {
    toast('¿Estás seguro de eliminar este item?', {
      action: {
        label: 'Eliminar',
        onClick: async () => {
          try {
            const response = await api.delete(`/inventario/${id}`);
            if (response.data?.success) {
              toast.success('Item eliminado correctamente');
              fetchItems();
            } else {
              toast.error(response.data?.mensaje || 'Error al eliminar');
            }
          } catch (_error) {
            toast.error('Error al eliminar item');
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
      cantidad: data.cantidad ? parseInt(data.cantidad) : 1,
      valor_unitario: data.valor_unitario ? parseFloat(data.valor_unitario) : null
    };

    try {
      let response;
      if (editingItem) {
        response = await api.put(`/inventario/${editingItem.id_item}`, payload);
      } else {
        response = await api.post('/inventario', payload);
      }
      
      if (response.data?.success) {
        toast.success(editingItem ? 'Item actualizado correctamente' : 'Item creado correctamente');
        setIsModalOpen(false);
        reset();
        fetchItems();
      } else {
        toast.error(response.data?.mensaje || 'Error al guardar');
      }
    } catch (_error) {
      toast.error('Error al guardar item');
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <Package className="w-6 h-6" />
          Inventario
        </h1>
        <button
          onClick={handleOpenModal}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 w-full sm:w-auto flex items-center justify-center gap-2"
        >
          <Box className="w-4 h-4" />
          Agregar Item
        </button>
      </div>

      {/* Filtro por estado */}
      {estados.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por estado:</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={fetchItems}
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
                onClick={() => fetchItemsByEstado(estado.id_estado)}
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
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {filtroEstado 
              ? 'No hay items con el estado seleccionado' 
              : 'No hay items en el inventario'}
          </p>
          <button
            onClick={handleOpenModal}
            className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Agregar el primer item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id_item} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg truncate">{item.nombre}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {item.categoria || 'Sin categoría'}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => handleViewItem(item)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Ver detalle"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Tag className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id_item)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Box className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3 text-sm">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Box className="w-4 h-4" />
                    <span className="font-medium">{item.cantidad}</span>
                    <span className="text-gray-400 text-xs">{item.unidad_medida}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-medium">{formatCurrency(item.valor_unitario)}</span>
                  </div>
                </div>
                
                {item.ubicacion && (
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                    <MapPinned className="w-3 h-3" />
                    {item.ubicacion}
                  </div>
                )}
                
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    item.estado?.nombre === 'Activo' 
                      ? 'bg-green-100 text-green-700' 
                      : item.estado?.nombre === 'Inactivo'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {item.estado?.nombre || '-'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {item.congregacion?.nombre || '-'}
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
                {editingItem ? 'Editar Item' : 'Nuevo Item'}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Código</label>
                    <input
                      {...register('codigo')}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="COD-001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Categoría</label>
                    <input
                      {...register('categoria')}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Equipos, Muebles, etc."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Descripción</label>
                  <textarea
                    {...register('descripcion')}
                    rows={2}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cantidad</label>
                    <input
                      type="number"
                      {...register('cantidad')}
                      defaultValue={1}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Unidad</label>
                    <select
                      {...register('unidad_medida')}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="unidad">Unidad</option>
                      <option value="caja">Caja</option>
                      <option value="metro">Metro</option>
                      <option value="litro">Litro</option>
                      <option value="kg">Kg</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Valor Unitario</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('valor_unitario')}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ubicación</label>
                    <input
                      {...register('ubicacion')}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Bodega, Sala, etc."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Congregación *</label>
                    <select
                      {...register('id_congregacion', { required: 'Congregación requerida' })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Seleccionar</option>
                      {congregaciones.map(cong => (
                        <option key={cong.id_congregacion} value={cong.id_congregacion}>{cong.nombre}</option>
                      ))}
                    </select>
                    {errors.id_congregacion && <span className="text-red-500 text-sm">{errors.id_congregacion.message}</span>}
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

      {/* Modal de detalle */}
      {isDetailModalOpen && viewingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-bold">{viewingItem.nombre}</h2>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Código:</span>
                  <span className="ml-2 font-medium">{viewingItem.codigo || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Categoría:</span>
                  <span className="ml-2 font-medium">{viewingItem.categoria || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Cantidad:</span>
                  <span className="ml-2 font-medium">{viewingItem.cantidad} {viewingItem.unidad_medida}</span>
                </div>
                <div>
                  <span className="text-gray-500">Valor Unitario:</span>
                  <span className="ml-2 font-medium">{formatCurrency(viewingItem.valor_unitario)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Ubicación:</span>
                  <span className="ml-2 font-medium">{viewingItem.ubicacion || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Estado:</span>
                  <span className="ml-2 font-medium">{viewingItem.estado?.nombre || '-'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">Congregación:</span>
                  <span className="ml-2 font-medium">{viewingItem.congregacion?.nombre || '-'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">Descripción:</span>
                  <p className="mt-1 text-gray-700">{viewingItem.descripcion || '-'}</p>
                </div>
              </div>

              {/* Movimientos recientes */}
              {viewingItem.movimientos && viewingItem.movimientos.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-bold mb-3">Movimientos Recientes</h3>
                  <div className="space-y-2">
                    {viewingItem.movimientos.slice(0, 5).map((mov) => (
                      <div key={mov.id_movimiento} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg text-sm">
                        <div>
                          <span className={`font-medium ${mov.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                            {mov.tipo === 'entrada' ? '+' : '-'}{mov.cantidad}
                          </span>
                          <span className="text-gray-500 ml-2">{mov.motivo || '-'}</span>
                        </div>
                        <span className="text-gray-400 text-xs">
                          {new Date(mov.fecha).toLocaleDateString('es-CL')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Préstamos */}
              {viewingItem.prestamos && viewingItem.prestamos.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-bold mb-3">Préstamos Activos</h3>
                  <div className="space-y-2">
                    {viewingItem.prestamos.filter(p => p.estado?.nombre === 'Activo').map((pres) => (
                      <div key={pres.id_prestamo} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg text-sm">
                        <span className="font-medium">{pres.institucion?.nombre || '-'}</span>
                        <span className="text-gray-500">{pres.cantidad} unidades</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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