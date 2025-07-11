// frontend/src/components/layout/Layout.js
import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import Header from './Header';
import Sidebar from './Sidebar';
import LoadingSpinner from '../common/LoadingSpinner';

// Hooks
import { useNetworkStatus } from '../../hooks/useSystemHealth';
import { useRealTimeMetrics } from '../../hooks/useSystemHealth';

// Icons
import { 
  WifiIcon, 
  ExclamationTriangleIcon,
  SignalSlashIcon 
} from '@heroicons/react/24/outline';

const Layout = () => {
  // Estados
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Hooks
  const location = useLocation();
  const isOnline = useNetworkStatus();
  const { data: metrics, isLoading: metricsLoading } = useRealTimeMetrics();

  // Efectos
  useEffect(() => {
    // Simular carga inicial
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Cerrar sidebar en mobile cuando cambia la ruta
    setSidebarOpen(false);
  }, [location.pathname]);

  // Configuración de páginas
  const getPageConfig = (pathname) => {
    const configs = {
      '/pos': {
        title: 'Punto de Venta',
        description: 'Sistema de ventas rápidas',
        showSidebar: false, // POS en pantalla completa
        backgroundColor: 'bg-pos-bg'
      },
      '/inventory': {
        title: 'Inventario',
        description: 'Gestión de stock y ubicaciones',
        showSidebar: true,
        backgroundColor: 'bg-gray-50'
      },
      '/reports': {
        title: 'Reportes',
        description: 'Análisis y estadísticas',
        showSidebar: true,
        backgroundColor: 'bg-gray-50'
      },
      '/settings': {
        title: 'Configuración',
        description: 'Ajustes del sistema',
        showSidebar: true,
        backgroundColor: 'bg-gray-50'
      }
    };

    return configs[pathname] || {
      title: 'Sistema de Inventario',
      description: 'Gestión integral',
      showSidebar: true,
      backgroundColor: 'bg-gray-50'
    };
  };

  const pageConfig = getPageConfig(location.pathname);

  // Mostrar loading inicial
  if (isLoading) {
    return (
      <div className="min-h-screen bg-pos-bg flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="xl" />
          <h2 className="mt-4 text-xl font-semibold text-pos-text-primary">
            Cargando Sistema
          </h2>
          <p className="mt-2 text-pos-text-secondary">
            Inicializando aplicación...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <AnimatePresence>
        {pageConfig.showSidebar && (
          <>
            {/* Overlay para mobile */}
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}

            {/* Sidebar component */}
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: sidebarOpen ? 0 : -280 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-30 w-64 lg:static lg:inset-0 lg:z-auto lg:translate-x-0"
            >
              <Sidebar 
                onClose={() => setSidebarOpen(false)}
                metrics={metrics}
                isLoading={metricsLoading}
              />
            </motion.div>

            {/* Sidebar estático para desktop */}
            <div className="hidden lg:flex lg:w-64 lg:flex-col">
              <Sidebar 
                metrics={metrics}
                isLoading={metricsLoading}
              />
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header 
          onMenuClick={() => setSidebarOpen(true)}
          showMenuButton={pageConfig.showSidebar}
          title={pageConfig.title}
          description={pageConfig.description}
          metrics={metrics}
        />

        {/* Barra de estado de conectividad */}
        <AnimatePresence>
          {!isOnline && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="bg-danger-600 text-white px-4 py-2 text-sm font-medium"
            >
              <div className="flex items-center justify-center space-x-2">
                <SignalSlashIcon className="h-4 w-4" />
                <span>Sin conexión a internet - Trabajando en modo offline</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Área de contenido principal */}
        <main className={`flex-1 overflow-y-auto ${pageConfig.backgroundColor}`}>
          <div className="h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Footer opcional para páginas que no sean POS */}
        {pageConfig.showSidebar && (
          <footer className="bg-white border-t border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-4">
                <span>© 2024 Sistema de Inventario</span>
                <div className="flex items-center space-x-1">
                  <WifiIcon className={`h-4 w-4 ${isOnline ? 'text-success-500' : 'text-danger-500'}`} />
                  <span className={isOnline ? 'text-success-600' : 'text-danger-600'}>
                    {isOnline ? 'Conectado' : 'Desconectado'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {metrics && (
                  <>
                    <span>
                      Ventas hoy: {metrics.todaySalesCount}
                    </span>
                    <span>
                      Alertas: {metrics.lowStockAlerts}
                    </span>
                  </>
                )}
                <span>
                  v1.0.0
                </span>
              </div>
            </div>
          </footer>
        )}
      </div>

      {/* Notificaciones globales (para alertas importantes) */}
      <AnimatePresence>
        {metrics?.lowStockAlerts > 5 && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed bottom-4 right-4 bg-warning-100 border border-warning-200 rounded-lg p-4 shadow-lg z-50 max-w-sm"
          >
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-warning-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-warning-800">
                  Múltiples alertas de stock
                </h4>
                <p className="mt-1 text-sm text-warning-700">
                  Tienes {metrics.lowStockAlerts} productos con stock bajo. 
                  Revisa el inventario.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Indicador de carga global */}
      <AnimatePresence>
        {metricsLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-4 right-4 bg-white rounded-lg shadow-lg p-3 z-50"
          >
            <div className="flex items-center space-x-2">
              <LoadingSpinner size="sm" />
              <span className="text-sm text-gray-600">Actualizando datos...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay de mantenimiento (si es necesario) */}
      {process.env.REACT_APP_MAINTENANCE_MODE === 'true' && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
            <div className="mb-4">
              <ExclamationTriangleIcon className="h-12 w-12 text-warning-500 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Mantenimiento Programado
            </h2>
            <p className="text-gray-600 mb-4">
              El sistema está en mantenimiento. Por favor, intenta más tarde.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="button-primary"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;