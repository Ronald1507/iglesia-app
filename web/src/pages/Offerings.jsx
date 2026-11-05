import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { HandCoins, PiggyBank, Calendar, Trash2, Pencil, RefreshCw, Plus, FileText, Printer } from 'lucide-react';
import api from '../services/api';
import { useOfferingsStore } from '../store/offeringsStore';

const TIPOS_OFRENDA = ['DIEZMO', 'OFRENDA'];

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || amount === '') return '-';
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
};

export default function Offerings() {
  const [tab, setTab] = useState('ofrendas');

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <HandCoins className="w-6 h-6" />
          Ofrendas y Presupuestos
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setTab('ofrendas')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 ${
            tab === 'ofrendas'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <HandCoins className="w-4 h-4" />
          Ofrendas / Diezmos
        </button>
        <button
          onClick={() => setTab('presupuestos')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 ${
            tab === 'presupuestos'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <PiggyBank className="w-4 h-4" />
          Presupuestos
        </button>
      </div>

      {tab === 'ofrendas' ? <OfrendasTab /> : <PresupuestosTab />}
    </div>
  );
}

function OfrendasTab() {
  const { ofrendas, loading, opciones, fetchOfrendas, fetchOpciones, createOfrenda, deleteOfrenda } = useOfferingsStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Estado del modal de recibo
  const [reciboModal, setReciboModal] = useState({ open: false, step: 'form', loading: false, recibo: null });
  const [reciboIdMiembro, setReciboIdMiembro] = useState('');
  const [reciboAnio, setReciboAnio] = useState(new Date().getFullYear());

  const handleOpenReciboModal = async () => {
    // Asegurarse de tener la lista de miembros cargada
    if (!opciones.miembros.length) {
      await fetchOpciones();
    }
    setReciboIdMiembro('');
    setReciboAnio(new Date().getFullYear());
    setReciboModal({ open: true, step: 'form', loading: false, recibo: null });
  };

  const handleGenerarRecibo = async () => {
    if (!reciboIdMiembro) { toast.error('Selecciona un miembro'); return; }
    setReciboModal(prev => ({ ...prev, loading: true }));
    try {
      const res = await api.get(`/finanzas/ofrendas/recibo/${reciboIdMiembro}?anio=${reciboAnio}`);
      if (res.data?.success) {
        setReciboModal({ open: true, step: 'recibo', loading: false, recibo: res.data.data });
      } else {
        toast.error(res.data?.mensaje || 'Error al generar recibo');
        setReciboModal(prev => ({ ...prev, loading: false }));
      }
    } catch (_error) {
      toast.error('Error al generar recibo');
      setReciboModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handlePrint = () => {
    const style = document.createElement('style');
    style.id = 'print-recibo-style';
    style.textContent = `
      @media print {
        body > * { visibility: hidden; }
        #recibo-print-area, #recibo-print-area * { visibility: visible; }
        #recibo-print-area { position: absolute; top: 0; left: 0; width: 100%; }
      }
    `;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => document.getElementById('print-recibo-style')?.remove(), 1000);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchOfrendas(); }, []);

  const handleOpenModal = async () => {
    reset();
    const result = await fetchOpciones();
    if (result?.success === false) toast.error(result.message);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    toast('¿Estás seguro de eliminar esta ofrenda?', {
      action: {
        label: 'Eliminar',
        onClick: async () => {
          const result = await deleteOfrenda(id);
          if (result.success) toast.success(result.message);
          else toast.error(result.message);
        },
      },
      description: 'Esta acción revierte el saldo de la cuenta',
      duration: 5000,
    });
  };

  const onSubmit = async (data) => {
    const result = await createOfrenda(data);
    if (result.success) {
      toast.success(result.message);
      setIsModalOpen(false);
      reset();
    } else {
      toast.error(result.message);
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-end gap-2 mb-4">
        <button
          onClick={handleOpenReciboModal}
          className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 w-full sm:w-auto flex items-center justify-center gap-2"
        >
          <FileText className="w-4 h-4" />
          Generar Recibo
        </button>
        <button
          onClick={handleOpenModal}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 w-full sm:w-auto flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Registrar Ofrenda
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-2 text-gray-500">Cargando...</p>
        </div>
      ) : ofrendas.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <HandCoins className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No hay ofrendas registradas</p>
          <button
            onClick={handleOpenModal}
            className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Registrar la primera ofrenda
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Miembro</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Tipo</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Monto</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Cuenta</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Fecha</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Sobre</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ofrendas.map((o) => (
                  <tr key={o.id_ofrenda} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700 font-medium">
                      {o.miembro ? `${o.miembro.nombres} ${o.miembro.apellidos}` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        o.tipo === 'DIEZMO' ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {o.tipo || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-700">{formatCurrency(o.monto)}</td>
                    <td className="px-4 py-3 text-gray-600">{o.transaccion?.cuenta?.nombre || '-'}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {o.fecha ? new Date(o.fecha).toLocaleDateString('es-CL') : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{o.sobre_numero || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(o.id_ofrenda)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de recibo */}
      {reciboModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-bold mb-4">Recibo de Ofrendas y Diezmos</h2>

              {reciboModal.step === 'form' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Miembro</label>
                    <select
                      value={reciboIdMiembro}
                      onChange={e => setReciboIdMiembro(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Seleccionar</option>
                      {opciones.miembros.map(m => (
                        <option key={m.id_miembro} value={m.id_miembro}>{m.nombres} {m.apellidos}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
                    <input
                      type="number"
                      value={reciboAnio}
                      min={2000}
                      max={new Date().getFullYear()}
                      onChange={e => setReciboAnio(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleGenerarRecibo}
                      disabled={!reciboIdMiembro || reciboModal.loading}
                      className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
                    >
                      {reciboModal.loading ? 'Generando...' : 'Generar'}
                    </button>
                    <button
                      onClick={() => setReciboModal({ open: false, step: 'form', loading: false, recibo: null })}
                      className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 font-medium"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div id="recibo-print-area">
                    <div className="text-center mb-6">
                      <h2 className="text-xl font-bold">{reciboModal.recibo.congregacion.nombre}</h2>
                      <p className="text-sm text-gray-600">{reciboModal.recibo.congregacion.direccion}</p>
                      <h3 className="text-lg font-bold mt-4 uppercase">Recibo de Ofrendas y Diezmos</h3>
                      <p className="text-sm">Año {reciboModal.recibo.anio}</p>
                    </div>
                    <div className="mb-4">
                      <p><strong>Miembro:</strong> {reciboModal.recibo.miembro.nombres} {reciboModal.recibo.miembro.apellidos}</p>
                      {reciboModal.recibo.miembro.rut && <p><strong>RUT:</strong> {reciboModal.recibo.miembro.rut}</p>}
                    </div>
                    <table className="w-full border-collapse border mb-4">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border p-2 text-left">Tipo</th>
                          <th className="border p-2 text-right">Cantidad</th>
                          <th className="border p-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reciboModal.recibo.resumen.map(r => (
                          <tr key={r.tipo}>
                            <td className="border p-2">{r.tipo}</td>
                            <td className="border p-2 text-right">{r.cantidad}</td>
                            <td className="border p-2 text-right">${r.total.toLocaleString('es-CL')}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="font-bold">
                          <td className="border p-2" colSpan={2}>Total General</td>
                          <td className="border p-2 text-right">${reciboModal.recibo.total_general.toLocaleString('es-CL')}</td>
                        </tr>
                      </tfoot>
                    </table>
                    <p className="text-xs text-gray-500">Fecha de emisión: {reciboModal.recibo.fecha_emision}</p>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={handlePrint}
                      className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 font-medium flex items-center justify-center gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      Imprimir
                    </button>
                    <button
                      onClick={() => setReciboModal({ open: false, step: 'form', loading: false, recibo: null })}
                      className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 font-medium"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de crear */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-bold mb-4">Nueva Ofrenda</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Miembro *</label>
                  <select
                    {...register('id_miembro', { required: 'Miembro requerido' })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Seleccionar</option>
                    {opciones.miembros.map((m) => (
                      <option key={m.id_miembro} value={m.id_miembro}>{m.nombres} {m.apellidos}</option>
                    ))}
                  </select>
                  {errors.id_miembro && <span className="text-red-500 text-sm">{errors.id_miembro.message}</span>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo *</label>
                    <select
                      {...register('tipo', { required: 'Tipo requerido' })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Seleccionar</option>
                      {TIPOS_OFRENDA.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    {errors.tipo && <span className="text-red-500 text-sm">{errors.tipo.message}</span>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Monto *</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('monto', { required: 'Monto requerido' })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    {errors.monto && <span className="text-red-500 text-sm">{errors.monto.message}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cuenta *</label>
                    <select
                      {...register('id_cuenta', { required: 'Cuenta requerida' })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Seleccionar</option>
                      {opciones.cuentas.map((c) => (
                        <option key={c.id_cuenta} value={c.id_cuenta}>{c.nombre}</option>
                      ))}
                    </select>
                    {errors.id_cuenta && <span className="text-red-500 text-sm">{errors.id_cuenta.message}</span>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Método de Pago</label>
                    <select
                      {...register('id_metodo_pago')}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Seleccionar</option>
                      {opciones.metodosPago.map((mp) => (
                        <option key={mp.id_metodo_pago} value={mp.id_metodo_pago}>{mp.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha *</label>
                    <input
                      type="date"
                      {...register('fecha', { required: 'Fecha requerida' })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    {errors.fecha && <span className="text-red-500 text-sm">{errors.fecha.message}</span>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">N° de Sobre</label>
                    <input
                      {...register('sobre_numero')}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Opcional"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 font-medium"
                  >
                    Registrar
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
    </>
  );
}

function PresupuestosTab() {
  const { presupuestos, loading, fetchPresupuestos, createPresupuesto, updatePresupuesto, deletePresupuesto } = useOfferingsStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPres, setEditingPres] = useState(null);
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchPresupuestos(); }, []);

  const handleOpenModal = () => {
    setEditingPres(null);
    reset();
    setIsModalOpen(true);
  };

  const handleEdit = (pres) => {
    setEditingPres(pres);
    setValue('anio', pres.anio);
    setValue('mes', pres.mes);
    setValue('categoria', pres.categoria || '');
    setValue('monto_asignado', pres.monto_asignado);
    setValue('monto_ejecutado', pres.monto_ejecutado);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    toast('¿Estás seguro de eliminar este presupuesto?', {
      action: {
        label: 'Eliminar',
        onClick: async () => {
          const result = await deletePresupuesto(id);
          if (result.success) toast.success(result.message);
          else toast.error(result.message);
        },
      },
      description: 'Esta acción no se puede deshacer',
      duration: 5000,
    });
  };

  const onSubmit = async (data) => {
    const result = editingPres
      ? await updatePresupuesto(editingPres.id_presupuesto, data)
      : await createPresupuesto(data);

    if (result.success) {
      toast.success(result.message);
      setIsModalOpen(false);
      reset();
    } else {
      toast.error(result.message);
    }
  };

  const calcPorcentaje = (asignado, ejecutado) => {
    const a = parseFloat(asignado);
    const e = parseFloat(ejecutado);
    if (!a || a <= 0) return 0;
    return Math.round((e / a) * 100);
  };

  const nombreMes = (mes) => MESES[mes - 1] || mes || '-';

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={handleOpenModal}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 w-full sm:w-auto flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Agregar Presupuesto
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-2 text-gray-500">Cargando...</p>
        </div>
      ) : presupuestos.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <PiggyBank className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No hay presupuestos registrados</p>
          <button
            onClick={handleOpenModal}
            className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Agregar el primer presupuesto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {presupuestos.map((p) => {
            const porcentaje = calcPorcentaje(p.monto_asignado, p.monto_ejecutado);
            return (
              <div key={p.id_presupuesto} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg truncate">{p.categoria || 'Sin categoría'}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {nombreMes(p.mes)} {p.anio}
                      </p>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={() => handleEdit(p)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id_presupuesto)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Asignado</span>
                    <span className="font-medium text-gray-700">{formatCurrency(p.monto_asignado)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">Ejecutado</span>
                    <span className="font-medium text-gray-700">{formatCurrency(p.monto_ejecutado)}</span>
                  </div>

                  {/* Barra de progreso */}
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${porcentaje > 100 ? 'bg-red-500' : porcentaje >= 80 ? 'bg-amber-500' : 'bg-indigo-600'}`}
                      style={{ width: `${Math.min(porcentaje, 100)}%` }}
                    />
                  </div>
                  <div className="mt-1 text-right">
                    <span className={`text-xs font-medium ${porcentaje > 100 ? 'text-red-600' : 'text-gray-500'}`}>
                      {porcentaje}% ejecutado
                    </span>
                  </div>

                  {p.congregacion?.nombre && (
                    <div className="mt-3 pt-3 border-t border-gray-100 text-right">
                      <span className="text-xs text-gray-400">{p.congregacion.nombre}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de crear/editar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-bold mb-4">
                {editingPres ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
              </h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Año *</label>
                    <input
                      type="number"
                      {...register('anio', { required: 'Año requerido' })}
                      disabled={!!editingPres}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                      placeholder="2026"
                    />
                    {errors.anio && <span className="text-red-500 text-sm">{errors.anio.message}</span>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mes *</label>
                    <select
                      {...register('mes', { required: 'Mes requerido' })}
                      disabled={!!editingPres}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                    >
                      <option value="">Seleccionar</option>
                      {MESES.map((m, i) => (
                        <option key={m} value={i + 1}>{m}</option>
                      ))}
                    </select>
                    {errors.mes && <span className="text-red-500 text-sm">{errors.mes.message}</span>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Categoría *</label>
                  <input
                    {...register('categoria', { required: 'Categoría requerida' })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Mantención, Eventos, etc."
                  />
                  {errors.categoria && <span className="text-red-500 text-sm">{errors.categoria.message}</span>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Monto Asignado *</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('monto_asignado', { required: 'Monto requerido' })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    {errors.monto_asignado && <span className="text-red-500 text-sm">{errors.monto_asignado.message}</span>}
                  </div>

                  {editingPres && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Monto Ejecutado</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register('monto_ejecutado')}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 font-medium"
                  >
                    {editingPres ? 'Actualizar' : 'Crear'}
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
    </>
  );
}
