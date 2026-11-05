import { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function PrivateRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const fetchUser = useAuthStore((state) => state.fetchUser);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      if (isAuthenticated) {
        try {
          await fetchUser();
        } catch (_error) {
          // Token inválido, logout
          useAuthStore.getState().logout();
        }
      }
      setIsValidating(false);
    };

    validateToken();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validando sesión...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
}