import { create } from 'zustand';
import api from '../services/api';

export const useFinanceStore = create((set, get) => ({
  cuentas: [],
  transacciones: [],
  loading: false,
  error: null,
  estados: [], // Estados desde la DB
  filtroEstado: null, // Estado actualmente seleccionado

  // Cuentas
  fetchCuentas: async () => {
    set({ loading: true, error: null, filtroEstado: null });
    try {
      const response = await api.get('/finanzas/cuentas');
      const data = Array.isArray(response.data.data) ? response.data.data : [];
      set({ cuentas: data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchEstados: async () => {
    try {
      const response = await api.get('/finanzas/opciones');
      const estados = response.data.data?.estados || [];
      set({ estados });
      return estados;
    } catch (error) {
      console.error('Error fetching estados:', error);
      return [];
    }
  },

  fetchCuentasByEstado: async (idEstado) => {
    set({ loading: true, error: null, filtroEstado: idEstado });
    try {
      const response = await api.get(`/finanzas/cuentas/estado/${idEstado}`);
      const data = Array.isArray(response.data.data) ? response.data.data : [];
      set({ cuentas: data, loading: false });
    } catch (error) {
      console.error('[fetchCuentasByEstado] Error:', error);
      set({ error: error.message, loading: false, cuentas: [] });
    }
  },

  createCuenta: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/finanzas/cuentas', data);
      if (!response.data?.success) {
        set({ loading: false });
        return { success: false, message: response.data?.mensaje || 'Error al crear' };
      }
      set((state) => ({ 
        cuentas: [...state.cuentas, response.data.data], 
        loading: false 
      }));
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, message: error.response?.data?.mensaje || error.response?.data?.error };
    }
  },

  updateCuenta: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put(`/finanzas/cuentas/${id}`, data);
      if (!response.data?.success) {
        set({ loading: false });
        return { success: false, message: response.data?.mensaje || 'Error al actualizar' };
      }
      set((state) => ({
          cuentas: state.cuentas.map((c) => (c.id_cuenta === id ? response.data.data : c)),
        loading: false,
      }));
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, message: error.response?.data?.mensaje || error.response?.data?.error };
    }
  },

  deleteCuenta: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.delete(`/finanzas/cuentas/${id}`);
      if (!response.data?.success) {
        set({ loading: false });
        return { success: false, message: response.data?.mensaje || 'Error al eliminar' };
      }
      
      const filtroEstado = get().filtroEstado;
      
      // Recargar según el filtro actual
      if (filtroEstado) {
        await get().fetchCuentasByEstado(filtroEstado);
      } else {
        await get().fetchCuentas();
      }
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, message: error.response?.data?.mensaje || error.response?.data?.error };
    }
  },

  // Transacciones
  fetchTransacciones: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/finanzas/transacciones');
      const data = response.data?.success ? response.data.data : [];
      set({ transacciones: data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  createTransaccion: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/finanzas/transacciones', data);
      if (!response.data?.success) {
        set({ loading: false });
        return { success: false, message: response.data?.mensaje || 'Error al crear' };
      }
      set((state) => ({ 
        transacciones: [response.data.data, ...state.transacciones], 
        loading: false 
      }));
      // Recargar cuentas para ver el saldo actualizado
      get().fetchCuentas();
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, message: error.response?.data?.mensaje || error.response?.data?.error };
    }
  },

  deleteTransaccion: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.delete(`/finanzas/transacciones/${id}`);
      if (!response.data?.success) {
        set({ loading: false });
        return { success: false, message: response.data?.mensaje || 'Error al eliminar' };
      }
      set((state) => ({
        transacciones: state.transacciones.filter((t) => t.id_transaccion !== id),
        loading: false,
      }));
      // Recargar cuentas para ver el saldo actualizado
      get().fetchCuentas();
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, message: error.response?.data?.error };
    }
  },
}));