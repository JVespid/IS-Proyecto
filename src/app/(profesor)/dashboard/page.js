/**
 * Dashboard del Profesor
 * Página principal después del login
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

export default function DashboardPage() {
  const router = useRouter();
  const { user, professor, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user || !professor) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button onClick={handleLogout} variant="secondary">
            Cerrar Sesión
          </Button>
        </div>

        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-2">
            Bienvenido, {professor.name} {professor.lastName}
          </h2>
          <p className="text-gray-600">{professor.email}</p>
        </Card>

        <div className="grid md:grid-cols-2 gap-4">
          <Card title="Generar QR">
            <p className="text-gray-600 mb-4">
              Crea una sesión de pase de lista y genera un código QR
            </p>
            <Button onClick={() => router.push('/generar-qr')} className="w-full">
              Ir a Generar QR
            </Button>
          </Card>

          <Card title="Mis Materias">
            <p className="text-gray-600 mb-4">
              Gestiona tus materias y grupos
            </p>
            <Button variant="outline" className="w-full" disabled>
              Próximamente
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
