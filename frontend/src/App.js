import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import { apiService } from './services/api';

// Componente Principal POS
function POSSystem() {
  // Estados principales
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [scannerInput, setScannerInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [showCart, setShowCart] = useState(false);
  
  // Referencias
  const scannerInputRef = useRef(null);
  const searchInputRef = useRef(null);

  // Aplicar filtros cuando cambien
  const applyFilters = useCallback(() => {
    let filtered = [...products];
    
    // Filtrar por categoría
    if (selectedCategory) {
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        p.category?.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }
    
    // Filtrar por talla
    if (selectedSize) {
      filtered = filtered.filter(p => p.size === selectedSize);
    }
    
    // Filtrar por color
    if (selectedColor) {
      filtered = filtered.filter(p => p.color === selectedColor);
    }
    
    // Filtrar por ubicación
    if (selectedLocation) {
      filtered = filtered.filter(p => p.location === selectedLocation);
    }
    
    // Filtrar por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(term) ||
        p.sku?.toLowerCase().includes(term) ||
        p.short_code?.toLowerCase().includes(term)
      );
    }
    
    setFilteredProducts(filtered);
  }, [products, selectedCategory, selectedSize, selectedColor, selectedLocation, searchTerm]);

  // Cargar productos y ubicaciones al inicio
  useEffect(() => {
    loadInitialData();
  }, []);

  // Aplicar filtros cuando cambien
  useEffect(() => {
    applyFilters();
  }, [products, selectedCategory, selectedSize, selectedColor, selectedLocation, searchTerm, applyFilters]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      // Cargar productos
      const productsData = await apiService.get('/products/search');
      setProducts(productsData.data.results || []);
      
      // Cargar ubicaciones
      const locationsData = await apiService.get('/inventory/locations');
      setLocations(locationsData.data || []);
    } catch (error) {
      // Error manejado por el servicio API
      setProducts([]);
      setLocations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScan = async (e) => {
    e.preventDefault();
    if (!scannerInput.trim()) return;
    
    setIsLoading(true);
    try {
      const result = await apiService.post('/products/scan', { code: scannerInput });
      
      if (result.data.found && result.data.product) {
        addToCart(result.data.product);
        setScannerInput('');
        scannerInputRef.current?.focus();
      } else {
        alert(result.data.message || 'Producto no encontrado');
      }
    } catch (error) {
      alert('Error al escanear producto');
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
    
    // Mostrar notificación
    showNotification(`${product.name} agregado al carrito`);
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === productId
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    }
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const showNotification = (message) => {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Remover después de 3 segundos
    setTimeout(() => {
      notification.remove();
    }, 3000);
  };

  const processSale = () => {
    if (cart.length === 0) {
      alert('El carrito está vacío');
      return;
    }
    
    // Aquí iría la lógica para procesar la venta
    alert(`Venta procesada por: $${calculateTotal().toLocaleString()}`);
    setCart([]);
    setShowCart(false);
  };

  // Obtener valores únicos para filtros
  const categories = ['Chaquetas', 'Gorras'];
  const sizes = [...new Set(products.map(p => p.size).filter(Boolean))].sort();
  const colors = [...new Set(products.map(p => p.color).filter(Boolean))].sort();
  const locationNames = locations.map(loc => loc.name);

  return (
    <div className="pos-container">
      {/* Header */}
      <header className="pos-header">
        <div className="header-content">
          <h1>🏪 Sistema POS - Almacén de Ropa</h1>
          <div className="header-actions">
            <button 
              className="cart-button"
              onClick={() => setShowCart(!showCart)}
            >
              🛒 Carrito ({cart.reduce((sum, item) => sum + item.quantity, 0)})
              <span className="cart-total">
                ${calculateTotal().toLocaleString()}
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className="main-layout">
        {/* Panel izquierdo - Filtros y Scanner */}
        <aside className="filters-panel">
          {/* Scanner */}
          <div className="scanner-section">
            <h3>📷 Escáner</h3>
            <form onSubmit={handleScan}>
              <input
                ref={scannerInputRef}
                type="text"
                value={scannerInput}
                onChange={(e) => setScannerInput(e.target.value)}
                placeholder="Escanear código o escribir código corto"
                className="scanner-input"
                disabled={isLoading}
                autoFocus
              />
              <button type="submit" disabled={isLoading}>
                {isLoading ? '⏳' : '🔍'} Buscar
              </button>
            </form>
            <div className="scanner-help">
              <small>Código corto: CH-001-M-NEG</small>
            </div>
          </div>

          {/* Búsqueda de texto */}
          <div className="search-section">
            <h3>🔍 Búsqueda</h3>
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, código..."
              className="search-input"
            />
          </div>

          {/* Filtros */}
          <div className="filters-section">
            <h3>🏷️ Filtros</h3>
            
            <div className="filter-group">
              <label>Categoría:</label>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">Todas</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Talla:</label>
              <select 
                value={selectedSize} 
                onChange={(e) => setSelectedSize(e.target.value)}
              >
                <option value="">Todas</option>
                {sizes.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Color:</label>
              <select 
                value={selectedColor} 
                onChange={(e) => setSelectedColor(e.target.value)}
              >
                <option value="">Todos</option>
                {colors.map(color => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Ubicación:</label>
              <select 
                value={selectedLocation} 
                onChange={(e) => setSelectedLocation(e.target.value)}
              >
                <option value="">Todas</option>
                {locationNames.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>

            <button 
              className="clear-filters-btn"
              onClick={() => {
                setSelectedCategory('');
                setSelectedSize('');
                setSelectedColor('');
                setSelectedLocation('');
                setSearchTerm('');
              }}
            >
              🗑️ Limpiar Filtros
            </button>
          </div>
        </aside>

        {/* Panel central - Lista de productos */}
        <main className="products-section">
          <div className="products-header">
            <h2>📦 Productos ({filteredProducts.length})</h2>
            <div className="products-actions">
              <button onClick={() => setShowCart(!showCart)}>
                Ver Carrito ({cart.length})
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Buscando productos...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-state">
              <p>No se encontraron productos</p>
              <small>Intenta ajustar los filtros o la búsqueda</small>
            </div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map(product => (
                <div key={product.variant_id} className="product-card">
                  <div className="product-info">
                    <h4>{product.name}</h4>
                    <p className="product-details">
                      <span className="category">{product.category}</span>
                      <span className="size">Talla: {product.size}</span>
                      <span className="color">Color: {product.color}</span>
                    </p>
                    <p className="short-code">{product.short_code}</p>
                    <div className="price-stock">
                      <span className="price">${product.price?.toLocaleString()}</span>
                      <span className={`stock ${product.available_stock <= 3 ? 'low' : ''}`}>
                        Stock: {product.available_stock}
                      </span>
                    </div>
                    {product.location && (
                      <p className="location">📍 {product.location}</p>
                    )}
                  </div>
                  <div className="product-actions">
                    <button 
                      className="add-to-cart-btn"
                      onClick={() => addToCart(product)}
                      disabled={product.available_stock === 0}
                    >
                      {product.available_stock === 0 ? 'Sin Stock' : '➕ Agregar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Panel derecho - Carrito */}
        {showCart && (
          <aside className="cart-panel">
            <div className="cart-header">
              <h3>🛒 Carrito de Compras</h3>
              <button 
                className="close-cart-btn"
                onClick={() => setShowCart(false)}
              >
                ✖️
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="empty-cart">
                <p>El carrito está vacío</p>
                <small>Agrega productos desde la lista</small>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map(item => (
                    <div key={item.variant_id} className="cart-item">
                      <div className="item-info">
                        <h5>{item.name}</h5>
                        <p>{item.category} - {item.size} - {item.color}</p>
                        <p className="item-code">{item.short_code}</p>
                      </div>
                      <div className="item-controls">
                        <div className="quantity-controls">
                          <button 
                            onClick={() => updateQuantity(item.variant_id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            ➖
                          </button>
                          <span className="quantity">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.variant_id, item.quantity + 1)}
                            disabled={item.quantity >= item.available_stock}
                          >
                            ➕
                          </button>
                        </div>
                        <div className="item-price">
                          ${(item.price * item.quantity).toLocaleString()}
                        </div>
                        <button 
                          className="remove-item-btn"
                          onClick={() => removeFromCart(item.variant_id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cart-summary">
                  <div className="total-items">
                    Total items: {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </div>
                  <div className="total-amount">
                    <strong>Total: ${calculateTotal().toLocaleString()}</strong>
                  </div>
                  <div className="cart-actions">
                    <button 
                      className="clear-cart-btn"
                      onClick={() => setCart([])}
                    >
                      🗑️ Vaciar Carrito
                    </button>
                    <button 
                      className="checkout-btn"
                      onClick={processSale}
                      disabled={cart.length === 0}
                    >
                      💳 Procesar Venta
                    </button>
                  </div>
                </div>
              </>
            )}
          </aside>
        )}
      </div>

      {/* Notificaciones */}
      <div id="notifications" className="notifications-container"></div>
    </div>
  );
}

// Componente principal App
function App() {
  const [backendStatus, setBackendStatus] = useState('checking');
  const [error, setError] = useState(null);

  useEffect(() => {
    // Verificar conectividad del backend
    const checkBackend = async () => {
      try {
        // Intentar conectar con el backend
        const response = await apiService.get('/health');
        if (response.data) {
          setBackendStatus('connected');
        }
      } catch (err) {
        setBackendStatus('error');
        setError('No se puede conectar con el backend. Usando modo demo.');
      }
    };

    checkBackend();
  }, []);

  // Mostrar estado de carga
  if (backendStatus === 'checking') {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ marginTop: '20px', color: '#666' }}>
          Conectando con el sistema...
        </p>
      </div>
    );
  }

  return (
    <div className="App">
      {error && (
        <div style={{
          background: '#fff3cd',
          color: '#856404',
          padding: '10px',
          margin: '10px',
          borderRadius: '5px',
          border: '1px solid #ffeaa7'
        }}>
          ⚠️ {error}
        </div>
      )}
      <POSSystem />
    </div>
  );
}

export default App;