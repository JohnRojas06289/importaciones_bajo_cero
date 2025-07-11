// frontend/src/hooks/useSystemHealth.js
import React from 'react';
import { useQuery } from 'react-query';
import { apiService } from '../services/api';

/**
 * Hook para verificar la salud del sistema
 * Verifica que el backend esté respondiendo correctamente
 */
export function useSystemHealth() {
  return useQuery(
    'systemHealth',
    async () => {
      try {
        // Intentar conectar con el endpoint de salud
        const response = await apiService.get('/health');
        return response.data;
      } catch (error) {
        // Si el backend no responde, lanzar error
        throw new Error('No se puede conectar con el servidor');
      }
    },
    {
      retry: 3,
      retryDelay: 1000,
      refetchInterval: 30000, // Verificar cada 30 segundos
      refetchIntervalInBackground: true,
      staleTime: 0, // Siempre hacer la verificación
    }
  );
}

/**
 * Hook para obtener métricas en tiempo real del sistema
 */
export function useRealTimeMetrics() {
  return useQuery(
    'realTimeMetrics',
    () => apiService.get('/sales/metrics/realtime').then(res => res.data),
    {
      refetchInterval: 60000, // Actualizar cada minuto
      refetchIntervalInBackground: true,
      staleTime: 30000, // Considerar fresco por 30 segundos
    }
  );
}

/**
 * Hook para verificar la conectividad de red
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Hook para verificar la salud completa del sistema
 * Combina conectividad de red y estado del backend
 */
export function useCompleteSystemHealth() {
  const networkStatus = useNetworkStatus();
  const { data: backendHealth, isLoading, error } = useSystemHealth();

  return {
    isOnline: networkStatus,
    backendConnected: !error && backendHealth?.status === 'healthy',
    backendHealth,
    isLoading,
    error,
    systemStatus: networkStatus && !error && backendHealth?.status === 'healthy' ? 'healthy' : 'unhealthy'
  };
}

/**
 * Hook para obtener información de diagnóstico del sistema
 */
export function useSystemDiagnostics() {
  return useQuery(
    'systemDiagnostics',
    async () => {
      try {
        const response = await apiService.get('/health/diagnostics');
        return response.data;
      } catch (error) {
        return {
          database: { status: 'error', error: error.message },
          cache: { status: 'error', error: error.message },
          api: { status: 'error', error: error.message }
        };
      }
    },
    {
      retry: 1,
      retryDelay: 2000,
      refetchInterval: 60000, // Verificar cada minuto
      staleTime: 30000,
    }
  );
}