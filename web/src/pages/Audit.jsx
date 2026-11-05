import { useEffect, useState } from 'react';
import { useAuditStore } from '../store/auditStore';
import { ShieldCheck, RefreshCw, Eye, History } from 'lucide-react';

const ACCIONES = ['CREATE', 'UPDATE', 'DELETE'];

export default function Audit() {
  const { logs, loading, tablas, filtroTabla, filtroAccion, fetchLogs, fetchTablas, setFiltros } = useAuditStore();

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingLog, setViewingLog] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchTablas(); }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchLogs(); }, [filtroTabla, filtroAccion]);

  const handleView = (log) => {
    setViewingLog(log);
    setIsDetailModalOpen(true);
  };

  const accionBadge = (accion) => {
    if (accion === 'CREATE') return 'bg-green-100 text-green-700';
    if (accion === 'UPDATE') return 'bg-amber-100 text-amber-700';
    if (accion === 'DELETE') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleString('es-CL');
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="w-6 h-6" />
          Auditoría
        </h1>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Tabla</label>
          <select
            value={filtroTabla}
            onChange={(e) => setFiltros(e.target.value, filtroAccion)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Todas</option>
            {tablas.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Acción</label>
          <select
            value={filtroAccion}
            onChange={(e) => setFiltros(filtroTabla, e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Todas</option>
            {ACCIONES.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-2 text-gray-500">Cargando...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No hay registros de auditoría</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Fecha</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Tabla</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Acción</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Usuario</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Registro</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id_log} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatFecha(log.fecha_hora)}</td>
                    <td className="px-4 py-3 text-gray-700 font-medium">{log.tabla_afectada || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${accionBadge(log.accion)}`}>
                        {log.accion || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{log.id_usuario ?? '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{log.id_registro ?? '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleView(log)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de detalle */}
      {isDetailModalOpen && viewingLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  Detalle de Auditoría
                </h2>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                <div>
                  <span className="text-gray-500">Tabla:</span>
                  <span className="ml-2 font-medium">{viewingLog.tabla_afectada || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Acción:</span>
                  <span className="ml-2 font-medium">{viewingLog.accion || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Usuario:</span>
                  <span className="ml-2 font-medium">{viewingLog.id_usuario ?? '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Registro:</span>
                  <span className="ml-2 font-medium">{viewingLog.id_registro ?? '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Fecha:</span>
                  <span className="ml-2 font-medium">{formatFecha(viewingLog.fecha_hora)}</span>
                </div>
                <div>
                  <span className="text-gray-500">IP Origen:</span>
                  <span className="ml-2 font-medium">{viewingLog.ip_origen || '-'}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-bold mb-2 text-sm">Datos Anteriores</h3>
                  <pre className="bg-gray-50 rounded-lg p-3 text-xs overflow-x-auto text-gray-700 border border-gray-100">
                    {viewingLog.datos_anteriores ? JSON.stringify(viewingLog.datos_anteriores, null, 2) : '-'}
                  </pre>
                </div>
                <div>
                  <h3 className="font-bold mb-2 text-sm">Datos Nuevos</h3>
                  <pre className="bg-gray-50 rounded-lg p-3 text-xs overflow-x-auto text-gray-700 border border-gray-100">
                    {viewingLog.datos_nuevos ? JSON.stringify(viewingLog.datos_nuevos, null, 2) : '-'}
                  </pre>
                </div>
              </div>

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
