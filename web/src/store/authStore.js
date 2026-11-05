import { create } from 'zustand';
import api from '../services/api';

// Pestañas permitidas por nivel de acceso
const getAllowedTabs = (nivel) => {
  switch (nivel) {
    case 'SUPERADMIN':
      return ['dashboard', 'members', 'institutions', 'finances', 'events', 'inventory', 'users', 'congregations', 'family', 'spiritual', 'pastoral', 'communications', 'documents', 'offerings', 'audit'];
    case 'ADMIN':
      return ['dashboard', 'members', 'institutions', 'finances', 'events', 'inventory', 'family', 'spiritual', 'pastoral', 'communications', 'documents', 'offerings'];
    case 'USUARIO':
      return ['dashboard', 'events', 'profile'];
    default:
      return ['dashboard'];
  }
};

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  nivel: 'USUARIO',  // USUARIO, ADMIN, SUPERADMIN
  allowedTabs: ['dashboard'],

  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const apiData = response.data;
      
      if (!apiData.success) {
        return { 
          success: false, 
          message: apiData.mensaje || 'Error al iniciar sesión' 
        };
      }
      
      const { token, user } = apiData.data;
      
      localStorage.setItem('token', token);
      const nivel = user.nivel || 'USUARIO';
      const allowedTabs = getAllowedTabs(nivel);
      
      set({ 
        token, 
        user, 
        isAuthenticated: true,
        nivel,
        allowedTabs
      });
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.mensaje || error.response?.data?.error || 'Error al iniciar sesión' 
      };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null, isAuthenticated: false, nivel: 'USUARIO', allowedTabs: ['dashboard'] });
  },

  fetchUser: async () => {
    try {
      const response = await api.get('/auth/me');
      const apiData = response.data;
      
      if (!apiData.success) {
        get().logout();
        return;
      }
      
      const user = apiData.data;
      const nivel = user.nivel || user.role || 'USUARIO';
      const allowedTabs = getAllowedTabs(nivel);
      set({ user, nivel, allowedTabs });
    } catch (error) {
      console.error('fetchUser error:', error);
      get().logout();
    }
  },
}));
