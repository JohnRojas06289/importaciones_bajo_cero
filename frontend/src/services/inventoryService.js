// frontend/src/services/inventoryService.js
import { apiService, apiUtils } from './api';

/**
 * Servicio para manejar todas las operaciones relacionadas con inventario
 */
export const inventoryService = {
  /**
   * Buscar inventario con filtros avanzados
   */
  async searchInventory(filters = {}, pagination = {}) {
    try {
      const params = {
        ...filters,
        limit: pagination.limit || 50,
        offset: pagination.offset || 0
      };

      const response = await apiService.get('/inventory/search', { params });
      return response.data;
    } catch (error) {
      console.error('Error searching inventory:', error);
      throw error;
    }
  },

  /**
   * Obtener alertas de stock
   */
  async getStockAlerts(locationId = null, severity = null) {
    try {
      const params = {};
      if (locationId) params.location_id = locationId;
      if (severity) params.severity = severity;

      const response = await apiService.get('/inventory/alerts', { params });
      return response.data;
    } catch (error) {
      console.error('Error getting stock alerts:', error);
      throw error;
    }
  },

  /**
   * Transferir inventario entre ubicaciones
   */
  async transferInventory(transferData) {
    try {
      const response = await apiService.post('/inventory/transfer', transferData);
      return response.data;
    } catch (error) {
      console.error('Error transferring inventory:', error);
      throw error;
    }
  },

  /**
   * Ajustar cantidad de inventario
   */
  async adjustInventory(adjustmentData) {
    try {
      const response = await apiService.post('/inventory/adjust', adjustmentData);
      return response.data;
    } catch (error) {
      console.error('Error adjusting inventory:', error);
      throw error;
    }
  },

  /**
   * Crear nueva ubicación
   */
  async createLocation(locationData) {
    try {
      const response = await apiService.post('/inventory/locations', locationData);
      return response.data;
    } catch (error) {
      console.error('Error creating location:', error);
      throw error;
    }
  },

  /**
   * Obtener todas las ubicaciones
   */
  async getLocations(filters = {}) {
    try {
      const response = await apiService.get('/inventory/locations', {
        params: filters
      });
      return response.data;
    } catch (error) {
      console.error('Error getting locations:', error);
      throw error;
    }
  },

  /**
   * Obtener ubicación específica
   */
  async getLocation(locationId) {
    try {
      const response = await apiService.get(`/inventory/locations/${locationId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting location:', error);
      throw error;
    }
  },

  /**
   * Actualizar ubicación
   */
  async updateLocation(locationId, updateData) {
    try {
      const response = await apiService.put(`/inventory/locations/${locationId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  },

  /**
   * Crear nueva reserva
   */
  async createReservation(reservationData) {
    try {
      const response = await apiService.post('/inventory/reservations', reservationData);
      return response.data;
    } catch (error) {
      console.error('Error creating reservation:', error);
      throw error;
    }
  },

  /**
   * Obtener reservas activas
   */
  async getActiveReservations() {
    try {
      const response = await apiService.get('/inventory/reservations/active');
      return response.data;
    } catch (error) {
      console.error('Error getting active reservations:', error);
      throw error;
    }
  },

  /**
   * Completar reserva (convertir en venta)
   */
  async completeReservation(reservationId) {
    try {
      const response = await apiService.post(`/inventory/reservations/${reservationId}/complete`);
      return response.data;
    } catch (error) {
      console.error('Error completing reservation:', error);
      throw error;
    }
  },

  /**
   * Cancelar reserva
   */
  async cancelReservation(reservationId) {
    try {
      const response = await apiService.post(`/inventory/reservations/${reservationId}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      throw error;
    }
  },

  /**
   * Controlar sistema LED
   */
  async controlLEDs(ledRequest) {
    try {
      const response = await apiService.post('/inventory/led/control', ledRequest);
      return response.data;
    } catch (error) {
      console.error('Error controlling LEDs:', error);
      throw error;
    }
  },

  /**
   * Generar reporte de inventario
   */
  async getInventoryReport(locationId = null, includeMovements = false) {
    try {
      const params = {};
      if (locationId) params.location_id = locationId;
      if (includeMovements) params.include_movements = includeMovements;

      const response = await apiService.get('/inventory/report', { params });
      return response.data;
    } catch (error) {
      console.error('Error getting inventory report:', error);
      throw error;
    }
  },

  /**
   * Obtener movimientos de inventario
   */
  async getInventoryMovements(filters = {}, pagination = {}) {
    try {
      const params = {
        ...filters,
        limit: pagination.limit || 100,
        offset: pagination.offset || 0
      };

      // Formatear fechas si existen
      if (filters.startDate) {
        params.start_date = filters.startDate.toISOString();
      }
      if (filters.endDate) {
        params.end_date = filters.endDate.toISOString();
      }

      const response = await apiService.get('/inventory/movements', { params });
      return response.data;
    } catch (error) {
      console.error('Error getting inventory movements:', error);
      throw error;
    }
  },

  /**
   * Obtener nivel de stock por ubicación
   */
  async getStockLevelsByLocation() {
    try {
      const response = await apiService.get('/inventory/stock-levels');
      return response.data;
    } catch (error) {
      console.error('Error getting stock levels by location:', error);
      throw error;
    }
  },

  /**
   * Obtener productos con stock bajo
   */
  async getLowStockProducts(threshold = 5, locationId = null) {
    try {
      const params = { threshold };
      if (locationId) params.location_id = locationId;

      const response = await apiService.get('/inventory/low-stock', { params });
      return response.data;
    } catch (error) {
      console.error('Error getting low stock products:', error);
      throw error;
    }
  },

  /**
   * Obtener productos sin stock
   */
  async getOutOfStockProducts(locationId = null) {
    try {
      const params = {};
      if (locationId) params.location_id = locationId;

      const response = await apiService.get('/inventory/out-of-stock', { params });
      return response.data;
    } catch (error) {
      console.error('Error getting out of stock products:', error);
      throw error;
    }
  },

  /**
   * Obtener valor total del inventario
   */
  async getInventoryValue(locationId = null) {
    try {
      const params = {};
      if (locationId) params.location_id = locationId;

      const response = await apiService.get('/inventory/value', { params });
      return response.data;
    } catch (error) {
      console.error('Error getting inventory value:', error);
      throw error;
    }
  },

  /**
   * Realizar conteo de inventario
   */
  async performInventoryCount(countData) {
    try {
      const response = await apiService.post('/inventory/count', countData);
      return response.data;
    } catch (error) {
      console.error('Error performing inventory count:', error);
      throw error;
    }
  },

  /**
   * Obtener historial de conteos
   */
  async getInventoryCountHistory(filters = {}) {
    try {
      const response = await apiService.get('/inventory/count-history', {
        params: filters
      });
      return response.data;
    } catch (error) {
      console.error('Error getting inventory count history:', error);
      throw error;
    }
  },

  /**
   * Exportar inventario
   */
  async exportInventory(filters = {}, format = 'csv') {
    try {
      const params = { ...filters, format };
      const filename = `inventory-export-${new Date().toISOString().split('T')[0]}.${format}`;
      
      return await apiService.download('/inventory/export', filename, { params });
    } catch (error) {
      console.error('Error exporting inventory:', error);
      throw error;
    }
  },

  /**
   * Importar ajustes de inventario desde CSV
   */
  async importInventoryAdjustments(file, options = {}) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      Object.keys(options).forEach(key => {
        formData.append(key, options[key]);
      });

      const response = await apiService.upload('/inventory/import-adjustments', formData,
        (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          options.onProgress?.(percentCompleted);
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error importing inventory adjustments:', error);
      throw error;
    }
  },

  /**
   * Obtener pronóstico de demanda
   */
  async getDemandForecast(variantId, days = 30) {
    try {
      const response = await apiService.get(`/inventory/demand-forecast/${variantId}`, {
        params: { days }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting demand forecast:', error);
      throw error;
    }
  },

  /**
   * Obtener sugerencias de reabastecimiento
   */
  async getRestockSuggestions(locationId = null) {
    try {
      const params = {};
      if (locationId) params.location_id = locationId;

      const response = await apiService.get('/inventory/restock-suggestions', { params });
      return response.data;
    } catch (error) {
      console.error('Error getting restock suggestions:', error);
      throw error;
    }
  }
};

/**
 * Utilidades para inventario
 */
export const inventoryUtils = {
  /**
   * Formatear nivel de stock
   */
  formatStockLevel(quantity, minStock, maxStock) {
    if (quantity === 0) {
      return { level: 'out', color: 'danger', text: 'Sin stock' };
    }
    
    if (quantity <= minStock) {
      return { level: 'low', color: 'warning', text: 'Stock bajo' };
    }
    
    if (quantity >= maxStock) {
      return { level: 'high', color: 'info', text: 'Stock alto' };
    }
    
    return { level: 'normal', color: 'success', text: 'Stock normal' };
  },

  /**
   * Calcular rotación de inventario
   */
  calculateInventoryTurnover(costOfGoodsSold, averageInventoryValue) {
    if (averageInventoryValue === 0) return 0;
    return costOfGoodsSold / averageInventoryValue;
  },

  /**
   * Calcular días de inventario
   */
  calculateDaysOfInventory(averageInventory, dailySales) {
    if (dailySales === 0) return Infinity;
    return averageInventory / dailySales;
  },

  /**
   * Validar datos de transferencia
   */
  validateTransferData(transferData) {
    const errors = [];

    if (!transferData.variantId) {
      errors.push('Producto requerido');
    }

    if (!transferData.fromLocationId) {
      errors.push('Ubicación de origen requerida');
    }

    if (!transferData.toLocationId) {
      errors.push('Ubicación de destino requerida');
    }

    if (transferData.fromLocationId === transferData.toLocationId) {
      errors.push('Las ubicaciones de origen y destino no pueden ser la misma');
    }

    if (!transferData.quantity || transferData.quantity <= 0) {
      errors.push('Cantidad debe ser mayor a 0');
    }

    if (!transferData.reason?.trim()) {
      errors.push('Razón de la transferencia requerida');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Validar datos de ajuste
   */
  validateAdjustmentData(adjustmentData) {
    const errors = [];

    if (!adjustmentData.inventoryId) {
      errors.push('ID de inventario requerido');
    }

    if (adjustmentData.newQuantity < 0) {
      errors.push('Cantidad no puede ser negativa');
    }

    if (!adjustmentData.reason?.trim()) {
      errors.push('Razón del ajuste requerida');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Calcular valor total de inventario
   */
  calculateInventoryValue(inventoryItems) {
    return inventoryItems.reduce((total, item) => {
      const itemValue = item.quantity * (item.unitCost || item.unitPrice || 0);
      return total + itemValue;
    }, 0);
  },

  /**
   * Agrupar inventario por ubicación
   */
  groupInventoryByLocation(inventoryItems) {
    return inventoryItems.reduce((groups, item) => {
      const locationName = item.locationName || 'Sin ubicación';
      
      if (!groups[locationName]) {
        groups[locationName] = {
          locationName,
          locationType: item.locationType,
          items: [],
          totalValue: 0,
          totalItems: 0
        };
      }

      groups[locationName].items.push(item);
      groups[locationName].totalValue += item.quantity * (item.unitCost || item.unitPrice || 0);
      groups[locationName].totalItems += item.quantity;

      return groups;
    }, {});
  },

  /**
   * Generar código de movimiento de inventario
   */
  generateMovementCode(movementType) {
    const prefixes = {
      'sale': 'VTA',
      'purchase': 'COM',
      'transfer': 'TRF',
      'adjustment': 'AJU',
      'return': 'DEV'
    };

    const prefix = prefixes[movementType] || 'MOV';
    const timestamp = Date.now().toString(36).toUpperCase();
    
    return `${prefix}-${timestamp}`;
  },

  /**
   * Calcular estadísticas de movimientos
   */
  calculateMovementStats(movements) {
    const stats = {
      totalMovements: movements.length,
      byType: {},
      totalQuantityIn: 0,
      totalQuantityOut: 0,
      byDate: {}
    };

    movements.forEach(movement => {
      // Por tipo
      if (!stats.byType[movement.movementType]) {
        stats.byType[movement.movementType] = {
          count: 0,
          quantityIn: 0,
          quantityOut: 0
        };
      }

      stats.byType[movement.movementType].count += 1;

      if (movement.quantityChange > 0) {
        stats.byType[movement.movementType].quantityIn += movement.quantityChange;
        stats.totalQuantityIn += movement.quantityChange;
      } else {
        stats.byType[movement.movementType].quantityOut += Math.abs(movement.quantityChange);
        stats.totalQuantityOut += Math.abs(movement.quantityChange);
      }

      // Por fecha
      const date = new Date(movement.createdAt).toDateString();
      if (!stats.byDate[date]) {
        stats.byDate[date] = { count: 0, quantityIn: 0, quantityOut: 0 };
      }
      stats.byDate[date].count += 1;

      if (movement.quantityChange > 0) {
        stats.byDate[date].quantityIn += movement.quantityChange;
      } else {
        stats.byDate[date].quantityOut += Math.abs(movement.quantityChange);
      }
    });

    return stats;
  },

  /**
   * Formatear tipo de ubicación
   */
  formatLocationType(type) {
    const types = {
      'display': 'Exhibición',
      'storage': 'Almacén',
      'reserve': 'Reserva',
      'damaged': 'Dañados',
      'transit': 'En tránsito'
    };

    return types[type] || type;
  },

  /**
   * Obtener color para nivel de stock
   */
  getStockLevelColor(quantity, minStock, maxStock) {
    const level = this.formatStockLevel(quantity, minStock, maxStock);
    
    const colors = {
      'out': '#ef4444',      // Rojo
      'low': '#f59e0b',      // Amarillo
      'normal': '#22c55e',   // Verde
      'high': '#3b82f6'      // Azul
    };

    return colors[level.level] || '#6b7280';
  }
};

export default inventoryService;