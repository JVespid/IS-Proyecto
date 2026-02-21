/**
 * Componente Escáner de QR
 * Permite escanear códigos QR usando la cámara
 */

'use client';

import { useEffect } from 'react';
import { useQRScanner } from '@/hooks/useQRScanner';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function QRScanner({ onScan, onError, autoStart = false }) {
  const { scanning, error, startScanning, stopScanning, scannerId } =
    useQRScanner(onScan, onError);

  // Auto-start del scanner cuando se monta (si autoStart=true)
  useEffect(() => {
    if (autoStart) {
      // Pequeño delay para asegurar que el DOM está listo
      const timer = setTimeout(() => {
        startScanning();
      }, 100);
      
      return () => {
        clearTimeout(timer);
        stopScanning();
      };
    }
    
    // Cleanup: detener scanner al desmontar
    return () => {
      stopScanning();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  return (
    <Card title="Escanear QR" className="text-center">
      <div
        id={scannerId}
        className="mx-auto max-w-md mb-4"
        style={{ minHeight: '250px' }}
      />
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="flex gap-2 justify-center">
        {!scanning ? (
          <Button onClick={startScanning}>Iniciar Escaneo</Button>
        ) : (
          <Button onClick={stopScanning} variant="danger">
            Detener Escaneo
          </Button>
        )}
      </div>

      <p className="text-sm text-gray-600 mt-4">
        Coloca el código QR dentro del recuadro para escanearlo
      </p>
    </Card>
  );
}
