// frontend/src/App.js - VERSIÓN SIMPLIFICADA PARA DEBUG
import React, { useState, useEffect } from 'react';

function App() {
  const [backendStatus, setBackendStatus] = useState('checking');
  const [error, setError] = useState(null);

  useEffect(() => {
    // Probar conexión con backend
    const checkBackend = async () => {
      try {
        console.log('🔍 Verificando backend...');
        
        // Intentar conectar con health check
        const response = await fetch('http://localhost:8000/health');
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Backend conectado:', data);
          setBackendStatus('connected');
        } else {
          console.error('❌ Backend error:', response.status);
          setBackendStatus('error');
          setError(`Backend respondió con status: ${response.status}`);
        }
      } catch (err) {
        console.error('❌ Error de conexión:', err);
        setBackendStatus('error');
        setError(`Error de conexión: ${err.message}`);
      }
    };

    checkBackend();
  }, []);

  // Mostrar estado de diagnóstico
  if (backendStatus === 'checking') {
    return (
      <div style={{ 
        padding: '20px', 
        fontFamily: 'Arial, sans-serif',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <h1>🔍 Diagnóstico del Sistema</h1>
        <p>Verificando conexión con backend...</p>
        <div style={{ 
          background: '#f0f0f0', 
          padding: '10px', 
          borderRadius: '5px',
          marginTop: '20px'
        }}>
          <strong>Información del sistema:</strong>
          <ul>
            <li>Frontend: http://localhost:3000 ✅</li>
            <li>Backend esperado: http://localhost:8000</li>
            <li>Estado: Verificando...</li>
          </ul>
        </div>
      </div>
    );
  }

  if (backendStatus === 'error') {
    return (
      <div style={{ 
        padding: '20px', 
        fontFamily: 'Arial, sans-serif',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <h1>❌ Error de Conexión</h1>
        <div style={{ 
          background: '#ffe6e6', 
          border: '1px solid #ff9999',
          padding: '15px', 
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <strong>Error:</strong> {error}
        </div>
        
        <h2>🔧 Pasos para Solucionar:</h2>
        <ol>
          <li>
            <strong>Verificar que el backend esté ejecutándose:</strong>
            <br />
            En terminal: <code>cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000</code>
          </li>
          <li>
            <strong>Verificar manualmente:</strong>
            <br />
            Abre: <a href="http://localhost:8000/health" target="_blank">http://localhost:8000/health</a>
          </li>
          <li>
            <strong>Verificar API docs:</strong>
            <br />
            Abre: <a href="http://localhost:8000/docs" target="_blank">http://localhost:8000/docs</a>
          </li>
        </ol>

        <button 
          onClick={() => window.location.reload()} 
          style={{
            background: '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            marginTop: '20px'
          }}
        >
          🔄 Reintentar
        </button>
      </div>
    );
  }

  // Si el backend funciona, mostrar sistema básico
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <h1>🏪 Sistema de Inventario - Almacén de Ropa</h1>
      
      <div style={{ 
        background: '#e6ffe6', 
        border: '1px solid #99ff99',
        padding: '15px', 
        borderRadius: '5px',
        marginBottom: '20px'
      }}>
        <strong>✅ Sistema Funcionando</strong>
        <ul>
          <li>Frontend: Conectado</li>
          <li>Backend: Conectado</li>
          <li>Base de datos: Activa</li>
        </ul>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '20px',
        marginTop: '30px'
      }}>
        
        {/* Panel de Pruebas */}
        <div style={{ 
          border: '1px solid #ddd', 
          padding: '20px', 
          borderRadius: '5px' 
        }}>
          <h2>🧪 Panel de Pruebas</h2>
          <p>Aquí puedes probar las funcionalidades básicas:</p>
          
          <TestApiComponent />
        </div>

        {/* Panel de Información */}
        <div style={{ 
          border: '1px solid #ddd', 
          padding: '20px', 
          borderRadius: '5px' 
        }}>
          <h2>📋 Información del Sistema</h2>
          <ul>
            <li><strong>Categorías:</strong> Chaquetas, Gorras</li>
            <li><strong>Códigos cortos:</strong> CH-001-M-NEG</li>
            <li><strong>Ubicaciones:</strong> Exhibición, Bodega</li>
            <li><strong>API Docs:</strong> <a href="http://localhost:8000/docs" target="_blank">Ver aquí</a></li>
          </ul>
        </div>
      </div>

      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <p>
          <strong>🎉 ¡Tu sistema está funcionando!</strong>
          <br />
          Ahora podemos continuar con la configuración completa del POS.
        </p>
      </div>
    </div>
  );
}

// Componente para probar la API
function TestApiComponent() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [codigoTest, setCodigoTest] = useState('CH-001-M-NEG');

  const probarAPI = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/products/search?limit=5');
      const data = await response.json();
      setProductos(data.results || []);
      console.log('Productos obtenidos:', data);
    } catch (error) {
      console.error('Error probando API:', error);
      alert('Error probando API: ' + error.message);
    }
    setLoading(false);
  };

  const probarEscaneo = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/products/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codigoTest })
      });
      const data = await response.json();
      console.log('Resultado escaneo:', data);
      alert(data.success ? 
        `✅ Producto encontrado: ${data.product?.product_name}` : 
        `❌ ${data.message}`
      );
    } catch (error) {
      console.error('Error probando escaneo:', error);
      alert('Error probando escaneo: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div>
      <button 
        onClick={probarAPI}
        disabled={loading}
        style={{
          background: '#28a745',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '3px',
          cursor: 'pointer',
          marginRight: '10px',
          marginBottom: '10px'
        }}
      >
        {loading ? '⏳ Cargando...' : '📦 Probar Productos'}
      </button>

      <div style={{ marginBottom: '10px' }}>
        <input 
          type="text" 
          value={codigoTest}
          onChange={(e) => setCodigoTest(e.target.value)}
          placeholder="Código a probar"
          style={{
            padding: '5px',
            marginRight: '10px',
            border: '1px solid #ddd',
            borderRadius: '3px'
          }}
        />
        <button 
          onClick={probarEscaneo}
          disabled={loading}
          style={{
            background: '#007bff',
            color: 'white',
            border: 'none',
            padding: '5px 10px',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          🔍 Escanear
        </button>
      </div>

      {productos.length > 0 && (
        <div style={{ 
          background: '#f8f9fa', 
          padding: '10px', 
          borderRadius: '3px',
          marginTop: '10px'
        }}>
          <strong>Productos encontrados:</strong>
          <ul>
            {productos.slice(0, 3).map((producto, index) => (
              <li key={index}>{producto.product_name} - {producto.sku}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;