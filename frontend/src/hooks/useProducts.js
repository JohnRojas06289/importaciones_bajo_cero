// frontend/src/hooks/useProducts.js
import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { productService } from '../services/productService';
import { debounce } from 'lodash';
import toast from 'react-hot-toast';

/**
 * Hook personalizado para manejar productos y búsquedas
 */
export function useProducts() {
  // Estados locales
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFilters, setSearchFilters] = useState({
    category: '',
    size: '',
    color: '',
    brand: '',
    inStock: true,
    minPrice: '',
    maxPrice: ''
  });
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);

  const queryClient = useQueryClient();

  // Búsqueda con debounce
  const debouncedSearch = useMemo(
    () => debounce(async (term, filters) => {
      if (!term?.trim() && !Object.values(filters).some(v => v && v !== true)) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);

      try {
        const params = {
          query: term?.trim(),
          ...filters,
          limit: 50
        };

        // Filtrar parámetros vacíos
        Object.keys(params).forEach(key => {
          if (!params[key] || params[key] === '') {
            delete params[key];
          }
        });

        const response = await productService.searchProducts(params);
        setSearchResults(response.results || []);

        // Agregar al historial si hay término de búsqueda
        if (term?.trim()) {
          setSearchHistory(prev => {
            const newHistory = [term.trim(), ...prev.filter(h => h !== term.trim())];
            return newHistory.slice(0, 10); // Mantener últimos 10
          });
        }

      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
        toast.error('Error en la búsqueda');
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  // Función de búsqueda principal
  const searchProducts = useCallback((term, filters = {}) => {
    const mergedFilters = { ...searchFilters, ...filters };
    setSearchTerm(term || '');
    setSearchFilters(mergedFilters);
    debouncedSearch(term, mergedFilters);
  }, [searchFilters, debouncedSearch]);

  // Búsqueda rápida para autocompletado
  const quickSearch = useCallback(async (term) => {
    if (!term?.trim() || term.length < 2) return [];

    try {
      const response = await productService.quickSearch(term);
      return response.results || [];
    } catch (error) {
      console.error('Quick search error:', error);
      return [];
    }
  }, []);

  // Limpiar resultados de búsqueda
  const clearSearchResults = useCallback(() => {
    setSearchResults([]);
    setSearchTerm('');
    setIsSearching(false);
    debouncedSearch.cancel();
  }, [debouncedSearch]);

  // Limpiar filtros
  const clearFilters = useCallback(() => {
    setSearchFilters({
      category: '',
      size: '',
      color: '',
      brand: '',
      inStock: true,
      minPrice: '',
      maxPrice: ''
    });
  }, []);

  // Hook para obtener un producto específico
  const useProduct = (variantId) => {
    return useQuery(
      ['product', variantId],
      () => productService.getProduct(variantId),
      {
        enabled: !!variantId,
        staleTime: 5 * 60 * 1000, // 5 minutos
        cacheTime: 10 * 60 * 1000, // 10 minutos
      }
    );
  };

  // Hook para obtener ubicaciones de un producto
  const useProductLocations = (variantId) => {
    return useQuery(
      ['productLocations', variantId],
      () => productService.getProductLocations(variantId),
      {
        enabled: !!variantId,
        staleTime: 2 * 60 * 1000, // 2 minutos
        cacheTime: 5 * 60 * 1000, // 5 minutos
      }
    );
  };

  // Hook para obtener productos alternativos
  const useProductAlternatives = (variantId) => {
    return useQuery(
      ['productAlternatives', variantId],
      () => productService.getProductAlternatives(variantId),
      {
        enabled: !!variantId,
        staleTime: 10 * 60 * 1000, // 10 minutos
        cacheTime: 30 * 60 * 1000, // 30 minutos
      }
    );
  };

  // Mutation para escanear producto
  const scanProductMutation = useMutation(
    (code) => productService.scanProduct(code),
    {
      onSuccess: (data) => {
        // Actualizar caché si es exitoso
        if (data.success && data.product) {
          queryClient.setQueryData(
            ['product', data.product.variant_id],
            data.product
          );
        }
      },
      onError: (error) => {
        console.error('Scan error:', error);
      }
    }
  );

  // Función para escanear producto
  const scanProduct = useCallback(async (code) => {
    try {
      const result = await scanProductMutation.mutateAsync(code);
      return result;
    } catch (error) {
      throw error;
    }
  }, [scanProductMutation]);

  // Validar código corto
  const validateShortCode = useCallback(async (code) => {
    try {
      return await productService.validateShortCode(code);
    } catch (error) {
      console.error('Validation error:', error);
      return { isValid: false, errors: ['Error de validación'] };
    }
  }, []);

  // Obtener productos frecuentes/favoritos
  const useFrequentProducts = () => {
    return useQuery(
      'frequentProducts',
      () => productService.getFrequentProducts(),
      {
        staleTime: 30 * 60 * 1000, // 30 minutos
        cacheTime: 60 * 60 * 1000, // 1 hora
      }
    );
  };

  // Función para marcar producto como favorito (simulado)
  const toggleFavorite = useCallback((variantId) => {
    // Implementar lógica de favoritos en localStorage o backend
    const favorites = JSON.parse(localStorage.getItem('favoriteProducts') || '[]');
    const index = favorites.indexOf(variantId);
    
    if (index >= 0) {
      favorites.splice(index, 1);
      toast.success('Producto removido de favoritos');
    } else {
      favorites.push(variantId);
      toast.success('Producto agregado a favoritos');
    }
    
    localStorage.setItem('favoriteProducts', JSON.stringify(favorites));
    
    // Invalidar queries relacionadas
    queryClient.invalidateQueries('frequentProducts');
  }, [queryClient]);

  // Obtener favoritos
  const getFavorites = useCallback(() => {
    return JSON.parse(localStorage.getItem('favoriteProducts') || '[]');
  }, []);

  // Estadísticas de búsqueda
  const searchStats = useMemo(() => {
    return {
      totalSearches: searchHistory.length,
      uniqueTerms: new Set(searchHistory).size,
      mostSearched: searchHistory.reduce((acc, term) => {
        acc[term] = (acc[term] || 0) + 1;
        return acc;
      }, {}),
      recentSearches: searchHistory.slice(0, 5)
    };
  }, [searchHistory]);

  // Filtros sugeridos basados en resultados actuales
  const suggestedFilters = useMemo(() => {
    const categories = new Set();
    const sizes = new Set();
    const colors = new Set();
    const brands = new Set();

    searchResults.forEach(product => {
      if (product.category) categories.add(product.category);
      if (product.size) sizes.add(product.size);
      if (product.color) colors.add(product.color);
      if (product.brand) brands.add(product.brand);
    });

    return {
      categories: Array.from(categories).sort(),
      sizes: Array.from(sizes).sort(),
      colors: Array.from(colors).sort(),
      brands: Array.from(brands).sort()
    };
  }, [searchResults]);

  // Exportar historial de búsquedas
  const exportSearchHistory = useCallback(() => {
    const data = {
      searchHistory,
      searchStats,
      exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `search-history-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }, [searchHistory, searchStats]);

  return {
    // Estados principales
    searchTerm,
    searchFilters,
    searchResults,
    isSearching,
    searchHistory,

    // Funciones de búsqueda
    searchProducts,
    quickSearch,
    clearSearchResults,
    clearFilters,

    // Funciones de productos individuales
    useProduct,
    useProductLocations,
    useProductAlternatives,
    scanProduct,
    validateShortCode,

    // Gestión de favoritos
    useFrequentProducts,
    toggleFavorite,
    getFavorites,

    // Utilidades
    searchStats,
    suggestedFilters,
    exportSearchHistory,

    // Estados derivados
    hasResults: searchResults.length > 0,
    hasFilters: Object.values(searchFilters).some(v => v && v !== true),
    hasSearchTerm: !!searchTerm?.trim(),

    // Mutations para acceso directo
    scanProductMutation
  };
}

export default useProducts;