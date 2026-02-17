/**
 * Página Editar Grupo
 * Renderiza el formulario de grupo en modo edición con datos pre-cargados
 */

'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GroupForm from '@/components/forms/GroupForm';
import Spinner from '@/components/ui/Spinner';
import { getById } from '@/services/session.service';
import { createClient } from '@/lib/supabase/client';

export default function EditGroupPage({ params }) {
  const router = useRouter();
  const { groupId } = use(params);
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cargar datos del grupo
  useEffect(() => {
    async function loadGroup() {
      try {
        const supabase = createClient();
        
        // Verificar usuario autenticado
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('No autenticado');
        }

        const groupData = await getById(groupId, supabase);
        
        // RLS retorna null si no tiene permiso o no existe
        if (!groupData) {
          throw new Error('Grupo no encontrado o sin permisos');
        }
        
        setInitialData(groupData);
      } catch (err) {
        console.error('Error al cargar grupo:', err);
        const message = err.message.includes('sin permisos') 
          ? 'No tienes permisos para editar este grupo'
          : 'Error al cargar el grupo';
        setError(`${message}. Redirigiendo...`);
        setTimeout(() => router.push('/'), 2000);
      } finally {
        setLoading(false);
      }
    }

    if (groupId) {
      loadGroup();
    }
  }, [groupId, router]);

  const handleSuccess = (groupId) => {
    // Cuando se implemente el botón de guardar, esto redirigirá al dashboard
    console.log('Grupo actualizado exitosamente:', groupId);
    // router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-green-400 to-green-300">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-green-400 to-green-300">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <p className="text-red-600 font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <GroupForm 
      mode="edit" 
      initialData={initialData}
      onSuccess={handleSuccess}
    />
  );
}
