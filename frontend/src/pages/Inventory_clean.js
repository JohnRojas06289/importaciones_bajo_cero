import React, { useState, useEffect } from 'react';
import { realApiService } from '../services/realApiService';
import '../styles/components/Inventory.css';

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
        realApiService.getProducts(),
        realApiService.getLocations()
      ]);
      
      setProducts(productsResponse || []);
      
      // Si no hay ubicaciones en la base de datos, usar ubicaciones por defecto
      const defaultLocations = [
        { id: 1, name: 'Almacén Principal' },
        { id: 2, name: 'Tienda' },
        { id: 3, name: 'Bodega' },
        { id: 4, name: 'Vitrina' }
      ];
      
      setLocations(locationsResponse && locationsResponse.length > 0 ? locationsResponse : defaultLocations);
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
      
      // Crear producto en el backend con la estructura correcta
      const productData = {
        name: newProduct.name || 'Producto sin nombre',
        category: newProduct.category || 'General',
        category_code: newProduct.category ? newProduct.category.substring(0, 3).toUpperCase() : 'GEN',
        internal_number: newProduct.short_code || Math.random().toString(36).substring(2, 8).toUpperCase(),
        description: newProduct.description || '',
        brand: newProduct.brand || '',
        base_price: parseFloat(newProduct.price) || 0,
        wholesale_price: parseFloat(newProduct.price) * 0.8 || 0, // 80% del precio base
        is_active: true,
        requires_size: true,
        requires_color: true,
        tags: []
      };

      await realApiService.createProduct(productData);
      
      // Recargar datos
      await loadData();
      
      setNewProduct({
        name: '', short_code: '', sku: '', category: '', subcategory: '',
        brand: '', price: '', size: '', color: '', description: '',
        location: '', available_stock: 0
      });
      setShowAddProduct(false);
    } catch (error) {
      console.error('Error agregando producto:', error);
      alert('Error al crear el producto: ' + error.message);
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
      
      // Actualizar producto en el backend
      const productData = {
        name: newProduct.name,
        brand: newProduct.brand,
        category: newProduct.category,
        subcategory: newProduct.subcategory,
        description: newProduct.description,
        price: parseFloat(newProduct.price)
      };

      await realApiService.updateProduct(editingProduct.id, productData);
      
      // Recargar datos
      await loadData();
      
      setEditingProduct(null);
      setShowAddProduct(false);
      setNewProduct({
        name: '', short_code: '', sku: '', category: '', subcategory: '',
        brand: '', price: '', size: '', color: '', description: '',
        location: '', available_stock: 0
      });
    } catch (error) {
      console.error('Error actualizando producto:', error);
      alert('Error al actualizar el producto: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        setIsLoading(true);
        await realApiService.deleteProduct(productId);
        await loadData(); // Recargar datos
      } catch (error) {
        alert('Error al eliminar el producto: ' + error.message);
      } finally {
        setIsLoading(false);
      }
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
        {filteredProducts.length === 0 ? (
          <div className="empty-state">
            <p>No se encontraron productos</p>
          </div>
        ) : (
          filteredProducts.map(product => (
            <div key={product.id} className="product-card">
              <div className="product-header">
                <h3 className="product-name">{product.name}</h3>
                <span className="product-code">{product.internal_number || product.short_code}</span>
              </div>
              <div className="product-details">
                <div className="product-detail">
                  <strong>Marca:</strong> {product.brand || 'N/A'}
                </div>
                <div className="product-detail">
                  <strong>Categoría:</strong> {product.category || 'N/A'}
                </div>
                <div className="product-detail">
                  <strong>Precio:</strong> ${product.base_price?.toFixed(2) || '0.00'}
                </div>
                {product.description && (
                  <div className="product-detail">
                    <strong>Descripción:</strong> {product.description}
                  </div>
                )}
              </div>
              <div className="product-actions">
                <button 
                  onClick={() => handleEditProduct(product)}
                  className="btn btn-edit"
                >
                  Editar
                </button>
                <button 
                  onClick={() => handleDeleteProduct(product.id)}
                  className="btn btn-delete"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal para agregar/editar producto */}
      {showAddProduct && (
        <div className="modal-overlay">
          <div className="modal-content">
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
                  />
                </div>
                
                <div className="form-group">
                  <label>Código corto</label>
                  <input
                    type="text"
                    value={newProduct.short_code}
                    onChange={(e) => setNewProduct({...newProduct, short_code: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>SKU</label>
                  <input
                    type="text"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Categoría</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
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
                    onChange={(e) => setNewProduct(prev => ({...prev, brand: e.target.value}))}
                  />
                </div>

                <div className="form-group">
                  <label>Precio</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Talla</label>
                  <select
                    value={newProduct.size}
                    onChange={(e) => setNewProduct({...newProduct, size: e.target.value})}
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
                  />
                </div>

                <div className="form-group">
                  <label>Ubicación</label>
                  <select
                    value={newProduct.location}
                    onChange={(e) => setNewProduct({...newProduct, location: e.target.value})}
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
    </div>
  );
};

export default Inventory;
