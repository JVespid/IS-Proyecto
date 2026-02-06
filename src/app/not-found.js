/**
 * Página 404 - Not Found
 * Maneja rutas no encontradas y redirige según el estado de autenticación
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function NotFound() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      // Si hay sesión, redirigir a la página principal
      // Si no hay sesión, redirigir a login
      const redirectTo = user ? '/' : '/login';
      router.push(redirectTo);
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-lg text-gray-600">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-black mb-4">404</h1>
        <p className="text-xl text-gray-700 mb-6">Página no encontrada</p>
        <p className="text-gray-600">Redirigiendo...</p>
      </div>
    </div>
  );
}
