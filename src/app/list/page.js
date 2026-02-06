/**
 * Página de Lista de Asistencias
 * Muestra tabla de alumnos que pasaron lista en una sesión específica
 */

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { log, logError } from '@/constants/config';

const MODULE_NAME = 'ListPage';

// Forzar renderizado dinámico para evitar errores de prerender con useSearchParams
export const dynamic = 'force-dynamic';

export default function ListPage() {
  const searchParams = useSearchParams();
  const currentGroupId = searchParams.get('currentGroupId');
  
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAttendances = async () => {
      if (!currentGroupId) {
        setError('No se proporcionó ID de sesión');
        setLoading(false);
        return;
      }

      try {
        log(MODULE_NAME, 'Cargando asistencias', { currentGroupId });
        
        // Crear cliente de Supabase
        const supabase = createClient();
        
        // Verificar autenticación (para debugging RLS)
        const { data: { session } } = await supabase.auth.getSession();
        console.log('🔐 Usuario autenticado:', session?.user?.email);
        
        // Consulta con sintaxis simple de JOIN (patrón usado en todo el proyecto)
        const { data, error: queryError } = await supabase
          .schema('bdLista')
          .from('TakeAttendance')
          .select(`
            *,
            Students (*)
          `)
          .eq('currentGroupId', currentGroupId)
          .order('created_at', { ascending: false });

        if (queryError) {
          logError(MODULE_NAME, 'Error en query', queryError);
          console.error('❌ Error Supabase:', queryError);
          throw queryError;
        }

        console.log('📊 Datos obtenidos:', data);
        console.log('📊 Cantidad de registros:', data?.length);
        
        setAttendances(data || []);
        log(MODULE_NAME, 'Asistencias cargadas', { count: data?.length || 0 });
      } catch (err) {
        logError(MODULE_NAME, 'Error al cargar asistencias', err);
        setError(`Error al cargar las asistencias: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendances();
  }, [currentGroupId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Cargando asistencias...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Lista de Asistencias
          </h1>
          <p className="text-gray-600">
            Total de registros: {attendances.length}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Sesión ID: {currentGroupId}
          </p>
        </div>

        {/* Table */}
        {attendances.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 text-lg">
              No hay asistencias registradas para esta sesión
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Número de Lista
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Boleta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Nombre
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendances.map((attendance) => (
                  <tr key={attendance.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {attendance.numberOfList || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {attendance.Students?.reportCard || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {attendance.Students?.fullName || 'N/A'}
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
