import { create } from 'zustand';
import api from '../services/api';

export const useFamilyStore = create((set, get) => ({
  relaciones: [],
  loading: false,
  error: null,
  opciones: { tipos: [], miembros: [] },

  fetchRelaciones: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/familia');
      const data = response.data?.success ? response.data.data : [];
      set({ relaciones: Array.isArray(data) ? data : [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false, relaciones: [] });
    }
  },

  fetchOpciones: async () => {
    try {
      const [tiposRes, miembrosRes] = await Promise.all([
        api.get('/familia/listado/tipos'),
        api.get('/familia/listado/miembros'),
      ]);
      set({
        opciones: {
          tipos: tiposRes.data?.success ? tiposRes.data.data : [],
          miembros: miembrosRes.data?.success ? miembrosRes.data.data : [],
        },
      });
    } catch (error) {
      console.error('Error fetching opciones familia:', error);
    }
  },

  createRelacion: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/familia', data);
      if (!response.data?.success) {
        set({ loading: false });
        return { success: false, message: response.data?.mensaje || 'Error al crear' };
      }
      await get().fetchRelaciones();
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, message: error.response?.data?.mensaje || error.response?.data?.error };
    }
  },

  updateRelacion: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put(`/familia/${id}`, data);
      if (!response.data?.success) {
        set({ loading: false });
        return { success: false, message: response.data?.mensaje || 'Error al actualizar' };
      }
      await get().fetchRelaciones();
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, message: error.response?.data?.mensaje || error.response?.data?.error };
    }
  },

  deleteRelacion: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.delete(`/familia/${id}`);
      if (!response.data?.success) {
        set({ loading: false });
        return { success: false, message: response.data?.mensaje || 'Error al eliminar' };
      }
      await get().fetchRelaciones();
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, message: error.response?.data?.mensaje || error.response?.data?.error };
    }
  },
}));
