import { useEffect, useState } from 'react';
import { Users, TrendingUp, DollarSign, MessageSquare, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';

const TIPO_COLORES = {
  CULTO: 'bg-indigo-100 text-indigo-700',
  ESCUELA: 'bg-green-100 text-green-700',
  REUNION: 'bg-yellow-100 text-yellow-700',
  ESPECIAL: 'bg-pink-100 text-pink-700',
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(res => {
        if (res.data?.success) setStats(res.data.data);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Cargando...</div>;
  }

  if (error || !stats) {
    return <div className="p-8 text-center text-red-500">No se pudo cargar el dashboard</div>;
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 md:p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 font-medium">Miembros Activos</p>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl md:text-3xl font-bold text-indigo-600">{stats.miembros_activos}</p>
        </div>

        <div className="bg-white p-4 md:p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 font-medium">Asistencia Promedio</p>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl md:text-3xl font-bold text-green-600">
            {stats.asistencia_promedio_30d != null ? Math.round(stats.asistencia_promedio_30d) : '-'}
          </p>
          <p className="text-xs text-gray-400 mt-1">Últimos 30 días</p>
        </div>

        <div className="bg-white p-4 md:p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 font-medium">Ingresos del Mes</p>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl md:text-3xl font-bold text-emerald-600">
            ${(stats.ingresos_mes_actual || 0).toLocaleString('es-CL')}
          </p>
        </div>

        <div className="bg-white p-4 md:p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 font-medium">Peticiones Pendientes</p>
            <MessageSquare className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl md:text-3xl font-bold text-orange-600">{stats.peticiones_pendientes ?? 0}</p>
        </div>
      </div>

      {/* Chart + Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart */}
        {stats.tendencia_asistencia?.length > 0 && (
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-base font-bold mb-4">Tendencia de Asistencia</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.tendencia_asistencia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Próximos eventos */}
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-base font-bold mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-500" />
            Próximos Eventos
          </h2>
          {!stats.proximos_eventos?.length ? (
            <p className="text-gray-400 text-sm">No hay eventos próximos</p>
          ) : (
            <ul className="space-y-3">
              {stats.proximos_eventos.slice(0, 5).map((e) => (
                <li key={e.id_evento} className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-800 truncate">{e.nombre}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(e.fecha_inicio).toLocaleDateString('es-CL', {
                        weekday: 'short', day: '2-digit', month: 'short',
                        hour: '2-digit', minute: '2-digit'
                      })}
                      {e.lugar ? ` · ${e.lugar}` : ''}
                    </p>
                  </div>
                  {e.tipo && (
                    <span className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${TIPO_COLORES[e.tipo] || 'bg-gray-100 text-gray-600'}`}>
                      {e.tipo}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
