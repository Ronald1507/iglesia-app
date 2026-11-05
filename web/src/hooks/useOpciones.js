import { useState, useCallback } from 'react';
import api from '../services/api';

/**
 * Hook para cargar opciones bajo demanda (lazy loading)
 * Evita cargar /opciones al inicio, solo cuando se necesita (modal, filtro)
 * 
 * @param {string} endpoint - Endpoint de opciones (ej: '/miembros/opciones')
 * @param {string} storeFetch - Función del store para fetchEstados (opcional)
 */
export function useOpciones(endpoint, storeFetch) {
  const [opciones, setOpciones] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const loadOpciones = useCallback(async () => {
    if (loaded && opciones) return opciones;

    setLoading(true);
    try {
      const [opcionesRes] = await Promise.all([
        api.get(endpoint),
        storeFetch ? storeFetch() : Promise.resolve(null)
      ]);

      // Nuevo formato ApiResponse: { success, mensaje, data }
      const opcionesData = opcionesRes.data?.success ? opcionesRes.data.data : {};
      
      const data = {
        ...opcionesData,
        // Si el store ya tiene estados, usarlos; si no, tomarlos del endpoint
        estados: opcionesData.estados || []
      };

      setOpciones(data);
      setLoaded(true);
      setLoading(false);
      return data;
    } catch (error) {
      console.error('Error loading opciones:', error);
      setLoading(false);
      throw error;
    }
  }, [endpoint, storeFetch, loaded, opciones]);

  const resetOpciones = useCallback(() => {
    setOpciones(null);
    setLoaded(false);
  }, []);

  return {
    opciones,
    loadingOpciones: loading,
    loaded,
    loadOpciones,
    resetOpciones
  };
}
