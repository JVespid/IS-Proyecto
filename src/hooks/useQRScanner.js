/**
 * Hook para escanear códigos QR
 * Utiliza html5-qrcode para escanear QR codes
 */

'use client';

import { useState, useEffect, useCallback, useRef, useId } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { log, logError } from '@/constants/config';

const MODULE_NAME = 'useQRScanner';

export const useQRScanner = (onScan, onError) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const scannerRef = useRef(null);
  const reactId = useId();
  const elementIdRef = useRef(`qr-scanner-${reactId.replace(/:/g, '-')}`);

  const startScanning = useCallback(async () => {
    // Solo iniciar si estamos en el cliente (montado)
    if (!isMounted) {
      log(MODULE_NAME, 'Esperando montaje del componente');
      return;
    }

    try {
      setScanning(true);
      setError(null);
      
      const scannerId = elementIdRef.current;
      log(MODULE_NAME, 'Iniciando escaneo de QR', { scannerId });

      // Verificar que el elemento DOM existe
      const element = document.getElementById(scannerId);
      log(MODULE_NAME, 'Verificando elemento DOM', { 
        scannerId, 
        elementExists: !!element,
        elementType: element?.tagName 
      });
      
      if (!element) {
        const errorMsg = `Elemento del scanner no encontrado: #${scannerId}`;
        logError(MODULE_NAME, errorMsg, new Error(errorMsg));
        throw new Error(errorMsg);
      }

      // PASO CRÍTICO: Solicitar permisos de cámara ANTES de iniciar Html5Qrcode
      log(MODULE_NAME, 'Solicitando permisos de cámara');
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu navegador no soporta acceso a la cámara');
      }

      // Solicitar acceso a la cámara
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      log(MODULE_NAME, 'Permisos de cámara concedidos', {
        tracks: stream.getVideoTracks().length
      });
      
      // Detener el stream temporal, Html5Qrcode creará el suyo propio
      stream.getTracks().forEach(track => track.stop());

      log(MODULE_NAME, 'Creando instancia de Html5Qrcode');
      const scanner = new Html5Qrcode(scannerId);
      scannerRef.current = scanner;

      log(MODULE_NAME, 'Iniciando scanner con cámara');
      await scanner.start(
        { facingMode: 'environment' }, // Cámara trasera
        {
          fps: 10, // Frames por segundo
          qrbox: { width: 250, height: 250 }, // Área de escaneo
        },
        (decodedText) => {
          log(MODULE_NAME, 'QR escaneado exitosamente', {
            text: decodedText.substring(0, 50),
          });
          if (onScan) {
            onScan(decodedText);
          }
        },
        (errorMessage) => {
          // Este error se dispara constantemente mientras busca QR, lo ignoramos
          // Solo loggear errores significativos
        }
      );

      log(MODULE_NAME, 'Escáner iniciado exitosamente');
    } catch (err) {
      logError(MODULE_NAME, 'Error al iniciar escáner', err);
      setScanning(false);
      
      let errorMessage = 'Error al iniciar el escáner';
      if (err?.name === 'NotAllowedError') {
        errorMessage = 'Permiso de cámara denegado. Por favor, permite el acceso a la cámara en tu navegador.';
      } else if (err?.name === 'NotFoundError') {
        errorMessage = 'No se encontró ninguna cámara en tu dispositivo';
      } else if (err?.name === 'NotReadableError') {
        errorMessage = 'La cámara está siendo usada por otra aplicación';
      } else if (err?.name === 'OverconstrainedError') {
        errorMessage = 'No se pudo acceder a la cámara trasera. Intenta con la frontal.';
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    }
  }, [onScan, onError, isMounted]);

  const stopScanning = useCallback(async () => {
    try {
      if (scannerRef.current) {
        // Verificar si el scanner está escaneando antes de detenerlo
        const isScanning = scannerRef.current.getState?.() === 2; // 2 = SCANNING
        if (isScanning) {
          await scannerRef.current.stop();
          await scannerRef.current.clear();
          log(MODULE_NAME, 'Escáner detenido');
        }
      }
      setScanning(false);
    } catch (err) {
      // Solo loggear errores reales, ignorar si el scanner ya está detenido
      if (err && !err.message?.includes('not scanning')) {
        logError(MODULE_NAME, 'Error al detener escáner', err);
      }
    }
  }, []);

  // Marcar como montado (solo en cliente) y cleanup al desmontar
  useEffect(() => {
    setIsMounted(true);
    
    // Cleanup: detener scanner al desmontar
    return () => {
      setIsMounted(false);
      
      // Detener scanner sin usar el callback (evita dependencias circulares)
      if (scannerRef.current) {
        try {
          const isScanning = scannerRef.current.getState?.() === 2;
          if (isScanning) {
            scannerRef.current.stop().catch(() => {});
            scannerRef.current.clear().catch(() => {});
          }
        } catch (err) {
          // Ignorar errores en cleanup
        }
      }
    };
  }, []);

  return {
    scanning,
    error,
    startScanning,
    stopScanning,
    scannerId: elementIdRef.current,
  };
};
