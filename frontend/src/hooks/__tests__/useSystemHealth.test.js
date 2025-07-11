// frontend/src/hooks/__tests__/useSystemHealth.test.js
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { useSystemHealth, useNetworkStatus, useCompleteSystemHealth } from '../useSystemHealth';

// Mock apiService
jest.mock('../services/api', () => ({
  apiService: {
    get: jest.fn()
  }
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useSystemHealth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return health data when API responds successfully', async () => {
    const mockHealthData = { status: 'healthy', version: '1.0.0' };
    require('../services/api').apiService.get.mockResolvedValue({
      data: mockHealthData
    });

    const { result } = renderHook(() => useSystemHealth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockHealthData);
  });

  it('should handle API errors', async () => {
    require('../services/api').apiService.get.mockRejectedValue(
      new Error('Network error')
    );

    const { result } = renderHook(() => useSystemHealth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error.message).toBe('No se puede conectar con el servidor');
  });
});

describe('useNetworkStatus', () => {
  it('should return online status', () => {
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    const { result } = renderHook(() => useNetworkStatus());
    
    expect(result.current).toBe(true);
  });

  it('should return offline status', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const { result } = renderHook(() => useNetworkStatus());
    
    expect(result.current).toBe(false);
  });
});

describe('useCompleteSystemHealth', () => {
  it('should return complete system health status', async () => {
    // Mock successful API response
    const mockHealthData = { status: 'healthy' };
    require('../services/api').apiService.get.mockResolvedValue({
      data: mockHealthData
    });

    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    const { result } = renderHook(() => useCompleteSystemHealth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.systemStatus).toBe('healthy');
    });

    expect(result.current.isOnline).toBe(true);
    expect(result.current.backendConnected).toBe(true);
  });
});
