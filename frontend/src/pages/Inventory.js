import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Formulario para nuevo producto
  const [newProduct, setNewProduct] = useState({
    name: '',
    short_code: '',
    sku: '',
    category: '',
    subcategory: '',
    brand: '',
    price: '',
    size: '',
    color: '',
    description: '',
    location: '',
    available_stock: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [products, selectedLocation, selectedCategory, searchTerm]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [productsResponse, locationsResponse] = await Promise.all([
        apiService.get('/products/search'),
        apiService.get('/inventory/locations')
      ]);
      
      setProducts(productsResponse.data.results || []);
      setLocations(locationsResponse.data || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];

    if (selectedLocation) {
      filtered = filtered.filter(p => p.location === selectedLocation);
    }

    if (selectedCategory) {
      filtered = filtered.filter(p => 
        p.category?.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(term) ||
        p.short_code?.toLowerCase().includes(term) ||
        p.sku?.toLowerCase().includes(term) ||
        p.brand?.toLowerCase().includes(term)
      );
    }

    setFilteredProducts(filtered);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      // Simular creación de producto
      const newId = Math.max(...products.map(p => p.id), 0) + 1;
      const productToAdd = {
        ...newProduct,
        id: newId,
        price: parseFloat(newProduct.price),
        available_stock: parseInt(newProduct.available_stock),
        image_url: `https://via.placeholder.com/300x300?text=${encodeURIComponent(newProduct.name)}`
      };

      setProducts(prev => [...prev, productToAdd]);
      setNewProduct({
        name: '', short_code: '', sku: '', category: '', subcategory: '',
        brand: '', price: '', size: '', color: '', description: '',
        location: '', available_stock: 0
      });
      setShowAddProduct(false);
    } catch (error) {
      console.error('Error agregando producto:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setNewProduct(product);
    setShowAddProduct(true);
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setProducts(prev => 
        prev.map(p => p.id === editingProduct.id 
          ? { ...newProduct, price: parseFloat(newProduct.price) }
          : p
        )
      );
      setEditingProduct(null);
      setShowAddProduct(false);
      setNewProduct({
        name: '', short_code: '', sku: '', category: '', subcategory: '',
        brand: '', price: '', size: '', color: '', description: '',
        location: '', available_stock: 0
      });
    } catch (error) {
      console.error('Error actualizando producto:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      setProducts(prev => prev.filter(p => p.id !== productId));
    }
  };

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  if (isLoading) {
    return (
      <div className="inventory-page loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Cargando inventario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="inventory-page">
      <div className="inventory-header">
        <h1>Gestión de Inventario</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddProduct(true)}
        >
          + Agregar Producto
        </button>
      </div>

      {/* Filtros */}
      <div className="inventory-filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-group">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
          >
            <option value="">Todas las categorías</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="filter-select"
          >
            <option value="">Todas las ubicaciones</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.name}>{loc.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de productos */}
      <div className="inventory-grid">
        {filteredProducts.map(product => (
          <div key={product.id} className="inventory-card">
            <div className="product-image">
              <img src={product.image_url} alt={product.name} />
            </div>
            <div className="product-info">
              <h3>{product.name}</h3>
              <p className="product-code">{product.short_code}</p>
              <p className="product-brand">{product.brand}</p>
              <p className="product-category">{product.category}</p>
              <div className="product-details">
                <span className="size">Talla: {product.size}</span>
                <span className="color">Color: {product.color}</span>
              </div>
              <div className="product-stock">
                <span className={`stock ${product.available_stock < 5 ? 'low' : ''}`}>
                  Stock: {product.available_stock}
                </span>
              </div>
              <div className="product-price">
                ${product.price?.toFixed(2)}
              </div>
              <div className="product-location">
                📍 {product.location}
              </div>
            </div>
            <div className="product-actions">
              <button 
                onClick={() => handleEditProduct(product)}
                className="btn btn-sm btn-secondary"
              >
                Editar
              </button>
              <button 
                onClick={() => handleDeleteProduct(product.id)}
                className="btn btn-sm btn-danger"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal para agregar/editar producto */}
      {showAddProduct && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingProduct ? 'Editar Producto' : 'Agregar Nuevo Producto'}</h2>
              <button 
                onClick={() => {
                  setShowAddProduct(false);
                  setEditingProduct(null);
                  setNewProduct({
                    name: '', short_code: '', sku: '', category: '', subcategory: '',
                    brand: '', price: '', size: '', color: '', description: '',
                    location: '', available_stock: 0
                  });
                }}
                className="close-btn"
              >
                ×
              </button>
            </div>
            <form onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nombre del producto</label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Código corto</label>
                  <input
                    type="text"
                    value={newProduct.short_code}
                    onChange={(e) => setNewProduct({...newProduct, short_code: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>SKU</label>
                  <input
                    type="text"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Categoría</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    required
                  >
                    <option value="">Seleccionar categoría</option>
                    <option value="Chaquetas">Chaquetas</option>
                    <option value="Gorras">Gorras</option>
                    <option value="Sudaderas">Sudaderas</option>
                    <option value="Pantalones">Pantalones</option>
                    <option value="Camisetas">Camisetas</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Marca</label>
                  <input
                    type="text"
                    value={newProduct.brand}
                    onChange={(e) => setNewProduct({...newProduct, brand: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Precio</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Talla</label>
                  <select
                    value={newProduct.size}
                    onChange={(e) => setNewProduct({...newProduct, size: e.target.value})}
                    required
                  >
                    <option value="">Seleccionar talla</option>
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                    <option value="Única">Única</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Color</label>
                  <input
                    type="text"
                    value={newProduct.color}
                    onChange={(e) => setNewProduct({...newProduct, color: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Ubicación</label>
                  <select
                    value={newProduct.location}
                    onChange={(e) => setNewProduct({...newProduct, location: e.target.value})}
                    required
                  >
                    <option value="">Seleccionar ubicación</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.name}>{loc.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Stock inicial</label>
                  <input
                    type="number"
                    value={newProduct.available_stock}
                    onChange={(e) => setNewProduct({...newProduct, available_stock: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label>Descripción</label>
                  <textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    rows="3"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Actualizar' : 'Agregar'} Producto
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowAddProduct(false);
                    setEditingProduct(null);
                  }}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .inventory-page {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .inventory-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .inventory-header h1 {
          color: #1f2937;
          font-size: 2rem;
          margin: 0;
        }

        .inventory-filters {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }

        .filter-group {
          flex: 1;
          min-width: 200px;
        }

        .search-input, .filter-select {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          font-size: 1rem;
        }

        .inventory-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .inventory-card {
          background: white;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          overflow: hidden;
          transition: transform 0.2s;
        }

        .inventory-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        .product-image {
          height: 200px;
          overflow: hidden;
        }

        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .product-info {
          padding: 1rem;
        }

        .product-info h3 {
          margin: 0 0 0.5rem 0;
          color: #1f2937;
          font-size: 1.1rem;
        }

        .product-code {
          color: #6b7280;
          font-family: 'Courier New', monospace;
          font-size: 0.9rem;
          margin: 0;
        }

        .product-brand {
          color: #374151;
          font-weight: 500;
          margin: 0.25rem 0;
        }

        .product-category {
          color: #6b7280;
          font-size: 0.9rem;
          margin: 0.25rem 0;
        }

        .product-details {
          display: flex;
          gap: 1rem;
          margin: 0.5rem 0;
          font-size: 0.9rem;
        }

        .product-stock .stock {
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.8rem;
          font-weight: 500;
          background: #dcfce7;
          color: #166534;
        }

        .product-stock .stock.low {
          background: #fef2f2;
          color: #dc2626;
        }

        .product-price {
          font-size: 1.2rem;
          font-weight: bold;
          color: #059669;
          margin: 0.5rem 0;
        }

        .product-location {
          color: #6b7280;
          font-size: 0.9rem;
        }

        .product-actions {
          padding: 1rem;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 0.5rem;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal {
          background: white;
          border-radius: 0.5rem;
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h2 {
          margin: 0;
          color: #1f2937;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6b7280;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
          padding: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-group label {
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #374151;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 1rem;
        }

        .modal-actions {
          padding: 1.5rem;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
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
      `}</style>
    </div>
  );
};

export default Inventory;
