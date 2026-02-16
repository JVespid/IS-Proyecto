/**
 * Dashboard Principal - Gestión de Grupos
 * Muestra tabla con todos los grupos activos del profesor
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import { getAllByProfessor, updateStatus } from '@/services/session.service';
import { createClient } from '@/lib/supabase/client';

export default function Home() {
  const router = useRouter();
  const { user, professor, loading: authLoading } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, group: null });
  const [deleting, setDeleting] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Extraer solo el ID para evitar re-renders por objeto completo
  const professorId = professor?.id;

  // Cargar grupos del profesor solo una vez
  useEffect(() => {
    async function loadGroups() {
      if (!professorId || hasLoadedOnce) return;

      try {
        setLoading(true);
        const supabase = createClient();
        const allGroups = await getAllByProfessor(professorId, supabase);
        
        // Filtrar solo grupos activos
        const activeGroups = allGroups.filter((g) => g.status === 'ACTIVE');
        setGroups(activeGroups);
        setHasLoadedOnce(true);
      } catch (err) {
        console.error('Error al cargar grupos:', err);
        setError('Error al cargar los grupos. Recarga la página para reintentar.');
      } finally {
        setLoading(false);
      }
    }

    if (professorId) {
      loadGroups();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [professorId, hasLoadedOnce]);

  // Eliminar grupo (cambiar status a INACTIVE)
  const handleDelete = async () => {
    if (!deleteModal.group) return;

    try {
      setDeleting(true);
      const supabase = createClient();
      await updateStatus(deleteModal.group.id, 'INACTIVE', supabase);
      
      // Actualizar lista eliminando el grupo
      setGroups((prev) => prev.filter((g) => g.id !== deleteModal.group.id));
      setDeleteModal({ isOpen: false, group: null });
    } catch (err) {
      console.error('Error al eliminar grupo:', err);
      alert('Error al eliminar el grupo. Intenta de nuevo.');
    } finally {
      setDeleting(false);
    }
  };

  // Definir columnas de la tabla
  const columns = [
    {
      key: 'subject',
      label: 'Materias',
      render: (row) => row.Subject?.Subject || 'Sin materia',
    },
    {
      key: 'group',
      label: 'Grupos',
      render: (row) => row.Group?.group || 'Sin grupo',
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/editGroup/${row.id}`);
            }}
            className="flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Editar
          </Button>
          <Button
            variant="danger"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteModal({ isOpen: true, group: row });
            }}
            className="flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Eliminar
          </Button>
        </div>
      ),
    },
  ];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 to-green-300">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null; // Middleware redirigirá a /login
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-green-300 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header con botón crear grupo */}
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">
            Gestión de Grupos
          </h1>
          <Button
            onClick={() => router.push('/createGroup')}
            className="flex items-center gap-2 bg-white text-green-600 hover:bg-green-50 font-semibold shadow-lg"
            unstyled={false}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Crear grupo
          </Button>
        </div>

        {/* Card con tabla */}
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-2xl border-2 border-blue-200 p-8">
          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {groups.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-4">
                No hay grupos activos
              </p>
              <Button onClick={() => router.push('/createGroup')}>
                Crear tu primer grupo
              </Button>
            </div>
          ) : (
            <Table columns={columns} data={groups} />
          )}
        </div>
      </div>

      {/* Modal de confirmación de eliminación */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => !deleting && setDeleteModal({ isOpen: false, group: null })}
        title="Confirmar eliminación"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ isOpen: false, group: null })}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </>
        }
      >
        <p>
          ¿Estás seguro de que deseas eliminar el grupo{' '}
          <strong>{deleteModal.group?.Subject?.Subject}</strong> -{' '}
          <strong>{deleteModal.group?.Group?.group}</strong>?
        </p>
        <p className="mt-2 text-sm text-gray-600">
          El grupo se marcará como inactivo y no aparecerá en la lista principal.
        </p>
      </Modal>
    </div>
  );
}

