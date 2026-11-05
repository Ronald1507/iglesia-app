import { create } from 'zustand';
import api from '../services/api';

export const useSpiritualStore = create((set, get) => ({
  hitos: [],
  loading: false,
  error: null,
  opciones: { tipos: [], miembros: [] },

  fetchHitos: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/espiritual');
      const data = response.data?.success ? response.data.data : [];
      set({ hitos: Array.isArray(data) ? data : [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false, hitos: [] });
    }
  },

  fetchOpciones: async () => {
    try {
      const [tiposRes, miembrosRes] = await Promise.all([
        api.get('/espiritual/listado/tipos'),
        api.get('/espiritual/listado/miembros'),
      ]);
      set({
        opciones: {
          tipos: tiposRes.data?.success ? tiposRes.data.data : [],
          miembros: miembrosRes.data?.success ? miembrosRes.data.data : [],
        },
      });
    } catch (error) {
      console.error('Error fetching opciones espiritual:', error);
    }
  },

  createHito: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/espiritual', data);
      if (!response.data?.success) {
        set({ loading: false });
        return { success: false, message: response.data?.mensaje || 'Error al crear' };
      }
      await get().fetchHitos();
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, message: error.response?.data?.mensaje || error.response?.data?.error };
    }
  },

  updateHito: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put(`/espiritual/${id}`, data);
      if (!response.data?.success) {
        set({ loading: false });
        return { success: false, message: response.data?.mensaje || 'Error al actualizar' };
      }
      await get().fetchHitos();
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, message: error.response?.data?.mensaje || error.response?.data?.error };
    }
  },

  deleteHito: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.delete(`/espiritual/${id}`);
      if (!response.data?.success) {
        set({ loading: false });
        return { success: false, message: response.data?.mensaje || 'Error al eliminar' };
      }
      await get().fetchHitos();
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, message: error.response?.data?.mensaje || error.response?.data?.error };
    }
  },
}));
