// frontend/src/hooks/useScanner.js
import { useState, useCallback, useRef, useEffect } from 'react';
import { productService } from '../services/productService';

/**
 * Hook personalizado para manejar el escáner de códigos
 * Incluye tanto escáner de cámara como entrada manual
 */
export function useScanner() {
  // Estados principales
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [cameraPermission, setCameraPermission] = useState('unknown'); // 'granted', 'denied', 'unknown'
  const [isProcessing, setIsProcessing] = useState(false);

  // Referencias
  const lastScanTime = useRef(0);
  const scannerInstance = useRef(null);

  // Verificar permisos de cámara al inicializar
  useEffect(() => {
    checkCameraPermissions();
  }, []);

  const checkCameraPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Preferir cámara trasera
      });
      
      // Detener el stream inmediatamente, solo verificamos permisos
      stream.getTracks().forEach(track => track.stop());
      setCameraPermission('granted');
      
    } catch (error) {
      console.warn('Camera permission check failed:', error);
      setCameraPermission('denied');
    }
  };

  const startScanning = useCallback(async () => {
    try {
      if (cameraPermission === 'denied') {
        setScanError('Permisos de cámara denegados');
        return false;
      }

      setIsScanning(true);
      setScanError(null);
      return true;
      
    } catch (error) {
      console.error('Error starting scanner:', error);
      setScanError('Error al iniciar el escáner');
      setIsScanning(false);
      return false;
    }
  }, [cameraPermission]);

  const stopScanning = useCallback(() => {
    setIsScanning(false);
    setScanError(null);
  }, []);

  const processScan = useCallback(async (code, source = 'camera') => {
    // Evitar escaneos duplicados muy rápidos
    const now = Date.now();
    if (now - lastScanTime.current < 1000 && source === 'camera') {
      return;
    }
    lastScanTime.current = now;

    if (!code?.trim()) {
      setScanError('Código vacío');
      return;
    }

    setIsProcessing(true);
    setScanError(null);

    try {
      // Agregar al historial
      const scanEntry = {
        code: code.trim(),
        timestamp: new Date(),
        source,
        id: Date.now() + Math.random()
      };

      setScanHistory(prev => [scanEntry, ...prev.slice(0, 19)]); // Mantener últimos 20

      // Buscar producto en el backend
      const result = await productService.scanProduct(code.trim());
      
      setLastScan({
        ...result,
        code: code.trim(),
        source,
        timestamp: new Date()
      });

      // Vibración en dispositivos móviles si el escaneo fue exitoso
      if (result.success && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }

    } catch (error) {
      console.error('Error processing scan:', error);
      const errorResult = {
        success: false,
        message: 'Error al procesar el código',
        code: code.trim(),
        source,
        timestamp: new Date(),
        error: error.message
      };
      
      setLastScan(errorResult);
      setScanError('Error al procesar el código');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const scanManualCode = useCallback(async (code) => {
    return processScan(code, 'manual');
  }, [processScan]);

  const resetScan = useCallback(() => {
    setLastScan(null);
    setScanError(null);
  }, []);

  const clearHistory = useCallback(() => {
    setScanHistory([]);
  }, []);

  const clearError = useCallback(() => {
    setScanError(null);
  }, []);

  // Función para manejar escaneos desde el componente Scanner
  const onScanSuccess = useCallback((decodedText, decodedResult) => {
    processScan(decodedText, 'camera');
  }, [processScan]);

  const onScanError = useCallback((error) => {
    // Solo mostrar errores importantes, filtrar ruido común
    if (
      !error.includes('No QR code found') && 
      !error.includes('NotFoundException') &&
      !error.includes('No MultiFormat Readers')
    ) {
      console.warn('Scanner error:', error);
      // No establecer como error crítico, son errores normales del escáner
    }
  }, []);

  // Estadísticas del escáner
  const scanStats = {
    totalScans: scanHistory.length,
    successfulScans: scanHistory.filter(scan => {
      // Determinar si fue exitoso basado en el historial
      return true; // Simplificado por ahora
    }).length,
    cameraScans: scanHistory.filter(scan => scan.source === 'camera').length,
    manualScans: scanHistory.filter(scan => scan.source === 'manual').length,
    todayScans: scanHistory.filter(scan => {
      const today = new Date();
      const scanDate = new Date(scan.timestamp);
      return scanDate.toDateString() === today.toDateString();
    }).length
  };

  // Función de utilidad para obtener el último escaneo exitoso
  const getLastSuccessfulScan = useCallback(() => {
    return scanHistory.find(scan => scan.success !== false) || null;
  }, [scanHistory]);

  // Función para exportar historial
  const exportScanHistory = useCallback(() => {
    const dataStr = JSON.stringify(scanHistory, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scan-history-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }, [scanHistory]);

  // Configuración del escáner
  const scannerConfig = {
    fps: 10,
    qrbox: { width: 250, height: 250 },
    aspectRatio: 1.0,
    rememberLastUsedCamera: true,
    showTorchButtonIfSupported: true,
    showZoomSliderIfSupported: true,
    defaultZoomValueIfSupported: 2,
    supportedScanTypes: [
      0, // QR_CODE
      1, // AZTEC
      2, // CODABAR
      3, // CODE_39
      4, // CODE_93
      5, // CODE_128
      6, // DATA_MATRIX
      7, // EAN_8
      8, // EAN_13
      9, // ITF
      10, // MAXICODE
      11, // PDF_417
      12, // RSS_14
      13, // RSS_EXPANDED
      14, // UPC_A
      15, // UPC_E
      16, // UPC_EAN_EXTENSION
    ]
  };

  return {
    // Estados principales
    isScanning,
    lastScan,
    scanError,
    scanHistory,
    cameraPermission,
    isProcessing,

    // Acciones principales
    startScanning,
    stopScanning,
    processScan,
    scanManualCode,
    resetScan,

    // Gestión de historial y errores
    clearHistory,
    clearError,

    // Callbacks para componentes
    onScanSuccess,
    onScanError,

    // Utilidades
    scanStats,
    getLastSuccessfulScan,
    exportScanHistory,
    scannerConfig,

    // Estados derivados
    hasError: !!scanError,
    hasHistory: scanHistory.length > 0,
    canScan: cameraPermission === 'granted' || cameraPermission === 'unknown'
  };
}

export default useScanner;