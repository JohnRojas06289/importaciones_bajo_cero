// frontend/src/services/salesService.js
import { apiService, apiUtils } from './api';

/**
 * Servicio para manejar todas las operaciones relacionadas con ventas
 */
export const salesService = {
  /**
   * Crear nueva venta completa
   */
  async createSale(saleData) {
    try {
      const response = await apiService.post('/sales', saleData);
      return response.data;
    } catch (error) {
      console.error('Error creating sale:', error);
      throw error;
    }
  },

  /**
   * Crear venta rápida de un solo producto
   */
  async createQuickSale(quickSaleData) {
    try {
      const response = await apiService.post('/sales/quick', quickSaleData);
      return response.data;
    } catch (error) {
      console.error('Error creating quick sale:', error);
      throw error;
    }
  },

  /**
   * Obtener venta específica por ID
   */
  async getSale(saleId) {
    try {
      const response = await apiService.get(`/sales/${saleId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting sale:', error);
      throw error;
    }
  },

  /**
   * Búsqueda avanzada de ventas
   */
  async searchSales(filters = {}, pagination = {}) {
    try {
      const params = {
        ...filters,
        limit: pagination.limit || 50,
        offset: pagination.offset || 0
      };

      // Formatear fechas si existen
      if (filters.startDate) {
        params.start_date = filters.startDate.toISOString();
      }
      if (filters.endDate) {
        params.end_date = filters.endDate.toISOString();
      }

      const response = await apiService.get('/sales/search', { params });
      return response.data;
    } catch (error) {
      console.error('Error searching sales:', error);
      throw error;
    }
  },

  /**
   * Actualizar venta
   */
  async updateSale(saleId, updateData) {
    try {
      const response = await apiService.put(`/sales/${saleId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating sale:', error);
      throw error;
    }
  },

  /**
   * Cancelar venta
   */
  async cancelSale(saleId, reason, userId = null) {
    try {
      const response = await apiService.post(`/sales/${saleId}/cancel`, {
        reason,
        user_id: userId
      });
      return response.data;
    } catch (error) {
      console.error('Error cancelling sale:', error);
      throw error;
    }
  },

  /**
   * Validar carrito antes de procesar venta
   */
  async validateCart(cartData) {
    try {
      const response = await apiService.post('/sales/cart/validate', cartData);
      return response.data;
    } catch (error) {
      console.error('Error validating cart:', error);
      throw error;
    }
  },

  /**
   * Crear devolución
   */
  async createRefund(refundData) {
    try {
      const response = await apiService.post('/sales/refunds', refundData);
      return response.data;
    } catch (error) {
      console.error('Error creating refund:', error);
      throw error;
    }
  },

  /**
   * Obtener devolución específica
   */
  async getRefund(refundId) {
    try {
      const response = await apiService.get(`/sales/refunds/${refundId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting refund:', error);
      throw error;
    }
  },

  /**
   * Obtener métricas en tiempo real
   */
  async getRealTimeMetrics() {
    try {
      const response = await apiService.get('/sales/metrics/realtime');
      return response.data;
    } catch (error) {
      console.error('Error getting real-time metrics:', error);
      throw error;
    }
  },

  /**
   * Obtener reporte diario de ventas
   */
  async getDailySalesReport(date = null) {
    try {
      const params = {};
      if (date) {
        params.date = date.toISOString();
      }

      const response = await apiService.get('/sales/reports/daily', { params });
      return response.data;
    } catch (error) {
      console.error('Error getting daily sales report:', error);
      throw error;
    }
  },

  /**
   * Obtener reporte personalizado de ventas
   */
  async getCustomSalesReport(reportFilters) {
    try {
      const formattedFilters = {
        ...reportFilters,
        start_date: reportFilters.startDate?.toISOString(),
        end_date: reportFilters.endDate?.toISOString()
      };

      const response = await apiService.post('/sales/reports/custom', formattedFilters);
      return response.data;
    } catch (error) {
      console.error('Error getting custom sales report:', error);
      throw error;
    }
  },

  /**
   * Obtener datos para recibo
   */
  async getSaleReceipt(saleId) {
    try {
      const response = await apiService.get(`/sales/${saleId}/receipt`);
      return response.data;
    } catch (error) {
      console.error('Error getting sale receipt:', error);
      throw error;
    }
  },

  /**
   * Imprimir recibo (enviar a impresora)
   */
  async printReceipt(saleId, printerConfig = {}) {
    try {
      const response = await apiService.post(`/sales/${saleId}/print`, {
        printer_config: printerConfig
      });
      return response.data;
    } catch (error) {
      console.error('Error printing receipt:', error);
      throw error;
    }
  },

  /**
   * Obtener ventas por cajero
   */
  async getSalesByCashier(cashierId, startDate, endDate) {
    try {
      const params = {
        cashier_id: cashierId,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      };

      const response = await apiService.get('/sales/search', { params });
      return response.data;
    } catch (error) {
      console.error('Error getting sales by cashier:', error);
      throw error;
    }
  },

  /**
   * Obtener top productos vendidos
   */
  async getTopSellingProducts(period = '30days', limit = 10) {
    try {
      const response = await apiService.get('/sales/top-products', {
        params: { period, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting top selling products:', error);
      throw error;
    }
  },

  /**
   * Obtener ventas por método de pago
   */
  async getSalesByPaymentMethod(startDate, endDate) {
    try {
      const params = apiUtils.formatDateParams(startDate, endDate);
      const response = await apiService.get('/sales/by-payment-method', { params });
      return response.data;
    } catch (error) {
      console.error('Error getting sales by payment method:', error);
      throw error;
    }
  },

  /**
   * Obtener estadísticas de ventas por período
   */
  async getSalesStatistics(period = 'week') {
    try {
      const response = await apiService.get('/sales/statistics', {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting sales statistics:', error);
      throw error;
    }
  },

  /**
   * Exportar ventas a CSV/Excel
   */
  async exportSales(filters = {}, format = 'csv') {
    try {
      const params = {
        ...filters,
        format,
        start_date: filters.startDate?.toISOString(),
        end_date: filters.endDate?.toISOString()
      };

      const filename = `sales-export-${new Date().toISOString().split('T')[0]}.${format}`;
      return await apiService.download('/sales/export', filename, { params });
    } catch (error) {
      console.error('Error exporting sales:', error);
      throw error;
    }
  },

  /**
   * Obtener resumen de ventas del día
   */
  async getTodaySalesSummary() {
    try {
      const today = new Date();
      const response = await this.getDailySalesReport(today);
      return response;
    } catch (error) {
      console.error('Error getting today sales summary:', error);
      throw error;
    }
  },

  /**
   * Obtener ventas recientes
   */
  async getRecentSales(limit = 10) {
    try {
      const response = await apiService.get('/sales/search', {
        params: {
          limit,
          sort: 'created_at',
          order: 'desc'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting recent sales:', error);
      throw error;
    }
  },

  /**
   * Procesar pago de venta pendiente
   */
  async processPendingPayment(saleId, paymentData) {
    try {
      const response = await apiService.post(`/sales/${saleId}/process-payment`, paymentData);
      return response.data;
    } catch (error) {
      console.error('Error processing pending payment:', error);
      throw error;
    }
  },

  /**
   * Obtener análisis de rendimiento de ventas
   */
  async getSalesPerformanceAnalysis(period = '30days') {
    try {
      const response = await apiService.get('/sales/performance-analysis', {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting sales performance analysis:', error);
      throw error;
    }
  }
};

/**
 * Utilidades para ventas
 */
export const salesUtils = {
  /**
   * Formatear número de venta
   */
  formatSaleNumber(saleNumber) {
    if (!saleNumber) return '';
    
    // Formato: V-YYYYMMDD-####
    const parts = saleNumber.split('-');
    if (parts.length === 3) {
      const [prefix, date, number] = parts;
      const formattedDate = `${date.slice(0, 4)}/${date.slice(4, 6)}/${date.slice(6, 8)}`;
      return `${prefix}-${formattedDate}-${number}`;
    }
    
    return saleNumber;
  },

  /**
   * Calcular totales de venta
   */
  calculateSaleTotals(items, discountPercentage = 0, discountAmount = 0) {
    const subtotal = items.reduce((total, item) => {
      return total + (item.quantity * item.unitPrice) - (item.discountAmount || 0);
    }, 0);

    let totalDiscount = discountAmount;
    if (discountPercentage > 0) {
      totalDiscount += subtotal * (discountPercentage / 100);
    }

    const taxAmount = 0; // Configurar según normativa
    const total = Math.max(0, subtotal - totalDiscount + taxAmount);

    return {
      subtotal: Math.round(subtotal),
      totalDiscount: Math.round(totalDiscount),
      taxAmount: Math.round(taxAmount),
      total: Math.round(total),
      itemsCount: items.reduce((count, item) => count + item.quantity, 0)
    };
  },

  /**
   * Validar datos de venta
   */
  validateSaleData(saleData) {
    const errors = [];

    if (!saleData.items || saleData.items.length === 0) {
      errors.push('La venta debe tener al menos un producto');
    }

    if (!saleData.paymentMethod) {
      errors.push('Método de pago es requerido');
    }

    saleData.items?.forEach((item, index) => {
      if (!item.variantId) {
        errors.push(`Producto ${index + 1}: ID de variante requerido`);
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Producto ${index + 1}: Cantidad debe ser mayor a 0`);
      }
      if (!item.unitPrice || item.unitPrice <= 0) {
        errors.push(`Producto ${index + 1}: Precio debe ser mayor a 0`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Formatear método de pago para mostrar
   */
  formatPaymentMethod(method) {
    const methods = {
      'cash': 'Efectivo',
      'card': 'Tarjeta',
      'transfer': 'Transferencia',
      'mixed': 'Mixto',
      'check': 'Cheque',
      'other': 'Otro'
    };

    return methods[method] || method;
  },

  /**
   * Generar datos para recibo
   */
  generateReceiptData(sale, storeInfo = {}) {
    return {
      store: {
        name: storeInfo.name || 'Almacén de Ropa',
        address: storeInfo.address || 'Centro de Bogotá, Colombia',
        phone: storeInfo.phone || '+57 1 234 5678',
        email: storeInfo.email || 'ventas@almacenropa.com',
        ...storeInfo
      },
      sale: {
        ...sale,
        formattedNumber: this.formatSaleNumber(sale.saleNumber),
        formattedDate: new Date(sale.createdAt).toLocaleString('es-CO'),
        formattedPaymentMethod: this.formatPaymentMethod(sale.paymentMethod)
      },
      qrCode: `SALE-${sale.saleNumber}`,
      barcode: sale.saleNumber,
      footer: storeInfo.receiptFooter || '¡Gracias por su compra!'
    };
  },

  /**
   * Calcular estadísticas de ventas
   */
  calculateSalesStats(sales) {
    if (!sales || sales.length === 0) {
      return {
        totalSales: 0,
        totalRevenue: 0,
        averageSale: 0,
        totalItems: 0,
        paymentMethods: {},
        topProducts: []
      };
    }

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalItems = sales.reduce((sum, sale) => sum + sale.totalItems, 0);
    
    // Agrupar por métodos de pago
    const paymentMethods = sales.reduce((acc, sale) => {
      const method = sale.paymentMethod;
      if (!acc[method]) {
        acc[method] = { count: 0, amount: 0 };
      }
      acc[method].count += 1;
      acc[method].amount += sale.totalAmount;
      return acc;
    }, {});

    return {
      totalSales: sales.length,
      totalRevenue,
      averageSale: sales.length > 0 ? totalRevenue / sales.length : 0,
      totalItems,
      paymentMethods,
      period: {
        start: sales.length > 0 ? new Date(Math.min(...sales.map(s => new Date(s.createdAt)))) : null,
        end: sales.length > 0 ? new Date(Math.max(...sales.map(s => new Date(s.createdAt)))) : null
      }
    };
  },

  /**
   * Comparar rendimiento de ventas entre períodos
   */
  compareSalesPerformance(currentPeriod, previousPeriod) {
    const current = this.calculateSalesStats(currentPeriod);
    const previous = this.calculateSalesStats(previousPeriod);

    const calculateChange = (curr, prev) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    };

    return {
      current,
      previous,
      changes: {
        salesCount: calculateChange(current.totalSales, previous.totalSales),
        revenue: calculateChange(current.totalRevenue, previous.totalRevenue),
        averageSale: calculateChange(current.averageSale, previous.averageSale),
        totalItems: calculateChange(current.totalItems, previous.totalItems)
      }
    };
  }
};

export default salesService;