import { create } from 'zustand';
import api from '../services/api';

export const useAuditStore = create((set, get) => ({
  logs: [],
  tablas: [],
  loading: false,
  error: null,
  filtroTabla: '',
  filtroAccion: '',

  fetchLogs: async (filtroTabla, filtroAccion) => {
    // Use provided args or fall back to current state
    const tabla = filtroTabla !== undefined ? filtroTabla : get().filtroTabla;
    const accion = filtroAccion !== undefined ? filtroAccion : get().filtroAccion;

    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (tabla) params.append('tabla', tabla);
      if (accion) params.append('accion', accion);
      params.append('limit', '100');
      const response = await api.get(`/auditoria?${params.toString()}`);
      const data = response.data?.success ? response.data.data : [];
      set({ logs: Array.isArray(data) ? data : [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchTablas: async () => {
    try {
      const response = await api.get('/auditoria/listado/tablas');
      const data = response.data?.success ? response.data.data : [];
      set({ tablas: Array.isArray(data) ? data : [] });
    } catch (error) {
      set({ error: error.message });
    }
  },

  setFiltros: (tabla, accion) => {
    set({ filtroTabla: tabla, filtroAccion: accion });
    get().fetchLogs(tabla, accion);
  },
}));
