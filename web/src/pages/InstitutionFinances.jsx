import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { toast } from 'sonner';
import { Wallet, ArrowLeft, Plus, Edit2, Trash2, RefreshCw, Building, TrendingUp, TrendingDown, Eye, Church, CheckCircle } from 'lucide-react';

export default function InstitutionFinances() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isCongregacion = !id || id === 'congregacion';
  const cuentaId = location.state?.cuentaId;
  
  const [loading, setLoading] = useState(false);
  const [nombreEntidad, setNombreEntidad] = useState('Congregación');
  const [cuentas, setCuentas] = useState([]);
  const [transacciones, setTransacciones] = useState([]);
  
  const [_estadosCuentas, setEstadosCuentas] = useState([]);
  const [estadosTransacciones, setEstadosTransacciones] = useState([]);
  const [tiposTransaccion, setTiposTransaccion] = useState([]);
  const [metodosPago, setMetodosPago] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { register, handleSubmit, reset } = useForm();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, [id, cuentaId]);

  const loadData = async () => {
    setLoading(true);
    try {
      let cuentasData = [];
      let nombre = 'Cuenta';
      if (isCongregacion) {
        // Si viene cuentaId específica, mostrar solo esa
        if (cuentaId) {
          const cuentaRes = await api.get(`/finanzas/cuentas/${cuentaId}`);
          if (cuentaRes.data?.success) {
            cuentasData = [cuentaRes.data.data];
            nombre = cuentaRes.data.data.nombre;
          }
        } else {
          // Cargar todas las cuentas SIN institución
          const response = await api.get('/finanzas/cuentas');
          const todas = response.data?.success ? response.data.data : [];
          cuentasData = todas.filter(c => !c.id_institucion);
          nombre = 'Congregación';
        }
      } else {
        // Si viene cuentaId específica, mostrar solo esa
        if (cuentaId) {
          const cuentaRes = await api.get(`/finanzas/cuentas/${cuentaId}`);
          if (cuentaRes.data?.success) {
            cuentasData = [cuentaRes.data.data];
            nombre = cuentaRes.data.data.nombre;
            
            // También cargar nombre de institución
            if (cuentaRes.data.data.id_institucion) {
              const instRes = await api.get(`/instituciones/${cuentaRes.data.data.id_institucion}`);
              if (instRes.data?.success) {
                const instNombre = instRes.data.data.nombre;
                nombre = `${cuentaRes.data.data.nombre} (${instNombre})`;
              }
            }
          }
        } else {
          // Cargar cuentas de esta institución
          const cuentasResponse = await api.get(`/finanzas/cuentas/institucion/${id}`);
          cuentasData = cuentasResponse.data?.success ? cuentasResponse.data.data : [];
          
          const instResponse = await api.get(`/instituciones/${id}`);
          if (instResponse.data?.success) {
            nombre = instResponse.data.data.nombre;
          }
        }
      }
      
      setCuentas(cuentasData);
      setNombreEntidad(nombre);
      
      // Cargar transacciones para cada cuenta - una por una (API específica)
      const transDataArray = [];
      for (const cuenta of cuentasData) {
        try {
          const transResponse = await api.get(`/finanzas/cuentas/${cuenta.id_cuenta}/transacciones`);
          const trans = transResponse.data?.success ? transResponse.data.data : [];
          transDataArray.push(...trans);
        } catch (_e) {
          // Ignorar errores de cuentas sin transacciones
        }
      }
      // Ordenar por fecha
      transDataArray.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      setTransacciones(transDataArray);
      
      // Opciones
      const [estadosCtasRes, estadosTransRes, tiposTransRes, metodosRes] = await Promise.all([
        api.get('/finanzas/listado/estados-cuentas'),
        api.get('/finanzas/listado/estados-transacciones'),
        api.get('/finanzas/listado/tipos-transaccion'),
        api.get('/finanzas/listado/metodos-pago')
      ]);
      
      setEstadosCuentas(estadosCtasRes.data?.success ? estadosCtasRes.data.data : []);
      setEstadosTransacciones(estadosTransRes.data?.success ? estadosTransRes.data.data : []);
      setTiposTransaccion(tiposTransRes.data?.success ? tiposTransRes.data.data : []);
      setMetodosPago(metodosRes.data?.success ? metodosRes.data.data : []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    reset();
    setIsModalOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        id_cuenta: parseInt(data.id_cuenta),
        id_tipo: parseInt(data.id_tipo),
        concepto: data.concepto,
        monto: parseFloat(data.monto),
        id_estado: parseInt(data.id_estado),
        id_metodo_pago: data.id_metodo_pago ? parseInt(data.id_metodo_pago) : null,
      };
      
      const response = await api.post('/finanzas/transacciones', payload);
      if (response.data?.success) {
        toast.success('Transacción creada');
        setIsModalOpen(false);
        loadData();
      } else {
        toast.error(response.data?.mensaje || 'Error al crear');
      }
    } catch (_error) {
      toast.error('Error al crear transacción');
    }
  };

  const handleConfirmar = async (transaccionId) => {
    const confirmada = estadosTransacciones.find(e => e.codigo === 'CONFIRMADA');
    if (!confirmada) { toast.error('No se encontró el estado Confirmada'); return; }
    try {
      const response = await api.patch(`/finanzas/transacciones/${transaccionId}/estado`, { id_estado: confirmada.id_estado });
      if (response.data?.success) {
        toast.success('Transacción confirmada');
        loadData();
      } else {
        toast.error(response.data?.mensaje || 'Error al confirmar');
      }
    } catch (_error) {
      toast.error('Error al confirmar transacción');
    }
  };

  const estadoTransClass = (nombre) => {
    if (nombre === 'Confirmada') return 'bg-green-100 text-green-700';
    if (nombre === 'Pendiente') return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-500';
  };

  const handleDelete = async (transaccionId) => {
    toast('¿Eliminar esta transacción?', {
      action: {
        label: 'Eliminar',
        onClick: async () => {
          try {
            const response = await api.delete(`/finanzas/transacciones/${transaccionId}`);
            if (response.data?.success) {
              toast.success('Transacción eliminada');
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

  const saldoTotal = cuentas.reduce((sum, c) => sum + parseFloat(c.saldo_actual || 0), 0);

  // El tipo de la transacción viene en la relación tipoTransaccion (nombre/naturaleza),
  // no en un campo escalar "tipo".
  const esIngreso = (t) => {
    const nat = t.tipoTransaccion?.naturaleza;
    return nat === 'ENTRADA' || nat === 'INGRESO' || t.tipoTransaccion?.nombre === 'INGRESO';
  };

  const ingresos = transacciones
    .filter(esIngreso)
    .reduce((sum, t) => sum + parseFloat(t.monto), 0);

  const egresos = transacciones
    .filter((t) => !esIngreso(t))
    .reduce((sum, t) => sum + parseFloat(t.monto), 0);

  const formatMoney = (amount) => `$${parseFloat(amount || 0).toLocaleString()}`;
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('es-CL');
  };

  const getTipoNombre = (t) => t.tipoTransaccion?.nombre || '-';

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/finances')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            {isCongregacion ? (
              <Church className="w-6 h-6 text-blue-600" />
            ) : (
              <Building className="w-6 h-6 text-purple-600" />
            )}
            {nombreEntidad}
          </h1>
          <p className="text-sm text-gray-500">Finanzas</p>
        </div>
        <button
          onClick={openModal}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          + Transacción
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">Saldo Total</p>
          <p className="text-2xl font-bold text-gray-800">{formatMoney(saldoTotal)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-green-600" />
            Ingresos
          </p>
          <p className="text-2xl font-bold text-green-600">{formatMoney(ingresos)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <TrendingDown className="w-4 h-4 text-red-600" />
            Egresos
          </p>
          <p className="text-2xl font-bold text-red-600">{formatMoney(egresos)}</p>
        </div>
      </div>

      {/* Cuentas */}
      <div className="bg-white rounded-xl shadow-sm border mb-6">
        <div className="p-4 border-b">
          <h2 className="font-bold text-lg">Cuentas ({cuentas.length})</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : cuentas.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No hay cuentas</div>
        ) : (
          <div className="divide-y">
            {cuentas.map((cuenta) => (
              <div key={cuenta.id_cuenta} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <Wallet className="w-4 h-4 text-gray-400" />
                  <div>
                    <h3 className="font-semibold">{cuenta.nombre}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      cuenta.estado?.nombre === 'ACTIVA' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {cuenta.estado?.nombre}
                    </span>
                  </div>
                </div>
                <p className="font-bold">{formatMoney(cuenta.saldo_actual)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transacciones */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-4 border-b">
          <h2 className="font-bold text-lg">Transacciones Recientes</h2>
        </div>
        {transacciones.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No hay transacciones</div>
        ) : (
          <div className="divide-y max-h-96 overflow-y-auto">
            {transacciones.slice(0, 30).map((trans) => (
              <div key={trans.id_transaccion} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      esIngreso(trans) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {getTipoNombre(trans)}
                    </span>
                    {trans.estado?.nombre && (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${estadoTransClass(trans.estado.nombre)}`}>
                        {trans.estado.nombre}
                      </span>
                    )}
                    <span className="text-sm text-gray-600">{trans.concepto}</span>
                  </div>
                  <p className="text-xs text-gray-400">{trans.cuenta?.nombre} · {formatDate(trans.fecha)}</p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <p className={`font-bold ${
                    trans.estado?.nombre === 'Cancelada' ? 'text-gray-400 line-through' : esIngreso(trans) ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {esIngreso(trans) ? '+' : '-'}{formatMoney(trans.monto)}
                  </p>
                  {trans.estado?.nombre === 'Pendiente' && (
                    <button onClick={() => handleConfirmar(trans.id_transaccion)} className="p-1 text-gray-400 hover:text-green-600" title="Confirmar">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  {trans.estado?.nombre !== 'Cancelada' && (
                    <button onClick={() => handleDelete(trans.id_transaccion)} className="p-1 text-gray-400 hover:text-red-600" title="Cancelar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal transacción */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="bg-green-600 p-4 rounded-t-lg">
              <h2 className="text-xl font-bold text-white">Nueva Transacción</h2>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta *</label>
                <select {...register('id_cuenta', { required: true })} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">Seleccionar</option>
                  {cuentas.map(c => <option key={c.id_cuenta} value={c.id_cuenta}>{c.nombre}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                  <select {...register('id_tipo', { required: true })} className="w-full px-3 py-2 border rounded-lg">
                    <option value="">Seleccionar</option>
                    {tiposTransaccion.map(t => <option key={t.id_tipo} value={t.id_tipo}>{t.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monto *</label>
                  <input type="number" step="0.01" {...register('monto', { required: true })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Concepto *</label>
                <input {...register('concepto', { required: true })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
                  <select {...register('id_estado', { required: true })} className="w-full px-3 py-2 border rounded-lg">
                    <option value="">Seleccionar</option>
                    {estadosTransacciones.map(e => <option key={e.id_estado} value={e.id_estado}>{e.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Método de pago</label>
                  <select {...register('id_metodo_pago')} className="w-full px-3 py-2 border rounded-lg">
                    <option value="">Seleccionar</option>
                    {metodosPago.map(m => <option key={m.id_metodo_pago} value={m.id_metodo_pago}>{m.nombre}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-medium">
                  Crear
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