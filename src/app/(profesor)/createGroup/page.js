/**
 * Página Crear Grupo
 * Renderiza el formulario de grupo en modo creación
 */

'use client';

import { useRouter } from 'next/navigation';
import GroupForm from '@/components/forms/GroupForm';

export default function CreateGroupPage() {
  const router = useRouter();

  const handleSuccess = (groupId) => {
    // Cuando se implemente el botón de guardar, esto redirigirá al dashboard
    console.log('Grupo creado exitosamente:', groupId);
    // router.push('/');
  };

  return (
    <GroupForm 
      mode="create" 
      onSuccess={handleSuccess}
    />
  );
}
