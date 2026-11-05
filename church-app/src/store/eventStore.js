import { create } from 'zustand';
import api from '../services/api';

export const useEventStore = create((set, get) => ({
  eventos: [],
  loading: false,
  error: null,
  estados: [], // Estados desde la DB
  filtroEstado: null, // Estado actualmente seleccionado

  fetchEventos: async () => {
    set({ loading: true, error: null, filtroEstado: null });
    try {
      const response = await api.get('/eventos');
      const data = Array.isArray(response.data.data) ? response.data.data : [];
      set({ eventos: data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchEstados: async () => {
    try {
      const response = await api.get('/eventos/opciones');
      const estados = response.data.data?.estados || [];
      set({ estados });
      return estados;
    } catch (error) {
      console.error('Error fetching estados:', error);
      return [];
    }
  },

  fetchEventosByEstado: async (idEstado) => {
    set({ loading: true, error: null, filtroEstado: idEstado });
    try {
      const response = await api.get(`/eventos/estado/${idEstado}`);
      const data = Array.isArray(response.data.data) ? response.data.data : [];
      set({ eventos: data, loading: false });
    } catch (error) {
      console.error('[fetchEventosByEstado] Error:', error);
      set({ error: error.message, loading: false, eventos: [] });
    }
  },

  createEvento: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/eventos', data);
      if (!response.data?.success) {
        set({ loading: false });
        return { success: false, message: response.data?.mensaje || 'Error al crear' };
      }
      set((state) => ({ 
        eventos: [...state.eventos, response.data.data], 
        loading: false 
      }));
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, message: error.response?.data?.mensaje || error.response?.data?.error };
    }
  },

  updateEvento: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put(`/eventos/${id}`, data);
      if (!response.data?.success) {
        set({ loading: false });
        return { success: false, message: response.data?.mensaje || 'Error al actualizar' };
      }
      set((state) => ({
          eventos: state.eventos.map((e) => (e.id_evento === id ? response.data.data : e)),
        loading: false,
      }));
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, message: error.response?.data?.mensaje || error.response?.data?.error };
    }
  },

  deleteEvento: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.delete(`/eventos/${id}`);
      if (!response.data?.success) {
        set({ loading: false });
        return { success: false, message: response.data?.mensaje || 'Error al eliminar' };
      }
      
      const filtroEstado = get().filtroEstado;
      
      // Recargar según el filtro actual
      if (filtroEstado) {
        await get().fetchEventosByEstado(filtroEstado);
      } else {
        await get().fetchEventos();
      }
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, message: error.response?.data?.mensaje || error.response?.data?.error };
    }
  },
}));