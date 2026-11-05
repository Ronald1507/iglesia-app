import { create } from 'zustand';
import api from '../services/api';

export const useCongregationStore = create((set, get) => ({
  congregaciones: [],
  loading: false,
  error: null,
  estados: [], // Estados desde la DB
  filtroEstado: null, // Estado actualmente seleccionado

  fetchCongregaciones: async () => {
    set({ loading: true, error: null, filtroEstado: null });
    try {
      const response = await api.get('/congregaciones');
      const data = Array.isArray(response.data.data) ? response.data.data : [];
      set({ congregaciones: data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchEstados: async () => {
    try {
      const response = await api.get('/congregaciones/opciones');
      const estados = response.data.data?.estados || [];
      set({ estados });
      return estados;
    } catch (error) {
      console.error('Error fetching estados:', error);
      return [];
    }
  },

  fetchCongregacionesByEstado: async (idEstado) => {
    set({ loading: true, error: null, filtroEstado: idEstado });
    try {
      const response = await api.get(`/congregaciones/estado/${idEstado}`);
      const data = Array.isArray(response.data.data) ? response.data.data : [];
      set({ congregaciones: data, loading: false });
    } catch (error) {
      console.error('[fetchCongregacionesByEstado] Error:', error);
      set({ error: error.message, loading: false, congregaciones: [] });
    }
  },

  createCongregacion: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/congregaciones', data);
      if (!response.data?.success) {
        set({ loading: false });
        return { success: false, message: response.data?.mensaje || 'Error al crear' };
      }
      set((state) => ({ 
        congregaciones: [...state.congregaciones, response.data.data], 
        loading: false 
      }));
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, message: error.response?.data?.mensaje || error.response?.data?.error };
    }
  },

  updateCongregacion: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put(`/congregaciones/${id}`, data);
      if (!response.data?.success) {
        set({ loading: false });
        return { success: false, message: response.data?.mensaje || 'Error al actualizar' };
      }
      set((state) => ({
          congregaciones: state.congregaciones.map((c) => (c.id_congregacion === id ? response.data.data : c)),
        loading: false,
      }));
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, message: error.response?.data?.mensaje || error.response?.data?.error };
    }
  },

  deleteCongregacion: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.delete(`/congregaciones/${id}`);
      if (!response.data?.success) {
        set({ loading: false });
        return { success: false, message: response.data?.mensaje || 'Error al eliminar' };
      }
      
      const filtroEstado = get().filtroEstado;
      
      // Recargar según el filtro actual
      if (filtroEstado) {
        await get().fetchCongregacionesByEstado(filtroEstado);
      } else {
        await get().fetchCongregaciones();
      }
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, message: error.response?.data?.mensaje || error.response?.data?.error };
    }
  },
}));