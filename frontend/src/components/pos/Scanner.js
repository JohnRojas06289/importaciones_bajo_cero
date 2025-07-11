// frontend/src/components/pos/Scanner.js
import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

// Icons
import { 
  QrCodeIcon, 
  CameraIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

// Services
import { productService } from '../../services/productService';

const Scanner = ({ 
  isActive, 
  onScanResult, 
  onError, 
  className = "",
  showManualInput = true 
}) => {
  // Estados
  const [scanner, setScanner] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastScanTime, setLastScanTime] = useState(0);
  const [scanHistory, setScanHistory] = useState([]);
  const [cameraPermission, setCameraPermission] = useState('unknown'); // 'granted', 'denied', 'unknown'

  // Referencias
  const scannerRef = useRef(null);
  const manualInputRef = useRef(null);

  // Configuración del escáner
  const scannerConfig = {
    fps: 10,
    qrbox: { width: 250, height: 250 },
    aspectRatio: 1.0,
    rememberLastUsedCamera: true,
    supportedScanTypes: [
      Html5QrcodeScanner.SCAN_TYPE_CAMERA,
      Html5QrcodeScanner.SCAN_TYPE_FILE
    ]
  };

  // Inicializar escáner
  useEffect(() => {
    if (isActive && !scanner && scannerRef.current) {
      initializeScanner();
    }

    return () => {
      if (scanner) {
        cleanupScanner();
      }
    };
  }, [isActive]);

  // Manejar cambios en el estado activo
  useEffect(() => {
    if (scanner) {
      if (isActive && !isScanning) {
        startScanning();
      } else if (!isActive && isScanning) {
        stopScanning();
      }
    }
  }, [isActive, scanner]);

  // Enfocar input manual cuando se activa
  useEffect(() => {
    if (isActive && showManualInput && manualInputRef.current) {
      const timer = setTimeout(() => {
        manualInputRef.current?.focus();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isActive, showManualInput]);

  const initializeScanner = async () => {
    try {
      // Verificar permisos de cámara
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setCameraPermission('granted');

      // Crear escáner
      const html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader",
        scannerConfig,
        false
      );

      html5QrcodeScanner.render(onScanSuccess, onScanError);
      setScanner(html5QrcodeScanner);

    } catch (error) {
      console.error('Error initializing scanner:', error);
      setCameraPermission('denied');
      onError?.('No se puede acceder a la cámara. Verifique los permisos.');
    }
  };

  const cleanupScanner = () => {
    if (scanner) {
      try {
        scanner.clear();
      } catch (error) {
        console.error('Error cleaning up scanner:', error);
      }
      setScanner(null);
      setIsScanning(false);
    }
  };

  const startScanning = () => {
    setIsScanning(true);
  };

  const stopScanning = () => {
    setIsScanning(false);
  };

  const onScanSuccess = async (decodedText, decodedResult) => {
    // Prevenir escaneos duplicados muy rápidos
    const now = Date.now();
    if (now - lastScanTime < 1000) {
      return;
    }
    setLastScanTime(now);

    // Vibración si está disponible
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }

    await processCode(decodedText, 'camera');
  };

  const onScanError = (error) => {
    // Solo mostrar errores importantes, no spam de "No QR code found"
    if (!error.includes('No QR code found') && !error.includes('NotFoundException')) {
      console.warn('Scan error:', error);
    }
  };

  const processCode = async (code, source = 'manual') => {
    if (!code?.trim()) return;

    setIsProcessing(true);
    
    try {
      // Agregar al historial
      const scanEntry = {
        code: code.trim(),
        timestamp: new Date(),
        source,
        id: Date.now()
      };
      
      setScanHistory(prev => [scanEntry, ...prev.slice(0, 9)]); // Mantener últimos 10

      // Buscar producto
      const result = await productService.scanProduct(code.trim());
      
      if (result.success && result.product) {
        onScanResult?.(result.product);
        toast.success('Producto encontrado');
      } else {
        // Mostrar sugerencias si las hay
        if (result.suggestions?.length > 0) {
          toast.error(`Producto no encontrado. ¿Quisiste decir: ${result.suggestions[0].product_name}?`);
        } else {
          toast.error(result.message || 'Producto no encontrado');
        }
        onError?.(result.message || 'Producto no encontrado');
      }

    } catch (error) {
      console.error('Error processing code:', error);
      toast.error('Error al procesar el código');
      onError?.('Error al procesar el código');
    } finally {
      setIsProcessing(false);
      if (source === 'manual') {
        setManualCode('');
      }
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      processCode(manualCode.trim(), 'manual');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleManualSubmit(e);
    }
  };

  const clearHistory = () => {
    setScanHistory([]);
  };

  return (
    <div className={`scanner-container ${className}`}>
      {/* Header del escáner */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`
              p-2 rounded-lg transition-colors duration-200
              ${isActive ? 'bg-primary-100 text-primary-600' : 'bg-secondary-100 text-secondary-600'}
            `}>
              <QrCodeIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-pos-text-primary">
                Escáner de Códigos
              </h3>
              <p className="text-sm text-pos-text-secondary">
                {isActive ? 'Escaneando...' : 'Inactivo'}
              </p>
            </div>
          </div>

          {/* Indicador de estado */}
          <div className="flex items-center space-x-2">
            {isProcessing && (
              <div className="flex items-center text-warning-600">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-warning-600 border-t-transparent mr-2"></div>
                <span className="text-sm">Procesando...</span>
              </div>
            )}
            
            <div className={`
              w-3 h-3 rounded-full transition-colors duration-200
              ${isActive && isScanning ? 'bg-success-500 animate-pulse' : 'bg-secondary-300'}
            `} />
          </div>
        </div>
      </div>

      {/* Área del escáner */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Escáner de cámara */}
        <div className="space-y-4">
          <h4 className="font-medium text-pos-text-primary">Cámara</h4>
          
          <div className="relative">
            {cameraPermission === 'denied' ? (
              <div className="bg-danger-50 border-2 border-dashed border-danger-200 rounded-lg p-8 text-center">
                <ExclamationTriangleIcon className="h-12 w-12 text-danger-600 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-danger-800 mb-2">
                  Cámara no disponible
                </h4>
                <p className="text-danger-600 mb-4">
                  No se puede acceder a la cámara. Verifique los permisos del navegador.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="button-primary"
                >
                  Reintentar
                </button>
              </div>
            ) : (
              <div className="relative bg-black rounded-lg overflow-hidden">
                <div 
                  id="qr-reader" 
                  ref={scannerRef}
                  className="w-full h-64"
                />
                
                {/* Overlay de escaneando */}
                <AnimatePresence>
                  {isProcessing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
                    >
                      <div className="bg-white rounded-lg p-4 flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-600 border-t-transparent"></div>
                        <span className="text-pos-text-primary font-medium">Procesando código...</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Línea de escaneo animada */}
                {isActive && isScanning && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-primary-500 opacity-75 animate-scan-line"></div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Input manual */}
        <div className="space-y-4">
          <h4 className="font-medium text-pos-text-primary">Entrada Manual</h4>
          
          {showManualInput && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label htmlFor="manual-code" className="block text-sm font-medium text-pos-text-secondary mb-2">
                  Código del producto
                </label>
                <div className="relative">
                  <input
                    ref={manualInputRef}
                    id="manual-code"
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escanear o escribir código..."
                    className="input-field tablet-friendly"
                    disabled={isProcessing}
                  />
                  {manualCode && (
                    <button
                      type="button"
                      onClick={() => setManualCode('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
              
              <button
                type="submit"
                disabled={!manualCode.trim() || isProcessing}
                className={`
                  w-full tablet-friendly transition-colors duration-200
                  ${manualCode.trim() && !isProcessing
                    ? 'button-primary'
                    : 'bg-secondary-200 text-secondary-500 cursor-not-allowed'
                  }
                `}
              >
                {isProcessing ? 'Procesando...' : 'Buscar Producto'}
              </button>
            </form>
          )}

          {/* Historial de escaneos */}
          {scanHistory.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-medium text-pos-text-secondary">
                  Últimos escaneos
                </h5>
                <button
                  onClick={clearHistory}
                  className="text-xs text-secondary-500 hover:text-secondary-700"
                >
                  Limpiar
                </button>
              </div>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {scanHistory.map((scan) => (
                  <motion.div
                    key={scan.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-2 bg-secondary-50 rounded border text-sm"
                  >
                    <div className="flex items-center space-x-2">
                      {scan.source === 'camera' ? (
                        <CameraIcon className="h-4 w-4 text-secondary-500" />
                      ) : (
                        <QrCodeIcon className="h-4 w-4 text-secondary-500" />
                      )}
                      <span className="font-mono text-pos-text-primary">
                        {scan.code}
                      </span>
                    </div>
                    <span className="text-xs text-pos-text-secondary">
                      {scan.timestamp.toLocaleTimeString()}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instrucciones */}
      <div className="mt-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
        <h5 className="font-medium text-primary-800 mb-2">Instrucciones:</h5>
        <ul className="text-sm text-primary-700 space-y-1">
          <li>• Apunte la cámara hacia el código de barras o QR</li>
          <li>• Mantenga el código centrado en el recuadro</li>
          <li>• Para códigos sin barras, use la entrada manual</li>
          <li>• Formato de códigos cortos: CH-001-M-NEG</li>
        </ul>
      </div>
    </div>
  );
};

export default Scanner;