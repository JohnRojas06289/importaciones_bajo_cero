// frontend/src/components/layout/Sidebar.js
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Icons
import {
  HomeIcon,
  CreditCardIcon,
  CubeIcon,
  ChartBarIcon,
  CogIcon,
  XMarkIcon,
  ShoppingCartIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  TagIcon,
  MapPinIcon,
  DocumentChartBarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

// Components
import LoadingSpinner from '../common/LoadingSpinner';

const Sidebar = ({ onClose, metrics, isLoading }) => {
  // Estados
  const [expandedSections, setExpandedSections] = useState({
    inventory: false,
    reports: false
  });

  // Hooks
  const location = useLocation();

  // Navegación principal
  const mainNavigation = [
    {
      name: 'Punto de Venta',
      href: '/pos',
      icon: CreditCardIcon,
      current: location.pathname === '/pos',
      badge: null,
      description: 'Sistema de ventas rápidas'
    },
    {
      name: 'Inventario',
      href: '/inventory',
      icon: CubeIcon,
      current: location.pathname.startsWith('/inventory'),
      badge: metrics?.lowStockAlerts > 0 ? metrics.lowStockAlerts : null,
      badgeColor: 'warning',
      description: 'Gestión de stock y ubicaciones',
      submenu: [
        {
          name: 'Vista General',
          href: '/inventory',
          icon: CubeIcon,
          current: location.pathname === '/inventory'
        },
        {
          name: 'Ubicaciones',
          href: '/inventory/locations',
          icon: MapPinIcon,
          current: location.pathname === '/inventory/locations'
        },
        {
          name: 'Alertas',
          href: '/inventory/alerts',
          icon: ExclamationTriangleIcon,
          current: location.pathname === '/inventory/alerts',
          badge: metrics?.lowStockAlerts
        },
        {
          name: 'Movimientos',
          href: '/inventory/movements',
          icon: ClockIcon,
          current: location.pathname === '/inventory/movements'
        }
      ]
    },
    {
      name: 'Reportes',
      href: '/reports',
      icon: ChartBarIcon,
      current: location.pathname.startsWith('/reports'),
      badge: null,
      description: 'Análisis y estadísticas',
      submenu: [
        {
          name: 'Dashboard',
          href: '/reports',
          icon: ChartBarIcon,
          current: location.pathname === '/reports'
        },
        {
          name: 'Ventas',
          href: '/reports/sales',
          icon: CurrencyDollarIcon,
          current: location.pathname === '/reports/sales'
        },
        {
          name: 'Productos',
          href: '/reports/products',
          icon: TagIcon,
          current: location.pathname === '/reports/products'
        },
        {
          name: 'Inventario',
          href: '/reports/inventory',
          icon: DocumentChartBarIcon,
          current: location.pathname === '/reports/inventory'
        }
      ]
    },
    {
      name: 'Configuración',
      href: '/settings',
      icon: CogIcon,
      current: location.pathname.startsWith('/settings'),
      badge: null,
      description: 'Ajustes del sistema'
    }
  ];

  // Métricas rápidas para mostrar en el sidebar
  const quickMetrics = [
    {
      name: 'Ventas Hoy',
      value: metrics?.todaySalesCount || 0,
      subvalue: `$${metrics?.todayRevenue?.toLocaleString() || '0'}`,
      icon: ShoppingCartIcon,
      color: 'success'
    },
    {
      name: 'Stock Bajo',
      value: metrics?.lowStockAlerts || 0,
      subvalue: 'productos',
      icon: ExclamationTriangleIcon,
      color: metrics?.lowStockAlerts > 0 ? 'warning' : 'gray'
    },
    {
      name: 'Reservas',
      value: metrics?.pendingReservations || 0,
      subvalue: 'activas',
      icon: ClockIcon,
      color: 'primary'
    }
  ];

  // Handlers
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleNavClick = (item) => {
    if (item.submenu) {
      const sectionKey = item.name.toLowerCase();
      toggleSection(sectionKey);
    }
    
    // En móvil, cerrar sidebar al navegar
    if (window.innerWidth < 1024) {
      onClose?.();
    }
  };

  const getColorClasses = (color) => {
    const colors = {
      success: 'text-success-600 bg-success-100',
      warning: 'text-warning-600 bg-warning-100',
      primary: 'text-primary-600 bg-primary-100',
      danger: 'text-danger-600 bg-danger-100',
      gray: 'text-gray-600 bg-gray-100'
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      
      {/* Header del sidebar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <CubeIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              Inventario
            </h1>
            <p className="text-xs text-gray-500">
              Sistema de Gestión
            </p>
          </div>
        </div>

        {/* Botón de cerrar (solo móvil) */}
        <button
          onClick={onClose}
          className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Métricas rápidas */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Resumen
        </h3>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="sm" />
          </div>
        ) : (
          <div className="space-y-3">
            {quickMetrics.map((metric, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${getColorClasses(metric.color)}`}>
                    <metric.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {metric.value}
                    </p>
                    <p className="text-xs text-gray-500">
                      {metric.subvalue}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-600">
                  {metric.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navegación principal */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {mainNavigation.map((item) => (
          <div key={item.name}>
            {/* Item principal */}
            <NavLink
              to={item.submenu ? '#' : item.href}
              onClick={(e) => {
                if (item.submenu) {
                  e.preventDefault();
                  handleNavClick(item);
                } else {
                  handleNavClick(item);
                }
              }}
              className={({ isActive }) => `
                group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200
                ${isActive || item.current
                  ? 'bg-primary-100 text-primary-700 border border-primary-200'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }
              `}
            >
              <div className="flex items-center space-x-3 flex-1">
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </div>

              <div className="flex items-center space-x-2">
                {/* Badge */}
                {item.badge && (
                  <span className={`
                    inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                    ${item.badgeColor === 'warning' 
                      ? 'bg-warning-100 text-warning-700'
                      : 'bg-gray-100 text-gray-700'
                    }
                  `}>
                    {item.badge}
                  </span>
                )}

                {/* Flecha para submenús */}
                {item.submenu && (
                  <motion.svg
                    animate={{ 
                      rotate: expandedSections[item.name.toLowerCase()] ? 90 : 0 
                    }}
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </motion.svg>
                )}
              </div>
            </NavLink>

            {/* Submenú */}
            <AnimatePresence>
              {item.submenu && expandedSections[item.name.toLowerCase()] && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="ml-6 mt-2 space-y-1"
                >
                  {item.submenu.map((subItem) => (
                    <NavLink
                      key={subItem.name}
                      to={subItem.href}
                      onClick={() => handleNavClick(subItem)}
                      className={({ isActive }) => `
                        group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200
                        ${isActive || subItem.current
                          ? 'bg-primary-50 text-primary-600 border-l-2 border-primary-600'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-3">
                        <subItem.icon className="h-4 w-4 flex-shrink-0" />
                        <span>{subItem.name}</span>
                      </div>

                      {subItem.badge && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-warning-100 text-warning-700">
                          {subItem.badge}
                        </span>
                      )}
                    </NavLink>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </nav>

      {/* Footer del sidebar */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>v1.0.0</span>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-success-500 rounded-full"></div>
            <span>Online</span>
          </div>
        </div>
        
        {/* Información adicional */}
        <div className="mt-2 p-2 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            <span className="font-medium">Terminal:</span> POS-01
          </p>
          <p className="text-xs text-gray-600">
            <span className="font-medium">Turno:</span> Mañana
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;