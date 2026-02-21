/**
 * Página de Validación de QR
 * Primera pantalla: Valida el QR escaneado y prepara el pase de lista
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import { log, logError } from '@/constants/config';

const MODULE_NAME = 'validate.page';

function ValidatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('Validando código QR...');

  useEffect(() => {
    const validateQR = async () => {
      try {
        const sessionId = searchParams.get('sessionId');
        const expiresAt = searchParams.get('expiresAt');

        if (!sessionId || !expiresAt) {
          setError('Código QR inválido o incompleto');
          setValidating(false);
          return;
        }

        // Llamar al endpoint de validación
        const response = await fetch(
          `/api/attendance/validate-qr?sessionId=${sessionId}&expiresAt=${expiresAt}`
        );

        const data = await response.json();

        if (!response.ok || !data.valid) {
          setError(data.error || 'El código QR ha expirado o es inválido');
          setValidating(false);
          return;
        }

        // QR válido
        if (data.requiresSetup) {
          setMessage('Preparando pase de lista...');
          // Pequeño delay para mostrar el mensaje
          setTimeout(() => {
            router.push(`/asistencia/scan?sessionId=${sessionId}`);
          }, 1500);
        } else {
          setMessage('Sesión verificada...');
          setTimeout(() => {
            router.push(`/asistencia/scan?sessionId=${sessionId}`);
          }, 1000);
        }
      } catch (err) {
        logError(MODULE_NAME, 'Error al validar QR', err);
        setError('Error al procesar el código QR');
        setValidating(false);
      }
    };

    validateQR();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen w-full bg-[#4ba96c] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#ccfed9] rounded-[1.5rem] border border-[#449e63] p-8 shadow-lg">
          
          {validating ? (
            <>
              {/* Validando */}
              <div className="text-center mb-6">
                <div className="flex justify-center mb-4">
                  <Spinner size="lg" />
                </div>
                <h2 className="text-2xl font-normal text-black mb-2">
                  {message}
                </h2>
                <p className="text-gray-700 text-sm">
                  Por favor espera...
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Error */}
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <svg
                    className="w-16 h-16 text-red-500"
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
                </div>
                <h2 className="text-xl font-semibold text-red-600 mb-2">
                  Código QR Inválido
                </h2>
                <p className="text-gray-700 mb-6">
                  {error}
                </p>
                <Button
                  onClick={() => router.push('/')}
                  className="bg-[#53b099] hover:bg-[#5aba9f] text-white px-8 py-2 rounded-full"
                  unstyled={true}
                >
                  Volver
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ValidatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#4ba96c]">
        <Spinner size="lg" color="white" />
      </div>
    }>
      <ValidatePageContent />
    </Suspense>
  );
}
