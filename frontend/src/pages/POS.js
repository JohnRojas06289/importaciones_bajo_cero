// frontend/src/pages/POS.js
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

// Components
import Scanner from '../components/pos/Scanner';
import ProductSearch from '../components/pos/ProductSearch';
import Cart from '../components/pos/Cart';
import PaymentModal from '../components/pos/PaymentModal';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Hooks
import { useCart } from '../hooks/useCart';
import { useScanner } from '../hooks/useScanner';
import { useProducts } from '../hooks/useProducts';

// Services
import { salesService } from '../services/salesService';

// Icons
import { 
  QrCodeIcon, 
  MagnifyingGlassIcon,
  ShoppingCartIcon,
  CreditCardIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const POS = () => {
  // Estados principales
  const [activeTab, setActiveTab] = useState('scanner'); // 'scanner' | 'search'
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [lastSaleResult, setLastSaleResult] = useState(null);

  // Hooks personalizados
  const {
    cart,
    cartTotal,
    cartItemsCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    applyDiscount,
    cartSummary
  } = useCart();

  const {
    isScanning,
    lastScan,
    scanError,
    startScanning,
    stopScanning,
    resetScan
  } = useScanner();

  const {
    searchProducts,
    isSearching,
    searchResults,
    clearSearchResults
  } = useProducts();

  // Efectos
  useEffect(() => {
    // Auto-iniciar escáner cuando se carga la página
    if (activeTab === 'scanner') {
      startScanning();
    }
    
    return () => {
      stopScanning();
    };
  }, [activeTab, startScanning, stopScanning]);

  // Manejar escaneo exitoso
  useEffect(() => {
    if (lastScan?.success && lastScan?.product) {
      handleProductFound(lastScan.product);
      resetScan();
    } else if (lastScan && !lastScan.success) {
      toast.error(lastScan.message || 'Producto no encontrado');
      resetScan();
    }
  }, [lastScan, resetScan]);

  // Handlers
  const handleProductFound = useCallback((product) => {
    addToCart({
      variantId: product.variant_id,
      productName: product.product_name,
      sku: product.sku,
      size: product.size,
      color: product.color,
      price: product.price,
      availableStock: product.available_stock,
      quantity: 1
    });

    toast.success(`Agregado: ${product.product_name} - ${product.size} - ${product.color}`);
  }, [addToCart]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'scanner') {
      startScanning();
      clearSearchResults();
    } else {
      stopScanning();
    }
  };

  const handleQuickSale = async () => {
    if (cartItemsCount === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    if (cartItemsCount === 1) {
      // Venta rápida para un solo producto
      const item = cart[0];
      setIsProcessingSale(true);
      
      try {
        const saleData = {
          variant_id: item.variantId,
          quantity: item.quantity,
          payment_method: 'cash',
          discount_amount: item.discount || 0
        };

        const result = await salesService.createQuickSale(saleData);
        
        if (result.success) {
          setLastSaleResult(result);
          clearCart();
          toast.success(`Venta completada: $${result.sale.total_amount.toLocaleString()}`);
        }
      } catch (error) {
        toast.error('Error al procesar la venta');
        console.error('Quick sale error:', error);
      } finally {
        setIsProcessingSale(false);
      }
    } else {
      // Abrir modal de pago para ventas múltiples
      setShowPaymentModal(true);
    }
  };

  const handleCompleteSale = async (paymentData) => {
    setIsProcessingSale(true);
    
    try {
      const saleData = {
        items: cart.map(item => ({
          variant_id: item.variantId,
          quantity: item.quantity,
          unit_price: item.price,
          discount_amount: item.discount || 0
        })),
        payment_method: paymentData.method,
        customer_phone: paymentData.customerPhone,
        discount_percentage: cartSummary.discountPercentage,
        discount_amount: cartSummary.discountAmount,
        notes: paymentData.notes
      };

      const result = await salesService.createSale(saleData);
      
      if (result.success) {
        setLastSaleResult(result);
        clearCart();
        setShowPaymentModal(false);
        toast.success(`Venta completada: $${result.total_amount.toLocaleString()}`);
      }
    } catch (error) {
      toast.error('Error al procesar la venta');
      console.error('Sale completion error:', error);
    } finally {
      setIsProcessingSale(false);
    }
  };

  return (
    <div className="min-h-screen bg-pos-bg">
      {/* Header */}
      <div className="bg-white border-b border-pos-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-pos-text-primary">
                Punto de Venta
              </h1>
              {isProcessingSale && (
                <div className="flex items-center text-warning-600">
                  <LoadingSpinner size="sm" className="mr-2" />
                  <span className="text-sm">Procesando venta...</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Información del carrito */}
              <div className="flex items-center space-x-2 text-pos-text-secondary">
                <ShoppingCartIcon className="h-5 w-5" />
                <span className="text-sm">
                  {cartItemsCount} {cartItemsCount === 1 ? 'artículo' : 'artículos'}
                </span>
                <span className="text-lg font-semibold text-pos-text-primary">
                  ${cartTotal.toLocaleString()}
                </span>
              </div>
              
              {/* Botón de venta rápida */}
              <button
                onClick={handleQuickSale}
                disabled={cartItemsCount === 0 || isProcessingSale}
                className={`
                  inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors duration-200
                  ${cartItemsCount > 0 && !isProcessingSale
                    ? 'bg-success-600 hover:bg-success-700 text-white'
                    : 'bg-secondary-300 text-secondary-500 cursor-not-allowed'
                  }
                `}
              >
                <CreditCardIcon className="h-5 w-5 mr-2" />
                {cartItemsCount === 1 ? 'Venta Rápida' : 'Procesar Venta'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Panel izquierdo - Escáner y búsqueda */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Tabs */}
            <div className="bg-white rounded-lg border border-pos-border">
              <div className="border-b border-pos-border">
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => handleTabChange('scanner')}
                    className={`
                      py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                      ${activeTab === 'scanner'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-pos-text-secondary hover:text-pos-text-primary hover:border-secondary-300'
                      }
                    `}
                  >
                    <QrCodeIcon className="h-5 w-5 inline mr-2" />
                    Escáner
                  </button>
                  <button
                    onClick={() => handleTabChange('search')}
                    className={`
                      py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                      ${activeTab === 'search'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-pos-text-secondary hover:text-pos-text-primary hover:border-secondary-300'
                      }
                    `}
                  >
                    <MagnifyingGlassIcon className="h-5 w-5 inline mr-2" />
                    Búsqueda
                  </button>
                </nav>
              </div>

              {/* Contenido de tabs */}
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {activeTab === 'scanner' && (
                    <motion.div
                      key="scanner"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Scanner
                        isActive={isScanning}
                        onScanResult={handleProductFound}
                        onError={(error) => toast.error(error)}
                        className="min-h-[400px]"
                      />
                      
                      {scanError && (
                        <div className="mt-4 p-4 bg-danger-50 border border-danger-200 rounded-lg">
                          <div className="flex items-center">
                            <ExclamationTriangleIcon className="h-5 w-5 text-danger-600 mr-2" />
                            <span className="text-danger-700">{scanError}</span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {activeTab === 'search' && (
                    <motion.div
                      key="search"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ProductSearch
                        onProductSelect={handleProductFound}
                        searchResults={searchResults}
                        isSearching={isSearching}
                        onSearch={searchProducts}
                        className="min-h-[400px]"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Últimos productos */}
            {lastSaleResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-success-50 border border-success-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-success-600 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-success-800">
                        Venta completada exitosamente
                      </h3>
                      <p className="mt-1 text-sm text-success-700">
                        Total: ${lastSaleResult.total_amount?.toLocaleString() || cartTotal.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setLastSaleResult(null)}
                    className="text-success-600 hover:text-success-800"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Panel derecho - Carrito */}
          <div className="lg:col-span-1">
            <Cart
              items={cart}
              total={cartTotal}
              summary={cartSummary}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeFromCart}
              onApplyDiscount={applyDiscount}
              onClearCart={clearCart}
              onCheckout={() => setShowPaymentModal(true)}
              isProcessing={isProcessingSale}
            />
          </div>
        </div>
      </div>

      {/* Modal de pago */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirm={handleCompleteSale}
        cartSummary={cartSummary}
        isProcessing={isProcessingSale}
      />
    </div>
  );
};

export default POS;