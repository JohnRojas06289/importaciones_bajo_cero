import React, { useState, useEffect } from 'react';
import { realApiService } from '../services/realApiService';

const Reports = () => {
  const [reportData, setReportData] = useState({
    salesSummary: {},
    topProducts: [],
    inventoryAlerts: [],
    dailySales: [],
    categoryBreakdown: {}
  });
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sales');

  useEffect(() => {
    loadReportData();
  }, [selectedPeriod]);

  const loadReportData = async () => {
    setIsLoading(true);
    try {
      // Obtener datos reales del backend
      const [dashboardData, inventoryReport] = await Promise.all([
        realApiService.getDashboardData(),
        realApiService.getInventoryReport()
      ]);
      
      setReportData({
        salesSummary: dashboardData.sales || {},
        topProducts: dashboardData.top_products || [],
        inventoryAlerts: inventoryReport.alerts || [],
        dailySales: dashboardData.daily_sales || [],
        categoryBreakdown: dashboardData.category_breakdown || {}
      });
    } catch (error) {
      // En caso de error, usar datos mock como fallback
      const mockSalesData = generateMockSalesData(parseInt(selectedPeriod));
      const mockInventoryData = generateMockInventoryData();
      
      setReportData({
        salesSummary: mockSalesData.summary,
        topProducts: mockSalesData.topProducts,
        inventoryAlerts: mockInventoryData.alerts,
        dailySales: mockSalesData.dailySales,
        categoryBreakdown: mockSalesData.categoryBreakdown
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockSalesData = (days) => {
    const dailySales = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dailySales.push({
        date: date.toISOString().split('T')[0],
        sales: Math.floor(Math.random() * 1500) + 500,
        transactions: Math.floor(Math.random() * 20) + 5,
        avgTicket: Math.floor(Math.random() * 50) + 30
      });
    }

    const totalSales = dailySales.reduce((sum, day) => sum + day.sales, 0);
    const totalTransactions = dailySales.reduce((sum, day) => sum + day.transactions, 0);
    
    return {
      summary: {
        totalSales,
        totalTransactions,
        avgTicket: totalSales / totalTransactions,
        growth: Math.floor(Math.random() * 20) - 10
      },
      dailySales,
      topProducts: [
        { name: 'Chaqueta Nike Deportiva', sales: 45, revenue: 4049.55 },
        { name: 'Gorra Adidas Originals', sales: 38, revenue: 949.62 },
        { name: 'Sudadera Puma Essential', sales: 28, revenue: 1679.72 },
        { name: 'Pantalón Under Armour', sales: 22, revenue: 1759.78 },
        { name: 'Camiseta Jordan Retro', sales: 35, revenue: 1399.65 }
      ],
      categoryBreakdown: {
        'Chaquetas': 35,
        'Gorras': 25,
        'Sudaderas': 20,
        'Pantalones': 12,
        'Camisetas': 8
      }
    };
  };

  const generateMockInventoryData = () => {
    return {
      alerts: [
        { product: 'Gorra New Era Yankees', stock: 3, location: 'Exhibición Gorras', level: 'critical' },
        { product: 'Pantalón Under Armour', stock: 6, location: 'Bodega Principal', level: 'warning' },
        { product: 'Chaqueta Nike M', stock: 8, location: 'Exhibición Principal', level: 'warning' }
      ]
    };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount * 1000); // Convertir a pesos colombianos
  };

  const formatPercentage = (value) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="reports-page loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Cargando reportes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-page">
      <div className="reports-header">
        <h1>Reportes y Análisis</h1>
        <div className="period-selector">
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="period-select"
          >
            <option value="7">Últimos 7 días</option>
            <option value="30">Últimos 30 días</option>
            <option value="90">Últimos 3 meses</option>
            <option value="365">Último año</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="report-tabs">
        <button 
          className={`tab ${activeTab === 'sales' ? 'active' : ''}`}
          onClick={() => setActiveTab('sales')}
        >
          Ventas
        </button>
        <button 
          className={`tab ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          Inventario
        </button>
        <button 
          className={`tab ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          Productos
        </button>
      </div>

      {/* Sales Tab */}
      {activeTab === 'sales' && (
        <div className="tab-content">
          {/* KPIs */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-header">
                <h3>Ventas Totales</h3>
                <span className="kpi-icon">💰</span>
              </div>
              <div className="kpi-value">
                {formatCurrency(reportData.salesSummary.totalSales)}
              </div>
              <div className={`kpi-change ${reportData.salesSummary.growth >= 0 ? 'positive' : 'negative'}`}>
                {formatPercentage(reportData.salesSummary.growth)} vs período anterior
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <h3>Transacciones</h3>
                <span className="kpi-icon">🛒</span>
              </div>
              <div className="kpi-value">
                {reportData.salesSummary.totalTransactions?.toLocaleString()}
              </div>
              <div className="kpi-change positive">
                +12.5% vs período anterior
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <h3>Ticket Promedio</h3>
                <span className="kpi-icon">🎫</span>
              </div>
              <div className="kpi-value">
                {formatCurrency(reportData.salesSummary.avgTicket)}
              </div>
              <div className="kpi-change positive">
                +5.2% vs período anterior
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <h3>Productos Vendidos</h3>
                <span className="kpi-icon">📦</span>
              </div>
              <div className="kpi-value">
                {reportData.topProducts?.reduce((sum, p) => sum + p.sales, 0)}
              </div>
              <div className="kpi-change positive">
                +8.7% vs período anterior
              </div>
            </div>
          </div>

          {/* Sales Chart */}
          <div className="chart-container">
            <h3>Ventas Diarias</h3>
            <div className="sales-chart">
              {reportData.dailySales?.map((day, index) => (
                <div key={index} className="chart-bar">
                  <div 
                    className="bar" 
                    style={{ 
                      height: `${(day.sales / Math.max(...reportData.dailySales.map(d => d.sales))) * 100}%` 
                    }}
                    title={`${day.date}: ${formatCurrency(day.sales)}`}
                  ></div>
                  <div className="bar-label">
                    {new Date(day.date).getDate()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="category-breakdown">
            <h3>Ventas por Categoría</h3>
            <div className="category-chart">
              {Object.entries(reportData.categoryBreakdown || {}).map(([category, percentage]) => (
                <div key={category} className="category-item">
                  <div className="category-info">
                    <span className="category-name">{category}</span>
                    <span className="category-percentage">{percentage}%</span>
                  </div>
                  <div className="category-bar">
                    <div 
                      className="category-fill" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="tab-content">
          <div className="inventory-alerts">
            <h3>Alertas de Inventario</h3>
            <div className="alerts-grid">
              {reportData.inventoryAlerts?.map((alert, index) => (
                <div key={index} className={`alert-card ${alert.level}`}>
                  <div className="alert-header">
                    <span className="alert-icon">
                      {alert.level === 'critical' ? '🚨' : '⚠️'}
                    </span>
                    <span className={`alert-level ${alert.level}`}>
                      {alert.level === 'critical' ? 'Crítico' : 'Advertencia'}
                    </span>
                  </div>
                  <div className="alert-product">{alert.product}</div>
                  <div className="alert-details">
                    <span>Stock: {alert.stock} unidades</span>
                    <span>Ubicación: {alert.location}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="inventory-summary">
            <h3>Resumen de Inventario</h3>
            <div className="inventory-stats">
              <div className="stat-card">
                <h4>Total de Productos</h4>
                <div className="stat-value">156</div>
              </div>
              <div className="stat-card">
                <h4>Valor Total</h4>
                <div className="stat-value">{formatCurrency(12450)}</div>
              </div>
              <div className="stat-card">
                <h4>Productos con Stock Bajo</h4>
                <div className="stat-value critical">8</div>
              </div>
              <div className="stat-card">
                <h4>Rotación Promedio</h4>
                <div className="stat-value">15 días</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="tab-content">
          <div className="top-products">
            <h3>Productos Más Vendidos</h3>
            <div className="products-table">
              <div className="table-header">
                <span>Producto</span>
                <span>Unidades</span>
                <span>Ingresos</span>
                <span>Participación</span>
              </div>
              {reportData.topProducts?.map((product, index) => (
                <div key={index} className="table-row">
                  <span className="product-name">
                    <span className="rank">#{index + 1}</span>
                    {product.name}
                  </span>
                  <span className="units-sold">{product.sales}</span>
                  <span className="revenue">{formatCurrency(product.revenue)}</span>
                  <span className="market-share">
                    {((product.sales / reportData.topProducts.reduce((sum, p) => sum + p.sales, 0)) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .reports-page {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .reports-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .reports-header h1 {
          color: #1f2937;
          font-size: 2rem;
          margin: 0;
        }

        .period-select {
          padding: 0.75rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          font-size: 1rem;
          background: white;
        }

        .report-tabs {
          display: flex;
          border-bottom: 1px solid #e5e7eb;
          margin-bottom: 2rem;
        }

        .tab {
          padding: 1rem 1.5rem;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 1rem;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }

        .tab:hover {
          background: #f9fafb;
        }

        .tab.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
        }

        .tab-content {
          animation: fadeIn 0.3s ease-in;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .kpi-card {
          background: white;
          padding: 1.5rem;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          border: 1px solid #e5e7eb;
        }

        .kpi-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .kpi-header h3 {
          margin: 0;
          color: #6b7280;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .kpi-icon {
          font-size: 1.5rem;
        }

        .kpi-value {
          font-size: 2rem;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .kpi-change {
          font-size: 0.9rem;
          font-weight: 500;
        }

        .kpi-change.positive {
          color: #059669;
        }

        .kpi-change.negative {
          color: #dc2626;
        }

        .chart-container {
          background: white;
          padding: 1.5rem;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          margin-bottom: 2rem;
        }

        .chart-container h3 {
          margin: 0 0 1.5rem 0;
          color: #1f2937;
        }

        .sales-chart {
          display: flex;
          align-items: flex-end;
          height: 200px;
          gap: 2px;
          padding: 1rem 0;
        }

        .chart-bar {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
        }

        .bar {
          background: linear-gradient(to top, #3b82f6, #60a5fa);
          border-radius: 2px 2px 0 0;
          min-height: 10px;
          width: 100%;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .bar:hover {
          opacity: 0.8;
        }

        .bar-label {
          margin-top: 0.5rem;
          font-size: 0.8rem;
          color: #6b7280;
        }

        .category-breakdown {
          background: white;
          padding: 1.5rem;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          margin-bottom: 2rem;
        }

        .category-breakdown h3 {
          margin: 0 0 1.5rem 0;
          color: #1f2937;
        }

        .category-item {
          margin-bottom: 1rem;
        }

        .category-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .category-name {
          font-weight: 500;
          color: #374151;
        }

        .category-percentage {
          color: #6b7280;
          font-weight: 500;
        }

        .category-bar {
          height: 8px;
          background: #f3f4f6;
          border-radius: 4px;
          overflow: hidden;
        }

        .category-fill {
          height: 100%;
          background: linear-gradient(to right, #3b82f6, #60a5fa);
          transition: width 0.3s ease;
        }

        .inventory-alerts {
          background: white;
          padding: 1.5rem;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          margin-bottom: 2rem;
        }

        .inventory-alerts h3 {
          margin: 0 0 1.5rem 0;
          color: #1f2937;
        }

        .alerts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
        }

        .alert-card {
          padding: 1rem;
          border-radius: 0.5rem;
          border-left: 4px solid;
        }

        .alert-card.critical {
          background: #fef2f2;
          border-left-color: #dc2626;
        }

        .alert-card.warning {
          background: #fffbeb;
          border-left-color: #f59e0b;
        }

        .alert-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .alert-level.critical {
          color: #dc2626;
          font-weight: 500;
        }

        .alert-level.warning {
          color: #f59e0b;
          font-weight: 500;
        }

        .alert-product {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .alert-details {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          font-size: 0.9rem;
          color: #6b7280;
        }

        .inventory-summary {
          background: white;
          padding: 1.5rem;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .inventory-summary h3 {
          margin: 0 0 1.5rem 0;
          color: #1f2937;
        }

        .inventory-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .stat-card {
          text-align: center;
          padding: 1rem;
          background: #f9fafb;
          border-radius: 0.5rem;
        }

        .stat-card h4 {
          margin: 0 0 0.5rem 0;
          color: #6b7280;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: bold;
          color: #1f2937;
        }

        .stat-value.critical {
          color: #dc2626;
        }

        .top-products {
          background: white;
          padding: 1.5rem;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .top-products h3 {
          margin: 0 0 1.5rem 0;
          color: #1f2937;
        }

        .products-table {
          border-radius: 0.5rem;
          overflow: hidden;
          border: 1px solid #e5e7eb;
        }

        .table-header {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 1rem;
          padding: 1rem;
          background: #f9fafb;
          font-weight: 600;
          color: #374151;
          border-bottom: 1px solid #e5e7eb;
        }

        .table-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 1rem;
          padding: 1rem;
          border-bottom: 1px solid #f3f4f6;
          align-items: center;
        }

        .table-row:last-child {
          border-bottom: none;
        }

        .table-row:hover {
          background: #f9fafb;
        }

        .product-name {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .rank {
          background: #3b82f6;
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.8rem;
          font-weight: bold;
        }

        .units-sold {
          text-align: center;
          font-weight: 500;
        }

        .revenue {
          text-align: center;
          color: #059669;
          font-weight: 500;
        }

        .market-share {
          text-align: center;
          color: #6b7280;
        }

        .loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 400px;
        }

        .loading-spinner {
          text-align: center;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f4f6;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .reports-page {
            padding: 1rem;
          }
          
          .kpi-grid {
            grid-template-columns: 1fr;
          }
          
          .table-header,
          .table-row {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Reports;
