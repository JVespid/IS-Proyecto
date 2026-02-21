/**
 * Dashboard Principal - Gestión de Grupos
 * Muestra tabla con todos los grupos activos del profesor
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Table from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import { DropdownMenu, DropdownItem } from "@/components/ui/DropdownMenu";
import { getAllByProfessor, updateStatus } from "@/services/session.service";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const router = useRouter();
  const { user, professor, loading: authLoading, logout } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    group: null,
  });
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
        const activeGroups = allGroups.filter((g) => g.status === "ACTIVE");
        setGroups(activeGroups);
        setHasLoadedOnce(true);
      } catch (err) {
        console.error("Error al cargar grupos:", err);
        setError(
          "Error al cargar los grupos. Recarga la página para reintentar.",
        );
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
      await updateStatus(deleteModal.group.id, "INACTIVE", supabase);

      // Actualizar lista eliminando el grupo
      setGroups((prev) => prev.filter((g) => g.id !== deleteModal.group.id));
      setDeleteModal({ isOpen: false, group: null });
    } catch (err) {
      console.error("Error al eliminar grupo:", err);
      alert("Error al eliminar el grupo. Intenta de nuevo.");
    } finally {
      setDeleting(false);
    }
  };

  // Definir columnas de la tabla (DISEÑO ABSOLUTO FINAL)
  const columns = [
    {
      key: "subject",
      label: "Materias",
      render: (row) => (
        <span className="text-base text-[#2f4f4f]">
          &quot;{row.Subject?.Subject || "Sin materia"}&quot;
        </span>
      ),
    },
    {
      key: "group",
      // Header personalizado con botón "Crear grupo" integrado
      label: (
        <div className="flex items-center justify-between w-full">
          <span className="flex-1 text-center pl-8">Grupos</span>
        </div>
      ),
      render: (row) => (
        <span className="text-base text-[#2f4f4f] relative">
          &quot;{row.Group?.group || "Sin grupo"}&quot;
        </span>
      ),

      BTN: (row) => (
        <div className="flex justify-center absolute top-1 right-1">
          <DropdownMenu
            trigger={
              <button
                className="flex items-center justify-center bg-[#e0e0e0] border border-black rounded-[4px] w-8 h-6 hover:bg-gray-300 transition-colors cursor-pointer"
                title="Menú de acciones"
              >
                <div className="flex gap-[2px]">
                  <div className="w-1 h-1 bg-black rounded-full"></div>
                  <div className="w-1 h-1 bg-black rounded-full"></div>
                  <div className="w-1 h-1 bg-black rounded-full"></div>
                </div>
              </button>
            }
            align="right"
          >
            <DropdownItem
              className=" cursor-pointer"
              onClick={() => router.push(`/editGroup/${row.id}`)}
            >
              <span className="flex items-center gap-2 font-normal cursor-pointer">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
                Editar
              </span>
            </DropdownItem>
            <DropdownItem
              className=" cursor-pointer"
              onClick={() => setDeleteModal({ isOpen: true, group: row })}
            >
              <span className="flex items-center gap-2 font-normal">
                <svg
                  className="w-4 h-4 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Eliminar
              </span>
            </DropdownItem>
            <DropdownItem
              className=" cursor-pointer"
              onClick={() => router.push(`/list?currentGroupId=${row.id}`)}
            >
              <span className="flex items-center gap-2 font-normal  cursor-pointer">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                Ver
              </span>
            </DropdownItem>
          </DropdownMenu>
        </div>
      ),
    },
    {
      key: "actions",
      label: (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            router.push("/createGroup");
          }}
          className="flex items-center gap-1 bg-[#e0e0e0] text-black border border-black hover:bg-gray-300 shadow-none text-xs px-2 py-1 rounded-[4px] mr-0 h-7 scale-125"
          unstyled={true}
        >
          <div className="bg-transparent border border-black rounded-full w-3 h-3 flex items-center justify-center mr-1">
            <span className="text-black text-xs leading-none mt-[-1px] font-bold">
              +
            </span>
          </div>
          Crear grupo
        </Button>
      ),
      render: "",
    },
  ];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#4ba96c]">
        <Spinner size="lg" color="white" />
      </div>
    );
  }

  if (!user) return null;

  return (
    // Fondo de página verde sólido
    <div className="min-h-screen w-full bg-[#4ba96c] p-8 flex items-center justify-center relative overflow-hidden">
      {/* Container principal (Card) */}
      <div className="w-full max-w-11/12 h-[75vh] bg-[#ccfed9] rounded-[1.5rem] border border-[#449e63] p-8 shadow-none relative flex flex-col">
        {/* Botón atrás en la esquina superior izquierda (Estilo neomorfismo con flecha gruesa) */}
        <div className="absolute top-6 left-6">
          <Button
            variant="outline"
            onClick={async () => {
              await logout();
              router.push('/login');
            }}
            className="bg-gradient-to-b from-[#f9f9f9] to-[#e0e0e0] border-none text-black hover:bg-gray-100 w-12 h-12 p-0 flex items-center justify-center rounded-lg shadow-sm"
            unstyled={false}
          >
            <svg
              className="w-7 h-7 text-[#222]"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              {/* Flecha gruesa apuntando a izquierda */}
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </Button>
        </div>

        <div className="border border-[#84c7c6] mt-20 h-full bg-[#e6ffea] ">
          {/* Contenedor de la tabla centrado */}
          <div className="flex-1 flex items-center justify-center px-4 md:px-12 mt-8">
            <div className="w-full max-w-2xl overflow-visible">
              <Table
                columns={columns}
                data={groups}
                onRowClick={(row) =>
                  router.push(`/list?currentGroupId=${row.id}`)
                }
                containerClassName="overflow-visible h-[400px]"
                className="bg-transparent"
              />
            </div>
          </div>

          {groups.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-[#2f4f4f] text-lg font-medium bg-[#d8f8e1] px-6 py-2 border border-black rounded-lg">
                No tienes grupos activos
              </p>
            </div>
          )}
        </div>
      </div>
      {/* Modal de confirmación para eliminar */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, group: null })}
        title="Eliminar Grupo"
      >
        <div className="p-4">
          <p className="mb-4 text-gray-700">
            ¿Confirmas que deseas eliminar{" "}
            <strong>&quot;{deleteModal.group?.Group?.group}&quot;</strong>?
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ isOpen: false, group: null })}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
