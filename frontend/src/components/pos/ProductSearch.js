// frontend/src/components/pos/ProductSearch.js
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { debounce } from 'lodash';

// Icons
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  TagIcon,
  SwatchIcon,
  Square3Stack3DIcon,
  CubeIcon,
  MapPinIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

// Components
import LoadingSpinner from '../common/LoadingSpinner';

const ProductSearch = ({ 
  onProductSelect, 
  searchResults = [], 
  isSearching = false, 
  onSearch,
  className = "",
  showFilters = true 
}) => {
  // Estados
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    size: '',
    color: '',
    inStock: true,
    minPrice: '',
    maxPrice: ''
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);

  // Referencias
  const searchInputRef = useRef(null);
  const resultsRef = useRef(null);

  // Búsqueda con debounce
  const debouncedSearch = useMemo(
    () => debounce((term, filterParams) => {
      if (term.trim().length >= 2 || Object.values(filterParams).some(v => v)) {
        onSearch?.(term, filterParams);
        
        // Agregar a búsquedas recientes
        if (term.trim()) {
          setRecentSearches(prev => {
            const newSearches = [term, ...prev.filter(s => s !== term)].slice(0, 5);
            return newSearches;
          });
        }
      }
    }, 300),
    [onSearch]
  );

  // Efectos
  useEffect(() => {
    debouncedSearch(searchTerm, filters);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchTerm, filters, debouncedSearch]);

  useEffect(() => {
    // Enfocar input al montar el componente
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Handlers
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      size: '',
      color: '',
      inStock: true,
      minPrice: '',
      maxPrice: ''
    });
    setSearchTerm('');
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setTimeout(() => {
      onProductSelect?.(product);
      setSelectedProduct(null);
    }, 200);
  };

  const handleRecentSearchClick = (term) => {
    setSearchTerm(term);
    searchInputRef.current?.focus();
  };

  // Filtros disponibles basados en resultados
  const availableFilters = useMemo(() => {
    const categories = new Set();
    const sizes = new Set();
    const colors = new Set();

    searchResults.forEach(product => {
      if (product.product_name) categories.add(product.product_name.split(' ')[0]);
      if (product.size) sizes.add(product.size);
      if (product.color) colors.add(product.color);
    });

    return {
      categories: Array.from(categories).sort(),
      sizes: Array.from(sizes).sort(),
      colors: Array.from(colors).sort()
    };
  }, [searchResults]);

  return (
    <div className={`product-search ${className}`}>
      {/* Barra de búsqueda */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-secondary-400" />
          </div>
          
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Buscar por nombre, SKU, código..."
            className="input-field tablet-friendly pl-10 pr-12"
          />
          
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <XMarkIcon className="h-5 w-5 text-secondary-400 hover:text-secondary-600" />
            </button>
          )}
        </div>

        {/* Botón de filtros */}
        {showFilters && (
          <div className="mt-3 flex items-center justify-between">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`
                inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200
                ${showAdvancedFilters
                  ? 'bg-primary-100 text-primary-700 border border-primary-200'
                  : 'bg-secondary-100 text-secondary-700 border border-secondary-200'
                }
              `}
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filtros
              {Object.values(filters).some(v => v && v !== true) && (
                <span className="ml-2 bg-primary-600 text-white text-xs rounded-full px-2 py-1">
                  {Object.values(filters).filter(v => v && v !== true).length}
                </span>
              )}
            </button>

            {(searchTerm || Object.values(filters).some(v => v && v !== true)) && (
              <button
                onClick={clearFilters}
                className="text-sm text-secondary-600 hover:text-secondary-800"
              >
                Limpiar todo
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filtros avanzados */}
      <AnimatePresence>
        {showAdvancedFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 bg-secondary-50 border border-secondary-200 rounded-lg"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium text-pos-text-secondary mb-2">
                  Categoría
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="input-field"
                >
                  <option value="">Todas</option>
                  <option value="Chaquetas">Chaquetas</option>
                  <option value="Gorras">Gorras</option>
                  <option value="Accesorios">Accesorios</option>
                </select>
              </div>

              {/* Talla */}
              <div>
                <label className="block text-sm font-medium text-pos-text-secondary mb-2">
                  Talla
                </label>
                <select
                  value={filters.size}
                  onChange={(e) => handleFilterChange('size', e.target.value)}
                  className="input-field"
                >
                  <option value="">Todas</option>
                  <option value="XS">XS</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                  <option value="Única">Única</option>
                </select>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-pos-text-secondary mb-2">
                  Color
                </label>
                <select
                  value={filters.color}
                  onChange={(e) => handleFilterChange('color', e.target.value)}
                  className="input-field"
                >
                  <option value="">Todos</option>
                  <option value="Negro">Negro</option>
                  <option value="Blanco">Blanco</option>
                  <option value="Azul">Azul</option>
                  <option value="Rojo">Rojo</option>
                  <option value="Verde">Verde</option>
                  <option value="Gris">Gris</option>
                </select>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Precio mínimo */}
              <div>
                <label className="block text-sm font-medium text-pos-text-secondary mb-2">
                  Precio mínimo
                </label>
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  placeholder="$0"
                  className="input-field"
                />
              </div>

              {/* Precio máximo */}
              <div>
                <label className="block text-sm font-medium text-pos-text-secondary mb-2">
                  Precio máximo
                </label>
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  placeholder="$999,999"
                  className="input-field"
                />
              </div>

              {/* Solo en stock */}
              <div className="flex items-center mt-6">
                <input
                  type="checkbox"
                  id="inStock"
                  checked={filters.inStock}
                  onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                  className="form-checkbox h-4 w-4 text-primary-600 rounded"
                />
                <label htmlFor="inStock" className="ml-2 text-sm text-pos-text-secondary">
                  Solo productos en stock
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Búsquedas recientes */}
      {recentSearches.length > 0 && !searchTerm && !isSearching && searchResults.length === 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-pos-text-secondary mb-3">
            Búsquedas recientes
          </h4>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((search, index) => (
              <button
                key={index}
                onClick={() => handleRecentSearchClick(search)}
                className="px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm hover:bg-secondary-200 transition-colors duration-200"
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Estado de carga */}
      {isSearching && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="md" />
          <span className="ml-3 text-pos-text-secondary">Buscando productos...</span>
        </div>
      )}

      {/* Resultados */}
      <div ref={resultsRef} className="space-y-3">
        <AnimatePresence>
          {searchResults.map((product, index) => (
            <motion.div
              key={`${product.variant_id}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              onClick={() => handleProductClick(product)}
              className={`
                group relative p-4 bg-white border rounded-lg cursor-pointer transition-all duration-200
                hover:shadow-md hover:border-primary-300
                ${selectedProduct?.variant_id === product.variant_id
                  ? 'ring-2 ring-primary-500 border-primary-500'
                  : 'border-pos-border'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  {/* Información del producto */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-pos-text-primary group-hover:text-primary-600 transition-colors duration-200">
                        {product.product_name}
                      </h3>
                      <p className="text-sm text-pos-text-secondary mt-1">
                        {product.size} • {product.color}
                      </p>
                    </div>
                    
                    <div className="ml-4 text-right">
                      <p className="text-xl font-bold text-pos-text-primary">
                        ${product.price?.toLocaleString()}
                      </p>
                      <p className={`
                        text-sm font-medium
                        ${product.available_stock > 0 ? 'text-success-600' : 'text-danger-600'}
                      `}>
                        {product.available_stock > 0 
                          ? `${product.available_stock} disponibles`
                          : 'Sin stock'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Detalles adicionales */}
                  <div className="mt-3 flex items-center space-x-4 text-sm text-pos-text-secondary">
                    <div className="flex items-center">
                      <TagIcon className="h-4 w-4 mr-1" />
                      <span className="font-mono">{product.sku}</span>
                    </div>
                    
                    {product.short_code && (
                      <div className="flex items-center">
                        <Square3Stack3DIcon className="h-4 w-4 mr-1" />
                        <span className="font-mono">{product.short_code}</span>
                      </div>
                    )}
                    
                    {product.barcode && (
                      <div className="flex items-center">
                        <CubeIcon className="h-4 w-4 mr-1" />
                        <span className="font-mono">{product.barcode}</span>
                      </div>
                    )}
                  </div>

                  {/* Ubicaciones */}
                  {product.locations && product.locations.length > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center text-sm text-pos-text-secondary">
                        <MapPinIcon className="h-4 w-4 mr-2" />
                        <span>Ubicaciones:</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {product.locations.map((location, idx) => (
                          <span
                            key={idx}
                            className={`
                              inline-flex items-center px-2 py-1 rounded text-xs font-medium
                              ${location.location_type === 'display'
                                ? 'bg-primary-100 text-primary-700'
                                : 'bg-secondary-100 text-secondary-700'
                              }
                            `}
                          >
                            {location.location_name} ({location.quantity})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Indicador de selección */}
                {selectedProduct?.variant_id === product.variant_id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-4 right-4"
                  >
                    <CheckCircleIcon className="h-6 w-6 text-primary-600" />
                  </motion.div>
                )}
              </div>

              {/* Indicador de stock bajo */}
              {product.available_stock > 0 && product.available_stock <= 3 && (
                <div className="absolute top-2 left-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-warning-100 text-warning-700">
                    Stock bajo
                  </span>
                </div>
              )}

              {/* Indicador de sin stock */}
              {product.available_stock === 0 && (
                <div className="absolute inset-0 bg-secondary-100 bg-opacity-50 rounded-lg flex items-center justify-center">
                  <span className="px-3 py-1 bg-danger-100 text-danger-700 rounded-full text-sm font-medium">
                    Sin stock
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Estado vacío */}
      {!isSearching && searchResults.length === 0 && (searchTerm || Object.values(filters).some(v => v && v !== true)) && (
        <div className="text-center py-12">
          <MagnifyingGlassIcon className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-pos-text-primary mb-2">
            No se encontraron productos
          </h3>
          <p className="text-pos-text-secondary mb-4">
            Intenta ajustar los filtros o cambiar los términos de búsqueda
          </p>
          <button
            onClick={clearFilters}
            className="button-secondary"
          >
            Limpiar filtros
          </button>
        </div>
      )}

      {/* Mensaje inicial */}
      {!isSearching && searchResults.length === 0 && !searchTerm && !Object.values(filters).some(v => v && v !== true) && (
        <div className="text-center py-12">
          <MagnifyingGlassIcon className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-pos-text-primary mb-2">
            Buscar productos
          </h3>
          <p className="text-pos-text-secondary">
            Escribe el nombre, SKU o código del producto que buscas
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductSearch;