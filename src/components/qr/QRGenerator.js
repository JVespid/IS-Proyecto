/**
 * Componente Generador de QR
 * Muestra el QR code generado para una sesión con auto-actualización
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { generateSessionQR } from '@/lib/qr/generator';
import Spinner from '@/components/ui/Spinner';
import Card from '@/components/ui/Card';

export default function QRGenerator({ 
  sessionId, 
  lifeTime = 15,      // segundos - cada cuánto se actualiza
  activeTime = 90,    // minutos - duración total
  onGenerated 
}) {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [iteration, setIteration] = useState(0);
  const intervalRef = useRef(null);

  // Calcular iteraciones máximas: (activeTime * 60) / lifeTime
  const maxIterations = Math.floor((activeTime * 60) / lifeTime);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
      <Card className="flex items-center justify-center p-8">
        <Spinner size="lg" />
      </Card>
    );
  }

  if (error && !qrData) {
    return (
      <Card className="text-center">
        <p className="text-red-600">{error}</p>
      </Card>
    );
  }

  if (!qrData) return null;

  const expiresDate = new Date(qrData.expiresAt);
  const isExpired = iteration >= maxIterations;

  return (
    <Card title="Código QR de Asistencia" className="text-center">
      <div className="mb-4">
        {isExpired ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] bg-gray-100 border-4 border-red-300 rounded p-8">
            <svg 
              className="w-20 h-20 text-red-500 mb-4" 
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
            <h2 className="text-3xl font-bold text-red-600 mb-2">QR EXPIRADO</h2>
            <p className="text-gray-600">El tiempo de vida del código QR ha terminado</p>
          </div>
        ) : (
          <img
            src={qrData.qrImage}
            alt="QR Code"
            className="mx-auto border-4 border-gray-200 rounded"
          />
        )}
      </div>
      
      <div className="text-sm text-gray-600 space-y-1">
        <p>
          <strong>Iteración:</strong> {iteration + 1} / {maxIterations}
          {isExpired && <span className="text-red-600 ml-2">(Expirado)</span>}
        </p>
        <p><strong>Actualización cada:</strong> {lifeTime} segundos</p>
        <p><strong>Duración total:</strong> {activeTime} minutos</p>
        {isMounted && <p><strong>Expira:</strong> {expiresDate.toLocaleTimeString()}</p>}
      </div>

      {/* URL del QR */}
      <div className="mt-4 p-2 bg-gray-100 rounded text-xs break-all">
        <strong>URL:</strong> {qrData.url}
      </div>

      {/* Datos para debug */}
      <details className="mt-4 text-left">
        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
          Ver datos técnicos
        </summary>
        <div className="mt-2 p-3 bg-gray-50 rounded text-xs space-y-2">
          <div>
            <strong>Datos Raw:</strong>
            <pre className="mt-1 p-2 bg-white rounded overflow-x-auto">{qrData.rawData}</pre>
          </div>
          <div>
            <strong>Datos Codificados (Base64):</strong>
            <pre className="mt-1 p-2 bg-white rounded overflow-x-auto break-all">{qrData.encodedData}</pre>
          </div>
          <div>
            <strong>Session ID:</strong> {qrData.sessionId}
          </div>
          <div>
            <strong>Timestamp:</strong> {new Date(qrData.timestamp).toISOString()}
          </div>
        </div>
      </details>
    </Card>
  );
}
