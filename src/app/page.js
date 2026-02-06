/**
 * Página de inicio
 * Muestra mensaje de sesión iniciada correctamente
 */

'use client';

import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Cargando...</div>
      </div>
    );
  }

  // Si no hay usuario, el middleware redirigirá a /login
  if (!user) {
    return null;
  }

  // Mensaje simple para usuarios autenticados
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <h1 className="text-4xl font-bold text-black">
        sesión iniciada correctamente
      </h1>
    </div>
  );
}
