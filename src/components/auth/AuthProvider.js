/**
 * Componente proveedor de autenticación
 * Wrapper que provee el contexto de autenticación a toda la app
 */

'use client';

import { AuthProvider as AuthContextProvider } from '@/contexts/AuthContext';

export default function AuthProvider({ children }) {
  return <AuthContextProvider>{children}</AuthContextProvider>;
}
