/**
 * Hook para escanear códigos QR
 * Utiliza html5-qrcode para escanear QR codes
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { log, logError } from '@/constants/config';

const MODULE_NAME = 'useQRScanner';

export const useQRScanner = (onScan, onError) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const elementIdRef = useRef(`qr-scanner-${Date.now()}`);

  const startScanning = useCallback(async () => {
    try {
      setScanning(true);
      setError(null);
      log(MODULE_NAME, 'Iniciando escaneo de QR');

      const scanner = new Html5Qrcode(elementIdRef.current);
      scannerRef.current = scanner;

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

      log(MODULE_NAME, 'Escáner iniciado');
    } catch (err) {
      logError(MODULE_NAME, 'Error al iniciar escáner', err);
      setScanning(false);
      
      let errorMessage = 'Error al iniciar el escáner';
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Permiso de cámara denegado';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No se encontró ninguna cámara';
      }
      
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    }
  }, [onScan, onError]);

  const stopScanning = useCallback(async () => {
    try {
      if (scannerRef.current && scanning) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        log(MODULE_NAME, 'Escáner detenido');
      }
      setScanning(false);
    } catch (err) {
      logError(MODULE_NAME, 'Error al detener escáner', err);
    }
  }, [scanning]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  return {
    scanning,
    error,
    startScanning,
    stopScanning,
    scannerId: elementIdRef.current,
  };
};
