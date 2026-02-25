/**
 * Página Crear Grupo
 * Renderiza el formulario de grupo en modo creación
 * La autenticación es manejada por el middleware
 */

'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import GroupForm from '@/components/forms/GroupForm';
import Spinner from '@/components/ui/Spinner';

export default function CreateGroupPage() {
  const router = useRouter();
  const { loading } = useAuth();

  const handleSuccess = (groupId) => {
    console.log('Grupo creado exitosamente:', groupId);
    router.push('/dashboard');
  };

  // Mostrar spinner mientras carga el contexto de autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#CCFED9]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <GroupForm 
      mode="create" 
      onSuccess={handleSuccess}
    />
  );
}
