import { create } from 'zustand';
import api from '../services/api';

export const useDocumentStore = create((set, get) => ({
  documentos: [],
  loading: false,
  error: null,
  opciones: { estados: [], miembros: [] },

  fetchDocumentos: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/documentos');
      const data = response.data?.success ? response.data.data : [];
      set({ documentos: Array.isArray(data) ? data : [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false, documentos: [] });
    }
  },

  fetchOpciones: async () => {
    try {
      const [estadosRes, miembrosRes] = await Promise.all([
        api.get('/documentos/listado/estados'),
        api.get('/documentos/listado/miembros'),
      ]);
      set({
        opciones: {
          estados: estadosRes.data?.success ? estadosRes.data.data : [],
          miembros: miembrosRes.data?.success ? miembrosRes.data.data : [],
        },
      });
    } catch (error) {
      console.error('Error fetching opciones documentos:', error);
    }
  },

  createDocumento: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/documentos', data);
      if (!response.data?.success) {
        set({ loading: false });
        return { success: false, message: response.data?.mensaje || 'Error al crear' };
      }
      await get().fetchDocumentos();
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, message: error.response?.data?.mensaje || error.response?.data?.error };
    }
  },

  updateDocumento: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put(`/documentos/${id}`, data);
      if (!response.data?.success) {
        set({ loading: false });
        return { success: false, message: response.data?.mensaje || 'Error al actualizar' };
      }
      await get().fetchDocumentos();
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, message: error.response?.data?.mensaje || error.response?.data?.error };
    }
  },

  deleteDocumento: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.delete(`/documentos/${id}`);
      if (!response.data?.success) {
        set({ loading: false });
        return { success: false, message: response.data?.mensaje || 'Error al anular' };
      }
      await get().fetchDocumentos();
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, message: error.response?.data?.mensaje || error.response?.data?.error };
    }
  },
}));
