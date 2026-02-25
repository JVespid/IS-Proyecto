/**
 * Página de Lista de Asistencias
 * Muestra tabla de alumnos que pasaron lista en una sesión específica
 *
 * REGLA DE NEGOCIO IMPORTANTE:
 * - El length de takeAttendanceStudentData debe ser el MISMO para todos los estudiantes
 * - Representa el número total de clases/días en que se ha pasado lista
 */

"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { log, logError } from "@/constants/config";
import { AttendanceIcon } from "@/components/ui/AttendanceIcons";

const MODULE_NAME = "ListPage";

// Configuración personalizable para diseño
const DESIGN_CONFIG = {
  CELL_SIZE: 16, // Tamaño de cada cuadrado de asistencia (px) - ¡PERSONALIZABLE!
  CELL_GAP: 0, // Espacio entre cuadrados (px) - ¡PERSONALIZABLE!
};

/**
 * Componente interno que usa useSearchParams
 * Debe estar separado para evitar hydration errors
 */
function ListContent() {
  const searchParams = useSearchParams();
  const currentGroupId = searchParams.get("currentGroupId");

  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAttendances = async () => {
      if (!currentGroupId) {
        setError("No se proporcionó ID de sesión");
        setLoading(false);
        return;
      }

      try {
        log(MODULE_NAME, "Cargando asistencias", { currentGroupId });

        // Crear cliente de Supabase
        const supabase = createClient();

        // Verificar autenticación (para debugging RLS)
        const {
          data: { session },
        } = await supabase.auth.getSession();
        console.log("🔐 Usuario autenticado:", session?.user?.email);

        // Consulta con sintaxis simple de JOIN (patrón usado en todo el proyecto)
        const { data, error: queryError } = await supabase
          .schema("bdLista")
          .from("TakeAttendance")
          .select(
            `
            *,
            Students (*)
          `,
          )
          .eq("currentGroupId", currentGroupId)
          .order("created_at", { ascending: false });

        if (queryError) {
          logError(MODULE_NAME, "Error en query", queryError);
          console.error("❌ Error Supabase:", queryError);
          
          // Si el error es de permisos RLS (código 42501)
          if (queryError.code === '42501') {
            throw new Error('No tienes permisos para ver esta lista de asistencia');
          }
          
          throw queryError;
        }

        console.log("📊 Datos obtenidos:", data);
        console.log("📊 Cantidad de registros:", data?.length);

        // Si no hay datos, verificar si es por falta de permisos o realmente no hay registros
        if (!data || data.length === 0) {
          // Verificar si el grupo existe y tenemos permisos
          const { data: groupCheck, error: groupError } = await supabase
            .schema("bdLista")
            .from("CurrentGroup")
            .select("id, professorId")
            .eq("id", currentGroupId)
            .single();
            
          // Si no podemos leer el grupo, no tenemos permisos
          if (groupError || !groupCheck) {
            throw new Error('No tienes permisos para ver este grupo o no existe');
          }
          
          // Si llegamos aquí, tenemos permisos pero no hay asistencias todavía
          console.log("✓ Grupo válido, sin asistencias registradas aún");
        }

        // Ordenar por número de lista (numéricamente)
        const sortedData = (data || []).sort((a, b) => {
          const numA = parseInt(a.numberOfList || "999", 10);
          const numB = parseInt(b.numberOfList || "999", 10);
          return numA - numB;
        });

        setAttendances(sortedData);
        log(MODULE_NAME, "Asistencias cargadas y ordenadas", {
          count: sortedData.length,
        });
      } catch (err) {
        logError(MODULE_NAME, "Error al cargar asistencias", err);
        setError(`Error al cargar las asistencias: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendances();
  }, [currentGroupId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#3eb575]">
        <div className="text-lg text-white">Cargando asistencias...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#3eb575]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Error</h1>
          <p className="text-white">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#3eb575] p-0 overflow-hidden flex items-center justify-center">
      {/* Scroll personalizado */}
      <style jsx global>{`
        /* Scroll personalizado - track grueso, thumb centrado */
        .custom-scroll::-webkit-scrollbar {
          width: 16px;
          height: 16px;
        }

        .custom-scroll::-webkit-scrollbar-track {
          background: white;
          border-radius: 8px;
        }

        .custom-scroll::-webkit-scrollbar-thumb {
          background: #bfbfbf;
          border-radius: 8px;
          border: 4px solid white; /* Crea efecto centrado */
        }

        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: #a0a0a0;
        }
      `}</style>

      {/* Contenedor principal con gradiente - Centrado verticalmente */}
      <div className="max-h-[50vh] min-w-11/12 p-2 rounded-2xl bg-[#ccffd9] flex items-start justify-center overflow-auto custom-scroll">
        {attendances.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-[#616c63] text-lg">
              No hay asistencias registradas para esta sesión
            </p>
          </div>
        ) : (
          <div className="w-full max-w-full overflow-x-auto custom-scroll p-8 border border-[#65ccef] bg-linear-to-b from-[#effff3] to-[#ccffd9] flex flex-col items-center justify-center">
            <table
              className="border-collapse border border-[#616c63] "
              style={{ width: "max-content" }}
            >
              {/* Header de la tabla */}
              <thead>
                <tr className="border-b-2 border-[#616c63]">
                  <th
                    className="px-3 py-2 text-xs font-semibold text-[#616c63] uppercase tracking-wide border-r border-[#616c63] text-center bg-[#effff3]"
                    style={{ width: "140px" }}
                  >
                    No. lista
                  </th>
                  <th
                    className="px-3 py-2 text-xs font-semibold text-[#616c63] uppercase tracking-wide border-r border-[#616c63] text-center bg-[#effff3]"
                    style={{ width: "200px" }}
                  >
                    Boleta
                  </th>
                  <th
                    className="px-3 py-2 text-xs font-semibold text-[#616c63] uppercase tracking-wide border-r border-[#616c63] text-center bg-[#effff3]"
                    style={{ width: "360px" }}
                  >
                    Nombre
                  </th>
                  <th
                    className="px-0 py-2 text-[#616c63] bg-[#effff3] border-r border-[#616c63]"
                    style={{ width: "max-content" }}
                  >
                    <div className="text-center ">
                      <div className="text-lg font-bold uppercase tracking-wider mb-1 border-b border-[#616c63]">
                        Asistencia
                      </div>
                      <div className="text-[10px] font-normal">clases</div>
                    </div>
                  </th>
                </tr>
              </thead>

              {/* Cuerpo de la tabla */}
              <tbody>
                {attendances.map((attendance, index) => (
                  <tr
                    key={attendance.id}
                    className="border-b border-[#616c63] hover:bg-[#effff3]/50 transition-colors"
                  >
                    {/* Número de lista */}
                    <td
                      className="px-3 py-2 text-center text-sm font-medium text-[#616c63] border-r border-[#616c63] overflow-hidden text-ellipsis whitespace-nowrap"
                      style={{ width: "70px" }}
                    >
                      {attendance.numberOfList || index + 1}
                    </td>

                    {/* Boleta */}
                    <td
                      className="px-3 py-2 text-center text-sm text-[#616c63] border-r border-[#616c63] overflow-hidden text-ellipsis whitespace-nowrap"
                      style={{ width: "100px" }}
                    >
                      {attendance.Students?.reportCard || "N/A"}
                    </td>

                    {/* Nombre */}
                    <td
                      className="px-3 py-2 text-center text-sm text-[#616c63] border-r border-[#616c63] overflow-hidden text-ellipsis whitespace-nowrap"
                      style={{ width: "180px" }}
                    >
                      {attendance.Students?.fullName || "N/A"}
                    </td>

                    {/* Cuadrícula de asistencias - SIN padding, altura 100% */}
                    <td className="border-r border-[#616c63] p-0 h-px box-border">
                      <div
                        className="flex items-center justify-start h-full"
                        style={{
                          gap: `${DESIGN_CONFIG.CELL_GAP}px`,
                        }}
                      >
                        {attendance.takeAttendanceStudentData &&
                        Array.isArray(attendance.takeAttendanceStudentData) &&
                        attendance.takeAttendanceStudentData.length > 0 ? (
                          attendance.takeAttendanceStudentData.map(
                            (record, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-center border border-[#616c63] text-[#616c63] h-full"
                                style={{
                                  width: `${DESIGN_CONFIG.CELL_SIZE}px`,
                                  minWidth: `${DESIGN_CONFIG.CELL_SIZE}px`,
                                }}
                              >
                                <AttendanceIcon
                                  attendance={record}
                                  size={DESIGN_CONFIG.CELL_SIZE - 4}
                                />
                              </div>
                            ),
                          )
                        ) : (
                          <span className="text-xs text-[#616c63]">
                            Sin datos
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Componente wrapper principal con Suspense boundary
 * Requerido por Next.js 16 para componentes que usan useSearchParams
 */
export default function ListPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Cargando lista de asistencia...</div>
      </div>
    }>
      <ListContent />
    </Suspense>
  );
}
