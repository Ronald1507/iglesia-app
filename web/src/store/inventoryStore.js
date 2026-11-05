import { create } from 'zustand';
import api from '../services/api';

export const useInventoryStore = create((set, get) => ({
  items: [],
  loading: false,
  error: null,
  estados: [],
  filtroEstado: null,

  fetchItems: async () => {
    set({ loading: true, error: null, filtroEstado: null });
    try {
      const response = await api.get('/inventario');
      const data = response.data?.success ? response.data.data : [];
      set({ items: Array.isArray(data) ? data : [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchEstados: async () => {
    try {
      const response = await api.get('/inventario/opciones');
      const estados = response.data?.success ? response.data.data?.estados || [] : [];
      set({ estados });
      return estados;
    } catch (error) {
      console.error('Error fetching estados:', error);
      return [];
    }
  },

  fetchItemsByEstado: async (idEstado) => {
    set({ loading: true, error: null, filtroEstado: idEstado });
    try {
      const response = await api.get(`/inventario/estado/${idEstado}`);
      const data = response.data?.success ? response.data.data : [];
      set({ items: Array.isArray(data) ? data : [], loading: false });
    } catch (error) {
      console.error('[fetchItemsByEstado] Error:', error);
      set({ error: error.message, loading: false, items: [] });
    }
  },

  createItem: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/inventario', data);
      if (!response.data?.success) {
        set({ loading: false });
        return { success: false, message: response.data?.mensaje };
      }
      set((state) => ({ items: [...state.items, response.data.data], loading: false }));
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, message: error.response?.data?.mensaje || error.response?.data?.error };
    }
  },

  updateItem: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put(`/inventario/${id}`, data);
      if (!response.data?.success) {
        set({ loading: false });
        return { success: false, message: response.data?.mensaje };
      }
      set((state) => ({
        items: state.items.map((i) => (i.id_item === id ? response.data.data : i)),
        loading: false,
      }));
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, message: error.response?.data?.mensaje || error.response?.data?.error };
    }
  },

  deleteItem: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.delete(`/inventario/${id}`);
      if (!response.data?.success) {
        set({ loading: false });
        return { success: false, message: response.data?.mensaje };
      }
      const filtroEstado = get().filtroEstado;
      if (filtroEstado) {
        await get().fetchItemsByEstado(filtroEstado);
      } else {
        await get().fetchItems();
      }
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, message: error.response?.data?.mensaje || error.response?.data?.error };
    }
  },
}));