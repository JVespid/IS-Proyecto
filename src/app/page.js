/**
 * Página de inicio
 * Muestra pantalla de bienvenida para usuarios autenticados
 */

'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';

export default function Home() {
  const router = useRouter();
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

  // Pantalla de bienvenida para usuarios autenticados
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gradient-to-b from-blue-50 to-white">
      <h1 className="text-4xl font-bold text-gray-900">Bienvenido</h1>
      <Button onClick={() => router.push('/dashboard')} variant="primary">
        Ir al Dashboard
      </Button>
    </div>
  );
}
