import axios from 'axios';

// Configuración de la API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8002/api';
const MOCK_API = false; // Deshabilitado para usar backend real
const DEBUG_API = process.env.NODE_ENV === 'development';

// Crear instancia de axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Mock data para desarrollo
const MOCK_DATA = {
  products: [
    {
      id: 1,
      name: 'Chaqueta Deportiva Nike',
      short_code: 'CHQ001',
      sku: 'NK-CHQ-001',
      category: 'Chaquetas',
      subcategory: 'Deportivas',
      brand: 'Nike',
      price: 89.99,
      available_stock: 15,
      location: 'Exhibición Principal',
      size: 'M',
      color: 'Negro',
      description: 'Chaqueta deportiva Nike con tecnología Dri-FIT',
      image_url: 'https://via.placeholder.com/300x300?text=Chaqueta+Nike'
    },
    {
      id: 2,
      name: 'Gorra Adidas Originals',
      short_code: 'GOR001',
      sku: 'AD-GOR-001',
      category: 'Gorras',
      subcategory: 'Snapback',
      brand: 'Adidas',
      price: 24.99,
      available_stock: 8,
      location: 'Exhibición Gorras',
      size: 'Única',
      color: 'Blanco',
      description: 'Gorra Adidas Originals con logo bordado',
      image_url: 'https://via.placeholder.com/300x300?text=Gorra+Adidas'
    },
    {
      id: 3,
      name: 'Sudadera Puma Essential',
      short_code: 'SUD001',
      sku: 'PM-SUD-001',
      category: 'Sudaderas',
      subcategory: 'Casual',
      brand: 'Puma',
      price: 59.99,
      available_stock: 12,
      location: 'Exhibición Principal',
      size: 'L',
      color: 'Gris',
      description: 'Sudadera Puma con capucha y bolsillo frontal',
      image_url: 'https://via.placeholder.com/300x300?text=Sudadera+Puma'
    },
    {
      id: 4,
      name: 'Pantalón Under Armour',
      short_code: 'PAN001',
      sku: 'UA-PAN-001',
      category: 'Pantalones',
      subcategory: 'Deportivos',
      brand: 'Under Armour',
      price: 79.99,
      available_stock: 6,
      location: 'Bodega Principal',
      size: 'M',
      color: 'Negro',
      description: 'Pantalón deportivo Under Armour con tecnología HeatGear',
      image_url: 'https://via.placeholder.com/300x300?text=Pantalon+UA'
    },
    {
      id: 5,
      name: 'Camiseta Jordan Retro',
      short_code: 'CAM001',
      sku: 'JD-CAM-001',
      category: 'Camisetas',
      subcategory: 'Retro',
      brand: 'Jordan',
      price: 39.99,
      available_stock: 20,
      location: 'Exhibición Principal',
      size: 'M',
      color: 'Rojo',
      description: 'Camiseta Jordan Retro con logo clásico',
      image_url: 'https://via.placeholder.com/300x300?text=Camiseta+Jordan'
    },
    {
      id: 6,
      name: 'Gorra New Era Yankees',
      short_code: 'GOR002',
      sku: 'NE-GOR-002',
      category: 'Gorras',
      subcategory: 'Baseball',
      brand: 'New Era',
      price: 34.99,
      available_stock: 5,
      location: 'Exhibición Gorras',
      size: 'Única',
      color: 'Azul',
      description: 'Gorra New Era oficial de los Yankees',
      image_url: 'https://via.placeholder.com/300x300?text=Gorra+Yankees'
    }
  ],
  locations: [
    { id: 1, name: 'Exhibición Principal', type: 'display', section: 'Frente' },
    { id: 2, name: 'Exhibición Gorras', type: 'display', section: 'Pared Izquierda' },
    { id: 3, name: 'Bodega Chaquetas', type: 'storage', section: 'Bodega Principal' },
    { id: 4, name: 'Bodega Gorras', type: 'storage', section: 'Bodega Principal' },
    { id: 5, name: 'Apartados', type: 'reserve', section: 'Mostrador' }
  ]
};

// Mock para toast (notificaciones)
const toast = {
  error: (message) => {
    if (DEBUG_API) {
      console.error('🔴 Error:', message);
    }
  },
  success: (message) => {
    if (DEBUG_API) {
      console.log('🟢 Success:', message);
    }
  },
  warning: (message) => {
    if (DEBUG_API) {
      console.warn('🟡 Warning:', message);
    }
  }
};

// Interceptores para requests y responses
apiClient.interceptors.request.use(
  (config) => {
    // Agregar token si está disponible
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (DEBUG_API) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }
    
    return config;
  },
  (error) => {
    if (DEBUG_API) {
      console.error('❌ Request Error:', error);
    }
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    if (DEBUG_API) {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
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
  if (DEBUG_API) {
    console.error('❌ API Error:', error);
  }
  
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

// Servicio principal de API con soporte para mock
export const apiService = {
  // Métodos HTTP básicos con conexión real al backend
  async get(url, config = {}) {
    if (MOCK_API) {
      return this.mockGet(url);
    }
    try {
      const response = await apiClient.get(url, config);
      return response;
    } catch (error) {
      if (DEBUG_API) {
        console.error('API GET error:', error.message);
      }
      throw error;
    }
  },
  
  async post(url, data, config = {}) {
    if (MOCK_API) {
      return this.mockPost(url, data);
    }
    try {
      const response = await apiClient.post(url, data, config);
      return response;
    } catch (error) {
      if (DEBUG_API) {
        console.error('API POST error:', error.message);
      }
      throw error;
    }
  },
  
  put: (url, data, config = {}) => apiClient.put(url, data, config),
  patch: (url, data, config = {}) => apiClient.patch(url, data, config),
  delete: (url, config = {}) => apiClient.delete(url, config),
  
  // Mock responses para desarrollo y fallback
  mockGet(url) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (url === '/health') {
          resolve({ data: { status: 'healthy', version: '1.0.0' } });
        } else if (url === '/products/search') {
          resolve({ data: { results: MOCK_DATA.products, total: MOCK_DATA.products.length } });
        } else if (url === '/inventory/locations') {
          resolve({ data: MOCK_DATA.locations });
        } else if (url.startsWith('/products/quick-search/')) {
          const term = url.split('/').pop().toLowerCase();
          const filtered = MOCK_DATA.products.filter(p => 
            p.name.toLowerCase().includes(term) ||
            p.short_code.toLowerCase().includes(term) ||
            p.category.toLowerCase().includes(term)
          );
          resolve({ data: { results: filtered.slice(0, 10) } });
        } else {
          resolve({ data: [] });
        }
      }, 500);
    });
  },

  mockPost(url, data) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (url === '/products/scan') {
          const code = data.code?.toLowerCase();
          const product = MOCK_DATA.products.find(p => 
            p.short_code.toLowerCase() === code ||
            p.sku.toLowerCase() === code
          );
          
          if (product) {
            resolve({ 
              data: { 
                found: true, 
                product,
                locations: [{ name: product.location, available_stock: product.available_stock }]
              } 
            });
          } else {
            resolve({ data: { found: false, message: 'Producto no encontrado' } });
          }
        } else {
          resolve({ data: { success: true } });
        }
      }, 300);
    });
  },
  
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