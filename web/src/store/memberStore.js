import { create } from 'zustand';
import api from '../services/api';

export const useMemberStore = create((set, get) => ({
  members: [],
  loading: false,
  error: null,
  estados: [],
  filtroEstado: null,

  fetchMembers: async () => {
    set({ loading: true, error: null, filtroEstado: null });
    try {
      const response = await api.get('/miembros');
      // Nueva estructura ApiResponse: { success, mensaje, data }
      const data = response.data?.success ? response.data.data : [];
      set({ members: Array.isArray(data) ? data : [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false, members: [] });
    }
  },

  fetchEstados: async () => {
    try {
      const response = await api.get('/miembros/opciones');
      const estados = response.data?.success ? response.data.data?.estados || [] : [];
      set({ estados });
      return estados;
    } catch (error) {
      console.error('Error fetching estados:', error);
      return [];
    }
  },

  fetchMembersByEstado: async (idEstado) => {
    set({ loading: true, error: null, filtroEstado: idEstado });
    try {
      const response = await api.get(`/miembros/estado/${idEstado}`);
      const data = response.data?.success ? response.data.data : [];
      set({ members: Array.isArray(data) ? data : [], loading: false });
    } catch (error) {
      console.error('[fetchMembersByEstado] Error:', error);
      set({ error: error.message, loading: false, members: [] });
    }
  },

  fetchInactivos: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/miembros/todos');
      const data = response.data?.success ? response.data.data : [];
      set({ members: Array.isArray(data) ? data : [], loading: false });
    } catch (error) {
      console.error('[fetchInactivos] Error:', error);
      set({ error: error.message, loading: false, members: [] });
    }
  },

  fetchEliminados: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/miembros/eliminados');
      const data = response.data?.success ? response.data.data : [];
      set({ members: Array.isArray(data) ? data : [], loading: false });
    } catch (error) {
      console.error('[fetchEliminados] Error:', error);
      set({ error: error.message, loading: false, members: [] });
    }
  },

  toggleMostrarInactivos: async () => {
    const currentMostrarInactivos = get().mostrarInactivos;
    const newValue = !currentMostrarInactivos;
    
    set({ mostrarInactivos: newValue, mostrarEliminados: false });
    
    if (newValue) {
      await get().fetchInactivos();
    } else {
      await get().fetchMembers();
    }
  },

  toggleMostrarEliminados: async () => {
    const currentMostrarEliminados = get().mostrarEliminados;
    const newValue = !currentMostrarEliminados;
    
    set({ mostrarEliminados: newValue, mostrarInactivos: false });
    
    if (newValue) {
      await get().fetchEliminados();
    } else {
      await get().fetchMembers();
    }
  },

  toggleMemberStatus: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.patch(`/miembros/${id}/status`);
      
      // Verificar respuesta según nueva estructura
      if (!response.data?.success) {
        const msg = response.data?.mensaje || 'Error al cambiar estado';
        set({ loading: false });
        return { success: false, message: msg };
      }
      
      const filtroEstado = get().filtroEstado;
      
      if (filtroEstado) {
        await get().fetchMembersByEstado(filtroEstado);
      } else {
        await get().fetchMembers();
      }
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, message: error.response?.data?.mensaje || error.response?.data?.error };
    }
  },

  createMember: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/miembros', data);
      
      if (!response.data?.success) {
        const msg = response.data?.mensaje || 'Error al crear';
        set({ loading: false });
        return { success: false, message: msg };
      }
      
      set((state) => ({ 
        members: [...state.members, response.data.data], 
        loading: false 
      }));
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, message: error.response?.data?.mensaje || error.response?.data?.error };
    }
  },

  updateMember: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put(`/miembros/${id}`, data);
      
      if (!response.data?.success) {
        const msg = response.data?.mensaje || 'Error al actualizar';
        set({ loading: false });
        return { success: false, message: msg };
      }
      
      set((state) => ({
        members: state.members.map((m) => (m.id_miembro === id ? response.data.data : m)),
        loading: false,
      }));
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, message: error.response?.data?.mensaje || error.response?.data?.error };
    }
  },

  deleteMember: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.delete(`/miembros/${id}`);
      
      if (!response.data?.success) {
        const msg = response.data?.mensaje || 'Error al eliminar';
        set({ loading: false });
        return { success: false, message: msg };
      }
      
      const filtroEstado = get().filtroEstado;
      
      if (filtroEstado) {
        await get().fetchMembersByEstado(filtroEstado);
      } else {
        await get().fetchMembers();
      }
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, message: error.response?.data?.mensaje || error.response?.data?.error };
    }
  },

  // Obtener un miembro específico con todas sus relaciones
  getMember: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/miembros/${id}`);
      
      if (!response.data?.success) {
        const msg = response.data?.mensaje || 'Miembro no encontrado';
        set({ loading: false });
        return { success: false, message: msg };
      }
      
      set({ loading: false });
      return { success: true, data: response.data.data };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, message: error.response?.data?.mensaje || error.response?.data?.error };
    }
  },
}));