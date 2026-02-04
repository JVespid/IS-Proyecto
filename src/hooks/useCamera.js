/**
 * Hook para acceso a la cámara
 * Maneja permisos y estado de la cámara
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { log, logError } from '@/constants/config';

const MODULE_NAME = 'useCamera';

export const useCamera = () => {
  const [status, setStatus] = useState('idle'); // idle, requesting, granted, denied
  const [error, setError] = useState(null);
  const [stream, setStream] = useState(null);

  const requestCamera = useCallback(async () => {
    try {
      setStatus('requesting');
      setError(null);
      log(MODULE_NAME, 'Solicitando permiso de cámara');

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Cámara trasera en móviles
        audio: false,
      });

      setStream(mediaStream);
      setStatus('granted');
      log(MODULE_NAME, 'Permiso de cámara concedido');

      return mediaStream;
    } catch (err) {
      logError(MODULE_NAME, 'Error al solicitar cámara', err);
      setStatus('denied');
      
      let errorMessage = 'Error al acceder a la cámara';
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Permiso de cámara denegado';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No se encontró ninguna cámara';
      }
      
      setError(errorMessage);
      return null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setStatus('idle');
      log(MODULE_NAME, 'Cámara detenida');
    }
  }, [stream]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    status,
    error,
    stream,
    requestCamera,
    stopCamera,
  };
};
