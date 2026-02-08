/**
 * Layout para página de lista de asistencias
 * Fuerza renderizado dinámico para evitar errores de prerender
 */

import { Suspense } from 'react';

// Forzar renderizado dinámico (esto funciona en Server Components)
export const dynamic = 'force-dynamic';

export default function ListLayout({ children }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Cargando...</div>
      </div>
    }>
      {children}
    </Suspense>
  );
}
