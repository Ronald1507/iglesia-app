import { create } from 'zustand';
import api from '../services/api';

export const usePastoralStore = create((set, get) => ({
  visitas: [],
  peticiones: [],
  loading: false,
  error: null,
  opciones: { miembros: [], estadosVisita: [], estadosPeticion: [] },

  fetchVisitas: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/pastoral/visitas');
      set({ visitas: response.data?.success ? response.data.data : [], loading: false });
    } catch (error) {
      set({ loading: false, error: error.response?.data?.mensaje || error.response?.data?.error || 'Error al cargar visitas' });
    }
  },

  fetchPeticiones: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/pastoral/peticiones');
      set({ peticiones: response.data?.success ? response.data.data : [], loading: false });
    } catch (error) {
      set({ loading: false, error: error.response?.data?.mensaje || error.response?.data?.error || 'Error al cargar peticiones' });
    }
  },

  // Carga miembros+estadosVisita+estadosPeticion en paralelo para evitar duplicar la llamada a /miembros
  fetchOpciones: async () => {
    try {
      const [miembrosRes, estadosVisitaRes, estadosPeticionRes] = await Promise.all([
        api.get('/pastoral/listado/miembros'),
        api.get('/pastoral/listado/estados/visita'),
        api.get('/pastoral/listado/estados/peticion'),
      ]);
      set({
        opciones: {
          miembros: miembrosRes.data?.success ? miembrosRes.data.data : [],
          estadosVisita: estadosVisitaRes.data?.success ? estadosVisitaRes.data.data : [],
          estadosPeticion: estadosPeticionRes.data?.success ? estadosPeticionRes.data.data : [],
        },
      });
    } catch (error) {
      set({ error: error.response?.data?.mensaje || 'Error al cargar opciones' });
    }
  },

  createVisita: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/pastoral/visitas', data);
      if (response.data?.success) {
        await get().fetchVisitas();
        return { success: true };
      }
      set({ loading: false });
      return { success: false, message: response.data?.mensaje || 'Error al guardar' };
    } catch (error) {
      set({ loading: false });
      return { success: false, message: error.response?.data?.mensaje || error.response?.data?.error || 'Error al guardar visita' };
    }
  },

  updateVisita: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put(`/pastoral/visitas/${id}`, data);
      if (response.data?.success) {
        await get().fetchVisitas();
        return { success: true };
      }
      set({ loading: false });
      return { success: false, message: response.data?.mensaje || 'Error al actualizar' };
    } catch (error) {
      set({ loading: false });
      return { success: false, message: error.response?.data?.mensaje || error.response?.data?.error || 'Error al actualizar visita' };
    }
  },

  deleteVisita: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.delete(`/pastoral/visitas/${id}`);
      if (response.data?.success) {
        await get().fetchVisitas();
        return { success: true };
      }
      set({ loading: false });
      return { success: false, message: response.data?.mensaje || 'Error al cancelar' };
    } catch (error) {
      set({ loading: false });
      return { success: false, message: error.response?.data?.mensaje || error.response?.data?.error || 'Error al cancelar visita' };
    }
  },

  createPeticion: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/pastoral/peticiones', data);
      if (response.data?.success) {
        await get().fetchPeticiones();
        return { success: true };
      }
      set({ loading: false });
      return { success: false, message: response.data?.mensaje || 'Error al guardar' };
    } catch (error) {
      set({ loading: false });
      return { success: false, message: error.response?.data?.mensaje || error.response?.data?.error || 'Error al guardar petición' };
    }
  },

  updatePeticion: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put(`/pastoral/peticiones/${id}`, data);
      if (response.data?.success) {
        await get().fetchPeticiones();
        return { success: true };
      }
      set({ loading: false });
      return { success: false, message: response.data?.mensaje || 'Error al actualizar' };
    } catch (error) {
      set({ loading: false });
      return { success: false, message: error.response?.data?.mensaje || error.response?.data?.error || 'Error al actualizar petición' };
    }
  },

  deletePeticion: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.delete(`/pastoral/peticiones/${id}`);
      if (response.data?.success) {
        await get().fetchPeticiones();
        return { success: true };
      }
      set({ loading: false });
      return { success: false, message: response.data?.mensaje || 'Error al cerrar' };
    } catch (error) {
      set({ loading: false });
      return { success: false, message: error.response?.data?.mensaje || error.response?.data?.error || 'Error al cerrar petición' };
    }
  },
}));
