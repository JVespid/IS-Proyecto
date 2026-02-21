/**
 * Componente Generador de QR
 * Muestra el QR code generado para una sesión con auto-actualización
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { generateSessionQR } from '@/lib/qr/generator';
import Spinner from '@/components/ui/Spinner';

export default function QRGenerator({ 
  sessionId, 
  lifeTime = 15,      // segundos - cada cuánto se actualiza
  activeTime = 90,    // minutos - duración total
  onGenerated 
}) {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [iteration, setIteration] = useState(0);
  const intervalRef = useRef(null);

  // Calcular iteraciones máximas: (activeTime * 60) / lifeTime
  const maxIterations = Math.floor((activeTime * 60) / lifeTime);

  // Función para generar QR
  const generateQR = async (currentIteration) => {
    try {
      setLoading(true);
      const data = await generateSessionQR(sessionId, currentIteration, lifeTime, activeTime);
      setQrData(data);
      if (onGenerated) {
        onGenerated(data);
      }
      setError(null);
    } catch (err) {
      setError('Error al generar QR');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Efecto para generar el QR inicial y configurar auto-actualización
  useEffect(() => {
    if (!sessionId) return;

    // Generar QR inicial
    generateQR(0);
    setIteration(0);

    // Configurar intervalo para auto-actualización
    intervalRef.current = setInterval(() => {
      setIteration((prevIteration) => {
        const newIteration = prevIteration + 1;
        
        // Si alcanzamos el máximo, detener
        if (newIteration >= maxIterations) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          return maxIterations;
        }
        
        // Generar nuevo QR con la nueva iteración
        generateQR(newIteration);
        return newIteration;
      });
    }, lifeTime * 1000);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [sessionId, lifeTime, activeTime]);

  if (loading && !qrData) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && !qrData) {
    return (
      <div className="text-center w-full">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!qrData) return null;

  const isExpired = iteration >= maxIterations;

  return (
    <div className="w-full h-full flex items-center justify-center">
      {isExpired ? (
        <div className="flex flex-col items-center justify-center w-full h-full bg-gray-100 p-4">
          <svg 
            className="w-16 h-16 text-red-500 mb-2" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <h2 className="text-xl font-bold text-red-600 mb-1">QR EXPIRADO</h2>
        </div>
      ) : (
        <img
          src={qrData.qrImage}
          alt="QR Code"
          className="w-full h-full object-contain"
        />
      )}
    </div>
  );
}
