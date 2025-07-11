// Servicio de API real para conectar con el backend
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8002/api';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para logging en desarrollo
api.interceptors.request.use(
  (config) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }
    return response;
  },
  (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ API Error:', error);
    }
    return Promise.reject(error);
  }
);

export const realApiService = {
  // ========== PRODUCTOS ==========
  
  // Obtener todos los productos con variantes
  async getProducts(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.brand) params.append('brand', filters.brand);
      if (filters.search) params.append('search', filters.search);
      
      const response = await api.get(`/products/search?${params.toString()}`);
      // Devolver solo el array de resultados
      return response.data.results || [];
    } catch (error) {
      throw new Error(`Error al obtener productos: ${error.message}`);
    }
  },

  // Crear producto
  async createProduct(productData) {
    try {
      const response = await api.post('/products', productData);
      return response.data;
    } catch (error) {
      throw new Error(`Error al crear producto: ${error.message}`);
    }
  },

  // Actualizar producto
  async updateProduct(productId, productData) {
    try {
      const response = await api.put(`/products/${productId}`, productData);
      return response.data;
    } catch (error) {
      throw new Error(`Error al actualizar producto: ${error.message}`);
    }
  },

  // Eliminar producto
  async deleteProduct(productId) {
    try {
      const response = await api.delete(`/products/${productId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Error al eliminar producto: ${error.message}`);
    }
  },

  // Buscar producto por código
  async scanProduct(code) {
    try {
      const response = await api.post('/products/scan', { code });
      return response.data;
    } catch (error) {
      throw new Error(`Error al escanear producto: ${error.message}`);
    }
  },

  // ========== INVENTARIO ==========
  
  // Obtener inventario
  async getInventory(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.location_id) params.append('location_id', filters.location_id);
      if (filters.product_id) params.append('product_id', filters.product_id);
      
      const response = await api.get(`/inventory/search?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(`Error al obtener inventario: ${error.message}`);
    }
  },

  // Ajustar inventario
  async adjustInventory(adjustmentData) {
    try {
      const response = await api.post('/inventory/adjust', adjustmentData);
      return response.data;
    } catch (error) {
      throw new Error(`Error al ajustar inventario: ${error.message}`);
    }
  },

  // Obtener ubicaciones
  async getLocations() {
    try {
      const response = await api.get('/inventory/locations');
      return response.data;
    } catch (error) {
      throw new Error(`Error al obtener ubicaciones: ${error.message}`);
    }
  },

  // ========== VENTAS ==========
  
  // Crear venta
  async createSale(saleData) {
    try {
      const response = await api.post('/sales', saleData);
      return response.data;
    } catch (error) {
      throw new Error(`Error al crear venta: ${error.message}`);
    }
  },

  // Obtener ventas
  async getSales(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      
      const response = await api.get(`/sales/search?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(`Error al obtener ventas: ${error.message}`);
    }
  },

  // ========== REPORTES ==========
  
  // Obtener datos del dashboard
  async getDashboardData() {
    try {
      const response = await api.get('/reports/dashboard');
      return response.data;
    } catch (error) {
      throw new Error(`Error al obtener datos del dashboard: ${error.message}`);
    }
  },

  // Obtener reporte de ventas
  async getSalesReport(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      
      const response = await api.get(`/reports/sales/summary?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(`Error al obtener reporte de ventas: ${error.message}`);
    }
  },

  // Obtener reporte de inventario
  async getInventoryReport() {
    try {
      const response = await api.get('/reports/inventory/status');
      return response.data;
    } catch (error) {
      throw new Error(`Error al obtener reporte de inventario: ${error.message}`);
    }
  },

  // ========== SALUD DEL SISTEMA ==========
  
  // Verificar conexión con el backend
  async healthCheck() {
    try {
      console.log('🔍 Verificando conexión con backend...');
      const response = await api.get('/health');
      console.log('✅ Respuesta del backend:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      throw new Error(`Error de conexión: ${error.message}`);
    }
  }
};

export default realApiService;
