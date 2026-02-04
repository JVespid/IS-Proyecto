/**
 * Hook personalizado para autenticación
 * Proporciona acceso al contexto de autenticación
 */

'use client';

import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';

/**
 * Hook para acceder al contexto de autenticación
 * @returns {object} Contexto de autenticación
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }

  return context;
};
