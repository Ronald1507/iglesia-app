import { Router, Response } from 'express';
import prisma from '../config/db';
import { authenticateToken, AuthRequest, getCongregacionFilter } from '../middleware/auth';
import { getEstadoId } from '../utils/estados';
import { ApiResponse, sendResponse } from '../utils/response';

const router = Router();

// GET /api/dashboard/stats
// Retorna KPIs escopados por congregación del usuario autenticado.
router.get('/stats', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const congregacionFilter = getCongregacionFilter(req.user);

    // ── miembros_activos ──────────────────────────────────────────
    const estadoActivoId = await getEstadoId('MIEMBRO', 'ACTIVO');
    const miembros_activos = await prisma.miembro.count({
      where: { id_estado: estadoActivoId, ...congregacionFilter },
    });

    // ── asistencia_promedio_30d ───────────────────────────────────
    const hace30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const eventosRecientes = await prisma.evento.findMany({
      where: {
        fecha_inicio: { gte: hace30d },
        ...congregacionFilter,
      },
      select: {
        id_evento: true,
        _count: { select: { asistencia: true } },
      },
    });
    const eventosConAsistencia = eventosRecientes.filter((e) => e._count.asistencia >= 1);
    const asistencia_promedio_30d =
      eventosConAsistencia.length > 0
        ? Math.round(
            eventosConAsistencia.reduce((acc, e) => acc + e._count.asistencia, 0) /
              eventosConAsistencia.length
          )
        : 0;

    // ── ingresos_mes_actual ───────────────────────────────────────
    const ahora = new Date();
    const startOfMonth = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const endOfMonth = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59, 999);
    const confirmadaId = await getEstadoId('TRANSACCION', 'CONFIRMADA');
    const tiposIngreso = await prisma.tipoTransaccion.findMany({
      where: { naturaleza: 'INGRESO' },
      select: { id_tipo: true },
    });
    const idsTiposIngreso = tiposIngreso.map((t) => t.id_tipo);
    const resultIngresos = await prisma.transaccion.aggregate({
      _sum: { monto: true },
      where: {
        id_estado: confirmadaId,
        id_tipo: idsTiposIngreso.length > 0 ? { in: idsTiposIngreso } : undefined,
        fecha: { gte: startOfMonth, lte: endOfMonth },
        cuenta: { ...congregacionFilter },
      },
    });
    const ingresos_mes_actual = Number(resultIngresos._sum.monto ?? 0);

    // ── peticiones_pendientes ─────────────────────────────────────
    const pendienteId = await getEstadoId('PETICION_ORACION', 'PENDIENTE');
    // PeticionOracion no tiene id_congregacion directo; se filtra via miembro
    const peticiones_pendientes = await prisma.peticionOracion.count({
      where: {
        id_estado: pendienteId,
        miembro: { ...congregacionFilter },
      },
    });

    // ── proximos_eventos ──────────────────────────────────────────
    const proximos_eventos = await prisma.evento.findMany({
      where: {
        fecha_inicio: { gte: new Date() },
        ...congregacionFilter,
      },
      orderBy: { fecha_inicio: 'asc' },
      take: 5,
      select: {
        id_evento: true,
        nombre: true,
        fecha_inicio: true,
        tipo: true,
        lugar: true,
      },
    });

    // ── tendencia_asistencia (últimos 6 meses) ────────────────────
    const tendencia_asistencia: Array<{ mes: string; total: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
      const total = await prisma.asistenciaEvento.count({
        where: {
          evento: {
            fecha_inicio: { gte: start, lte: end },
            ...congregacionFilter,
          },
        },
      });
      const mes = new Date(year, month, 1).toLocaleString('es-CL', { month: 'short' });
      // Capitalizar primera letra para consistencia (ene → Ene)
      tendencia_asistencia.push({ mes: mes.charAt(0).toUpperCase() + mes.slice(1), total });
    }

    return sendResponse(
      res,
      ApiResponse.success(
        {
          miembros_activos,
          asistencia_promedio_30d,
          ingresos_mes_actual,
          peticiones_pendientes,
          proximos_eventos,
          tendencia_asistencia,
        },
        'Stats del dashboard'
      )
    );
  } catch (error) {
    return sendResponse(res, ApiResponse.error('Error al obtener stats del dashboard', error));
  }
});

export default router;
