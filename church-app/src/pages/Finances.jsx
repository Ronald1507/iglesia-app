import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'sonner';
import { Wallet, Plus, Building, Edit2, Trash2, RefreshCw } from 'lucide-react';

export default function Finances() {
  const navigate = useNavigate();
  const [cuentas, setCuentas] = useState([]);
  const [instituciones, setInstituciones] = useState([]);
  const [estadosCuentas, setEstadosCuentas] = useState([]);
  const [congregaciones, setCongregaciones] = useState([]);
  const [tiposCuenta, setTiposCuenta] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const { register, handleSubmit, reset, setValue } = useForm();

  const loadData = async () => {
    try {
      const [cuentasRes, estadosRes, congregRes, instRes, tiposRes] = await Promise.all([
        api.get('/finanzas/cuentas'),
        api.get('/finanzas/listado/estados-cuentas'),
        api.get('/finanzas/listado/congregaciones'),
        api.get('/finanzas/listado/instituciones'),
        api.get('/finanzas/listado/tipos-cuenta')
      ]);
      
      setCuentas(cuentasRes.data?.success ? cuentasRes.data.data : []);
      setEstadosCuentas(estadosRes.data?.success ? estadosRes.data.data : []);
      setCongregaciones(congregRes.data?.success ? congregRes.data.data : []);
      setInstituciones(instRes.data?.success ? instRes.data.data : []);
      setTiposCuenta(tiposRes.data?.success ? tiposRes.data.data : []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useEffect(() => { loadData(); }, []); // eslint-disable-line react-hooks/set-state-in-effect

  const openModal = async (item = null) => {
    setEditingItem(item);
    reset();
    
    if (item) {
      setValue('nombre', item.nombre);
      setValue('tipo', item.tipo);
      setValue('descripcion', item.descripcion || '');
      setValue('id_congregacion', item.id_congregacion);
      setValue('id_institucion', item.id_institucion || '');
      setValue('id_estado', item.id_estado);
    }
    
    setIsModalOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        id_estado: parseInt(data.id_estado),
        id_congregacion: parseInt(data.id_congregacion),
        id_institucion: data.id_institucion ? parseInt(data.id_institucion) : null
      };
      
      let result;
      if (editingItem) {
        const response = await api.put(`/finanzas/cuentas/${editingItem.id_cuenta}`, payload);
        result = response.data;
      } else {
        const response = await api.post('/finanzas/cuentas', payload);
        result = response.data;
      }

      if (result?.success) {
        toast.success(editingItem ? 'Cuenta actualizada' : 'Cuenta creada');
        setIsModalOpen(false);
        loadData();
      } else {
        toast.error(result?.mensaje || 'Error al guardar');
      }
    } catch (_error) {
      toast.error('Error al guardar');
    }
  };

  const handleDelete = async (id) => {
    toast('¿Eliminar esta cuenta?', {
      action: {
        label: 'Eliminar',
        onClick: async () => {
          try {
            const response = await api.delete(`/finanzas/cuentas/${id}`);
            if (response.data?.success) {
              toast.success('Cuenta eliminada');
              loadData();
            }
          } catch (_error) {
            toast.error('Error al eliminar');
          }
        },
      },
      duration: 5000,
    });
  };

  const toggleStatus = async (id) => {
    try {
      const response = await api.patch(`/finanzas/cuentas/${id}/status`);
      if (response.data?.success) {
        toast.success(response.data.mensaje);
        loadData();
      }
    } catch (_error) {
      toast.error('Error al cambiar estado');
    }
  };

  const formatMoney = (amount) => `$${parseFloat(amount || 0).toLocaleString()}`;

  // Obtener nombre de institución o congregación
  const getEntidadNombre = (cuenta) => {
    if (cuenta.id_institucion) {
      return cuenta.institucion?.nombre || 'Institución';
    }
    return 'Congregación';
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Wallet className="w-6 h-6" />
            Finanzas
          </h1>
          <p className="text-sm text-gray-500">{cuentas.length} cuentas</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          + Cuenta
        </button>
      </div>

      {/* Cards de cada cuenta */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {cuentas.map((cuenta) => (
          <div 
            key={cuenta.id_cuenta}
            className={`bg-white rounded-xl shadow-sm border-2 p-4 cursor-pointer hover:shadow-md transition-all ${
              cuenta.id_institucion ? 'border-purple-200 hover:border-purple-400' : 'border-blue-200 hover:border-blue-400'
            }`}
            onClick={() => {
              const destino = cuenta.id_institucion 
                ? `/finanzas/institucion/${cuenta.id_institucion}` 
                : '/finanzas/congregacion';
              navigate(destino, { state: { cuentaId: cuenta.id_cuenta } });
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {cuenta.id_institucion ? (
                  <Building className="w-4 h-4 text-purple-500" />
                ) : (
                  <Wallet className="w-4 h-4 text-blue-500" />
                )}
                <h3 className="font-bold text-lg">{cuenta.nombre}</h3>
              </div>
              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => openModal(cuenta)} className="p-1 text-gray-400 hover:text-indigo-600">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => toggleStatus(cuenta.id_cuenta)} className="p-1 text-gray-400 hover:text-yellow-600">
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(cuenta.id_cuenta)} className="p-1 text-gray-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800">{formatMoney(cuenta.saldo_actual)}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2 py-0.5 rounded text-xs ${
                cuenta.estado?.nombre === 'ACTIVA' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {cuenta.estado?.nombre}
              </span>
              <span className={`text-xs ${
                cuenta.id_institucion ? 'text-purple-600' : 'text-blue-600'
              }`}>
                {getEntidadNombre(cuenta)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal cuenta */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="bg-indigo-600 p-4 rounded-t-lg">
              <h2 className="text-xl font-bold text-white">
                {editingItem ? 'Editar Cuenta' : 'Nueva Cuenta'}
              </h2>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input {...register('nombre', { required: true })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                  <select {...register('tipo', { required: true })} className="w-full px-3 py-2 border rounded-lg">
                    <option value="">Seleccionar</option>
                    {tiposCuenta.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
                  <select {...register('id_estado', { required: true })} className="w-full px-3 py-2 border rounded-lg">
                    <option value="">Seleccionar</option>
                    {estadosCuentas.map(e => <option key={e.id_estado} value={e.id_estado}>{e.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Congregación *</label>
                <select {...register('id_congregacion', { required: true })} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">Seleccionar</option>
                  {congregaciones.map(c => <option key={c.id_congregacion} value={c.id_congregacion}>{c.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Institución (opcional)</label>
                <select {...register('id_institucion')} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">Sin institución</option>
                  {instituciones.map(i => <option key={i.id_institucion} value={i.id_institucion}>{i.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea {...register('descripcion')} className="w-full px-3 py-2 border rounded-lg" rows={2} />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-medium">
                  {editingItem ? 'Actualizar' : 'Crear'}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-medium">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}