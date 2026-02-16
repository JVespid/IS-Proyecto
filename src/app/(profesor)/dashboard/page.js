/**
 * Dashboard del Profesor - DEPRECATED
 * Redirige a la nueva página principal en /
 */

'use client';

import { useEffect } from 'react';
import { redirect } from 'next/navigation';

export default function DashboardPage() {
  // Redirigir automáticamente a la nueva ruta principal
  useEffect(() => {
    redirect('/');
  }, []);

  // Este código no se ejecutará debido a la redirección
  return null;
}
