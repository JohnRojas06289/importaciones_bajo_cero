import React, { useState, useEffect } from 'react';
import { realApiService } from '../../services/realApiService';

const ConnectionTest = () => {
  const [connectionStatus, setConnectionStatus] = useState('testing');
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setConnectionStatus('testing');
      
      // Probar conexión básica
      await realApiService.healthCheck();
      
      // Obtener productos
      const productsData = await realApiService.getProducts();
      setProducts(productsData || []);
      
      setConnectionStatus('connected');
      setError(null);
    } catch (err) {
      setConnectionStatus('error');
      setError(err.message);
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'testing': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return '✅ Conectado al backend';
      case 'error': return '❌ Error de conexión';
      case 'testing': return '🔄 Probando conexión...';
      default: return '⚪ Desconocido';
    }
  };

  return (
    <div className="connection-test p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Estado de Conexión Backend</h3>
      
      <div className={`mb-4 ${getStatusColor()}`}>
        <p className="font-medium">{getStatusText()}</p>
        {error && (
          <p className="text-sm text-red-600 mt-2">
            Error: {error}
          </p>
        )}
      </div>

      <button
        onClick={testConnection}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-4"
      >
        Probar Conexión
      </button>

      {connectionStatus === 'connected' && (
        <div>
          <h4 className="font-medium mb-2">Productos en Base de Datos:</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {products.length > 0 ? (
              products.map((product, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded">
                  <p className="font-medium">{product.name || 'Sin nombre'}</p>
                  <p className="text-sm text-gray-600">
                    Marca: {product.brand || 'N/A'} | 
                    Categoría: {product.category || 'N/A'}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No hay productos en la base de datos</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionTest;
