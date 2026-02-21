/**
 * Página de Escaneo de Credencial
 * Segunda pantalla: Permite al alumno escanear su credencial escolar
 */

'use client';

import { Suspense, useMemo, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import QRScanner from '@/components/qr/QRScanner';
import Spinner from '@/components/ui/Spinner';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { log, logError } from '@/constants/config';

const MODULE_NAME = 'scan.page';

function ScanPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualBoleta, setManualBoleta] = useState('');
  const [error, setError] = useState('');
  const [webDown, setWebDown] = useState(false);

  const sessionId = useMemo(() => {
    const id = searchParams.get('sessionId');
    if (!id) {
      alert('Sesión no especificada');
      router.push('/');
      return '';
    }
    return id;
  }, [searchParams, router]);

  /**
   * Detecta si el error es por web caída (solo códigos 500+, ENOTFOUND, ECONNABORTED)
   */
  const isWebDownError = (errorMessage) => {
    if (!errorMessage) return false;
    const msg = errorMessage.toLowerCase();
    
    // Errores de red/servidor
    return (
      msg.includes('enotfound') ||
      msg.includes('econnaborted') ||
      msg.includes('timeout') ||
      msg.includes('503') ||
      msg.includes('504') ||
      msg.includes('500') ||
      msg.includes('502') ||
      msg.includes('la página tardó demasiado') ||
      msg.includes('no se pudo conectar')
    );
  };

  /**
   * Marca asistencia en la base de datos
   */
  const markAttendanceInDB = useCallback(async (reportCard, method = 'scan') => {
    try {
      const response = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          reportCard,
          method
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al marcar asistencia');
      }

      return data;
    } catch (error) {
      logError(MODULE_NAME, 'Error al marcar asistencia', error);
      throw error;
    }
  }, [sessionId]);

  /**
   * Procesa el escaneo de credencial (web scraping)
   */
  const handleCredentialScan = useCallback(async (url) => {
    if (isProcessing) return;

    setIsProcessing(true);
    setError('');

    try {
      log(MODULE_NAME, 'URL escaneada de credencial', { url: url.substring(0, 50) });

      // Extraer datos del estudiante mediante web scraping
      const scrapingResponse = await fetch('/api/scraping/extract-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const scrapingData = await scrapingResponse.json();

      if (!scrapingResponse.ok || !scrapingData.success) {
        const errorMsg = scrapingData.error || 'Error al extraer datos';
        
        // Verificar si es error de web caída
        if (isWebDownError(errorMsg)) {
          setWebDown(true);
          setShowManualInput(true);
          setError('La página web no está disponible. Puedes ingresar tu número de boleta manualmente.');
          setIsProcessing(false);
          return;
        }
        
        // Otros errores (404, boleta no encontrada, etc.)
        throw new Error(errorMsg);
      }

      const { reportCard } = scrapingData.data;

      if (!reportCard) {
        throw new Error('No se pudo extraer el número de boleta');
      }

      log(MODULE_NAME, 'Boleta extraída exitosamente', { reportCard });

      // Marcar asistencia
      const attendanceData = await markAttendanceInDB(reportCard, 'scan');

      // Redirigir a pantalla de éxito
      const studentName = attendanceData.data?.student?.name || 'Estudiante';
      router.push(`/asistencia/result?success=true&student=${encodeURIComponent(studentName)}`);

    } catch (error) {
      logError(MODULE_NAME, 'Error al procesar credencial', error);
      setError(error.message);
      
      // Mostrar error en pantalla de resultado
      router.push(`/asistencia/result?success=false&error=${encodeURIComponent(error.message)}`);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, router, markAttendanceInDB]);

  /**
   * Maneja el ingreso manual de boleta
   */
  const handleManualSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!manualBoleta.trim()) {
      setError('Por favor ingresa tu número de boleta');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Marcar asistencia con boleta manual
      const attendanceData = await markAttendanceInDB(manualBoleta.trim(), 'manual');

      // Redirigir a pantalla de éxito
      const studentName = attendanceData.data?.student?.name || 'Estudiante';
      router.push(`/asistencia/result?success=true&student=${encodeURIComponent(studentName)}`);

    } catch (error) {
      logError(MODULE_NAME, 'Error al procesar boleta manual', error);
      setError(error.message);
      
      // Mostrar error en pantalla de resultado
      router.push(`/asistencia/result?success=false&error=${encodeURIComponent(error.message)}`);
    } finally {
      setIsProcessing(false);
    }
  }, [manualBoleta, router, markAttendanceInDB]);

  // Crear handler memoizado para errores del scanner
  const handleScanError = useCallback((err) => setError(err), []);

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#9fd3c7]">
        <Spinner size="lg" color="white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#9fd3c7] flex flex-col items-center justify-center p-4">
      {/* Título */}
      <h1 className="text-4xl font-normal text-[#2d5f5d] mb-4">
        Pase de lista
      </h1>

      {/* Subtítulo */}
      <p className="text-xl font-normal text-[#2d5f5d] mb-12">
        {showManualInput ? 'Ingresa tu número de boleta' : 'Escanea tu credencial escolar'}
      </p>

      {/* Área de escaneo o input manual */}
      {!showManualInput ? (
        <div className="bg-white rounded-3xl w-full max-w-lg p-8 flex flex-col items-center mb-8 shadow-lg">
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Spinner size="lg" color="green" />
              <p className="text-[#2d5f5d] mt-4">Procesando credencial...</p>
            </div>
          ) : (
            <QRScanner
              onScan={handleCredentialScan}
              onError={handleScanError}
              autoStart={true}
            />
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl w-full max-w-lg p-8 mb-8 shadow-lg">
          <form onSubmit={handleManualSubmit} className="space-y-6">
            <div>
              <label htmlFor="boleta" className="block text-lg font-medium text-[#2d5f5d] mb-2">
                Número de Boleta
              </label>
              <Input
                id="boleta"
                type="text"
                value={manualBoleta}
                onChange={(e) => setManualBoleta(e.target.value)}
                placeholder="Ej: 2020123456"
                className="w-full text-lg"
                disabled={isProcessing}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#449e63] hover:bg-[#5aba9f] text-white py-3 text-lg"
              disabled={isProcessing}
            >
              {isProcessing ? 'Procesando...' : 'Confirmar Asistencia'}
            </Button>

            {!webDown && (
              <button
                type="button"
                onClick={() => setShowManualInput(false)}
                className="w-full text-[#2d5f5d] underline hover:text-[#449e63]"
                disabled={isProcessing}
              >
                Volver a escanear credencial
              </button>
            )}
          </form>
        </div>
      )}

      {/* Mensajes de error */}
      {error && (
        <div className="max-w-lg w-full p-4 bg-yellow-100 border-2 border-yellow-400 rounded-lg mb-4">
          <p className="text-sm text-yellow-800">
            <strong>Atención:</strong> {error}
          </p>
        </div>
      )}

      {/* Botón para mostrar input manual (solo si no es web caída) */}
      {!showManualInput && !webDown && !isProcessing && (
        <button
          onClick={() => setShowManualInput(true)}
          className="text-[#2d5f5d] underline hover:text-[#449e63] text-sm"
        >
          ¿Problemas con el escáner? Ingresa tu boleta manualmente
        </button>
      )}
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#9fd3c7]">
        <Spinner size="lg" color="white" />
      </div>
    }>
      <ScanPageContent />
    </Suspense>
  );
}
