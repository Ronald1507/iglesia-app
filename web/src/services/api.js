import axios from 'axios';
import { toast } from 'sonner';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

// Interceptor para agregar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar respuestas
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Extraer mensaje del error según estructura ApiResponse
    const responseData = error.response?.data;
    const mensaje = responseData?.mensaje || responseData?.error || 'Error de conexión';
    
    // Errores 401 ya se manejan en el login
    if (error.response?.status !== 401) {
      // Si es un error esperado del backend con formato ApiResponse, no mostrar toast aquí
      // Los componentes manejan sus propios toasts
      if (responseData?.success === false) {
        // Error del backend - ya se maneja en el componente
      } else {
        // Error de red u otro
        toast.error(mensaje);
      }
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
