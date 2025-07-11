// frontend/src/components/pos/CartItem.js
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

// Icons
import {
  MinusIcon,
  PlusIcon,
  TrashIcon,
  TagIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const CartItem = ({ 
  item, 
  onUpdateQuantity, 
  onRemove, 
  isProcessing = false 
}) => {
  // Estados locales
  const [isEditing, setIsEditing] = useState(false);
  const [editQuantity, setEditQuantity] = useState(item.quantity.toString());
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Referencias
  const quantityInputRef = useRef(null);

  // Efectos
  useEffect(() => {
    if (isEditing && quantityInputRef.current) {
      quantityInputRef.current.focus();
      quantityInputRef.current.select();
    }
  }, [isEditing]);

  // Cálculos
  const itemTotal = (item.price * item.quantity) - (item.discount || 0);
  const isOutOfStock = item.quantity > item.availableStock;
  const isLowStock = item.availableStock <= 3 && item.availableStock > 0;

  // Handlers
  const handleQuantityChange = (newQuantity) => {
    if (newQuantity <= 0) {
      handleRemove();
      return;
    }

    if (newQuantity > item.availableStock) {
      // Mostrar warning pero permitir la acción
      return;
    }

    onUpdateQuantity?.(item.id, newQuantity);
  };

  const handleQuantityInput = (value) => {
    setEditQuantity(value);
  };

  const handleQuantitySubmit = () => {
    const newQuantity = parseInt(editQuantity);
    
    if (isNaN(newQuantity) || newQuantity < 1) {
      setEditQuantity(item.quantity.toString());
      setIsEditing(false);
      return;
    }

    handleQuantityChange(newQuantity);
    setIsEditing(false);
  };

  const handleQuantityKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleQuantitySubmit();
    } else if (e.key === 'Escape') {
      setEditQuantity(item.quantity.toString());
      setIsEditing(false);
    }
  };

  const handleIncrement = () => {
    handleQuantityChange(item.quantity + 1);
  };

  const handleDecrement = () => {
    handleQuantityChange(item.quantity - 1);
  };

  const handleRemove = () => {
    if (showConfirmDelete) {
      onRemove?.(item.id);
      setShowConfirmDelete(false);
    } else {
      setShowConfirmDelete(true);
      // Auto-cancelar confirmación después de 3 segundos
      setTimeout(() => setShowConfirmDelete(false), 3000);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmDelete(false);
  };

  return (
    <motion.div
      layout
      className={`
        relative p-3 border rounded-lg transition-all duration-200
        ${isOutOfStock 
          ? 'bg-danger-50 border-danger-200' 
          : isLowStock 
          ? 'bg-warning-50 border-warning-200'
          : 'bg-white border-pos-border hover:border-secondary-300'
        }
      `}
    >
      {/* Información del producto */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-pos-text-primary truncate">
            {item.productName}
          </h4>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-sm text-pos-text-secondary">
              {item.size} • {item.color}
            </span>
            {item.sku && (
              <div className="flex items-center text-xs text-pos-text-secondary">
                <TagIcon className="h-3 w-3 mr-1" />
                <span className="font-mono">{item.sku}</span>
              </div>
            )}
          </div>
        </div>

        <div className="text-right ml-3">
          <p className="font-semibold text-pos-text-primary">
            ${item.price.toLocaleString()}
          </p>
          <p className="text-xs text-pos-text-secondary">c/u</p>
        </div>
      </div>

      {/* Alertas de stock */}
      {isOutOfStock && (
        <div className="flex items-center mb-3 p-2 bg-danger-100 border border-danger-200 rounded text-sm text-danger-700">
          <ExclamationTriangleIcon className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>
            Cantidad excede el stock disponible ({item.availableStock} unidades)
          </span>
        </div>
      )}

      {isLowStock && !isOutOfStock && (
        <div className="flex items-center mb-3 p-2 bg-warning-100 border border-warning-200 rounded text-sm text-warning-700">
          <ExclamationTriangleIcon className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>Stock bajo: solo {item.availableStock} unidades disponibles</span>
        </div>
      )}

      {/* Controles de cantidad y acciones */}
      <div className="flex items-center justify-between">
        
        {/* Controles de cantidad */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleDecrement}
            disabled={isProcessing}
            className={`
              p-1 rounded transition-colors duration-200
              ${item.quantity > 1
                ? 'text-secondary-600 hover:text-secondary-800 hover:bg-secondary-100'
                : 'text-secondary-300 cursor-not-allowed'
              }
            `}
          >
            <MinusIcon className="h-4 w-4" />
          </button>

          {/* Input de cantidad */}
          {isEditing ? (
            <input
              ref={quantityInputRef}
              type="number"
              value={editQuantity}
              onChange={(e) => handleQuantityInput(e.target.value)}
              onBlur={handleQuantitySubmit}
              onKeyPress={handleQuantityKeyPress}
              min="1"
              max={item.availableStock}
              className="w-16 px-2 py-1 text-center border border-secondary-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              disabled={isProcessing}
              className={`
                min-w-[2.5rem] px-2 py-1 text-center font-medium rounded transition-colors duration-200
                ${isOutOfStock 
                  ? 'bg-danger-100 text-danger-700 border border-danger-200'
                  : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200 border border-secondary-200'
                }
              `}
            >
              {item.quantity}
            </button>
          )}

          <button
            onClick={handleIncrement}
            disabled={isProcessing || item.quantity >= item.availableStock}
            className={`
              p-1 rounded transition-colors duration-200
              ${item.quantity < item.availableStock
                ? 'text-secondary-600 hover:text-secondary-800 hover:bg-secondary-100'
                : 'text-secondary-300 cursor-not-allowed'
              }
            `}
          >
            <PlusIcon className="h-4 w-4" />
          </button>

          <span className="text-sm text-pos-text-secondary ml-2">
            de {item.availableStock}
          </span>
        </div>

        {/* Total del item y botón eliminar */}
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="font-semibold text-pos-text-primary">
              ${itemTotal.toLocaleString()}
            </p>
            {item.discount > 0 && (
              <p className="text-xs text-success-600">
                -${item.discount.toLocaleString()} desc.
              </p>
            )}
          </div>

          {/* Botón eliminar con confirmación */}
          {showConfirmDelete ? (
            <div className="flex items-center space-x-1">
              <button
                onClick={handleRemove}
                className="p-1 text-danger-600 hover:text-danger-800 hover:bg-danger-100 rounded transition-colors duration-200"
                title="Confirmar eliminación"
              >
                <CheckCircleIcon className="h-4 w-4" />
              </button>
              <button
                onClick={handleCancelDelete}
                className="p-1 text-secondary-500 hover:text-secondary-700 hover:bg-secondary-100 rounded transition-colors duration-200"
                title="Cancelar"
              >
                <MinusIcon className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleRemove}
              disabled={isProcessing}
              className="p-1 text-secondary-500 hover:text-danger-600 hover:bg-danger-50 rounded transition-colors duration-200"
              title="Eliminar del carrito"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Indicador de descuento */}
      {item.discount > 0 && (
        <div className="mt-2 p-2 bg-success-50 border border-success-200 rounded text-sm">
          <div className="flex items-center justify-between">
            <span className="text-success-700">Descuento aplicado:</span>
            <span className="font-medium text-success-700">
              ${item.discount.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Información adicional */}
      <div className="mt-2 text-xs text-pos-text-secondary">
        <div className="flex justify-between">
          <span>Agregado: {new Date(item.addedAt).toLocaleTimeString()}</span>
          {item.quantity > 1 && (
            <span>{item.quantity} × ${item.price.toLocaleString()}</span>
          )}
        </div>
      </div>

      {/* Overlay de procesamiento */}
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-white bg-opacity-75 rounded-lg flex items-center justify-center"
        >
          <div className="flex items-center space-x-2 text-primary-600">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent"></div>
            <span className="text-sm font-medium">Procesando...</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default CartItem;