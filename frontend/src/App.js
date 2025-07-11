// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';

// Components
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';

// Pages
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

// Services
import { useSystemHealth } from './hooks/useSystemHealth';

// Styles
import './App.css';
import './styles/index.css';

// Configurar React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

function AppContent() {
  const { isLoading, isError, error } = useSystemHealth();

  // Mostrar loading mientras se verifica la conexión
  if (isLoading) {
    return (
      <div className="min-h-screen bg-pos-bg flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-pos-text-secondary">Iniciando sistema...</p>
        </div>
      </div>
    );
  }

  // Mostrar error si no se puede conectar al backend
  if (isError) {
    return (
      <div className="min-h-screen bg-pos-bg flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-danger-50 border border-danger-200 rounded-lg p-6">
            <div className="text-danger-600 text-xl font-semibold mb-2">
              Error de Conexión
            </div>
            <p className="text-danger-700 mb-4">
              No se puede conectar con el servidor. Verifique que el backend esté funcionando.
            </p>
            <p className="text-sm text-danger-600">
              {error?.message || 'Error desconocido'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 button-primary"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Ruta principal - redirigir a POS */}
          <Route index element={<Navigate to="/pos" replace />} />
          
          {/* Páginas principales */}
          <Route path="pos" element={<POS />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          
          {/* Ruta catch-all - redirigir a POS */}
          <Route path="*" element={<Navigate to="/pos" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="App">
        <AppContent />
        
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            className: 'tablet-friendly',
            style: {
              fontSize: '1rem',
              padding: '12px 16px',
              maxWidth: '500px',
            },
            success: {
              style: {
                background: '#f0fdf4',
                color: '#15803d',
                border: '1px solid #bbf7d0',
              },
              iconTheme: {
                primary: '#22c55e',
                secondary: '#f0fdf4',
              },
            },
            error: {
              style: {
                background: '#fef2f2',
                color: '#b91c1c',
                border: '1px solid #fecaca',
              },
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fef2f2',
              },
            },
            loading: {
              style: {
                background: '#f8fafc',
                color: '#475569',
                border: '1px solid #e2e8f0',
              },
            },
          }}
        />
        
        {/* Configuración React Query DevTools para desarrollo */}
        {process.env.NODE_ENV === 'development' && (
          <React.Suspense fallback={null}>
            {/* React Query DevTools se cargan solo en desarrollo */}
          </React.Suspense>
        )}
      </div>
    </QueryClientProvider>
  );
}

export default App;