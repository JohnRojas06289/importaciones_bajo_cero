// frontend/src/hooks/useCart.js
import { useState, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';

/**
 * Hook personalizado para manejar el carrito de compras
 */
export function useCart() {
  const [cart, setCart] = useState([]);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Agregar producto al carrito
  const addToCart = useCallback((product) => {
    setCart(currentCart => {
      // Verificar si el producto ya está en el carrito
      const existingItemIndex = currentCart.findIndex(
        item => item.variantId === product.variantId
      );

      if (existingItemIndex >= 0) {
        // Si ya existe, incrementar cantidad
        const newCart = [...currentCart];
        const existingItem = newCart[existingItemIndex];
        const newQuantity = existingItem.quantity + (product.quantity || 1);
        
        // Verificar stock disponible
        if (newQuantity > existingItem.availableStock) {
          toast.error(`Stock insuficiente. Disponible: ${existingItem.availableStock}`);
          return currentCart;
        }
        
        newCart[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity
        };
        
        return newCart;
      } else {
        // Si no existe, agregar nuevo item
        const newItem = {
          id: Date.now() + Math.random(), // ID único temporal
          variantId: product.variantId,
          productName: product.productName,
          sku: product.sku,
          size: product.size,
          color: product.color,
          price: product.price,
          quantity: product.quantity || 1,
          availableStock: product.availableStock,
          discount: 0,
          addedAt: new Date()
        };
        
        return [...currentCart, newItem];
      }
    });
  }, []);

  // Remover producto del carrito
  const removeFromCart = useCallback((itemId) => {
    setCart(currentCart => currentCart.filter(item => item.id !== itemId));
  }, []);

  // Actualizar cantidad de un producto
  const updateQuantity = useCallback((itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCart(currentCart => {
      const newCart = [...currentCart];
      const itemIndex = newCart.findIndex(item => item.id === itemId);
      
      if (itemIndex >= 0) {
        const item = newCart[itemIndex];
        
        // Verificar stock disponible
        if (newQuantity > item.availableStock) {
          toast.error(`Stock insuficiente. Disponible: ${item.availableStock}`);
          return currentCart;
        }
        
        newCart[itemIndex] = {
          ...item,
          quantity: newQuantity
        };
      }
      
      return newCart;
    });
  }, [removeFromCart]);

  // Aplicar descuento a un item específico
  const applyItemDiscount = useCallback((itemId, discount) => {
    setCart(currentCart => {
      const newCart = [...currentCart];
      const itemIndex = newCart.findIndex(item => item.id === itemId);
      
      if (itemIndex >= 0) {
        newCart[itemIndex] = {
          ...newCart[itemIndex],
          discount: Math.max(0, discount)
        };
      }
      
      return newCart;
    });
  }, []);

  // Aplicar descuento global
  const applyDiscount = useCallback((type, value) => {
    if (type === 'percentage') {
      setDiscountPercentage(Math.max(0, Math.min(100, value)));
      setDiscountAmount(0);
    } else if (type === 'amount') {
      setDiscountAmount(Math.max(0, value));
      setDiscountPercentage(0);
    }
  }, []);

  // Limpiar carrito
  const clearCart = useCallback(() => {
    setCart([]);
    setDiscountPercentage(0);
    setDiscountAmount(0);
  }, []);

  // Cálculos del carrito (memoizados para eficiencia)
  const cartCalculations = useMemo(() => {
    // Subtotal de items
    const itemsSubtotal = cart.reduce((total, item) => {
      const itemTotal = (item.price * item.quantity) - (item.discount || 0);
      return total + itemTotal;
    }, 0);

    // Descuento global
    let globalDiscount = discountAmount;
    if (discountPercentage > 0) {
      globalDiscount = itemsSubtotal * (discountPercentage / 100);
    }

    // Total final
    const total = Math.max(0, itemsSubtotal - globalDiscount);

    // Conteo de items
    const itemsCount = cart.reduce((count, item) => count + item.quantity, 0);

    // Impuestos (si aplican en el futuro)
    const taxAmount = 0;

    return {
      itemsSubtotal: Math.round(itemsSubtotal),
      globalDiscount: Math.round(globalDiscount),
      taxAmount: Math.round(taxAmount),
      total: Math.round(total),
      itemsCount,
      averageItemPrice: itemsCount > 0 ? Math.round(itemsSubtotal / itemsCount) : 0
    };
  }, [cart, discountPercentage, discountAmount]);

  // Validaciones del carrito
  const cartValidation = useMemo(() => {
    const issues = [];
    
    // Verificar stock para cada item
    cart.forEach(item => {
      if (item.quantity > item.availableStock) {
        issues.push({
          type: 'stock',
          itemId: item.id,
          message: `${item.productName} tiene stock insuficiente`,
          severity: 'error'
        });
      } else if (item.quantity === item.availableStock) {
        issues.push({
          type: 'stock_warning',
          itemId: item.id,
          message: `${item.productName} es el último en stock`,
          severity: 'warning'
        });
      }
    });

    // Verificar si el carrito está vacío
    if (cart.length === 0) {
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
  }, [cart]);

  // Resumen completo del carrito
  const cartSummary = useMemo(() => ({
    items: cart,
    itemsCount: cartCalculations.itemsCount,
    itemsSubtotal: cartCalculations.itemsSubtotal,
    discountPercentage,
    discountAmount,
    globalDiscount: cartCalculations.globalDiscount,
    taxAmount: cartCalculations.taxAmount,
    total: cartCalculations.total,
    averageItemPrice: cartCalculations.averageItemPrice,
    validation: cartValidation,
    // Métodos de pago sugeridos basados en el total
    suggestedPaymentMethods: getSuggestedPaymentMethods(cartCalculations.total)
  }), [cart, cartCalculations, discountPercentage, discountAmount, cartValidation]);

  // Funciones de utilidad para exportar
  const cartUtils = {
    // Obtener item por ID
    getItem: (itemId) => cart.find(item => item.id === itemId),
    
    // Verificar si un producto está en el carrito
    hasProduct: (variantId) => cart.some(item => item.variantId === variantId),
    
    // Obtener cantidad de un producto específico
    getProductQuantity: (variantId) => {
      const item = cart.find(item => item.variantId === variantId);
      return item ? item.quantity : 0;
    },
    
    // Exportar carrito como JSON
    exportCart: () => JSON.stringify(cartSummary, null, 2),
    
    // Importar carrito desde JSON
    importCart: (cartData) => {
      try {
        const parsedCart = JSON.parse(cartData);
        setCart(parsedCart.items || []);
        setDiscountPercentage(parsedCart.discountPercentage || 0);
        setDiscountAmount(parsedCart.discountAmount || 0);
        return true;
      } catch (error) {
        toast.error('Error al importar carrito');
        return false;
      }
    }
  };

  return {
    // Estado del carrito
    cart,
    cartTotal: cartCalculations.total,
    cartItemsCount: cartCalculations.itemsCount,
    cartSummary,
    
    // Acciones del carrito
    addToCart,
    removeFromCart,
    updateQuantity,
    applyItemDiscount,
    applyDiscount,
    clearCart,
    
    // Utilidades
    cartUtils,
    
    // Información adicional
    discountPercentage,
    discountAmount,
    validation: cartValidation
  };
}

// Función auxiliar para sugerir métodos de pago
function getSuggestedPaymentMethods(total) {
  const methods = ['cash'];
  
  if (total >= 20000) { // Más de $20,000
    methods.push('card');
  }
  
  if (total >= 50000) { // Más de $50,000
    methods.push('transfer');
  }
  
  return methods;
}

export default useCart;