/**
 * Página de Asistencia del Alumno
 * Permite al alumno escanear su credencial y registrar asistencia
 */

'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import QRScanner from '@/components/qr/QRScanner';
import Spinner from '@/components/ui/Spinner';

export default function AsistenciaPage({ params }) {
  const { sessionId } = use(params);
  const [step, setStep] = useState('validating'); // validating, scan, confirm, success, error
  const [session, setSession] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    validateSession();
  }, [sessionId]);

  const validateSession = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const response = await fetch(
        `/api/attendance/validate-session?sessionId=${sessionId}&signature=${urlParams.get('signature')}&timestamp=${urlParams.get('timestamp')}`
      );

      const data = await response.json();

      if (!response.ok || !data.valid) {
        setError(data.error || 'Sesión inválida');
        setStep('error');
        return;
      }

      setSession(data.session);
      setStep('scan');
    } catch (err) {
      setError('Error al validar sesión');
      setStep('error');
    }
  };

  const handleQRScan = async (qrData) => {
    setLoading(true);

    try {
      // Extraer datos del estudiante
      const extractResponse = await fetch('/api/scraping/extract-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: qrData }),
      });

      const extractData = await extractResponse.json();

      if (!extractResponse.ok) {
        throw new Error(extractData.error || 'Error al extraer datos');
      }

      setStudentData(extractData.data);
      setStep('confirm');
    } catch (err) {
      setError(err.message);
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/attendance/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          studentData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar asistencia');
      }

      if (data.duplicate) {
        setError('Ya pasaste lista en esta sesión');
        setStep('error');
      } else {
        setStep('success');
      }
    } catch (err) {
      setError(err.message);
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'validating') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Card className="text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p>Validando sesión...</p>
        </Card>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <Card className="text-center max-w-md">
          <div className="text-red-600 text-6xl mb-4">✕</div>
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </Card>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <Card className="text-center max-w-md">
          <div className="text-green-600 text-6xl mb-4">✓</div>
          <h2 className="text-xl font-bold mb-2">¡Asistencia Registrada!</h2>
          <p className="text-gray-600 mb-4">
            Tu asistencia ha sido registrada exitosamente
          </p>
          {studentData && (
            <div className="p-3 bg-gray-100 rounded">
              <p className="font-semibold">{studentData.fullName}</p>
              <p className="text-sm text-gray-600">{studentData.reportCard}</p>
            </div>
          )}
        </Card>
      </div>
    );
  }

  if (step === 'scan') {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-md mx-auto">
          <Card className="mb-4">
            <h2 className="font-semibold mb-1">Sesión: {session?.subject}</h2>
            <p className="text-sm text-gray-600">Grupo: {session?.group}</p>
          </Card>

          <QRScanner
            onScan={handleQRScan}
            onError={setError}
            autoStart={true}
          />

          {loading && (
            <Card className="mt-4 text-center">
              <Spinner size="lg" className="mx-auto mb-2" />
              <p>Procesando datos...</p>
            </Card>
          )}
        </div>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <Card className="max-w-md">
          <h2 className="text-xl font-bold mb-4">Confirmar Datos</h2>
          
          <div className="mb-6 p-4 bg-gray-100 rounded">
            <p className="font-semibold mb-2">{studentData?.fullName}</p>
            <p className="text-sm text-gray-600">Boleta: {studentData?.reportCard}</p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleConfirm}
              className="w-full"
              loading={loading}
              disabled={loading}
            >
              Confirmar Asistencia
            </Button>
            <Button
              onClick={() => setStep('scan')}
              variant="outline"
              className="w-full"
              disabled={loading}
            >
              Escanear Nuevamente
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return null;
}
