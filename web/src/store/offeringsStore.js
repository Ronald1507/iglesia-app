import { create } from 'zustand';
import api from '../services/api';

export const useOfferingsStore = create((set, get) => ({
  ofrendas: [],
  presupuestos: [],
  loading: false,
  error: null,
  opciones: { miembros: [], cuentas: [], metodosPago: [] },

  fetchOfrendas: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('/finanzas/ofrendas');
      set({ ofrendas: res.data?.success ? res.data.data : [], loading: false });
    } catch (error) {
      set({ loading: false, error: error.response?.data?.mensaje || error.response?.data?.error || 'Error al cargar ofrendas' });
    }
  },

  fetchPresupuestos: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('/finanzas/presupuestos');
      set({ presupuestos: res.data?.success ? res.data.data : [], loading: false });
    } catch (error) {
      set({ loading: false, error: error.response?.data?.mensaje || error.response?.data?.error || 'Error al cargar presupuestos' });
    }
  },

  fetchOpciones: async () => {
    try {
      const [miembrosRes, cuentasRes, metodosRes] = await Promise.all([
        api.get('/finanzas/listado/miembros'),
        api.get('/finanzas/cuentas'),
        api.get('/finanzas/listado/metodos-pago'),
      ]);
      set({
        opciones: {
          miembros: miembrosRes.data?.success ? miembrosRes.data.data : [],
          cuentas: cuentasRes.data?.success ? cuentasRes.data.data : [],
          metodosPago: metodosRes.data?.success ? metodosRes.data.data : [],
        },
      });
    } catch {
      return { success: false, message: 'Error al cargar opciones' };
    }
  },

  createOfrenda: async (data) => {
    set({ loading: true, error: null });
    try {
      const payload = {
        id_miembro: parseInt(data.id_miembro),
        id_cuenta: parseInt(data.id_cuenta),
        tipo: data.tipo,
        monto: parseFloat(data.monto),
        fecha: data.fecha || null,
        sobre_numero: data.sobre_numero || null,
        id_metodo_pago: data.id_metodo_pago ? parseInt(data.id_metodo_pago) : null,
      };
      const res = await api.post('/finanzas/ofrendas', payload);
      if (res.data?.success) {
        await get().fetchOfrendas();
        return { success: true, message: 'Ofrenda registrada correctamente' };
      }
      set({ loading: false });
      return { success: false, message: res.data?.mensaje || 'Error al guardar' };
    } catch (error) {
      set({ loading: false });
      return { success: false, message: error.response?.data?.mensaje || 'Error al guardar ofrenda' };
    }
  },

  deleteOfrenda: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await api.delete(`/finanzas/ofrendas/${id}`);
      if (res.data?.success) {
        await get().fetchOfrendas();
        return { success: true, message: 'Ofrenda eliminada correctamente' };
      }
      set({ loading: false });
      return { success: false, message: res.data?.mensaje || 'Error al eliminar' };
    } catch (error) {
      set({ loading: false });
      return { success: false, message: error.response?.data?.mensaje || 'Error al eliminar ofrenda' };
    }
  },

  createPresupuesto: async (data) => {
    set({ loading: true, error: null });
    try {
      const payload = {
        anio: parseInt(data.anio),
        mes: parseInt(data.mes),
        categoria: data.categoria,
        monto_asignado: parseFloat(data.monto_asignado),
      };
      const res = await api.post('/finanzas/presupuestos', payload);
      if (res.data?.success) {
        await get().fetchPresupuestos();
        return { success: true, message: 'Presupuesto creado correctamente' };
      }
      set({ loading: false });
      return { success: false, message: res.data?.mensaje || 'Error al guardar' };
    } catch (error) {
      set({ loading: false });
      return { success: false, message: error.response?.data?.mensaje || 'Error al guardar presupuesto' };
    }
  },

  updatePresupuesto: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const payload = {
        categoria: data.categoria,
        monto_asignado: parseFloat(data.monto_asignado),
        monto_ejecutado: data.monto_ejecutado ? parseFloat(data.monto_ejecutado) : 0,
      };
      const res = await api.put(`/finanzas/presupuestos/${id}`, payload);
      if (res.data?.success) {
        await get().fetchPresupuestos();
        return { success: true, message: 'Presupuesto actualizado correctamente' };
      }
      set({ loading: false });
      return { success: false, message: res.data?.mensaje || 'Error al guardar' };
    } catch (error) {
      set({ loading: false });
      return { success: false, message: error.response?.data?.mensaje || 'Error al guardar presupuesto' };
    }
  },

  deletePresupuesto: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await api.delete(`/finanzas/presupuestos/${id}`);
      if (res.data?.success) {
        await get().fetchPresupuestos();
        return { success: true, message: 'Presupuesto eliminado correctamente' };
      }
      set({ loading: false });
      return { success: false, message: res.data?.mensaje || 'Error al eliminar' };
    } catch (error) {
      set({ loading: false });
      return { success: false, message: error.response?.data?.mensaje || 'Error al eliminar presupuesto' };
    }
  },
}));
