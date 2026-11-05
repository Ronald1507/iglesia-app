import { create } from 'zustand';
import api from '../services/api';

export const useUserStore = create((set, get) => ({
  usuarios: [],
  loading: false,
  error: null,
  estados: [],
  filtroEstado: null,

  fetchUsuarios: async () => {
    set({ loading: true, error: null, filtroEstado: null });
    try {
      const response = await api.get('/usuarios');
      const data = response.data?.success ? response.data.data : [];
      set({ usuarios: Array.isArray(data) ? data : [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchEstados: async () => {
    try {
      const response = await api.get('/usuarios/opciones');
      const estados = response.data?.success ? response.data.data?.estados || [] : [];
      set({ estados });
      return estados;
    } catch (error) {
      console.error('Error fetching estados:', error);
      return [];
    }
  },

  fetchUsuariosByEstado: async (idEstado) => {
    set({ loading: true, error: null, filtroEstado: idEstado });
    try {
      const response = await api.get(`/usuarios/estado/${idEstado}`);
      const data = response.data?.success ? response.data.data : [];
      set({ usuarios: Array.isArray(data) ? data : [], loading: false });
    } catch (error) {
      console.error('[fetchUsuariosByEstado] Error:', error);
      set({ error: error.message, loading: false, usuarios: [] });
    }
  },

  createUsuario: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/usuarios', data);
      if (!response.data?.success) {
        set({ loading: false });
        return { success: false, message: response.data?.mensaje };
      }
      set((state) => ({ usuarios: [...state.usuarios, response.data.data], loading: false }));
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, message: error.response?.data?.mensaje || error.response?.data?.error };
    }
  },

  updateUsuario: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put(`/usuarios/${id}`, data);
      if (!response.data?.success) {
        set({ loading: false });
        return { success: false, message: response.data?.mensaje };
      }
      set((state) => ({
        usuarios: state.usuarios.map((u) => (u.id_usuario === id ? response.data.data : u)),
        loading: false,
      }));
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, message: error.response?.data?.mensaje || error.response?.data?.error };
    }
  },

  deleteUsuario: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.delete(`/usuarios/${id}`);
      if (!response.data?.success) {
        set({ loading: false });
        return { success: false, message: response.data?.mensaje };
      }
      const filtroEstado = get().filtroEstado;
      if (filtroEstado) {
        await get().fetchUsuariosByEstado(filtroEstado);
      } else {
        await get().fetchUsuarios();
      }
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, message: error.response?.data?.mensaje || error.response?.data?.error };
    }
  },
}));