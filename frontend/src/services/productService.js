// frontend/src/services/productService.js
import { apiService, apiUtils } from './api';

/**
 * Servicio para manejar todas las operaciones relacionadas con productos
 */
export const productService = {
  /**
   * Escanear producto por código de barras o código corto
   */
  async scanProduct(code) {
    try {
      const response = await apiService.post('/products/scan', {
        code: code.trim()
      });
      return response.data;
    } catch (error) {
      console.error('Error scanning product:', error);
      throw error;
    }
  },

  /**
   * Búsqueda avanzada de productos
   */
  async searchProducts(params = {}) {
    try {
      const cleanParams = {};
      
      // Limpiar parámetros vacíos
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
          cleanParams[key] = params[key];
        }
      });

      const response = await apiService.get('/products/search', {
        params: cleanParams
      });
      return response.data;
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  },

  /**
   * Búsqueda rápida para autocompletado
   */
  async quickSearch(term) {
    try {
      if (!term || term.trim().length < 2) {
        return { results: [] };
      }

      const response = await apiService.get(`/products/quick-search/${encodeURIComponent(term.trim())}`);
      return response.data;
    } catch (error) {
      console.error('Error in quick search:', error);
      return { results: [] };
    }
  },

  /**
   * Obtener producto específico por ID de variante
   */
  async getProduct(variantId) {
    try {
      const response = await apiService.get(`/products/variants/${variantId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting product:', error);
      throw error;
    }
  },

  /**
   * Obtener ubicaciones donde está disponible un producto
   */
  async getProductLocations(variantId, customerVisibleOnly = true) {
    try {
      const response = await apiService.get(`/products/${variantId}/locations`, {
        params: {
          customer_visible_only: customerVisibleOnly
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting product locations:', error);
      throw error;
    }
  },

  /**
   * Obtener productos alternativos/similares
   */
  async getProductAlternatives(variantId, limit = 10) {
    try {
      const response = await apiService.get(`/products/${variantId}/alternatives`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting product alternatives:', error);
      throw error;
    }
  },

  /**
   * Validar formato de código corto
   */
  async validateShortCode(code) {
    try {
      const response = await apiService.get(`/products/validate-code/${encodeURIComponent(code)}`);
      return response.data;
    } catch (error) {
      console.error('Error validating short code:', error);
      return {
        isValid: false,
        errors: ['Error al validar el código']
      };
    }
  },

  /**
   * Crear nuevo producto (admin)
   */
  async createProduct(productData) {
    try {
      const response = await apiService.post('/products', productData);
      return response.data;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  /**
   * Crear nueva variante de producto
   */
  async createProductVariant(productId, variantData) {
    try {
      const response = await apiService.post(`/products/${productId}/variants`, variantData);
      return response.data;
    } catch (error) {
      console.error('Error creating product variant:', error);
      throw error;
    }
  },

  /**
   * Actualizar producto
   */
  async updateProduct(productId, updateData) {
    try {
      const response = await apiService.put(`/products/${productId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  /**
   * Actualizar variante de producto
   */
  async updateProductVariant(variantId, updateData) {
    try {
      const response = await apiService.put(`/products/variants/${variantId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating product variant:', error);
      throw error;
    }
  },

  /**
   * Eliminar producto
   */
  async deleteProduct(productId) {
    try {
      const response = await apiService.delete(`/products/${productId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },

  /**
   * Obtener categorías disponibles
   */
  async getCategories() {
    try {
      const response = await apiService.get('/products/categories');
      return response.data;
    } catch (error) {
      console.error('Error getting categories:', error);
      // Retornar categorías por defecto en caso de error
      return [
        { name: 'Chaquetas', code: 'CH' },
        { name: 'Gorras', code: 'GO' },
        { name: 'Accesorios', code: 'AC' }
      ];
    }
  },

  /**
   * Obtener tallas disponibles
   */
  async getSizes() {
    try {
      const response = await apiService.get('/products/sizes');
      return response.data;
    } catch (error) {
      console.error('Error getting sizes:', error);
      // Retornar tallas por defecto
      return ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Única'];
    }
  },

  /**
   * Obtener colores disponibles
   */
  async getColors() {
    try {
      const response = await apiService.get('/products/colors');
      return response.data;
    } catch (error) {
      console.error('Error getting colors:', error);
      // Retornar colores por defecto
      return [
        { name: 'Negro', code: 'NEG', hex: '#000000' },
        { name: 'Blanco', code: 'BLA', hex: '#FFFFFF' },
        { name: 'Azul', code: 'AZU', hex: '#0066CC' },
        { name: 'Rojo', code: 'ROJ', hex: '#CC0000' },
        { name: 'Verde', code: 'VER', hex: '#00CC00' },
        { name: 'Gris', code: 'GRI', hex: '#808080' }
      ];
    }
  },

  /**
   * Obtener productos más vendidos
   */
  async getTopSellingProducts(limit = 10, period = '30days') {
    try {
      const response = await apiService.get('/products/top-selling', {
        params: { limit, period }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting top selling products:', error);
      return [];
    }
  },

  /**
   * Obtener productos con stock bajo
   */
  async getLowStockProducts(threshold = 5) {
    try {
      const response = await apiService.get('/products/low-stock', {
        params: { threshold }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting low stock products:', error);
      return [];
    }
  },

  /**
   * Obtener productos frecuentes (favoritos/recientes)
   */
  async getFrequentProducts() {
    try {
      // Combinar productos frecuentes del backend con favoritos locales
      const [backendResponse, localFavorites] = await Promise.all([
        apiService.get('/products/frequent').catch(() => ({ data: [] })),
        Promise.resolve(JSON.parse(localStorage.getItem('favoriteProducts') || '[]'))
      ]);

      const backendProducts = backendResponse.data || [];
      
      // Si hay favoritos locales, obtener su información
      if (localFavorites.length > 0) {
        const favoriteProductsPromises = localFavorites.map(variantId =>
          this.getProduct(variantId).catch(() => null)
        );
        
        const favoriteProducts = (await Promise.all(favoriteProductsPromises))
          .filter(product => product !== null);

        // Combinar y deduplicar
        const allProducts = [...backendProducts];
        favoriteProducts.forEach(favProduct => {
          if (!allProducts.find(p => p.variant_id === favProduct.variant_id)) {
            allProducts.push({ ...favProduct, isFavorite: true });
          }
        });

        return allProducts;
      }

      return backendProducts;
    } catch (error) {
      console.error('Error getting frequent products:', error);
      return [];
    }
  },

  /**
   * Importar productos desde archivo CSV
   */
  async importProducts(file, options = {}) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      Object.keys(options).forEach(key => {
        formData.append(key, options[key]);
      });

      const response = await apiService.upload('/products/import', formData, 
        (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          options.onProgress?.(percentCompleted);
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error importing products:', error);
      throw error;
    }
  },

  /**
   * Exportar productos a CSV
   */
  async exportProducts(filters = {}, format = 'csv') {
    try {
      const params = { ...filters, format };
      const filename = `products-export-${new Date().toISOString().split('T')[0]}.${format}`;
      
      return await apiService.download('/products/export', filename, { params });
    } catch (error) {
      console.error('Error exporting products:', error);
      throw error;
    }
  },

  /**
   * Generar código de barras para un producto
   */
  async generateBarcode(variantId, format = 'CODE128') {
    try {
      const response = await apiService.post(`/products/${variantId}/generate-barcode`, {
        format
      });
      return response.data;
    } catch (error) {
      console.error('Error generating barcode:', error);
      throw error;
    }
  },

  /**
   * Subir imagen de producto
   */
  async uploadProductImage(productId, file, imageType = 'product') {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('image_type', imageType);

      const response = await apiService.upload(`/products/${productId}/images`, formData);
      return response.data;
    } catch (error) {
      console.error('Error uploading product image:', error);
      throw error;
    }
  },

  /**
   * Buscar productos por imagen (futuro)
   */
  async searchByImage(imageFile) {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await apiService.upload('/products/search-by-image', formData);
      return response.data;
    } catch (error) {
      console.error('Error searching by image:', error);
      throw error;
    }
  }
};

/**
 * Funciones de utilidad para productos
 */
export const productUtils = {
  /**
   * Detectar tipo de código
   */
  detectCodeType(code) {
    if (!code) return 'unknown';
    
    const cleanCode = code.trim().toUpperCase();
    
    // Código de barras (solo números, 8-13 dígitos)
    if (/^\d{8,13}$/.test(cleanCode)) {
      return 'barcode';
    }
    
    // Código corto (formato: CAT-NUM-SIZE-COLOR)
    if (/^[A-Z]{2,3}-\d{3}-[A-Z]{1,2}-[A-Z]{3,4}$/.test(cleanCode)) {
      return 'shortcode';
    }
    
    // SKU u otro formato
    return 'sku';
  },

  /**
   * Formatear precio para mostrar
   */
  formatPrice(price, currency = 'COP') {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(price);
  },

  /**
   * Generar código corto desde componentes
   */
  generateShortCode(category, internalNumber, size, color) {
    const categoryMap = {
      'Chaquetas': 'CH',
      'Gorras': 'GO',
      'Accesorios': 'AC'
    };

    const sizeMap = {
      'Extra Small': 'XS',
      'Small': 'S',
      'Medium': 'M',
      'Large': 'L',
      'Extra Large': 'XL',
      'Extra Extra Large': 'XXL',
      'Única': 'U'
    };

    const colorMap = {
      'Negro': 'NEG',
      'Blanco': 'BLA',
      'Azul': 'AZU',
      'Rojo': 'ROJ',
      'Verde': 'VER',
      'Gris': 'GRI',
      'Café': 'CAF',
      'Rosado': 'ROS',
      'Morado': 'MOR',
      'Naranja': 'NAR',
      'Amarillo': 'AMA'
    };

    const categoryCode = categoryMap[category] || category.substring(0, 2).toUpperCase();
    const sizeCode = sizeMap[size] || size.substring(0, 2).toUpperCase();
    const colorCode = colorMap[color] || color.substring(0, 3).toUpperCase();
    const numberPadded = internalNumber.toString().padStart(3, '0');

    return `${categoryCode}-${numberPadded}-${sizeCode}-${colorCode}`;
  },

  /**
   * Validar SKU
   */
  validateSKU(sku) {
    if (!sku || sku.length < 3) {
      return { isValid: false, error: 'SKU muy corto' };
    }

    if (sku.length > 50) {
      return { isValid: false, error: 'SKU muy largo' };
    }

    // Permitir letras, números, guiones y guiones bajos
    if (!/^[a-zA-Z0-9\-_]+$/.test(sku)) {
      return { isValid: false, error: 'SKU contiene caracteres inválidos' };
    }

    return { isValid: true };
  },

  /**
   * Calcular descuento
   */
  calculateDiscount(price, discountPercent) {
    return price * (discountPercent / 100);
  },

  /**
   * Formatear información de stock
   */
  formatStockInfo(availableStock, totalStock) {
    if (totalStock === 0) {
      return { text: 'Sin stock', color: 'danger', level: 'critical' };
    }
    
    if (availableStock === 0) {
      return { text: 'No disponible', color: 'warning', level: 'high' };
    }
    
    if (availableStock <= 3) {
      return { text: `${availableStock} disponibles`, color: 'warning', level: 'medium' };
    }
    
    return { text: `${availableStock} disponibles`, color: 'success', level: 'good' };
  },

  /**
   * Generar filtros de búsqueda a partir de un producto
   */
  generateFiltersFromProduct(product) {
    return {
      category: product.category || '',
      size: product.size || '',
      color: product.color || '',
      brand: product.brand || '',
      minPrice: Math.floor(product.price * 0.8), // 80% del precio
      maxPrice: Math.ceil(product.price * 1.2)   // 120% del precio
    };
  }
};

// Función auxiliar para detectar tipo de código (también exportada individualmente)
function detectCodeType(code) {
  return productUtils.detectCodeType(code);
}

export { detectCodeType };
export default productService;