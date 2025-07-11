// frontend/src/components/pos/Cart.js
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

// Icons
import {
  ShoppingCartIcon,
  TrashIcon,
  MinusIcon,
  PlusIcon,
  TagIcon,
  ReceiptPercentIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

// Components
import CartItem from './CartItem';
import LoadingSpinner from '../common/LoadingSpinner';

const Cart = ({
  items = [],
  total = 0,
  summary = {},
  onUpdateQuantity,
  onRemoveItem,
  onApplyDiscount,
  onClearCart,
  onCheckout,
  isProcessing = false,
  className = ""
}) => {
  // Estados locales
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [discountType, setDiscountType] = useState('percentage'); // 'percentage' | 'amount'
  const [discountValue, setDiscountValue] = useState('');
  const [notes, setNotes] = useState('');

  // Validaciones del carrito
  const validation = useMemo(() => {
    const issues = [];
    
    items.forEach(item => {
      if (item.quantity > item.availableStock) {
        issues.push({
          type: 'stock_exceeded',
          message: `${item.productName} excede el stock disponible`,
          severity: 'error'
        });
      }
    });

    if (items.length === 0) {
      issues.push({
        type: 'empty_cart',
        message: 'El carrito está vacío',
        severity: 'info'
      });
    }

    return {
      isValid: issues.filter(issue => issue.severity === 'error').length === 0,
      issues,
      hasWarnings: issues.filter(issue => issue.severity === 'warning').length > 0
    };
  }, [items]);

  // Handlers
  const handleApplyDiscount = () => {
    const value = parseFloat(discountValue);
    
    if (isNaN(value) || value < 0) {
      toast.error('Valor de descuento inválido');
      return;
    }

    if (discountType === 'percentage' && value > 100) {
      toast.error('El porcentaje no puede ser mayor a 100%');
      return;
    }

    if (discountType === 'amount' && value > summary.itemsSubtotal) {
      toast.error('El descuento no puede ser mayor al subtotal');
      return;
    }

    onApplyDiscount?.(discountType, value);
    setDiscountModalOpen(false);
    setDiscountValue('');
    
    toast.success(`Descuento aplicado: ${discountType === 'percentage' ? `${value}%` : `$${value.toLocaleString()}`}`);
  };

  const handleRemoveDiscount = () => {
    onApplyDiscount?.('percentage', 0);
    toast.success('Descuento removido');
  };

  const handleClearCart = () => {
    if (items.length === 0) return;
    
    if (window.confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
      onClearCart?.();
      toast.success('Carrito vaciado');
    }
  };

  const handleCheckout = () => {
    if (!validation.isValid) {
      toast.error('Corrige los problemas del carrito antes de continuar');
      return;
    }

    if (items.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    onCheckout?.();
  };

  return (
    <div className={`cart-container bg-white rounded-lg border border-pos-border h-full flex flex-col ${className}`}>
      {/* Header del carrito */}
      <div className="p-4 border-b border-pos-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 text-primary-600 rounded-lg">
              <ShoppingCartIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-pos-text-primary">
                Carrito
              </h3>
              <p className="text-sm text-pos-text-secondary">
                {items.length} {items.length === 1 ? 'artículo' : 'artículos'}
              </p>
            </div>
          </div>

          {/* Botón limpiar carrito */}
          {items.length > 0 && (
            <button
              onClick={handleClearCart}
              disabled={isProcessing}
              className="p-2 text-secondary-500 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors duration-200"
              title="Vaciar carrito"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Validaciones del carrito */}
        {validation.issues.length > 0 && (
          <div className="mt-3 space-y-2">
            {validation.issues.map((issue, index) => (
              <div
                key={index}
                className={`
                  flex items-center p-2 rounded-lg text-sm
                  ${issue.severity === 'error'
                    ? 'bg-danger-50 text-danger-700 border border-danger-200'
                    : issue.severity === 'warning'
                    ? 'bg-warning-50 text-warning-700 border border-warning-200'
                    : 'bg-secondary-50 text-secondary-700 border border-secondary-200'
                  }
                `}
              >
                <ExclamationTriangleIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>{issue.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lista de productos */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full p-8 text-center"
            >
              <ShoppingCartIcon className="h-16 w-16 text-secondary-300 mb-4" />
              <h4 className="text-lg font-medium text-pos-text-primary mb-2">
                Carrito vacío
              </h4>
              <p className="text-pos-text-secondary">
                Escanea o busca productos para agregarlos al carrito
              </p>
            </motion.div>
          ) : (
            <div className="p-4 space-y-3">
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <CartItem
                    item={item}
                    onUpdateQuantity={onUpdateQuantity}
                    onRemove={onRemoveItem}
                    isProcessing={isProcessing}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Resumen y acciones del carrito */}
      {items.length > 0 && (
        <div className="border-t border-pos-border">
          {/* Sección de descuentos */}
          <div className="p-4 border-b border-pos-border">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-pos-text-primary">Descuentos</h4>
              <button
                onClick={() => setDiscountModalOpen(true)}
                disabled={isProcessing}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Aplicar descuento
              </button>
            </div>

            {(summary.discountPercentage > 0 || summary.discountAmount > 0) && (
              <div className="flex items-center justify-between p-2 bg-success-50 border border-success-200 rounded-lg">
                <div className="flex items-center">
                  <ReceiptPercentIcon className="h-4 w-4 text-success-600 mr-2" />
                  <span className="text-sm text-success-700">
                    {summary.discountPercentage > 0 
                      ? `${summary.discountPercentage}% de descuento`
                      : `$${summary.discountAmount?.toLocaleString()} de descuento`
                    }
                  </span>
                </div>
                <button
                  onClick={handleRemoveDiscount}
                  className="text-success-600 hover:text-success-800"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Resumen de totales */}
          <div className="p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-pos-text-secondary">Subtotal:</span>
              <span className="font-medium text-pos-text-primary">
                ${summary.itemsSubtotal?.toLocaleString()}
              </span>
            </div>

            {summary.globalDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-success-600">Descuento:</span>
                <span className="font-medium text-success-600">
                  -${summary.globalDiscount?.toLocaleString()}
                </span>
              </div>
            )}

            {summary.taxAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-pos-text-secondary">Impuestos:</span>
                <span className="font-medium text-pos-text-primary">
                  ${summary.taxAmount?.toLocaleString()}
                </span>
              </div>
            )}

            <div className="border-t border-pos-border pt-2">
              <div className="flex justify-between">
                <span className="text-lg font-semibold text-pos-text-primary">Total:</span>
                <span className="text-2xl font-bold text-primary-600">
                  ${total?.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Notas */}
          <div className="p-4 border-t border-pos-border">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas de la venta (opcional)..."
              className="w-full h-16 px-3 py-2 border border-secondary-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={isProcessing}
            />
          </div>

          {/* Botón de checkout */}
          <div className="p-4">
            <button
              onClick={handleCheckout}
              disabled={!validation.isValid || items.length === 0 || isProcessing}
              className={`
                w-full tablet-friendly flex items-center justify-center space-x-2 font-medium transition-all duration-200
                ${validation.isValid && items.length > 0 && !isProcessing
                  ? 'button-primary shadow-lg hover:shadow-xl'
                  : 'bg-secondary-300 text-secondary-500 cursor-not-allowed'
                }
              `}
            >
              {isProcessing ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <CreditCardIcon className="h-5 w-5" />
                  <span>Procesar Venta</span>
                  <span className="text-sm opacity-75">
                    (${total?.toLocaleString()})
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Modal de descuento */}
      <AnimatePresence>
        {discountModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setDiscountModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-pos-text-primary">
                  Aplicar Descuento
                </h3>
                <button
                  onClick={() => setDiscountModalOpen(false)}
                  className="text-secondary-500 hover:text-secondary-700"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Tipo de descuento */}
                <div>
                  <label className="block text-sm font-medium text-pos-text-secondary mb-2">
                    Tipo de descuento
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setDiscountType('percentage')}
                      className={`
                        p-3 rounded-lg border text-sm font-medium transition-colors duration-200
                        ${discountType === 'percentage'
                          ? 'bg-primary-50 border-primary-200 text-primary-700'
                          : 'bg-secondary-50 border-secondary-200 text-secondary-700'
                        }
                      `}
                    >
                      Porcentaje (%)
                    </button>
                    <button
                      onClick={() => setDiscountType('amount')}
                      className={`
                        p-3 rounded-lg border text-sm font-medium transition-colors duration-200
                        ${discountType === 'amount'
                          ? 'bg-primary-50 border-primary-200 text-primary-700'
                          : 'bg-secondary-50 border-secondary-200 text-secondary-700'
                        }
                      `}
                    >
                      Monto ($)
                    </button>
                  </div>
                </div>

                {/* Valor del descuento */}
                <div>
                  <label className="block text-sm font-medium text-pos-text-secondary mb-2">
                    {discountType === 'percentage' ? 'Porcentaje' : 'Monto'}
                  </label>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === 'percentage' ? '10' : '5000'}
                    className="input-field"
                    min="0"
                    max={discountType === 'percentage' ? '100' : summary.itemsSubtotal}
                  />
                </div>

                {/* Vista previa */}
                {discountValue && !isNaN(parseFloat(discountValue)) && (
                  <div className="p-3 bg-secondary-50 rounded-lg">
                    <div className="text-sm text-pos-text-secondary mb-1">Vista previa:</div>
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${summary.itemsSubtotal?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-success-600">
                      <span>Descuento:</span>
                      <span>
                        -${(discountType === 'percentage' 
                          ? (summary.itemsSubtotal * parseFloat(discountValue) / 100)
                          : parseFloat(discountValue)
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold border-t border-secondary-200 pt-1 mt-1">
                      <span>Total:</span>
                      <span>
                        ${(summary.itemsSubtotal - (discountType === 'percentage' 
                          ? (summary.itemsSubtotal * parseFloat(discountValue) / 100)
                          : parseFloat(discountValue)
                        )).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Botones */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setDiscountModalOpen(false)}
                    className="flex-1 button-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleApplyDiscount}
                    disabled={!discountValue || isNaN(parseFloat(discountValue))}
                    className="flex-1 button-primary"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Cart;