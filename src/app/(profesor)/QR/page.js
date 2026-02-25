/**
 * Página Generar QR
 * Muestra QR generado para una sesión/grupo
 */

'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import QRGenerator from '@/components/qr/QRGenerator';
import { getById } from '@/services/session.service';
import { createClient } from '@/lib/supabase/client';

function QRPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  
  const currentGroupId = searchParams.get('currentGroupId');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [group, setGroup] = useState(null);
  const [lifeTime, setLifeTime] = useState(15); // Tiempo de actualización en segundos
  const [activeTime, setActiveTime] = useState(90); // Duración total en minutos

  // Cargar datos del grupo
  useEffect(() => {
    async function loadGroup() {
      if (!currentGroupId) {
        setError('ID de grupo no proporcionado');
        setTimeout(() => router.push('/dashboard'), 2000);
        return;
      }

      try {
        setLoading(true);
        const supabase = createClient();
        const groupData = await getById(currentGroupId, supabase);
        
        if (!groupData) {
          throw new Error('Grupo no encontrado');
        }
        
        setGroup(groupData);
      } catch (err) {
        console.error('Error al cargar grupo:', err);
        setError('Error al cargar el grupo. Redirigiendo...');
        setTimeout(() => router.push('/dashboard'), 2000);
      } finally {
        setLoading(false);
      }
    }

    if (currentGroupId) {
      loadGroup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGroupId]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#4ba96c]">
        <Spinner size="lg" color="white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#4ba96c]">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <p className="text-red-600 font-semibold mb-4">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-[#4ba96c] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#3d8a59] transition-colors"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!user || !group) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-[#4ba96c] p-8 flex items-center justify-center relative overflow-hidden">
      <div className="w-full  max-w-5/12 h-[92vh] bg-[#ccfed9] rounded-[1.5rem] border border-[#449e63] p-8 shadow-none relative flex flex-col">
        
        {/* Botón atrás */}
        <div className="absolute top-6 left-6">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className="bg-gradient-to-b from-[#f9f9f9] to-[#e0e0e0] border-none text-black hover:bg-gray-100 w-12 h-12 p-0 flex items-center justify-center rounded-lg shadow-sm"
            unstyled={false}
          >
            <svg
              className="w-7 h-7 text-[#222]"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </Button>
        </div>

        {/* Contenedor interno */}
        <div className="border border-[#84c7c6] mt-16 h-full bg-[#e6ffea] flex flex-col items-center py-8 px-4 overflow-y-auto custom-scrollbar">
          
          {/* Título */}
          <h1 className="text-4xl font-normal text-black text-center mb-8">
            Generar QR
          </h1>

          {/* Área del QR */}
          <div className="bg-[#e0e0e0] border border-black w-80 h-80 flex items-center justify-center mb-8">
            {currentGroupId ? (
              <QRGenerator 
                sessionId={currentGroupId} 
                lifeTime={lifeTime}
                activeTime={activeTime}
              />
            ) : (
              <p className="text-gray-500 text-xl text-center">
                &quot;Aqui va el<br/>QR&quot;
              </p>
            )}
          </div>

          {/* Botón Establecer tiempo */}
          <div className="flex justify-center mb-4">
            <Button
              onClick={() => {
                alert('Funcionalidad de Establecer tiempo pendiente de implementar');
              }}
              className="flex items-center gap-2 bg-[#9b9aff] hover:bg-[#8a89ff] text-white px-8 py-2 rounded-full text-lg font-normal"
              unstyled={true}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Establecer tiempo
            </Button>
          </div>

          {/* Tiempo de vida */}
          <div className="mb-8">
            <p className="text-center text-black text-lg">
              Tiempo de vida: {lifeTime} segundos (actualiza cada {lifeTime} segundos) | Tiempo activo: {activeTime} minutos
            </p>
          </div>

          {/* Línea separadora */}
          <div className="w-full max-w-2xl border-t border-[#84c7c6] mb-8"></div>

          {/* Botón Generar nuevo QR */}
          <div className="flex justify-center relative w-72 h-10">
            {/* Bloques grises a los lados */}
            <div className="absolute inset-0 flex justify-between items-center px-0">
              <div className="w-6 h-8 bg-[#cccccc]"></div>
              <div className="w-6 h-8 bg-[#cccccc]"></div>
            </div>
            {/* Botón principal */}
            <Button
              disabled
              className="relative z-10 bg-gradient-to-b from-white to-[#e6e6ff] text-black px-8 py-1 text-lg font-normal shadow-sm w-64"
              unstyled={true}
            >
              Generar <strong>nuevo QR</strong>
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function QRPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#4ba96c]">
        <Spinner size="lg" color="white" />
      </div>
    }>
      <QRPageContent />
    </Suspense>
  );
}
