// frontend/src/services/api.js
import axios from 'axios';
import toast from 'react-hot-toast';

// Configuración base de la API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Crear instancia de axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para requests
apiClient.interceptors.request.use(
  (config) => {
    // Agregar timestamp para evitar cache en algunas requests
    if (config.method === 'get' && config.params) {
      config.params._t = Date.now();
    }
    
    // Logs en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data,
      });
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para responses
apiClient.interceptors.response.use(
  (response) => {
    // Logs en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
    }
    
    return response;
  },
  (error) => {
    // Manejo centralizado de errores
    handleApiError(error);
    return Promise.reject(error);
  }
);

// Función para manejar errores de API
function handleApiError(error) {
  console.error('❌ API Error:', error);
  
  if (error.response) {
    // El servidor respondió con un status de error
    const status = error.response.status;
    const message = error.response.data?.detail || error.response.data?.message || 'Error del servidor';
    
    switch (status) {
      case 400:
        toast.error(`Error: ${message}`);
        break;
      case 401:
        toast.error('No autorizado');
        break;
      case 403:
        toast.error('Sin permisos para esta operación');
        break;
      case 404:
        toast.error('Recurso no encontrado');
        break;
      case 422:
        toast.error('Datos inválidos');
        break;
      case 500:
        toast.error('Error interno del servidor');
        break;
      default:
        toast.error(`Error: ${message}`);
    }
  } else if (error.request) {
    // La request se hizo pero no hubo respuesta
    toast.error('No se puede conectar con el servidor');
  } else {
    // Algo más pasó
    toast.error('Error inesperado');
  }
}

// Servicio principal de API
export const apiService = {
  // Métodos HTTP básicos
  get: (url, config = {}) => apiClient.get(url, config),
  post: (url, data, config = {}) => apiClient.post(url, data, config),
  put: (url, data, config = {}) => apiClient.put(url, data, config),
  patch: (url, data, config = {}) => apiClient.patch(url, data, config),
  delete: (url, config = {}) => apiClient.delete(url, config),
  
  // Método para uploads de archivos
  upload: (url, formData, onUploadProgress) => {
    return apiClient.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onUploadProgress,
    });
  },
  
  // Método para descargas
  download: async (url, filename) => {
    try {
      const response = await apiClient.get(url, {
        responseType: 'blob',
      });
      
      // Crear URL para el blob
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      
      // Crear elemento temporal para descarga
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      return response;
    } catch (error) {
      toast.error('Error al descargar archivo');
      throw error;
    }
  },
  
  // Método para requests con retry automático
  withRetry: async (requestFn, maxRetries = 3, delay = 1000) => {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        
        // Si es el último intento, lanzar el error
        if (i === maxRetries - 1) {
          throw error;
        }
        
        // Esperar antes del siguiente intento
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
    
    throw lastError;
  },
  
  // Método para cancelar requests
  createCancelToken: () => axios.CancelToken.source(),
  
  // Verificar si un error es de cancelación
  isCancel: (error) => axios.isCancel(error),
};

// Funciones de utilidad específicas
export const apiUtils = {
  // Construir URL con parámetros
  buildUrl: (endpoint, params = {}) => {
    const url = new URL(endpoint, API_BASE_URL);
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        url.searchParams.append(key, params[key]);
      }
    });
    return url.toString();
  },
  
  // Formatear datos para FormData
  toFormData: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    return formData;
  },
  
  // Manejar errores de validación
  extractValidationErrors: (error) => {
    if (error.response?.status === 422 && error.response.data?.detail) {
      return error.response.data.detail.reduce((acc, item) => {
        const field = item.loc[item.loc.length - 1];
        acc[field] = item.msg;
        return acc;
      }, {});
    }
    return {};
  },
  
  // Formatear parámetros de fecha
  formatDateParams: (startDate, endDate) => {
    return {
      start_date: startDate?.toISOString(),
      end_date: endDate?.toISOString(),
    };
  },
};

// Configuración para modo offline (básico)
export const offlineManager = {
  // Lista de requests que se pueden cachear
  cacheableEndpoints: [
    '/products/search',
    '/inventory/search',
    '/reports/dashboard',
  ],
  
  // Verificar si hay conexión
  isOnline: () => navigator.onLine,
  
  // Manejar modo offline
  handleOfflineRequest: (url, fallbackData = null) => {
    if (!navigator.onLine) {
      toast.error('Sin conexión a internet');
      return Promise.reject(new Error('Offline'));
    }
    return Promise.resolve();
  },
};

export default apiService;