/**
 * Componente Generador de QR
 * Muestra el QR code generado para una sesión
 */

'use client';

import { useState, useEffect } from 'react';
import { generateSessionQR } from '@/lib/qr/generator';
import Spinner from '@/components/ui/Spinner';
import Card from '@/components/ui/Card';

export default function QRGenerator({ sessionId, duration = 90, onGenerated }) {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const generateQR = async () => {
      try {
        setLoading(true);
        const data = await generateSessionQR(sessionId, duration);
        setQrData(data);
        if (onGenerated) {
          onGenerated(data);
        }
      } catch (err) {
        setError('Error al generar QR');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      generateQR();
    }
  }, [sessionId, duration, onGenerated]);

  if (loading) {
    return (
      <Card className="flex items-center justify-center p-8">
        <Spinner size="lg" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="text-center">
        <p className="text-red-600">{error}</p>
      </Card>
    );
  }

  if (!qrData) return null;

  const expiresDate = new Date(qrData.expiresAt);

  return (
    <Card title="Código QR de Asistencia" className="text-center">
      <div className="mb-4">
        <img
          src={qrData.qrImage}
          alt="QR Code"
          className="mx-auto border-4 border-gray-200 rounded"
        />
      </div>
      <div className="text-sm text-gray-600">
        <p>Duración: {qrData.duration} minutos</p>
        <p>Expira: {expiresDate.toLocaleTimeString()}</p>
      </div>
      <div className="mt-4 p-2 bg-gray-100 rounded text-xs break-all">
        {qrData.url}
      </div>
    </Card>
  );
}
