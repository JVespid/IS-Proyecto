/**
 * Página Generar QR
 * Muestra QR generado para una sesión/grupo
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import QRGenerator from '@/components/qr/QRGenerator';
import { getById } from '@/services/session.service';
import { createClient } from '@/lib/supabase/client';

export default function QRPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  
  const currentGroupId = searchParams.get('currentGroupId');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [group, setGroup] = useState(null);
  const [lifeTime, setLifeTime] = useState(15); // Tiempo de actualización en segundos
  const [activeTime, setActiveTime] = useState(1); // Duración total en minutos

  // Cargar datos del grupo
  useEffect(() => {
    async function loadGroup() {
      if (!currentGroupId) {
        setError('ID de grupo no proporcionado');
        setTimeout(() => router.push('/'), 2000);
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
        setTimeout(() => router.push('/'), 2000);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 to-green-300">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 to-green-300">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <p className="text-red-600 font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  if (!user || !group) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-green-300 flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-2xl border-2 border-blue-200 p-8">
          {/* Título */}
          <h1 className="text-3xl font-bold text-gray-800 text-center mb-8">
            Generar QR
          </h1>

          {/* Área del QR */}
          <div className="bg-gray-200 rounded-lg border-2 border-gray-300 p-8 mb-8 flex items-center justify-center min-h-[400px]">
            {currentGroupId ? (
              <QRGenerator 
                sessionId={currentGroupId} 
                lifeTime={lifeTime}
                activeTime={activeTime}
              />
            ) : (
              <p className="text-gray-500 text-center">
                &quot;Aquí va el QR&quot;
              </p>
            )}
          </div>

          {/* Botón Establecer tiempo */}
          <div className="flex justify-center mb-6">
            <Button
              onClick={() => {
                // TODO: Implementar modal de configuración de tiempo
                alert('Funcionalidad de Establecer tiempo pendiente de implementar');
              }}
              className="flex items-center gap-3 bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-full shadow-lg"
              unstyled={false}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Establecer tiempo
            </Button>
          </div>

          {/* Tiempo de vida */}
          <div className="mb-6">
            <label className="block text-center text-gray-800 font-semibold mb-2">
              Tiempo de vida:
            </label>
            <div className="h-12 border-b-2 border-gray-300 flex items-center justify-center">
              <span className="text-gray-600">{activeTime} minutos (actualización cada {lifeTime}s)</span>
            </div>
          </div>

          {/* Botón Generar nuevo QR */}
          <div className="flex justify-center">
            <Button
              disabled
              className="bg-gray-200 text-gray-500 px-8 py-3 rounded-lg cursor-not-allowed"
              unstyled={true}
            >
              Generar nuevo QR
            </Button>
          </div>

          {/* Nota sobre funcionalidad */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Nota:</strong> Los botones &quot;Establecer tiempo&quot; y &quot;Generar nuevo QR&quot; 
              están pendientes de implementación según diseño.
            </p>
          </div>

          {/* Información del grupo */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Materia:</strong> {group.Subject?.Subject || 'N/A'}
              <br />
              <strong>Grupo:</strong> {group.Group?.group || 'N/A'}
              <br />
              <strong>Periodo:</strong> {group.schoolPeriod || 'N/A'}
            </p>
          </div>

          {/* Botón volver */}
          <div className="mt-6 flex justify-center">
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="bg-white hover:bg-gray-50"
            >
              ← Volver al Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
