/**
 * Página Principal del Profesor
 * Búsqueda y selección de grupos para generar QR
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { getAllByProfessor } from "@/services/session.service";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const router = useRouter();
  const { user, professor, loading: authLoading } = useAuth();
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const searchInputRef = useRef(null);

  // Cargar grupos del profesor
  useEffect(() => {
    async function loadGroups() {
      if (!professor?.id) return;

      try {
        setLoading(true);
        const supabase = createClient();
        const allGroups = await getAllByProfessor(professor.id, supabase);

        // Filtrar solo grupos activos
        const activeGroups = allGroups.filter((g) => g.status === "ACTIVE");
        setGroups(activeGroups);
      } catch (err) {
        console.error("Error al cargar grupos:", err);
      } finally {
        setLoading(false);
      }
    }

    if (professor?.id) {
      loadGroups();
    }
  }, [professor?.id]);

  // Redirigir a login si no hay usuario después de cargar
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  // Filtrar grupos según búsqueda
  useEffect(() => {
    if (searchValue.trim() === "") {
      // Cuando está vacío, mostrar todos los grupos disponibles
      setFilteredGroups(groups);
      return;
    }

    const search = searchValue.toLowerCase();
    const filtered = groups.filter((group) => {
      const groupName = group.Group?.group?.toLowerCase() || "";
      return groupName.includes(search);
    });

    setFilteredGroups(filtered);
    setShowSuggestions(filtered.length > 0);
  }, [searchValue, groups]);

  // Manejar selección de grupo
  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
    setSearchValue(group.Group?.group || "");
    setShowSuggestions(false);
    // Quitar focus del input para simular comportamiento de Enter
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
  };

  // Manejar tecla Enter
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && filteredGroups.length > 0) {
      handleSelectGroup(filteredGroups[0]);
    }
  };

  // Redirigir a generar QR
  const handleGenerateQR = () => {
    if (!selectedGroup) {
      alert("Por favor selecciona un grupo primero");
      return;
    }
    router.push(`/QR?currentGroupId=${selectedGroup.id}`);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#4ba96c]">
        <Spinner size="lg" color="white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#4ba96c] flex flex-col">
      {/* Header negro con botones morados */}
      <div className="w-full bg-black py-4 px-8 flex justify-end gap-6">
        <Button
          onClick={() => router.push("/createGroup")}
          className="bg-[#8B80F9] text-white px-12 py-3 text-xl font-medium rounded-full hover:bg-[#7a6ee6] transition-colors shadow-lg"
          unstyled={true}
        >
          Grupos
        </Button>
        <Button
          onClick={() => router.push("/dashboard")}
          className="bg-[#8B80F9] text-white px-12 py-3 text-xl font-medium rounded-full hover:bg-[#7a6ee6] transition-colors shadow-lg"
          unstyled={true}
        >
          Administrador de unidades de aprendizaje
        </Button>
      </div>

      {/* Contenedor principal */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-6xl h-[75vh] bg-[#ccfed9] rounded-3xl border-2 border-[#84c7c6] p-12 shadow-none relative flex flex-col">
          
          {/* Input de búsqueda */}
          <div className="relative w-full max-w-md mb-16">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-[#8B80F9] rounded-full p-2">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowSuggestions(filteredGroups.length > 0)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Buscar grupo..."
                className="w-full pl-16 pr-4 py-3 bg-white/70 border-2 border-[#84c7c6] rounded-full text-lg focus:outline-none focus:border-[#8B80F9] transition-colors"
              />
            </div>

            {/* Sugerencias de autocompletado */}
            {showSuggestions && (
              <div className="absolute top-full mt-2 w-full bg-white border-2 border-[#84c7c6] rounded-lg shadow-lg max-h-60 overflow-y-auto z-10">
                {filteredGroups.map((group) => (
                  <div
                    key={group.id}
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevenir el blur del input
                      handleSelectGroup(group);
                    }}
                    className="px-4 py-3 hover:bg-[#e6ffea] cursor-pointer border-b border-gray-200 last:border-b-0"
                  >
                    <div className="font-medium text-[#2f4f4f]">
                      Grupo: {group.Group?.group || "Sin nombre"}
                    </div>
                    <div className="text-sm text-gray-600">
                      {group.Subject?.Subject || "Sin materia"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contenido central - Materia y Profesor */}
          <div className="flex-1 flex flex-col justify-center space-y-8 mb-8">
            <div className="space-y-2">
              <label className="text-4xl font-medium text-[#4ba96c]">
                Materia:
              </label>
              <div className="w-full h-px bg-[#84c7c6]"></div>
              <div className="text-2xl text-[#2f4f4f] pt-2">
                {selectedGroup?.Subject?.Subject || ""}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-4xl font-medium text-[#4ba96c]">
                Profesor:
              </label>
              <div className="w-full h-px bg-[#84c7c6]"></div>
              <div className="text-2xl text-[#2f4f4f] pt-2">
                {selectedGroup
                  ? `${professor?.name || ""} ${professor?.lastName || ""}`.trim()
                  : ""}
              </div>
            </div>
          </div>

          {/* Sección inferior - Unidad de aprendizaje, Grupo y Botón QR */}
          <div className="bg-[#d8f8e1] border-2 border-[#84c7c6] rounded-2xl p-8 flex items-center justify-between">
            <div className="flex items-center gap-12">
              <div className="space-y-1">
                <div className="text-sm text-gray-500 uppercase tracking-wider">
                  UNIDAD DE APRENDIZAJE
                </div>
                <div className="text-base text-[#2f4f4f]">
                  {selectedGroup?.curriculum || ""}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold text-black">Grupo:</div>
                <div className="text-2xl font-bold text-black">
                  &quot;{selectedGroup?.Group?.group || ""}&quot;
                </div>
              </div>
            </div>

            <Button
              onClick={handleGenerateQR}
              disabled={!selectedGroup}
              className="bg-[#8B80F9] text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-[#7a6ee6] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-lg flex items-center gap-3"
              unstyled={true}
            >
              <span>Generar QR</span>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zm8-2v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4zm13-2h-2v3h-3v2h3v3h2v-3h3v-2h-3v-3z"/>
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
