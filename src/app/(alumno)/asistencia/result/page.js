/**
 * Página de Resultado de Asistencia
 * Tercera pantalla: Muestra éxito o error al registrar asistencia
 */

'use client';

import { Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppleComplete, AppleBitten } from '@/components/ui/AppleIcons';
import Spinner from '@/components/ui/Spinner';

function ResultPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const result = useMemo(() => {
    const success = searchParams.get('success') === 'true';
    const studentName = searchParams.get('student') || '';
    const error = searchParams.get('error') || '';

    return { success, studentName, error };
  }, [searchParams]);

  const { success, studentName, error } = result;

  return (
    <div className="min-h-screen w-full bg-[#9fd3c7] flex items-center justify-center p-4">
      {/* Card principal */}
      <div className="w-full max-w-2xl bg-[#ccfed9] rounded-3xl border-2 border-[#449e63] p-12 shadow-lg flex flex-col items-center">
        
        {/* Título */}
        <h1 className="text-4xl font-bold text-[#2d5f5d] mb-8 tracking-wider">
          {success ? 'REGISTRO EXITOSO' : 'REGISTRO FALLIDO'}
        </h1>

        {/* Manzana con corona (éxito) o manzana mordida (error) */}
        <div className="mb-8">
          {success ? (
            <AppleComplete className="w-64 h-64" />
          ) : (
            <AppleBitten className="w-64 h-64" />
          )}
        </div>

        {/* Icono de verificación o error */}
        <div className="mb-8">
          {success ? (
            // Checkmark verde
            <div className="w-24 h-24 rounded-full bg-[#449e63] border-4 border-[#2d5f5d] flex items-center justify-center">
              <svg
                className="w-16 h-16 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          ) : (
            // X roja
            <div className="w-24 h-24 rounded-full bg-[#E31E24] border-4 border-[#2d5f5d] flex items-center justify-center">
              <svg
                className="w-16 h-16 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Mensaje */}
        {success && studentName && (
          <p className="text-xl text-[#2d5f5d] text-center mb-8">
            ¡Bienvenido, <strong>{studentName}</strong>!
            <br />
            Tu asistencia ha sido registrada correctamente.
          </p>
        )}

        {!success && error && (
          <div className="bg-red-100 border-2 border-red-400 rounded-lg p-4 mb-8 max-w-md">
            <p className="text-red-800 text-center">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        {!success && !error && (
          <p className="text-xl text-[#2d5f5d] text-center mb-8">
            No se pudo registrar tu asistencia.
            <br />
            Por favor, contacta a tu profesor.
          </p>
        )}

        {/* Botón volver al inicio */}
        <button
          onClick={() => router.push('/')}
          className="bg-[#449e63] hover:bg-[#5aba9f] text-white font-semibold px-10 py-3 rounded-full border-2 border-[#2d5f5d] shadow-md hover:shadow-lg transition-all duration-200 text-lg"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#9fd3c7]">
        <Spinner size="lg" color="white" />
      </div>
    }>
      <ResultPageContent />
    </Suspense>
  );
}
