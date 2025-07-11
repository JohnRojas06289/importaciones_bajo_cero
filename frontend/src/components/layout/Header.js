// frontend/src/components/layout/Header.js
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Icons
import {
  Bars3Icon,
  BellIcon,
  CogIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon,
  QuestionMarkCircleIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

// Hooks
import { useRealTimeMetrics } from '../../hooks/useSystemHealth';

const Header = ({ 
  onMenuClick, 
  showMenuButton = true, 
  title, 
  description, 
  metrics 
}) => {
  // Estados
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Hooks
  const location = useLocation();
  const navigate = useNavigate();

  // Datos del usuario (simulado)
  const currentUser = {
    name: 'Vendedor Principal',
    email: 'vendedor@almacenropa.com',
    role: 'Vendedor',
    avatar: null
  };

  // Notificaciones simuladas
  const notifications = [
    {
      id: 1,
      type: 'warning',
      title: 'Stock bajo',
      message: '5 productos con stock crítico',
      time: new Date(Date.now() - 10 * 60 * 1000), // 10 minutos atrás
      unread: true
    },
    {
      id: 2,
      type: 'success',
      title: 'Venta completada',
      message: 'Venta V-20241210-001 por $89,000',
      time: new Date(Date.now() - 30 * 60 * 1000), // 30 minutos atrás
      unread: true
    },
    {
      id: 3,
      type: 'info',
      title: 'Reporte generado',
      message: 'Reporte de ventas diario disponible',
      time: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
      unread: false
    }
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  // Handlers
  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    setShowUserMenu(false);
  };

  const handleUserMenuClick = () => {
    setShowUserMenu(!showUserMenu);
    setShowNotifications(false);
  };

  const handleLogout = () => {
    // Lógica de cierre de sesión
    navigate('/login');
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    // Implementar lógica de tema oscuro
  };

  const getPageBreadcrumb = () => {
    const paths = {
      '/pos': [{ name: 'Punto de Venta', current: true }],
      '/inventory': [{ name: 'Inventario', current: true }],
      '/reports': [{ name: 'Reportes', current: true }],
      '/settings': [{ name: 'Configuración', current: true }]
    };

    return paths[location.pathname] || [{ name: 'Inicio', current: true }];
  };

  const getNotificationIcon = (type) => {
    const icons = {
      'warning': ExclamationTriangleIcon,
      'success': ShoppingBagIcon,
      'info': ChartBarIcon,
      'error': ExclamationTriangleIcon
    };
    
    const Icon = icons[type] || BellIcon;
    return <Icon className="h-5 w-5" />;
  };

  const getNotificationColor = (type) => {
    const colors = {
      'warning': 'text-warning-600 bg-warning-100',
      'success': 'text-success-600 bg-success-100',
      'info': 'text-primary-600 bg-primary-100',
      'error': 'text-danger-600 bg-danger-100'
    };
    
    return colors[type] || 'text-gray-600 bg-gray-100';
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 relative z-10">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Lado izquierdo - Menú y título */}
          <div className="flex items-center space-x-4">
            {/* Botón de menú móvil */}
            {showMenuButton && (
              <button
                onClick={onMenuClick}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
            )}

            {/* Información de la página */}
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                {/* Breadcrumb */}
                <nav className="flex" aria-label="Breadcrumb">
                  <ol className="flex items-center space-x-2">
                    {getPageBreadcrumb().map((item, index) => (
                      <li key={index} className="flex items-center">
                        <span className={`
                          text-sm font-medium
                          ${item.current 
                            ? 'text-primary-600' 
                            : 'text-gray-500 hover:text-gray-700'
                          }
                        `}>
                          {item.name}
                        </span>
                      </li>
                    ))}
                  </ol>
                </nav>
              </div>
              
              {description && (
                <p className="text-xs text-gray-500 mt-1">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Centro - Métricas rápidas (solo en desktop) */}
          {metrics && location.pathname !== '/pos' && (
            <div className="hidden md:flex items-center space-x-6">
              
              {/* Ventas de hoy */}
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-success-100 rounded-lg">
                  <CurrencyDollarIcon className="h-4 w-4 text-success-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Ventas hoy</p>
                  <p className="text-sm font-semibold text-gray-900">
                    ${metrics.todayRevenue?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>

              {/* Alertas de stock */}
              <div className="flex items-center space-x-2">
                <div className={`
                  p-2 rounded-lg
                  ${metrics.lowStockAlerts > 0 
                    ? 'bg-warning-100' 
                    : 'bg-gray-100'
                  }
                `}>
                  <ExclamationTriangleIcon className={`
                    h-4 w-4
                    ${metrics.lowStockAlerts > 0 
                      ? 'text-warning-600' 
                      : 'text-gray-400'
                    }
                  `} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Alertas</p>
                  <p className={`
                    text-sm font-semibold
                    ${metrics.lowStockAlerts > 0 
                      ? 'text-warning-600' 
                      : 'text-gray-400'
                    }
                  `}>
                    {metrics.lowStockAlerts || 0}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Lado derecho - Acciones y usuario */}
          <div className="flex items-center space-x-3">
            
            {/* Hora actual */}
            <div className="hidden sm:flex flex-col text-right">
              <p className="text-xs text-gray-500">
                {format(new Date(), 'EEEE', { locale: es })}
              </p>
              <p className="text-sm font-medium text-gray-900">
                {format(new Date(), 'HH:mm')}
              </p>
            </div>

            {/* Notificaciones */}
            <div className="relative">
              <button
                onClick={handleNotificationClick}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <BellIcon className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Panel de notificaciones */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20"
                  >
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-900">
                        Notificaciones
                      </h3>
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`
                              p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors duration-200
                              ${notification.unread ? 'bg-primary-50' : ''}
                            `}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`
                                p-1 rounded-full ${getNotificationColor(notification.type)}
                              `}>
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">
                                  {notification.title}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {format(notification.time, 'HH:mm')}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center">
                          <BellIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">
                            No hay notificaciones
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {notifications.length > 0 && (
                      <div className="p-4 border-t border-gray-200">
                        <button className="text-sm text-primary-600 hover:text-primary-800 font-medium">
                          Ver todas las notificaciones
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Menú de usuario */}
            <div className="relative">
              <button
                onClick={handleUserMenuClick}
                className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <UserCircleIcon className="h-6 w-6" />
                <span className="hidden sm:block text-sm font-medium">
                  {currentUser.name}
                </span>
              </button>

              {/* Panel de usuario */}
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20"
                  >
                    {/* Información del usuario */}
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center space-x-3">
                        <UserCircleIcon className="h-10 w-10 text-gray-400" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {currentUser.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {currentUser.role}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Opciones del menú */}
                    <div className="py-2">
                      <button
                        onClick={() => navigate('/settings')}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <CogIcon className="h-4 w-4" />
                        <span>Configuración</span>
                      </button>

                      <button
                        onClick={toggleDarkMode}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        {darkMode ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
                        <span>{darkMode ? 'Modo claro' : 'Modo oscuro'}</span>
                      </button>

                      <button
                        onClick={() => window.open('/help', '_blank')}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <QuestionMarkCircleIcon className="h-4 w-4" />
                        <span>Ayuda</span>
                      </button>

                      <hr className="my-2" />

                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm text-danger-600 hover:bg-danger-50 flex items-center space-x-2"
                      >
                        <ArrowRightOnRectangleIcon className="h-4 w-4" />
                        <span>Cerrar sesión</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay para cerrar menús al hacer clic fuera */}
      {(showNotifications || showUserMenu) && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => {
            setShowNotifications(false);
            setShowUserMenu(false);
          }}
        />
      )}
    </header>
  );
};

export default Header;