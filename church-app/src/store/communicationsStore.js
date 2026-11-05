import { create } from 'zustand';
import api from '../services/api';

export const useCommunicationsStore = create((set, get) => ({
  comunicaciones: [],
  loading: false,
  error: null,
  opciones: { estados: [], instituciones: [] },

  fetchComunicaciones: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/comunicaciones');
      const data = response.data?.success ? response.data.data : [];
      set({ comunicaciones: Array.isArray(data) ? data : [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchOpciones: async () => {
    try {
      const [estadosRes, institucionesRes] = await Promise.all([
        api.get('/comunicaciones/listado/estados'),
        api.get('/comunicaciones/listado/instituciones'),
      ]);
      set({
        opciones: {
          estados: estadosRes.data?.success ? estadosRes.data.data : [],
          instituciones: institucionesRes.data?.success ? institucionesRes.data.data : [],
        },
      });
    } catch (error) {
      set({ error: error.message });
      return { success: false, message: error.response?.data?.mensaje || error.response?.data?.error };
    }
  },

  createComunicacion: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/comunicaciones', data);
      if (!response.data?.success) {
        set({ loading: false });
        return { success: false, message: response.data?.mensaje || 'Error al crear' };
      }
      await get().fetchComunicaciones();
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, message: error.response?.data?.mensaje || error.response?.data?.error };
    }
  },

  updateComunicacion: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put(`/comunicaciones/${id}`, data);
      if (!response.data?.success) {
        set({ loading: false });
        return { success: false, message: response.data?.mensaje || 'Error al actualizar' };
      }
      await get().fetchComunicaciones();
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, message: error.response?.data?.mensaje || error.response?.data?.error };
    }
  },

  deleteComunicacion: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.delete(`/comunicaciones/${id}`);
      if (!response.data?.success) {
        set({ loading: false });
        return { success: false, message: response.data?.mensaje || 'Error al anular' };
      }
      await get().fetchComunicaciones();
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, message: error.response?.data?.mensaje || error.response?.data?.error };
    }
  },

  enviarComunicacion: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.patch(`/comunicaciones/${id}/enviar`);
      if (!response.data?.success) {
        set({ loading: false });
        return { success: false, message: response.data?.mensaje || 'Error al enviar' };
      }
      await get().fetchComunicaciones();
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, message: error.response?.data?.mensaje || error.response?.data?.error };
    }
  },
}));
