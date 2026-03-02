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
import Modal from '@/components/ui/Modal';
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
  const [scrapedBoleta, setScrapedBoleta] = useState(''); // Boleta obtenida del scraping
  const [showBoletaModal, setShowBoletaModal] = useState(false); // Modal para confirmar boleta

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
          setManualBoleta('');
          setError('La página web no está disponible. Puedes ingresar tu número de boleta manualmente.');
          setIsProcessing(false);
          return;
        }
        
        // Otros errores de scraping - mostrar modal para ingreso manual
        setShowManualInput(true);
        setManualBoleta('');
        setError(`No se pudo obtener la boleta automáticamente: ${errorMsg}. Ingrésala manualmente.`);
        setIsProcessing(false);
        return;
      }

      const { reportCard } = scrapingData.data;

      if (!reportCard) {
        setShowManualInput(true);
        setManualBoleta('');
        setError('No se pudo extraer el número de boleta. Por favor ingrésala manualmente.');
        setIsProcessing(false);
        return;
      }

      log(MODULE_NAME, 'Boleta extraída exitosamente', { reportCard });
      
      // Guardar boleta extraída y mostrar modal de confirmación
      setScrapedBoleta(reportCard);
      setManualBoleta(reportCard); // Pre-llenar el input
      setShowBoletaModal(true);
      setIsProcessing(false);

    } catch (error) {
      logError(MODULE_NAME, 'Error al procesar credencial', error);
      setError(error.message);
      setShowManualInput(true);
      setManualBoleta('');
      setIsProcessing(false);
    }
  }, [isProcessing]);

  /**
   * Confirma y marca la asistencia con la boleta escaneada
   */
  const handleConfirmBoleta = useCallback(async () => {
    setIsProcessing(true);
    setError('');

    try {
      // Marcar asistencia
      const attendanceData = await markAttendanceInDB(scrapedBoleta, 'scan');

      // Redirigir a pantalla de éxito
      const studentName = attendanceData.data?.student?.name || 'Estudiante';
      router.push(`/asistencia/result?success=true&student=${encodeURIComponent(studentName)}`);

    } catch (error) {
      logError(MODULE_NAME, 'Error al marcar asistencia', error);
      
      // Si falla al marcar, mostrar modal manual con la boleta obtenida
      setShowBoletaModal(false);
      setShowManualInput(true);
      setManualBoleta(scrapedBoleta); // Mantener la boleta obtenida
      setError(`Error al registrar asistencia: ${error.message}. Verifica tu boleta o ingrésala manualmente.`);
      setIsProcessing(false);
    }
  }, [scrapedBoleta, router, markAttendanceInDB]);

  /**
   * Editar manualmente la boleta escaneada
   */
  const handleEditBoleta = useCallback(() => {
    setShowBoletaModal(false);
    setShowManualInput(true);
    setManualBoleta(scrapedBoleta); // Pre-llenar con la boleta escaneada
  }, [scrapedBoleta]);

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
                placeholder={manualBoleta ? "Ej: 2020123456" : "Error al obtener boleta - ingrésala manualmente"}
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
        <div className="max-w-lg w-full p-4 bg-yellow-100 border-2 border-yellow-400 rounded-lg mb-4 flex items-start justify-between">
          <p className="text-sm text-yellow-800">
            <strong>Atención:</strong> {error}
          </p>
          <button
            onClick={() => setError(null)}
            className="ml-2 text-yellow-800 hover:text-yellow-900 font-bold text-xl leading-none flex-shrink-0"
            aria-label="Cerrar error"
          >
            ×
          </button>
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

      {/* Modal de confirmación de boleta escaneada */}
      <Modal
        isOpen={showBoletaModal}
        onClose={() => !isProcessing && setShowBoletaModal(false)}
        title="Confirmar Número de Boleta"
        footer={
          <>
            <Button
              onClick={handleEditBoleta}
              className="bg-gray-300 hover:bg-gray-400 text-black"
              disabled={isProcessing}
            >
              Editar
            </Button>
            <Button
              onClick={handleConfirmBoleta}
              className="bg-[#449e63] hover:bg-[#5aba9f] text-white"
              disabled={isProcessing}
            >
              {isProcessing ? 'Procesando...' : 'Confirmar'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-lg text-gray-700">
            Se detectó el siguiente número de boleta de tu credencial:
          </p>
          <div className="bg-[#CCFED9] border-4 border-black rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-black">{scrapedBoleta}</p>
          </div>
          <p className="text-sm text-gray-600">
            ¿Es correcto este número? Si no, puedes editarlo manualmente.
          </p>
        </div>
      </Modal>
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
