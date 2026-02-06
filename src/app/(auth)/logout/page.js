/**
 * Página de Cierre de Sesión
 * Cierra la sesión del usuario y redirige a login
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function LogoutPage() {
  const router = useRouter();
  const { logout } = useAuth();

  useEffect(() => {
    const handleLogout = async () => {
      const result = await logout();
      
      if (result.success) {
        // Redirigir a login después de cerrar sesión
        router.push('/login');
      } else {
        // Si hay error, también redirigir a login
        router.push('/login');
      }
    };

    handleLogout();
  }, [logout, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#3eb575] border-r-transparent mb-4"></div>
        <p className="text-gray-700">Cerrando sesión...</p>
      </div>
    </div>
  );
}
